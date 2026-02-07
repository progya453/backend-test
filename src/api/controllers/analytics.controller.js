// const UserActivity = require('../../models/UserActivity.model');
// const Question = require('../../models/Question.model');
// const mongoose = require('mongoose');

// // const  catchAsync  = require('../../utils/apiError'); // Assuming you have a wrapper, else use try-catch
// // const catchAsync = require('../../utils/apiError'); 
// const { catchAsync } = require('../../utils/apiError'); // Destructured import
// const UserProfile = require('../../models/UserProfile.model');


// exports.getBoardTrend = async (req, res, next) => {
//   try {
//     // Ensure userId is in the correct format for aggregation matching.
//     // Assuming user_id in UserActivity is stored as a String based on previous context.
//     // If it's stored as ObjectId, remove .toString().
//     const userId = req.user._id.toString();

//     // 1. Calculate the date boundary (start of today minus 7 weeks)
//     const today = new Date();
//     // Set to end of today to capture everything up to now
//     today.setHours(23, 59, 59, 999);

//     // Calculate start date: Go back 48 days (just under 7 weeks) to ensure we get full 7 weeks including current partial week
//     const sevenWeeksAgoStr = new Date(today.getTime() - (48 * 24 * 60 * 60 * 1000)).toISOString();
//     const dateBoundary = new Date(sevenWeeksAgoStr);

//     const trend = await UserActivity.aggregate([
//       // 🌟 CRITICAL SCALABILITY STEP: Filter by User AND Date Range immediately.
//       // This uses the compound index { user_id: 1, timestamp: -1 }
//       {
//         $match: {
//           user_id: userId,
//           timestamp: { $gte: dateBoundary }
//         }
//       },
//       {
//         $group: {
//           // Group by Year AND Week to handle year crossovers correctly
//           _id: {
//             year: { $isoWeekYear: "$timestamp" },
//             week: { $isoWeek: "$timestamp" }
//           },
//           // Capture the earliest date in that week for reference
//           weekStart: { $min: "$timestamp" },
//           // Calculate accuracy (1 for correct, 0 for incorrect)
//           averageAccuracy: { $avg: { $cond: ["$is_correct", 1, 0] } }
//         }
//       },
//       // Sort chronologically (oldest week first)
//       { $sort: { "_id.year": 1, "_id.week": 1 } },
//       // Ensure we never send more than 7 data points
//       { $limit: 7 }
//     ]);

//     // 3. Post-process for frontend labels (W1, W2...)
//     // This automatically handles new users. If they only have 2 weeks of data,
//     // the trend array length is 2, and they get labeled W1, W2.
//     const formattedData = trend.map((t, index) => ({
//       // The requirement: "W1 will be a according to w1 perfomence..."
//       // We label them sequentially based on the data found in the window.
//       weekLabel: `W${index + 1}`,
//       // Keep the actual date for tooltips if needed later
//       date: t.weekStart.toISOString().split('T')[0],
//       probability: Math.round(t.averageAccuracy * 100)
//     }));

//     res.status(200).json({
//       status: 'success',
//       data: formattedData
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// exports.getTopicDiagnostics = async (req, res, next) => {
//   try {
//     const userId = req.user._id.toString();

//     const diagnostics = await UserActivity.aggregate([
//       { $match: { user_id: userId } },
//       {
//         $group: {
//           _id: "$topic_tag",
//           totalAttempts: { $sum: 1 },
//           correctAttempts: { $sum: { $cond: ["$is_correct", 1, 0] } },
//           avgTimeTaken: { $avg: "$time_taken" }
//         }
//       },
//       {
//         $project: {
//           topic: "$_id",
//           accuracy: { $multiply: [{ $divide: ["$correctAttempts", "$totalAttempts"] }, 100] },
//           timeTaken: "$avgTimeTaken",
//           status: {
//             $switch: {
//               branches: [
//                 { case: { $gte: [{ $divide: ["$correctAttempts", "$totalAttempts"] }, 0.8] }, then: "Mastered" },
//                 { case: { $gte: [{ $divide: ["$correctAttempts", "$totalAttempts"] }, 0.5] }, then: "Improving" }
//               ],
//               default: "Weak"
//             }
//           }
//         }
//       }
//     ]);

//     res.status(200).json({ status: 'success', data: diagnostics });
//   } catch (error) {
//     next(error);
//   }
// };

// exports.getCognitiveSkills = async (req, res, next) => {
//   try {
//     const userId = req.user._id.toString();

//     const skills = await UserActivity.aggregate([
//       { $match: { user_id: userId } },
//       // Convert question_id string to ObjectId for lookup if needed, or keeping as string if IDs match
//       { $addFields: { qIdObj: { $toObjectId: "$question_id" } } }, 
//       {
//         $lookup: {
//           from: "questions",
//           localField: "qIdObj",
//           foreignField: "_id",
//           as: "questionDetails"
//         }
//       },
//       { $unwind: "$questionDetails" },
//       {
//         $group: {
//           _id: "$questionDetails.cognitive_level",
//           total: { $sum: 1 },
//           correct: { $sum: { $cond: ["$is_correct", 1, 0] } }
//         }
//       },
//       {
//         $project: {
//           skill: "$_id",
//           percentage: { $multiply: [{ $divide: ["$correct", "$total"] }, 100] }
//         }
//       }
//     ]);

//     res.status(200).json({ status: 'success', data: skills });
//   } catch (error) {
//     next(error);
//   }
// };

