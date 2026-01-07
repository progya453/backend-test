const UserActivity = require('../../models/UserActivity.model');
const axios = require('axios');
const mongoose = require('mongoose');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:8000';

exports.getCognitiveProfile = async (req, res) => {
  try {
    const userId = req.user.user_id; // Assumes auth middleware populates this

    // 1. Aggregation Pipeline: Calculate Accuracy & Time Ratio per Cognitive Level
    const stats = await UserActivity.aggregate([
      { $match: { user_id: userId } },
      // Join with Questions to get cognitive_level and optimum_time
      {
        $lookup: {
          from: 'questions',
          let: { qId: { $toObjectId: "$question_id" } }, // Cast String to ObjectId
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$qId"] } } },
            { $project: { cognitive_level: 1, optimum_time: 1 } }
          ],
          as: 'question_details'
        }
      },
      { $unwind: "$question_details" },
      // Group by Cognitive Level
      {
        $group: {
          _id: "$question_details.cognitive_level",
          avg_accuracy: { $avg: { $cond: ["$is_correct", 1, 0] } },
          // Calculate Time Ratio: Time Taken / Optimum Time
          avg_time_ratio: { 
            $avg: { $divide: ["$time_taken", "$question_details.optimum_time"] } 
          }
        }
      }
    ]);

    // 2. Format Data for Python API
    const aiPayload = {};
    stats.forEach(level => {
        // e.g., acc_Remember, time_Analyze
        if (level._id) {
            aiPayload[`acc_${level._id}`] = level.avg_accuracy;
            aiPayload[`time_${level._id}`] = level.avg_time_ratio;
        }
    });

    // 3. Call Python AI Service
    // Set a short timeout to prevent hanging if AI is down
    const aiResponse = await axios.post(`${AI_ENGINE_URL}/predict-persona`, aiPayload, { timeout: 2000 });

    res.status(200).json({
      success: true,
      persona: aiResponse.data.persona,
      raw_stats: aiPayload
    });

  } catch (error) {
    console.error("AI Hub Error:", error.message);
    // Fallback if AI is down or data is missing
    res.status(200).json({
      success: true,
      persona: "Aspiring Learner", // Default Safe Persona
      is_fallback: true
    });
  }
};