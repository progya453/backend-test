


// const UserActivity = require('../../models/UserActivity.model');
// const UserProfile = require('../../models/UserProfile.model');
// const axios = require('axios');
// const mongoose = require('mongoose');

// const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:8000';
// // Helper to map difficulty to numbers
// const getDifficultyWeight = (level) => {
//     if (level === 'Hard') return 3;
//     if (level === 'Medium') return 2;
//     return 1; // Easy
// };

// // --- 1. COGNITIVE PROFILER (Existing) ---
// exports.getCognitiveProfile = async (req, res) => {
//     try {
//         const userId = req.user._id;

//         const stats = await UserActivity.aggregate([
//             { $match: { user_id: userId } },
//             {
//                 $lookup: {
//                     from: 'questions',
//                     let: { qId: { $toObjectId: "$question_id" } },
//                     pipeline: [
//                         { $match: { $expr: { $eq: ["$_id", "$$qId"] } } },
//                         { $project: { cognitive_level: 1, optimum_time: 1 } }
//                     ],
//                     as: 'question_details'
//                 }
//             },
//             { $unwind: "$question_details" },
//             {
//                 $group: {
//                     _id: "$question_details.cognitive_level",
//                     avg_accuracy: { $avg: { $cond: ["$is_correct", 1, 0] } },
//                     avg_time_ratio: {
//                         $avg: { $divide: ["$time_taken", { $ifNull: ["$question_details.optimum_time", 60] }] }
//                     }
//                 }
//             }
//         ]);

//         const aiPayload = {};
//         stats.forEach(level => {
//             if (level._id) {
//                 aiPayload[`acc_${level._id}`] = level.avg_accuracy;
//                 aiPayload[`time_${level._id}`] = level.avg_time_ratio;
//             }
//         });

//         // Call Python AI #1
//         const aiResponse = await axios.post(`${AI_ENGINE_URL}/predict-persona`, aiPayload);

//         res.status(200).json({
//             success: true,
//             persona: aiResponse.data.persona,
//             raw_stats: aiPayload
//         });

//     } catch (error) {
//         console.error("AI Profiler Error:", error.message);
//         res.status(200).json({ success: true, persona: "Aspiring Learner", is_fallback: true });
//     }
// };

// // --- 2. STUDENT MASTERY (New) ---
// exports.getStudentMastery = async (req, res) => {
//     try {
//         const userId = req.user._id;

//         // A. Fetch User Profile for Streak & Last Active
//         const userProfile = await UserProfile.findById(userId);
//         const streak = userProfile?.gamification?.streak || 0;
//         const lastActive = userProfile?.last_active ? new Date(userProfile.last_active) : new Date();
//         const daysSinceLastActive = (new Date() - lastActive) / (1000 * 60 * 60 * 24);

//         // B. Fetch Activity Data
//         const activities = await UserActivity.aggregate([
//             { $match: { user_id: userId } },
//             { $sort: { created_at: -1 } }, // Latest first for consistency check
//             {
//                 $lookup: {
//                     from: 'questions',
//                     let: { qId: { $toObjectId: "$question_id" } },
//                     pipeline: [
//                         { $match: { $expr: { $eq: ["$_id", "$$qId"] } } },
//                         { $project: { difficulty: 1, cognitive_level: 1, optimum_time: 1 } }
//                     ],
//                     as: 'q'
//                 }
//             },
//             { $unwind: "$q" }
//         ]);

//         if (activities.length === 0) {
//             return res.status(200).json({ success: true, mastery_score: 0, level: "Novice" });
//         }

//         // C. Calculate Metrics manually (Javascript is easier than giant Mongo Pipeline here)
//         let totalWeightedScore = 0;
//         let totalMaxScore = 0;
//         let totalTimeRatio = 0;
//         let correctCount = 0;
        
//         let rememberAcc = { correct: 0, total: 0 };
//         let analyzeAcc = { correct: 0, total: 0 };