// <<<<<<< HEAD
// exports.getRootCause = async (req, res, next) => {
//   try {
//     // 1. Find weakest topic
//     const userId = req.user._id.toString();
//     const weakTopicStats = await UserActivity.aggregate([
//       { $match: { user_id: userId } },
//       { 
//         $group: { 
//           _id: "$topic_tag", 
//           accuracy: { $avg: { $cond: ["$is_correct", 1, 0] } } 
//         } 
//       },
//       { $sort: { accuracy: 1 } },
//       { $limit: 1 }
//     ]);

//     if (!weakTopicStats.length) return res.status(200).json({ status: 'success', data: null });

//     const weakTopicName = weakTopicStats[0]._id;

//     // 2. Find dependencies for this topic from Questions
//     // We assume dependencies are stored in the Question model's 'prerequisites' or implied by hierarchy
//     // Since 'prerequisites' is in the Question model schema you provided:
//     const dependencies = await Question.aggregate([
//       { $match: { "topic.name": weakTopicName } },
//       { $unwind: "$prerequisites" },
//       { $group: { _id: "$prerequisites.topic", strength_req: { $first: "$prerequisites.strength_req" } } },
//       { $limit: 3 }
//     ]);

//     res.status(200).json({
//       status: 'success',
//       data: {
//         weakestTopic: weakTopicName,
//         accuracy: Math.round(weakTopicStats[0].accuracy * 100),
//         dependencies: dependencies.map(d => ({ name: d._id, impact: d.strength_req }))
//       }
//     });
// =======
// // exports.getRootCause = async (req, res, next) => {
// //   try {
// //     // 1. Find weakest topic
// //     const userId = req.user._id.toString();
// //     const weakTopicStats = await UserActivity.aggregate([
// //       { $match: { user_id: userId } },
// //       { 
// //         $group: { 
// //           _id: "$topic_tag", 
// //           accuracy: { $avg: { $cond: ["$is_correct", 1, 0] } } 
// //         } 
// //       },
// //       { $sort: { accuracy: 1 } },
// //       { $limit: 1 }
// //     ]);

// //     if (!weakTopicStats.length) return res.status(200).json({ status: 'success', data: null });

// //     const weakTopicName = weakTopicStats[0]._id;

// //     // 2. Find dependencies for this topic from Questions
// //     // We assume dependencies are stored in the Question model's 'prerequisites' or implied by hierarchy
// //     // Since 'prerequisites' is in the Question model schema you provided:
// //     const dependencies = await Question.aggregate([
// //       { $match: { "topic.name": weakTopicName } },
// //       { $unwind: "$prerequisites" },
// //       { $group: { _id: "$prerequisites.topic", strength_req: { $first: "$prerequisites.strength_req" } } },
// //       { $limit: 3 }
// //     ]);

// //     res.status(200).json({
// //       status: 'success',
// //       data: {
// //         weakestTopic: weakTopicName,
// //         accuracy: Math.round(weakTopicStats[0].accuracy * 100),
// //         dependencies: dependencies.map(d => ({ name: d._id, impact: d.strength_req }))
// //       }
// //     });
// //   } catch (error) {
// //     next(error);
// //   }
// // };





// exports.getRootCause = async (req, res, next) => {
//   try {
//     const userId = req.user._id.toString();

//     // 1. Aggregate Incorrect Answers & Categorize based on Time/Pattern
//     const analysis = await UserActivity.aggregate([
//       // Filter: Only look at incorrect attempts for this user
//       { 
//         $match: { 
//           user_id: userId, 
//           is_correct: false 
//         } 
//       },
//       // Heuristic Categorization Logic
//       {
//         $project: {
//           category: {
//             $switch: {
//               branches: [
//                 // If answered in < 5 seconds: Likely "Guessing"
//                 { case: { $lt: ["$time_taken", 5] }, then: "Guessing" },
//                 // If answered in 5-15 seconds: Likely "Silly Mistake" (rushed reading)
//                 { case: { $and: [ { $gte: ["$time_taken", 5] }, { $lt: ["$time_taken", 15] } ] }, then: "Silly Mistake" },
//                 // If answered in > 120 seconds: Likely "Time Management" issue
//                 { case: { $gt: ["$time_taken", 120] }, then: "Time Management" }
//               ],
//               // Default (15s - 120s): "Conceptual Error" (Spent time but got it wrong)
//               default: "Conceptual Error"
//             }
//           }
//         }
//       },
//       // Group by Category to get counts
//       {
//         $group: {
//           _id: "$category",
//           count: { $sum: 1 }
//         }
//       }
//     ]);

//     // 2. Calculate Totals for Percentages
//     const totalErrors = analysis.reduce((sum, item) => sum + item.count, 0);

//     // 3. Define Colors for UI Mapping
//     const colorMap = {
//       'Conceptual Error': '#EF4444', // Red
//       'Silly Mistake': '#F59E0B',    // Amber
//       'Time Management': '#3B82F6',  // Blue
//       'Guessing': '#10B981'          // Emerald
//     };

//     // 4. Format Output matching Frontend Interface
//     const items = analysis.map(item => ({
//       label: item._id,
//       count: item.count,
//       percentage: totalErrors > 0 ? Math.round((item.count / totalErrors) * 100) : 0,
//       color: colorMap[item._id] || '#9CA3AF' // Default gray
//     }));

