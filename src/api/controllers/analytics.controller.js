const UserActivity = require('../../models/UserActivity.model');
const Question = require('../../models/Question.model');
const mongoose = require('mongoose');
const { catchAsync } = require('../../utils/apiError'); // Assuming you have a wrapper, else use try-catch

exports.getBoardTrend = async (req, res, next) => {
  try {
    // Ensure userId is in the correct format for aggregation matching.
    // Assuming user_id in UserActivity is stored as a String based on previous context.
    // If it's stored as ObjectId, remove .toString().
    const userId = req.user._id.toString();

    // 1. Calculate the date boundary (start of today minus 7 weeks)
    const today = new Date();
    // Set to end of today to capture everything up to now
    today.setHours(23, 59, 59, 999);

    // Calculate start date: Go back 48 days (just under 7 weeks) to ensure we get full 7 weeks including current partial week
    const sevenWeeksAgoStr = new Date(today.getTime() - (48 * 24 * 60 * 60 * 1000)).toISOString();
    const dateBoundary = new Date(sevenWeeksAgoStr);

    const trend = await UserActivity.aggregate([
      // 🌟 CRITICAL SCALABILITY STEP: Filter by User AND Date Range immediately.
      // This uses the compound index { user_id: 1, timestamp: -1 }
      {
        $match: {
          user_id: userId,
          timestamp: { $gte: dateBoundary }
        }
      },
      {
        $group: {
          // Group by Year AND Week to handle year crossovers correctly
          _id: {
            year: { $isoWeekYear: "$timestamp" },
            week: { $isoWeek: "$timestamp" }
          },
          // Capture the earliest date in that week for reference
          weekStart: { $min: "$timestamp" },
          // Calculate accuracy (1 for correct, 0 for incorrect)
          averageAccuracy: { $avg: { $cond: ["$is_correct", 1, 0] } }
        }
      },
      // Sort chronologically (oldest week first)
      { $sort: { "_id.year": 1, "_id.week": 1 } },
      // Ensure we never send more than 7 data points
      { $limit: 7 }
    ]);

    // 3. Post-process for frontend labels (W1, W2...)
    // This automatically handles new users. If they only have 2 weeks of data,
    // the trend array length is 2, and they get labeled W1, W2.
    const formattedData = trend.map((t, index) => ({
      // The requirement: "W1 will be a according to w1 perfomence..."
      // We label them sequentially based on the data found in the window.
      weekLabel: `W${index + 1}`,
      // Keep the actual date for tooltips if needed later
      date: t.weekStart.toISOString().split('T')[0],
      probability: Math.round(t.averageAccuracy * 100)
    }));

    res.status(200).json({
      status: 'success',
      data: formattedData
    });
  } catch (error) {
    next(error);
  }
};

exports.getTopicDiagnostics = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    const diagnostics = await UserActivity.aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: "$topic_tag",
          totalAttempts: { $sum: 1 },
          correctAttempts: { $sum: { $cond: ["$is_correct", 1, 0] } },
          avgTimeTaken: { $avg: "$time_taken" }
        }
      },
      {
        $project: {
          topic: "$_id",
          accuracy: { $multiply: [{ $divide: ["$correctAttempts", "$totalAttempts"] }, 100] },
          timeTaken: "$avgTimeTaken",
          status: {
            $switch: {
              branches: [
                { case: { $gte: [{ $divide: ["$correctAttempts", "$totalAttempts"] }, 0.8] }, then: "Mastered" },
                { case: { $gte: [{ $divide: ["$correctAttempts", "$totalAttempts"] }, 0.5] }, then: "Improving" }
              ],
              default: "Weak"
            }
          }
        }
      }
    ]);

    res.status(200).json({ status: 'success', data: diagnostics });
  } catch (error) {
    next(error);
  }
};

exports.getCognitiveSkills = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    const skills = await UserActivity.aggregate([
      { $match: { user_id: userId } },
      // Convert question_id string to ObjectId for lookup if needed, or keeping as string if IDs match
      { $addFields: { qIdObj: { $toObjectId: "$question_id" } } }, 
      {
        $lookup: {
          from: "questions",
          localField: "qIdObj",
          foreignField: "_id",
          as: "questionDetails"
        }
      },
      { $unwind: "$questionDetails" },
      {
        $group: {
          _id: "$questionDetails.cognitive_level",
          total: { $sum: 1 },
          correct: { $sum: { $cond: ["$is_correct", 1, 0] } }
        }
      },
      {
        $project: {
          skill: "$_id",
          percentage: { $multiply: [{ $divide: ["$correct", "$total"] }, 100] }
        }
      }
    ]);

    res.status(200).json({ status: 'success', data: skills });
  } catch (error) {
    next(error);
  }
};