//         // Consistency: Check variance of last 20 answers
//         const recentCorrectness = activities.slice(0, 20).map(a => a.is_correct ? 1 : 0);
//         const mean = recentCorrectness.reduce((a, b) => a + b, 0) / recentCorrectness.length;
//         const variance = recentCorrectness.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recentCorrectness.length;
//         const consistency_index = 1 - Math.sqrt(variance); // Higher is better

//         activities.forEach(act => {
//             const weight = getDifficultyWeight(act.q.difficulty);
//             const isCorrect = act.is_correct ? 1 : 0;

//             if (isCorrect) {
//                 correctCount++;
//                 totalWeightedScore += weight;
//             }
//             totalMaxScore += weight;
            
//             // Time Ratio
//             const optimum = act.q.optimum_time || 60;
//             totalTimeRatio += (act.time_taken / optimum);

//             // Cognitive Dropoff
//             if (act.q.cognitive_level === 'Remember') {
//                 rememberAcc.total++;
//                 if (isCorrect) rememberAcc.correct++;
//             }
//             if (act.q.cognitive_level === 'Analyze') {
//                 analyzeAcc.total++;
//                 if (isCorrect) analyzeAcc.correct++;
//             }
//         });

//         // Final Calculations
//         const accuracy_rate = correctCount / activities.length;
//         const difficulty_weighted_score = totalMaxScore > 0 ? totalWeightedScore / totalMaxScore : 0;
//         const time_efficiency_ratio = totalTimeRatio / activities.length;
        
//         const remRate = rememberAcc.total > 0 ? rememberAcc.correct / rememberAcc.total : 0;
//         const anaRate = analyzeAcc.total > 0 ? analyzeAcc.correct / analyzeAcc.total : 0;
//         const cognitive_dropoff = Math.max(0, remRate - anaRate); // Only positive dropoff matters

//         // D. Prepare Payload for Python
//         // ...
// // D. Prepare Payload for Python
// const aiPayload = {
//     accuracy_rate,
//     difficulty_weighted_score,
//     time_efficiency_ratio,
//     cognitive_dropoff,
//     consistency_index,
//     days_since_last_active: daysSinceLastActive,  // <--- ✅ FIXED (Map variable to key)
//     streak
// };

//         // E. Call Python AI #2
//         const aiResponse = await axios.post(`${AI_ENGINE_URL}/predict-mastery`, aiPayload);
//         const score = aiResponse.data.mastery_score;

//         // F. Determine Level
//         let levelLabel = "Novice";
//         if (score > 85) levelLabel = "Grandmaster";
//         else if (score > 70) levelLabel = "Expert";
//         else if (score > 50) levelLabel = "Apprentice";

//         res.status(200).json({
//             success: true,
//             mastery_score: score.toFixed(1),
//             level: levelLabel,
//             ai_data: aiPayload
//         });

//     } catch (error) {
//         console.error("AI Mastery Error:", error.message);
//         res.status(500).json({ success: false, message: "AI Engine Failed" });
//     }
// };





const UserActivity = require('../../models/UserActivity.model');
const UserProfile = require('../../models/UserProfile.model');
const UserProgress = require('../../models/UserProgress.model'); // Required for Syllabus
const Chapter = require('../../models/Chapter.model'); // Required for Syllabus
const axios = require('axios');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:8000';

const getDifficultyWeight = (level) => {
    if (level === 'Hard') return 3;
    if (level === 'Medium') return 2;
    return 1;
};

// --- 1. COGNITIVE PROFILER ---
exports.getCognitiveProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const stats = await UserActivity.aggregate([
            { $match: { user_id: userId } },
            {
                $lookup: {
                    from: 'questions',
                    let: { qId: { $toObjectId: "$question_id" } },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$qId"] } } },
                        { $project: { cognitive_level: 1, optimum_time: 1 } }
                    ],
                    as: 'q'
                }
            },
            { $unwind: "$q" },
            {
                $group: {
                    _id: "$q.cognitive_level",
                    avg_accuracy: { $avg: { $cond: ["$is_correct", 1, 0] } },
                    avg_time_ratio: { $avg: { $divide: ["$time_taken", { $ifNull: ["$q.optimum_time", 60] }] } }
                }
            }
        ]);

        const aiPayload = {};
        stats.forEach(level => {
            if (level._id) {
                aiPayload[`acc_${level._id}`] = level.avg_accuracy;
                aiPayload[`time_${level._id}`] = level.avg_time_ratio;
            }
        });

        const aiResponse = await axios.post(`${AI_ENGINE_URL}/predict-persona`, aiPayload);
        res.status(200).json({ success: true, persona: aiResponse.data.persona });
    } catch (error) {
        console.error("AI Profiler Error:", error.message);
        res.status(200).json({ success: true, persona: "Aspiring Learner" });
    }
};