//     // Ensure we send a valid object even if empty
//     res.status(200).json({
//       status: 'success',
//       data: {
//         totalErrors,
//         items: items.length > 0 ? items : []
//       }
//     });

// >>>>>>> rahulpro2/main
//   } catch (error) {
//     next(error);
//   }
// };

// <<<<<<< HEAD
// =======




// >>>>>>> rahulpro2/main
// exports.getRetentionHealth = async (req, res, next) => {
//   try {
//     const userId = req.user._id.toString();

//     // 1. Define the "Retention Gap" (e.g., 3 Days = 259200000 ms)
//     const RETENTION_GAP_MS = 3 * 24 * 60 * 60 * 1000; 

//     const retentionStats = await UserActivity.aggregate([
//       // A. Match User
//       { $match: { user_id: userId } },

//       // B. Group by Topic to find the "First Seen" date
//       { 
//         $group: {
//           _id: "$topic_tag",
//           firstSeen: { $min: "$timestamp" },
//           // Keep all attempts to filter later
//           attempts: { 
//             $push: { 
//               is_correct: "$is_correct", 
//               timestamp: "$timestamp" 
//             } 
//           }
//         }
//       },

//       // C. Filter for "Retention Attempts" (Answers given >3 days after first learning)
//       {
//         $project: {
//           retentionAttempts: {
//             $filter: {
//               input: "$attempts",
//               as: "attempt",
//               cond: { 
//                 $gte: [ 
//                   "$$attempt.timestamp", 
//                   { $add: ["$firstSeen", RETENTION_GAP_MS] } 
//                 ] 
//               }
//             }
//           }
//         }
//       },

//       // D. Only keep topics where retention attempts exist
//       { $match: { "retentionAttempts.0": { $exists: true } } },

//       // E. Unwind to calculate global accuracy on these specific "old" questions
//       { $unwind: "$retentionAttempts" },
//       {
//         $group: {
//           _id: null,
//           totalCorrect: { $sum: { $cond: ["$retentionAttempts.is_correct", 1, 0] } },
//           totalAttempts: { $sum: 1 }
//         }
//       }
//     ]);

//     // 2. Handle "New User" Case (No data older than 3 days)
//     if (retentionStats.length === 0) {
//       return res.status(200).json({
//         status: 'success',
//         data: {
//           overallRetention: 0, // Signal for "No Data"
//           hasData: false,      // Flag for UI
//           healthStatus: "Calculating...",
//           insight: "Keep practicing! We need activity older than 3 days to measure retention."
//         }
//       });
//     }

//     // 3. Calculate Real Percentage
//     const stats = retentionStats[0];
//     const percentage = Math.round((stats.totalCorrect / stats.totalAttempts) * 100);

//     // 4. Determine Status Label
//     let status = "Weak";
//     let insight = "Your retention is critical. Review older topics frequently.";
    
//     if (percentage >= 80) {
//       status = "Excellent";
//       insight = "Great long-term memory! You are retaining concepts well.";
//     } else if (percentage >= 50) {
//       status = "Good";
//       insight = "You retain most concepts, but regular revision will help.";
//     }

//     res.status(200).json({
//       status: 'success',
//       data: {
//         overallRetention: percentage,
//         hasData: true,
//         healthStatus: status,
//         insight: insight
//       }
//     });

//   } catch (error) {
//     next(error);
//   }
// <<<<<<< HEAD
// };
// =======
// };












// // exports.getChapterAnalysis = async (req, res, next) => {
// //   try {
// //     const userId = req.user._id.toString();

// //     const analysis = await UserActivity.aggregate([
// //       // 1. Match User Activity
// //       { $match: { user_id: userId } },
      
// //       // 2. Convert string ID to ObjectId for Lookup
// //       { $addFields: { qIdObj: { $toObjectId: "$question_id" } } },
      
// //       // 3. Lookup Question Details to get Chapter/Topic hierarchy
// //       {
// //         $lookup: {
// //           from: "questions",
// //           localField: "qIdObj",
// //           foreignField: "_id",
// //           as: "qDetails"
// //         }
// //       },
// //       { $unwind: "$qDetails" },

// //       // 4. Group by Chapter AND Topic
// //       {
// //         $group: {
// //           _id: {
// //             chapter: "$qDetails.chapter.name", // Ensure this matches your Question Schema structure
// //             topic: "$qDetails.topic.name"
// //           },
// //           total: { $sum: 1 },
// //           correct: { $sum: { $cond: ["$is_correct", 1, 0] } }
// //         }
// //       },

// //       // 5. Calculate Accuracy
// //       {
// //         $project: {
// //           chapter: "$_id.chapter",
// //           topic: "$_id.topic",
// //           accuracy: { 
// //             $multiply: [{ $divide: ["$correct", "$total"] }, 100] 
// //           },
// //           totalQuestions: "$total"
// //         }
// //       },

// //       // 6. Regroup by Chapter to create the nested structure
// //       {
// //         $group: {
// //           _id: "$chapter",
// //           topics: {
// //             $push: {
// //               name: "$topic",
// //               accuracy: { $round: ["$accuracy", 0] },
// //               count: "$totalQuestions"
// //             }
// //           }
// //         }
// //       },
      
// //       // 7. Sort Chapters Alphabetically
// //       { $sort: { _id: 1 } }
// //     ]);

// //     res.status(200).json({
// //       status: 'success',
// //       data: analysis
// //     });