exports.getRootCause = async (req, res, next) => {
  try {
    // 1. Find weakest topic
    const userId = req.user._id.toString();
    const weakTopicStats = await UserActivity.aggregate([
      { $match: { user_id: userId } },
      { 
        $group: { 
          _id: "$topic_tag", 
          accuracy: { $avg: { $cond: ["$is_correct", 1, 0] } } 
        } 
      },
      { $sort: { accuracy: 1 } },
      { $limit: 1 }
    ]);

    if (!weakTopicStats.length) return res.status(200).json({ status: 'success', data: null });

    const weakTopicName = weakTopicStats[0]._id;

    // 2. Find dependencies for this topic from Questions
    // We assume dependencies are stored in the Question model's 'prerequisites' or implied by hierarchy
    // Since 'prerequisites' is in the Question model schema you provided:
    const dependencies = await Question.aggregate([
      { $match: { "topic.name": weakTopicName } },
      { $unwind: "$prerequisites" },
      { $group: { _id: "$prerequisites.topic", strength_req: { $first: "$prerequisites.strength_req" } } },
      { $limit: 3 }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        weakestTopic: weakTopicName,
        accuracy: Math.round(weakTopicStats[0].accuracy * 100),
        dependencies: dependencies.map(d => ({ name: d._id, impact: d.strength_req }))
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getRetentionHealth = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    // 1. Define the "Retention Gap" (e.g., 3 Days = 259200000 ms)
    const RETENTION_GAP_MS = 3 * 24 * 60 * 60 * 1000; 

    const retentionStats = await UserActivity.aggregate([
      // A. Match User
      { $match: { user_id: userId } },

      // B. Group by Topic to find the "First Seen" date
      { 
        $group: {
          _id: "$topic_tag",
          firstSeen: { $min: "$timestamp" },
          // Keep all attempts to filter later
          attempts: { 
            $push: { 
              is_correct: "$is_correct", 
              timestamp: "$timestamp" 
            } 
          }
        }
      },

      // C. Filter for "Retention Attempts" (Answers given >3 days after first learning)
      {
        $project: {
          retentionAttempts: {
            $filter: {
              input: "$attempts",
              as: "attempt",
              cond: { 
                $gte: [ 
                  "$$attempt.timestamp", 
                  { $add: ["$firstSeen", RETENTION_GAP_MS] } 
                ] 
              }
            }
          }
        }
      },

      // D. Only keep topics where retention attempts exist
      { $match: { "retentionAttempts.0": { $exists: true } } },

      // E. Unwind to calculate global accuracy on these specific "old" questions
      { $unwind: "$retentionAttempts" },
      {
        $group: {
          _id: null,
          totalCorrect: { $sum: { $cond: ["$retentionAttempts.is_correct", 1, 0] } },
          totalAttempts: { $sum: 1 }
        }
      }
    ]);

    // 2. Handle "New User" Case (No data older than 3 days)
    if (retentionStats.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          overallRetention: 0, // Signal for "No Data"
          hasData: false,      // Flag for UI
          healthStatus: "Calculating...",
          insight: "Keep practicing! We need activity older than 3 days to measure retention."
        }
      });
    }

    // 3. Calculate Real Percentage
    const stats = retentionStats[0];
    const percentage = Math.round((stats.totalCorrect / stats.totalAttempts) * 100);

    // 4. Determine Status Label
    let status = "Weak";
    let insight = "Your retention is critical. Review older topics frequently.";
    
    if (percentage >= 80) {
      status = "Excellent";
      insight = "Great long-term memory! You are retaining concepts well.";
    } else if (percentage >= 50) {
      status = "Good";
      insight = "You retain most concepts, but regular revision will help.";
    }

    res.status(200).json({
      status: 'success',
      data: {
        overallRetention: percentage,
        hasData: true,
        healthStatus: status,
        insight: insight
      }
    });

  } catch (error) {
    next(error);
  }
};