// --- 2. STUDENT MASTERY ---
exports.getStudentMastery = async (req, res) => {
    try {
        const userId = req.user._id;
        // ... (Reuse your existing logic here, or use the helper function below)
        const metrics = await calculateCommonMetrics(userId);
        
        const aiPayload = {
            accuracy_rate: metrics.accuracy_rate,
            difficulty_weighted_score: metrics.difficulty_weighted_score,
            time_efficiency_ratio: metrics.time_efficiency_ratio,
            cognitive_dropoff: metrics.cognitive_dropoff,
            consistency_index: metrics.consistency_index,
            days_since_last_active: metrics.days_since_last_active,
            streak: metrics.streak
        };

        const aiResponse = await axios.post(`${AI_ENGINE_URL}/predict-mastery`, aiPayload);
        const score = aiResponse.data.mastery_score;

        let levelLabel = "Novice";
        if (score > 85) levelLabel = "Grandmaster";
        else if (score > 70) levelLabel = "Expert";
        else if (score > 50) levelLabel = "Apprentice";

        res.status(200).json({ success: true, mastery_score: score.toFixed(1), level: levelLabel });
    } catch (error) {
        console.error("AI Mastery Error:", error.message);
        res.status(500).json({ success: false, message: "AI Engine Failed" });
    }
};

// --- 3. EXAM PROJECTOR (NEW) ---
// exports.getExamPrediction = async (req, res) => {
//     try {
//         const userId = req.user._id;
        
//         // 1. Get Base Metrics (Mastery, Consistency)
//         const metrics = await calculateCommonMetrics(userId);

//         // 2. Calculate Syllabus Completion
//         const totalChapters = await Chapter.countDocuments();
//         // Assuming UserProgress tracks completed chapters
//         const completedChapters = await UserProgress.countDocuments({ user: userId, is_completed: true }); 
//         const syllabus_completion = totalChapters > 0 ? (completedChapters / totalChapters) : 0;

//         // 3. Mock Test Score (If exists, else use weighted mastery as proxy)
//         // Ideally, you'd query specific "Mock" quizzes here. 
//         // For MVP, we'll assume it matches their mastery score temporarily if no mocks found.
//         const mock_test_score = metrics.difficulty_weighted_score * 100; 

//         // 4. Anxiety (Default to 1.0 = Normal, unless we track 'skip rate' or 'time pressure')
//         const exam_anxiety_factor = 1.0; 

//         const aiPayload = {
//             weighted_mastery: metrics.difficulty_weighted_score * 100, // Convert 0-1 to 0-100
//             syllabus_completion: syllabus_completion,
//             mock_test_score: mock_test_score,
//             consistency_score: metrics.consistency_index,
//             exam_anxiety_factor: exam_anxiety_factor
//         };

//         const aiResponse = await axios.post(`${AI_ENGINE_URL}/predict-exam`, aiPayload);
        
//         res.status(200).json({
//             success: true,
//             predicted_score: aiResponse.data.predicted_board_score.toFixed(1),
//             syllabus_completion: (syllabus_completion * 100).toFixed(1)
//         });

//     } catch (error) {
//         console.error("AI Exam Error:", error.message);
//         res.status(500).json({ success: false, message: "AI Engine Failed" });
//     }
// };


// ... inside ai.controller.js