// //   } catch (error) {
// //     next(error);
// //   }
// // };




// // exports.getChapterAnalysis = async (req, res, next) => {
// //   try {
// //     const userId = req.user._id.toString();

// //     const analysis = await UserActivity.aggregate([
// //       // 1. Match User Activity
// //       { $match: { user_id: userId } },
      
// //       // 2. Lookup Question (to get topic_id)
// //       { $addFields: { qIdObj: { $toObjectId: "$question_id" } } },
// //       {
// //         $lookup: {
// //           from: "questions", // Standard Mongoose plural for Question model
// //           localField: "qIdObj",
// //           foreignField: "_id",
// //           as: "q"
// //         }
// //       },
// //       { $unwind: "$q" },

// //       // 3. Lookup Topic (Source of Truth)
// //       // ⚠️ FIX: Use 'Global_Topics' to match your Schema definition
// //       {
// //         $lookup: {
// //           from: "Global_Topics", 
// //           localField: "q.topic_id",
// //           foreignField: "_id",
// //           as: "t"
// //         }
// //       },
// //       { $unwind: "$t" },

// //       // 4. Lookup Chapter (Source of Truth)
// //       // ⚠️ FIX: Use 'Global_Chapters' to match your Schema definition
// //       {
// //         $lookup: {
// //           from: "Global_Chapters", 
// //           localField: "t.chapter_id", // Ensure Topic model has chapter_id
// //           foreignField: "_id",
// //           as: "c"
// //         }
// //       },
// //       { $unwind: "$c" },

// //       // 5. Calculate Metrics (Error Types & Time)
// //       {
// //         $addFields: {
// //           errorType: {
// //             $switch: {
// //               branches: [
// //                 { case: { $eq: ["$is_correct", true] }, then: "None" },
// //                 { case: { $lt: ["$time_taken", 5] }, then: "Guessing" },
// //                 { case: { $and: [{ $gte: ["$time_taken", 5] }, { $lt: ["$time_taken", 15] }] }, then: "Silly Mistake" },
// //                 { case: { $gt: ["$time_taken", 120] }, then: "Time Management" }
// //               ],
// //               default: "Conceptual Error"
// //             }
// //           },
// //           timeStatus: {
// //             $switch: {
// //               branches: [
// //                 { case: { $lt: ["$time_taken", 10] }, then: "Rushing" },
// //                 { case: { $gt: ["$time_taken", 90] }, then: "Overthinking" }
// //               ],
// //               default: "Optimal"
// //             }
// //           }
// //         }
// //       },

// //       // 6. Group by RELATIONAL Names
// //       {
// //         $group: {
// //           _id: {
// //             chapter: "$c.name",
// //             topic: "$t.name"
// //           },
// //           topicTotal: { $sum: 1 },
// //           topicCorrect: { $sum: { $cond: ["$is_correct", 1, 0] } },
// //           errors: { $push: "$errorType" },
// //           timeStatuses: { $push: "$timeStatus" }
// //         }
// //       },

// //       // 7. Group by Chapter
// //       {
// //         $group: {
// //           _id: "$_id.chapter",
// //           topics: {
// //             $push: {
// //               name: "$_id.topic",
// //               accuracy: { $multiply: [{ $divide: ["$topicCorrect", "$topicTotal"] }, 100] },
// //               count: "$topicTotal"
// //             }
// //           },
// //           allErrors: { $push: "$errors" },
// //           allTimeStatuses: { $push: "$timeStatuses" }
// //         }
// //       },

// //       // 8. Final Formatting
// //       {
// //         $project: {
// //           _id: 1, // Chapter Name
// //           topics: {
// //             $map: {
// //               input: "$topics",
// //               as: "t",
// //               in: {
// //                 name: "$$t.name",
// //                 accuracy: { $round: ["$$t.accuracy", 0] },
// //                 count: "$$t.count"
// //               }
// //             }
// //           },
// //           rootCauses: {
// //             $reduce: {
// //               input: { $reduce: { input: "$allErrors", initialValue: [], in: { $concatArrays: ["$$value", "$$this"] } } },
// //               initialValue: { Conceptual: 0, Silly: 0, Time: 0, Guessing: 0 },
// //               in: {
// //                 $mergeObjects: [
// //                   "$$value",
// //                   {
// //                     $switch: {
// //                       branches: [
// //                         { case: { $eq: ["$$this", "Conceptual Error"] }, then: { Conceptual: { $add: ["$$value.Conceptual", 1] } } },
// //                         { case: { $eq: ["$$this", "Silly Mistake"] }, then: { Silly: { $add: ["$$value.Silly", 1] } } },
// //                         { case: { $eq: ["$$this", "Time Management"] }, then: { Time: { $add: ["$$value.Time", 1] } } },
// //                         { case: { $eq: ["$$this", "Guessing"] }, then: { Guessing: { $add: ["$$value.Guessing", 1] } } }
// //                       ],
// //                       default: {}
// //                     }
// //                   }
// //                 ]
// //               }
// //             }
// //           },
// //           timeCounts: {
// //             $reduce: {
// //               input: { $reduce: { input: "$allTimeStatuses", initialValue: [], in: { $concatArrays: ["$$value", "$$this"] } } },
// //               initialValue: { Rushing: 0, Overthinking: 0, Optimal: 0 },
// //               in: {
// //                 $mergeObjects: [
// //                   "$$value",
// //                   {
// //                     $switch: {
// //                       branches: [
// //                         { case: { $eq: ["$$this", "Rushing"] }, then: { Rushing: { $add: ["$$value.Rushing", 1] } } },
// //                         { case: { $eq: ["$$this", "Overthinking"] }, then: { Overthinking: { $add: ["$$value.Overthinking", 1] } } },
// //                         { case: { $eq: ["$$this", "Optimal"] }, then: { Optimal: { $add: ["$$value.Optimal", 1] } } }
// //                       ],
// //                       default: {}
// //                     }
// //                   }
// //                 ]
// //               }
// //             }
// //           }
// //         }
// //       },

// //       // 9. Determine Dominant Time Status
// //       {
// //         $addFields: {
// //           timePressureStatus: {
// //             $switch: {
// //               branches: [
// //                 { case: { $gte: ["$timeCounts.Rushing", "$timeCounts.Overthinking"] }, then: "Rushing" },
// //                 { case: { $gt: ["$timeCounts.Overthinking", "$timeCounts.Rushing"] }, then: "Overthinking" }
// //               ],
// //               default: "Normal"
// //             }
// //           }
// //         }
// //       }
// //     ]);

// //     res.status(200).json({ status: 'success', data: analysis });

// //   } catch (error) {
// //     next(error);
// //   }
// // };




// exports.getChapterAnalysis = async (req, res, next) => {
//   try {
//     const userId = req.user._id.toString();

//     const analysis = await UserActivity.aggregate([
//       // 1. Match User Activity
//       { $match: { user_id: userId } },
      
//       // 2. Lookup Question
//       { $addFields: { qIdObj: { $toObjectId: "$question_id" } } },
//       {
//         $lookup: {
//           from: "questions",
//           localField: "qIdObj",
//           foreignField: "_id",
//           as: "q"
//         }
//       },
//       { $unwind: "$q" },

//       // 3. Lookup Topic
//       {
//         $lookup: {
//           from: "Global_Topics", 
//           localField: "q.topic_id",
//           foreignField: "_id",
//           as: "t"
//         }
//       },
//       { $unwind: "$t" },

//       // 4. Lookup Chapter
//       {
//         $lookup: {
//           from: "Global_Chapters", 
//           localField: "t.chapter_id",
//           foreignField: "_id",
//           as: "c"
//         }
//       },
//       { $unwind: "$c" },

//       // 5. ✅ NEW: Lookup Subject (Global_Subjects)
//       {
//         $lookup: {
//           from: "Global_Subjects", 
//           localField: "c.subject_id",
//           foreignField: "_id",
//           as: "s"
//         }
//       },
//       { $unwind: "$s" },

//       // 6. Calculate Metrics (Error Types & Time)
//       {
//         $addFields: {
//           errorType: {
//             $switch: {
//               branches: [
//                 { case: { $eq: ["$is_correct", true] }, then: "None" },
//                 { case: { $lt: ["$time_taken", 5] }, then: "Guessing" },
//                 { case: { $and: [{ $gte: ["$time_taken", 5] }, { $lt: ["$time_taken", 15] }] }, then: "Silly Mistake" },
//                 { case: { $gt: ["$time_taken", 120] }, then: "Time Management" }
//               ],
//               default: "Conceptual Error"
//             }
//           },
//           timeStatus: {
//             $switch: {
//               branches: [
//                 { case: { $lt: ["$time_taken", 10] }, then: "Rushing" },
//                 { case: { $gt: ["$time_taken", 90] }, then: "Overthinking" }
//               ],
//               default: "Optimal"
//             }
//           }
//         }
//       },

//       // 7. Group by RELATIONAL Names (Include Subject)
//       {
//         $group: {
//           _id: {
//             subject: "$s.name", // ✅ Group by Subject Name
//             chapter: "$c.name",
//             topic: "$t.name"
//           },
//           topicTotal: { $sum: 1 },
//           topicCorrect: { $sum: { $cond: ["$is_correct", 1, 0] } },
//           errors: { $push: "$errorType" },
//           timeStatuses: { $push: "$timeStatus" }
//         }
//       },

//       // 8. Group by Subject & Chapter (Aggregate Topic Stats)
//       {
//         $group: {
//           _id: {
//             subject: "$_id.subject", // ✅ Keep Subject in ID
//             chapter: "$_id.chapter"
//           },
//           topics: {
//             $push: {
//               name: "$_id.topic",
//               accuracy: { $multiply: [{ $divide: ["$topicCorrect", "$topicTotal"] }, 100] },
//               count: "$topicTotal"
//             }
//           },
//           allErrors: { $push: "$errors" },
//           allTimeStatuses: { $push: "$timeStatuses" }
//         }
//       },