exports.getExamPrediction = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // 1. Get Base Metrics
        const metrics = await calculateCommonMetrics(userId);

        // 2. DEBUG: Log Chapter Counts
        const totalChapters = await Chapter.countDocuments();
        
        // Check BOTH naming conventions just in case
        const completedSnake = await UserProgress.countDocuments({ user: userId, is_completed: true });
        const completedCamel = await UserProgress.countDocuments({ user: userId, isCompleted: true });
        
        // Use whichever has data
        const completedChapters = Math.max(completedSnake, completedCamel);
        
        console.log(`🔍 DEBUG SYLLABUS: Total=${totalChapters}, Completed=${completedChapters} (Snake=${completedSnake}, Camel=${completedCamel})`);

        const syllabus_completion = totalChapters > 0 ? (completedChapters / totalChapters) : 0;

        // 3. Mock Test (Fallback to mastery if 0)
        const mock_test_score = metrics.difficulty_weighted_score * 100; 

        const aiPayload = {
            weighted_mastery: metrics.difficulty_weighted_score * 100, 
            syllabus_completion: syllabus_completion,
            mock_test_score: mock_test_score,
            consistency_score: metrics.consistency_index,
            exam_anxiety_factor: 1.0
        };

        const aiResponse = await axios.post(`${AI_ENGINE_URL}/predict-exam`, aiPayload);
        
        res.status(200).json({
            success: true,
            predicted_score: aiResponse.data.predicted_board_score.toFixed(1),
            // Convert to Percentage (e.g., 0.12 -> 12.0)
            syllabus_completion: (syllabus_completion * 100).toFixed(1)
        });

    } catch (error) {
        console.error("AI Exam Error:", error.message);
        res.status(500).json({ success: false, message: "AI Engine Failed" });
    }
};

// --- HELPER: Common Metrics Calculation ---
async function calculateCommonMetrics(userId) {
    const userProfile = await UserProfile.findById(userId);
    const streak = userProfile?.gamification?.streak || 0;
    const lastActive = userProfile?.last_active ? new Date(userProfile.last_active) : new Date();
    const days_since_last_active = (new Date() - lastActive) / (1000 * 60 * 60 * 24);

    const activities = await UserActivity.aggregate([
        { $match: { user_id: userId } },
        { $sort: { created_at: -1 } },
        {
            $lookup: {
                from: 'questions',
                let: { qId: { $toObjectId: "$question_id" } },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$qId"] } } },
                    { $project: { difficulty: 1, cognitive_level: 1, optimum_time: 1 } }
                ],
                as: 'q'
            }
        },
        { $unwind: "$q" }
    ]);

    if (activities.length === 0) {
        return { accuracy_rate: 0, difficulty_weighted_score: 0, time_efficiency_ratio: 1, cognitive_dropoff: 0, consistency_index: 0, days_since_last_active: 0, streak: 0 };
    }

    let totalWeighted = 0, totalMax = 0, totalTimeRatio = 0, correctCount = 0;
    let remAcc = { c: 0, t: 0 }, anaAcc = { c: 0, t: 0 };

    // Consistency
    const recent = activities.slice(0, 20).map(a => a.is_correct ? 1 : 0);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const variance = recent.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recent.length;
    const consistency_index = 1 - Math.sqrt(variance);

    activities.forEach(act => {
        const w = getDifficultyWeight(act.q.difficulty);
        if (act.is_correct) { correctCount++; totalWeighted += w; }
        totalMax += w;
        totalTimeRatio += (act.time_taken / (act.q.optimum_time || 60));
        
        if (act.q.cognitive_level === 'Remember') { remAcc.t++; if (act.is_correct) remAcc.c++; }
        if (act.q.cognitive_level === 'Analyze') { anaAcc.t++; if (act.is_correct) anaAcc.c++; }
    });

    const remRate = remAcc.t > 0 ? remAcc.c / remAcc.t : 0;
    const anaRate = anaAcc.t > 0 ? anaAcc.c / anaAcc.t : 0;

    return {
        accuracy_rate: correctCount / activities.length,
        difficulty_weighted_score: totalMax > 0 ? totalWeighted / totalMax : 0,
        time_efficiency_ratio: totalTimeRatio / activities.length,
        cognitive_dropoff: Math.max(0, remRate - anaRate),
        consistency_index,
        days_since_last_active,
        streak
    };
}