//       // 9. Final Formatting
//       {
//         $project: {
//           subjectName: "$_id.subject", // ✅ Expose Subject Name to Frontend
//           _id: "$_id.chapter",         // Chapter Name
//           topics: {
//             $map: {
//               input: "$topics",
//               as: "t",
//               in: {
//                 name: "$$t.name",
//                 accuracy: { $round: ["$$t.accuracy", 0] },
//                 count: "$$t.count"
//               }
//             }
//           },
//           rootCauses: {
//             $reduce: {
//               input: { $reduce: { input: "$allErrors", initialValue: [], in: { $concatArrays: ["$$value", "$$this"] } } },
//               initialValue: { Conceptual: 0, Silly: 0, Time: 0, Guessing: 0 },
//               in: {
//                 $mergeObjects: [
//                   "$$value",
//                   {
//                     $switch: {
//                       branches: [
//                         { case: { $eq: ["$$this", "Conceptual Error"] }, then: { Conceptual: { $add: ["$$value.Conceptual", 1] } } },
//                         { case: { $eq: ["$$this", "Silly Mistake"] }, then: { Silly: { $add: ["$$value.Silly", 1] } } },
//                         { case: { $eq: ["$$this", "Time Management"] }, then: { Time: { $add: ["$$value.Time", 1] } } },
//                         { case: { $eq: ["$$this", "Guessing"] }, then: { Guessing: { $add: ["$$value.Guessing", 1] } } }
//                       ],
//                       default: {}
//                     }
//                   }
//                 ]
//               }
//             }
//           },
//           timeCounts: {
//             $reduce: {
//               input: { $reduce: { input: "$allTimeStatuses", initialValue: [], in: { $concatArrays: ["$$value", "$$this"] } } },
//               initialValue: { Rushing: 0, Overthinking: 0, Optimal: 0 },
//               in: {
//                 $mergeObjects: [
//                   "$$value",
//                   {
//                     $switch: {
//                       branches: [
//                         { case: { $eq: ["$$this", "Rushing"] }, then: { Rushing: { $add: ["$$value.Rushing", 1] } } },
//                         { case: { $eq: ["$$this", "Overthinking"] }, then: { Overthinking: { $add: ["$$value.Overthinking", 1] } } },
//                         { case: { $eq: ["$$this", "Optimal"] }, then: { Optimal: { $add: ["$$value.Optimal", 1] } } }
//                       ],
//                       default: {}
//                     }
//                   }
//                 ]
//               }
//             }
//           }
//         }
//       },

//       // 10. Determine Dominant Time Status
//       {
//         $addFields: {
//           timePressureStatus: {
//             $switch: {
//               branches: [
//                 { case: { $gte: ["$timeCounts.Rushing", "$timeCounts.Overthinking"] }, then: "Rushing" },
//                 { case: { $gt: ["$timeCounts.Overthinking", "$timeCounts.Rushing"] }, then: "Overthinking" }
//               ],
//               default: "Normal"
//             }
//           }
//         }
//       },

//       // 11. Sort by Subject, then Chapter
//       { $sort: { subjectName: 1, _id: 1 } }
//     ]);

//     res.status(200).json({ status: 'success', data: analysis });

//   } catch (error) {
//     next(error);
//   }
// };



// exports.getDashboardPulse = catchAsync(async (req, res, next) => {
//   const UserProfile = require('../../models/UserProfile.model');
//   const userId = req.user._id;

//   const user = await UserProfile.findById(userId)
//     .select('ai_report topic_states gamification dashboard_insight profile.name');

//   if (!user) {
//     return res.status(404).json({ status: 'fail', message: 'User profile not found' });
//   }

//   // FORCE FALLBACKS: If the DB fields are empty, send "Initialization" data
//   const readiness = (user.ai_report && user.ai_report.predicted_percentile) ? user.ai_report : {
//     predicted_percentile: 0,
//     probability_score: 15, // Non-zero for the UI ring to show a sliver
//     reasoning: "Initialization phase: Complete more sessions to activate AI."
//   };

//   // SCANNER FALLBACK: If no topics are at risk, show recent topics to keep HUD active
//   let recoveryQueue = (user.topic_states || [])
//     .filter(t => t.memory_strength < 45)
//     .sort((a, b) => a.memory_strength - b.memory_strength)
//     .slice(0, 3);

//   if (recoveryQueue.length === 0 && user.topic_states?.length > 0) {
//     recoveryQueue = user.topic_states.slice(0, 3); // Show top 3 recent if none are "Critical"
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       userName: user.profile.name || "Student",
//       readiness: readiness,
//       stats: user.gamification || { streak: 0 },
//       aiPlan: user.dashboard_insight?.recommendation || { label: "Analyze Path", context: "Pick a subject below to start your diagnostic." },
//       recoveryQueue: recoveryQueue
//     }
//   });
// });
// >>>>>>> rahulpro2/main




const UserActivity = require('../../models/UserActivity.model');
const Question = require('../../models/Question.model');
const mongoose = require('mongoose');
const { catchAsync } = require('../../utils/apiError'); 
const UserProfile = require('../../models/UserProfile.model');

exports.getBoardTrend = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    // 1. Calculate the date boundary (start of today minus 7 weeks)
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sevenWeeksAgoStr = new Date(today.getTime() - (48 * 24 * 60 * 60 * 1000)).toISOString();
    const dateBoundary = new Date(sevenWeeksAgoStr);

    const trend = await UserActivity.aggregate([
      {
        $match: {
          user_id: userId,
          timestamp: { $gte: dateBoundary }
        }
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: "$timestamp" },
            week: { $isoWeek: "$timestamp" }
          },
          weekStart: { $min: "$timestamp" },
          averageAccuracy: { $avg: { $cond: ["$is_correct", 1, 0] } }
        }
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
      { $limit: 7 }
    ]);

    const formattedData = trend.map((t, index) => ({
      weekLabel: `W${index + 1}`,
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

// 🌟 MERGED: Combines Behavioral Analysis (rahulpro2) AND Topic Dependencies (HEAD)
exports.getRootCause = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    // --- 1. Behavioral Analysis (Time/Pattern Heuristics) ---
    const analysis = await UserActivity.aggregate([
      { 
        $match: { 
          user_id: userId, 
          is_correct: false 
        } 
      },
      {
        $project: {
          category: {
            $switch: {
              branches: [
                { case: { $lt: ["$time_taken", 5] }, then: "Guessing" },
                { case: { $and: [ { $gte: ["$time_taken", 5] }, { $lt: ["$time_taken", 15] } ] }, then: "Silly Mistake" },
                { case: { $gt: ["$time_taken", 120] }, then: "Time Management" }
              ],
              default: "Conceptual Error"
            }
          }
        }
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalErrors = analysis.reduce((sum, item) => sum + item.count, 0);
    const colorMap = {
      'Conceptual Error': '#EF4444', 
      'Silly Mistake': '#F59E0B',    
      'Time Management': '#3B82F6',  
      'Guessing': '#10B981'          
    };

    const items = analysis.map(item => ({
      label: item._id,
      count: item.count,
      percentage: totalErrors > 0 ? Math.round((item.count / totalErrors) * 100) : 0,
      color: colorMap[item._id] || '#9CA3AF'
    }));

    // --- 2. Topic Dependency Analysis (Preserving HEAD Feature) ---
    // Finds the specific topic causing issues to suggest prerequisites
    let dependencyData = null;
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

    if (weakTopicStats.length > 0) {
        const weakTopicName = weakTopicStats[0]._id;
        const dependencies = await Question.aggregate([
            { $match: { "topic.name": weakTopicName } },
            { $unwind: "$prerequisites" },
            { $group: { _id: "$prerequisites.topic", strength_req: { $first: "$prerequisites.strength_req" } } },
            { $limit: 3 }
        ]);
        
        dependencyData = {
            weakestTopic: weakTopicName,
            accuracy: Math.round(weakTopicStats[0].accuracy * 100),
            prerequisites: dependencies.map(d => ({ name: d._id, impact: d.strength_req }))
        };
    }

    // --- 3. Combined Response ---
    res.status(200).json({
      status: 'success',
      data: {
        // Behavioral Data
        totalErrors,
        items: items.length > 0 ? items : [],
        // Topic Data
        topicAnalysis: dependencyData
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.getRetentionHealth = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    // 1. Define the "Retention Gap" (e.g., 3 Days)
    const RETENTION_GAP_MS = 3 * 24 * 60 * 60 * 1000; 

    const retentionStats = await UserActivity.aggregate([
      // A. Match User
      { $match: { user_id: userId } },

      // B. Group by Topic to find the "First Seen" date
      { 
        $group: {
          _id: "$topic_tag",
          firstSeen: { $min: "$timestamp" },
          attempts: { 
            $push: { 
              is_correct: "$is_correct", 
              timestamp: "$timestamp" 
            } 
          }
        }
      },

      // C. Filter for "Retention Attempts"
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

      // E. Unwind to calculate global accuracy
      { $unwind: "$retentionAttempts" },
      {
        $group: {
          _id: null,
          totalCorrect: { $sum: { $cond: ["$retentionAttempts.is_correct", 1, 0] } },
          totalAttempts: { $sum: 1 }
        }
      }
    ]);

    if (retentionStats.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          overallRetention: 0, 
          hasData: false,      
          healthStatus: "Calculating...",
          insight: "Keep practicing! We need activity older than 3 days to measure retention."
        }
      });
    }

    const stats = retentionStats[0];
    const percentage = Math.round((stats.totalCorrect / stats.totalAttempts) * 100);

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

exports.getChapterAnalysis = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    const analysis = await UserActivity.aggregate([
      // 1. Match User Activity
      { $match: { user_id: userId } },
      
      // 2. Lookup Question
      { $addFields: { qIdObj: { $toObjectId: "$question_id" } } },
      {
        $lookup: {
          from: "questions",
          localField: "qIdObj",
          foreignField: "_id",
          as: "q"
        }
      },
      { $unwind: "$q" },

      // 3. Lookup Topic
      {
        $lookup: {
          from: "Global_Topics", 
          localField: "q.topic_id",
          foreignField: "_id",
          as: "t"
        }
      },
      { $unwind: "$t" },

      // 4. Lookup Chapter
      {
        $lookup: {
          from: "Global_Chapters", 
          localField: "t.chapter_id",
          foreignField: "_id",
          as: "c"
        }
      },
      { $unwind: "$c" },

      // 5. Lookup Subject (Global_Subjects)
      {
        $lookup: {
          from: "Global_Subjects", 
          localField: "c.subject_id",
          foreignField: "_id",
          as: "s"
        }
      },
      { $unwind: "$s" },

      // 6. Calculate Metrics (Error Types & Time)
      {
        $addFields: {
          errorType: {
            $switch: {
              branches: [
                { case: { $eq: ["$is_correct", true] }, then: "None" },
                { case: { $lt: ["$time_taken", 5] }, then: "Guessing" },
                { case: { $and: [{ $gte: ["$time_taken", 5] }, { $lt: ["$time_taken", 15] }] }, then: "Silly Mistake" },
                { case: { $gt: ["$time_taken", 120] }, then: "Time Management" }
              ],
              default: "Conceptual Error"
            }
          },
          timeStatus: {
            $switch: {
              branches: [
                { case: { $lt: ["$time_taken", 10] }, then: "Rushing" },
                { case: { $gt: ["$time_taken", 90] }, then: "Overthinking" }
              ],
              default: "Optimal"
            }
          }
        }
      },

      // 7. Group by RELATIONAL Names (Include Subject)
      {
        $group: {
          _id: {
            subject: "$s.name", 
            chapter: "$c.name",
            topic: "$t.name"
          },
          topicTotal: { $sum: 1 },
          topicCorrect: { $sum: { $cond: ["$is_correct", 1, 0] } },
          errors: { $push: "$errorType" },
          timeStatuses: { $push: "$timeStatus" }
        }
      },

      // 8. Group by Subject & Chapter (Aggregate Topic Stats)
      {
        $group: {
          _id: {
            subject: "$_id.subject", 
            chapter: "$_id.chapter"
          },
          topics: {
            $push: {
              name: "$_id.topic",
              accuracy: { $multiply: [{ $divide: ["$topicCorrect", "$topicTotal"] }, 100] },
              count: "$topicTotal"
            }
          },
          allErrors: { $push: "$errors" },
          allTimeStatuses: { $push: "$timeStatuses" }
        }
      },

      // 9. Final Formatting
      {
        $project: {
          subjectName: "$_id.subject", 
          _id: "$_id.chapter",
          topics: {
            $map: {
              input: "$topics",
              as: "t",
              in: {
                name: "$$t.name",
                accuracy: { $round: ["$$t.accuracy", 0] },
                count: "$$t.count"
              }
            }
          },
          rootCauses: {
            $reduce: {
              input: { $reduce: { input: "$allErrors", initialValue: [], in: { $concatArrays: ["$$value", "$$this"] } } },
              initialValue: { Conceptual: 0, Silly: 0, Time: 0, Guessing: 0 },
              in: {
                $mergeObjects: [
                  "$$value",
                  {
                    $switch: {
                      branches: [
                        { case: { $eq: ["$$this", "Conceptual Error"] }, then: { Conceptual: { $add: ["$$value.Conceptual", 1] } } },
                        { case: { $eq: ["$$this", "Silly Mistake"] }, then: { Silly: { $add: ["$$value.Silly", 1] } } },
                        { case: { $eq: ["$$this", "Time Management"] }, then: { Time: { $add: ["$$value.Time", 1] } } },
                        { case: { $eq: ["$$this", "Guessing"] }, then: { Guessing: { $add: ["$$value.Guessing", 1] } } }
                      ],
                      default: {}
                    }
                  }
                ]
              }
            }
          },
          timeCounts: {
            $reduce: {
              input: { $reduce: { input: "$allTimeStatuses", initialValue: [], in: { $concatArrays: ["$$value", "$$this"] } } },
              initialValue: { Rushing: 0, Overthinking: 0, Optimal: 0 },
              in: {
                $mergeObjects: [
                  "$$value",
                  {
                    $switch: {
                      branches: [
                        { case: { $eq: ["$$this", "Rushing"] }, then: { Rushing: { $add: ["$$value.Rushing", 1] } } },
                        { case: { $eq: ["$$this", "Overthinking"] }, then: { Overthinking: { $add: ["$$value.Overthinking", 1] } } },
                        { case: { $eq: ["$$this", "Optimal"] }, then: { Optimal: { $add: ["$$value.Optimal", 1] } } }
                      ],
                      default: {}
                    }
                  }
                ]
              }
            }
          }
        }
      },

      // 10. Determine Dominant Time Status
      {
        $addFields: {
          timePressureStatus: {
            $switch: {
              branches: [
                { case: { $gte: ["$timeCounts.Rushing", "$timeCounts.Overthinking"] }, then: "Rushing" },
                { case: { $gt: ["$timeCounts.Overthinking", "$timeCounts.Rushing"] }, then: "Overthinking" }
              ],
              default: "Normal"
            }
          }
        }
      },

      // 11. Sort by Subject, then Chapter
      { $sort: { subjectName: 1, _id: 1 } }
    ]);

    res.status(200).json({ status: 'success', data: analysis });

  } catch (error) {
    next(error);
  }
};

exports.getDashboardPulse = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const user = await UserProfile.findById(userId)
    .select('ai_report topic_states gamification dashboard_insight profile.name');

  if (!user) {
    return res.status(404).json({ status: 'fail', message: 'User profile not found' });
  }

  // FORCE FALLBACKS: If the DB fields are empty, send "Initialization" data
  const readiness = (user.ai_report && user.ai_report.predicted_percentile) ? user.ai_report : {
    predicted_percentile: 0,
    probability_score: 15, 
    reasoning: "Initialization phase: Complete more sessions to activate AI."
  };

  // SCANNER FALLBACK: If no topics are at risk, show recent topics to keep HUD active
  let recoveryQueue = (user.topic_states || [])
    .filter(t => t.memory_strength < 45)
    .sort((a, b) => a.memory_strength - b.memory_strength)
    .slice(0, 3);

  if (recoveryQueue.length === 0 && user.topic_states?.length > 0) {
    recoveryQueue = user.topic_states.slice(0, 3); 
  }

  res.status(200).json({
    status: 'success',
    data: {
      userName: user.profile.name || "Student",
      readiness: readiness,
      stats: user.gamification || { streak: 0 },
      aiPlan: user.dashboard_insight?.recommendation || { label: "Analyze Path", context: "Pick a subject below to start your diagnostic." },
      recoveryQueue: recoveryQueue
    }
  });
});