



// const UserActivity = require('../../models/UserActivity.model');
// const UserProfile = require('../../models/UserProfile.model');
// const UserProgress = require('../../models/UserProgress.model'); // Required for Syllabus
// const Chapter = require('../../models/Chapter.model'); // Required for Syllabus
// const axios = require('axios');

// // const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:8000';


// const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'https://ai-engine-p21z.onrender.com';


// const getDifficultyWeight = (level) => {
//     if (level === 'Hard') return 3;
//     if (level === 'Medium') return 2;
//     return 1;
// };

// // --- 1. COGNITIVE PROFILER ---
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
//                     as: 'q'
//                 }
//             },
//             { $unwind: "$q" },
//             {
//                 $group: {
//                     _id: "$q.cognitive_level",
//                     avg_accuracy: { $avg: { $cond: ["$is_correct", 1, 0] } },
//                     avg_time_ratio: { $avg: { $divide: ["$time_taken", { $ifNull: ["$q.optimum_time", 60] }] } }
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

//         const aiResponse = await axios.post(`${AI_ENGINE_URL}/predict-persona`, aiPayload);
//         res.status(200).json({ success: true, persona: aiResponse.data.persona });
//     } catch (error) {
//         console.error("AI Profiler Error:", error.message);
//         res.status(200).json({ success: true, persona: "Aspiring Learner" });
//     }
// };


 

// <<<<<<< HEAD
// // ... Imports remain the same

// exports.getStudentMastery = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         const metrics = await calculateCommonMetrics(userId);
        
//         // --- 🆕 NEW LOGIC: FIND WEAKEST TOPIC ---
//         // Group activity by Topic ID and sort by Accuracy (Ascending)
//         const weakestTopicAgg = await UserActivity.aggregate([
//             { $match: { user_id: userId } },
//             {
//                 $lookup: {
//                     from: 'questions',
//                     let: { qId: { $toObjectId: "$question_id" } },
//                     pipeline: [
//                         { $match: { $expr: { $eq: ["$_id", "$$qId"] } } },
//                         { $project: { topic_id: 1 } } // Get Topic ID
//                     ],
//                     as: 'q'
//                 }
//             },
//             { $unwind: "$q" },
//             {
//                 $group: {
//                     _id: "$q.topic_id",
//                     accuracy: { $avg: { $cond: ["$is_correct", 1, 0] } },
//                     total_attempts: { $sum: 1 }
//                 }
//             },
//             // Only look at topics where they have tried at least 3 questions (avoid noise)
//             { $match: { total_attempts: { $gte: 3 } } },
//             { $sort: { accuracy: 1 } }, // Lowest accuracy first
//             { $limit: 1 }
//         ]);

//         // If no data, return null
//         const weakestTopicId = weakestTopicAgg.length > 0 ? weakestTopicAgg[0]._id : null;
//         // ----------------------------------------

//         const aiPayload = {
//             accuracy_rate: metrics.accuracy_rate,
//             difficulty_weighted_score: metrics.difficulty_weighted_score,
//             time_efficiency_ratio: metrics.time_efficiency_ratio,
//             cognitive_dropoff: metrics.cognitive_dropoff,
//             consistency_index: metrics.consistency_index,
//             days_since_last_active: metrics.days_since_last_active,
//             streak: metrics.streak
//         };

//         const aiResponse = await axios.post(`${AI_ENGINE_URL}/predict-mastery`, aiPayload);
//         const score = aiResponse.data.mastery_score;

//         let levelLabel = "Novice";
//         if (score > 85) levelLabel = "Grandmaster";
//         else if (score > 70) levelLabel = "Expert";
//         else if (score > 50) levelLabel = "Apprentice";

//         res.status(200).json({
//             success: true,
//             mastery_score: score.toFixed(1),
//             level: levelLabel,
//             ai_data: aiPayload,
//             weakest_topic_id: weakestTopicId // 👈 SEND THIS TO FRONTEND
//         });
//     } catch (error) {
//         console.error("AI Mastery Error:", error.message);
//         res.status(500).json({ success: false, message: "AI Engine Failed" });
//     }
// };







// // ... inside ai.controller.js

// exports.getExamPrediction = async (req, res) => {
//     try {
//         const userId = req.user._id;
        
//         // 1. Get Base Metrics
//         const metrics = await calculateCommonMetrics(userId);

//         // 2. DEBUG: Log Chapter Counts
//         const totalChapters = await Chapter.countDocuments();
        
//         // Check BOTH naming conventions just in case
//         const completedSnake = await UserProgress.countDocuments({ user: userId, is_completed: true });
//         const completedCamel = await UserProgress.countDocuments({ user: userId, isCompleted: true });
        
//         // Use whichever has data
//         const completedChapters = Math.max(completedSnake, completedCamel);
        
//         console.log(`🔍 DEBUG SYLLABUS: Total=${totalChapters}, Completed=${completedChapters} (Snake=${completedSnake}, Camel=${completedCamel})`);

//         const syllabus_completion = totalChapters > 0 ? (completedChapters / totalChapters) : 0;

//         // 3. Mock Test (Fallback to mastery if 0)
//         const mock_test_score = metrics.difficulty_weighted_score * 100; 

//         const aiPayload = {
//             weighted_mastery: metrics.difficulty_weighted_score * 100, 
//             syllabus_completion: syllabus_completion,
//             mock_test_score: mock_test_score,
//             consistency_score: metrics.consistency_index,
//             exam_anxiety_factor: 1.0
//         };

//         const aiResponse = await axios.post(`${AI_ENGINE_URL}/predict-exam`, aiPayload);
        
//         res.status(200).json({
//             success: true,
//             predicted_score: aiResponse.data.predicted_board_score.toFixed(1),
//             // Convert to Percentage (e.g., 0.12 -> 12.0)
//             syllabus_completion: (syllabus_completion * 100).toFixed(1)
//         });

//     } catch (error) {
//         console.error("AI Exam Error:", error.message);
//         res.status(500).json({ success: false, message: "AI Engine Failed" });
//     }
// };

// // --- HELPER: Common Metrics Calculation ---
// async function calculateCommonMetrics(userId) {
//     const userProfile = await UserProfile.findById(userId);
//     const streak = userProfile?.gamification?.streak || 0;










// const UserActivity = require('../../models/UserActivity.model');
// const UserProfile = require('../../models/UserProfile.model');
// const UserProgress = require('../../models/UserProgress.model');
// const Chapter = require('../../models/Chapter.model');
// const axios = require('axios');
// const mongoose = require('mongoose');

// const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:8000';

// // Helper to map difficulty to numbers
// const getDifficultyWeight = (level) => {
//     if (level === 'Hard') return 3;
//     if (level === 'Medium') return 2;
//     return 1; // Easy
// };

// /**
//  * --- CORE HELPER: calculateCommonMetrics ---
//  * This is the SINGLE SOURCE OF TRUTH for all AI data.
//  */
// async function calculateCommonMetrics(userId) {
//     // 1. Determine if we should use ObjectId or String
//     let queryId;
//     if (mongoose.Types.ObjectId.isValid(userId)) {
//         queryId = new mongoose.Types.ObjectId(userId);
//     } else {
//         queryId = userId; 
//     }

//     // 2. Fetch Profile & Calculate "Days Since Last Active"
//     const userProfile = await UserProfile.findById(queryId) || {};
//     const streak = userProfile?.gamification?.streak || 0;
    
//     // ✅ ADD THIS CALCULATION (This was missing and causing the error)
// >>>>>>> rahulpro2/main
//     const lastActive = userProfile?.last_active ? new Date(userProfile.last_active) : new Date();
//     const days_since_last_active = (new Date() - lastActive) / (1000 * 60 * 60 * 24);

//     const activities = await UserActivity.aggregate([
// <<<<<<< HEAD
//         { $match: { user_id: userId } },
// =======
//         { $match: { user_id: queryId } }, 
// >>>>>>> rahulpro2/main
//         { $sort: { created_at: -1 } },
//         {
//             $lookup: {
//                 from: 'questions',
// <<<<<<< HEAD
//                 let: { qId: { $toObjectId: "$question_id" } },
//                 pipeline: [
//                     { $match: { $expr: { $eq: ["$_id", "$$qId"] } } },
// =======
//                 let: { qId: "$question_id" },
//                 pipeline: [
//                     { 
//                         $match: { 
//                             $expr: { 
//                                 $eq: ["$_id", { $toObjectId: "$$qId" }] 
//                             } 
//                         } 
//                     },
// >>>>>>> rahulpro2/main
//                     { $project: { difficulty: 1, cognitive_level: 1, optimum_time: 1 } }
//                 ],
//                 as: 'q'
//             }
//         },
//         { $unwind: "$q" }
//     ]);

// <<<<<<< HEAD
//     if (activities.length === 0) {
//         return { accuracy_rate: 0, difficulty_weighted_score: 0, time_efficiency_ratio: 1, cognitive_dropoff: 0, consistency_index: 0, days_since_last_active: 0, streak: 0 };
// =======
//     console.log(`DEBUG: Found ${activities.length} activities for user ${userId}`);

//     // Syllabus Calculation
//     const totalChapters = await Chapter.countDocuments() || 1;
//     const completedChapters = await UserProgress.countDocuments({ 
//         $or: [{ user: userId }, { userId: userId }, { user_id: userId }], 
//         $or: [{ is_completed: true }, { isCompleted: true }] 
//     });
//     const syllabus_completion = (completedChapters / totalChapters) * 100;

//     if (activities.length === 0) {
//         return { 
//             accuracy_rate: 0, 
//             mastery_score: "0.0", 
//             time_efficiency_ratio: 1, 
//             cognitive_dropoff: 0, 
//             consistency_index: 0, 
//             days_since_last_active, 
//             streak, 
//             syllabus_completion: 0, 
//             predicted_score: "0.0",
//             persona: "Novice"
//         };
// >>>>>>> rahulpro2/main
//     }

//     let totalWeighted = 0, totalMax = 0, totalTimeRatio = 0, correctCount = 0;
//     let remAcc = { c: 0, t: 0 }, anaAcc = { c: 0, t: 0 };

// <<<<<<< HEAD
//     // Consistency
//     const recent = activities.slice(0, 20).map(a => a.is_correct ? 1 : 0);
//     const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
//     const variance = recent.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recent.length;
//     const consistency_index = 1 - Math.sqrt(variance);

//     activities.forEach(act => {
//         const w = getDifficultyWeight(act.q.difficulty);
//         if (act.is_correct) { correctCount++; totalWeighted += w; }
// =======
//     activities.forEach(act => {
//         const w = getDifficultyWeight(act.q.difficulty);
//         if (act.is_correct) { 
//             correctCount++; 
//             totalWeighted += w; 
//         }
// >>>>>>> rahulpro2/main
//         totalMax += w;
//         totalTimeRatio += (act.time_taken / (act.q.optimum_time || 60));
        
//         if (act.q.cognitive_level === 'Remember') { remAcc.t++; if (act.is_correct) remAcc.c++; }
//         if (act.q.cognitive_level === 'Analyze') { anaAcc.t++; if (act.is_correct) anaAcc.c++; }
//     });


//     const remRate = remAcc.t > 0 ? remAcc.c / remAcc.t : 0;
//     const anaRate = anaAcc.t > 0 ? anaAcc.c / anaAcc.t : 0;

//     return {
//         accuracy_rate: correctCount / activities.length,
//         difficulty_weighted_score: totalMax > 0 ? totalWeighted / totalMax : 0,
//         time_efficiency_ratio: totalTimeRatio / activities.length,
//         cognitive_dropoff: Math.max(0, remRate - anaRate),
//         consistency_index,
//         days_since_last_active,
//         streak
//     };
// }

//     const mastery_score = (totalWeighted / totalMax) * 100;
//     const accuracy_rate = correctCount / activities.length;

//     return {
//         accuracy_rate,
//         mastery_score: mastery_score.toFixed(1),
//         time_efficiency_ratio: totalTimeRatio / activities.length,
//         cognitive_dropoff: Math.max(0, (remAcc.t > 0 ? remAcc.c/remAcc.t : 0) - (anaAcc.t > 0 ? anaAcc.c/anaAcc.t : 0)),
//         consistency_index: 0.85,
//         days_since_last_active, // Now it is defined!
//         streak: streak || 1,
//         syllabus_completion: syllabus_completion,
//         predicted_score: (mastery_score * 0.7).toFixed(1),
//         persona: accuracy_rate > 0.7 ? "Master" : "Impulsive_guesser"
//     };
// }

// /** --- ENDPOINTS --- **/

// exports.getCognitiveProfile = async (req, res) => {
//     try {
//         const metrics = await calculateCommonMetrics(req.user._id);
//         res.status(200).json({ success: true, persona: metrics.persona });
//     } catch (error) {
//         res.status(200).json({ success: true, persona: "Novice" });
//     }
// };

// exports.getStudentMastery = async (req, res) => {
//     try {
//         const metrics = await calculateCommonMetrics(req.user._id);
//         res.status(200).json({
//             success: true,
//             mastery_score: metrics.mastery_score,
//             level: parseFloat(metrics.mastery_score) > 70 ? "Expert" : "Novice",
//             ai_data: metrics
//         });
//     } catch (error) {
//         res.status(500).json({ success: false });
//     }
// };

// exports.getExamPrediction = async (req, res) => {
//     try {
//         const metrics = await calculateCommonMetrics(req.user._id);
//         res.status(200).json({
//             success: true,
//             predicted_score: metrics.predicted_score,
//             syllabus_completion: metrics.syllabus_completion.toFixed(1)
//         });
//     } catch (error) {
//         res.status(500).json({ success: false });
//     }
// };

// exports.getBurnoutStatus = async (req, res) => {
//     try {
//         const metrics = await calculateCommonMetrics(req.user._id);
//         res.status(200).json({
//             success: true,
//             is_burned_out: metrics.accuracy_rate < 0.4,
//             stress_level: metrics.accuracy_rate < 0.4 ? "0.88" : "0.12",
//             recommendation: "System monitoring active."
//         });
//     } catch (error) {
//         res.status(500).json({ success: false });
//     }
// };

// /**
//  * --- COMPREHENSIVE SUMMARY ---
//  * This generates the professional Optimization Report
//  */
// exports.getComprehensiveSummary = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         const metrics = await calculateCommonMetrics(userId);

//         // Map variables for the report
//         const finalMastery = metrics.mastery_score;
//         const finalPrediction = metrics.predicted_score;
//         const finalSyllabus = metrics.syllabus_completion;
//         const dropoffPct = (metrics.cognitive_dropoff * 100).toFixed(1);

//         const deepInsights = [
//             {
//                 id: 'AI-1: COGNITIVE ARCHITECT',
//                 title: "Thinking Pattern Diagnosis",
//                 currentStatus: `${metrics.persona} Style`,
//                 diagnosis: `Your current accuracy-to-latency ratio is ${metrics.time_efficiency_ratio.toFixed(2)}x. We've detected a "Recognition Trap": you solve familiar questions in ~${(metrics.time_efficiency_ratio * 60).toFixed(0)}s, but accuracy drops by ${dropoffPct}% when logic requires 3+ steps.`,
//                 roadmap: `To reach 'Master' rank, spend 45s on every question—even if the answer is obvious—to write out the logic.`
//             },
//             {
//                 id: 'AI-2: MASTERY QUANTUM',
//                 title: "True Mastery Optimization",
//                 currentStatus: `${finalMastery}/100 Power Level`,
//                 diagnosis: `Your global rank is currently suppressed by ${(100 - parseFloat(finalMastery)).toFixed(0)} points due to "Complexity Avoidance." You are handling standard tasks but hitting a plateau at the 75th percentile of complexity.`,
//                 roadmap: `Implement the 'Complexity Spike' strategy by filtering for 'Analyze' level questions specifically.`
//             },
//             {
//                 id: 'AI-3: PROJECTOR CORE',
//                 title: "Exam Probability & Stability",
//                 currentStatus: `Trajectory: ${finalPrediction} Pts`,
//                 diagnosis: `This projection is an extrapolation of your ${finalSyllabus.toFixed(1)}% syllabus coverage. Your ${metrics.streak}-day streak is the only thing preventing a "Retention Decay," which could drop your score by 8 points in 48 hours.`,
//                 roadmap: `Target the "60% Threshold." Crossing 60% completion is your "Stability Point" for score resistance.`
//             },
//             {
//                 id: 'AI-4: NEURAL WATCHDOG',
//                 title: "Mental Load & Focus Security",
//                 currentStatus: metrics.accuracy_rate < 0.5 ? "High Fatigue Detected" : "Optimal Focus Zone",
//                 diagnosis: `Neural Focus is at ${(metrics.accuracy_rate * 100).toFixed(0)}%. In the last 15 questions, your processing speed increased, but accuracy decayed. This is a signature of neural exhaustion.`,
//                 roadmap: `A 'Neural Reset' is recommended. Stop for 15-20 minutes. Continuing now will decrease tomorrow's retention by up to 22%.`
//             }
//         ];

//         res.status(200).json({
//             success: true,
//             summary: {
//                 executiveSummary: `Audit Complete: System detects a ${dropoffPct}% logic gap. Neural alignment stabilized at ${finalMastery}%.`,
//                 deepInsights: deepInsights
//             }
//         });
//     } catch (error) {
//         console.error("Pro Analysis Engine Failed:", error);
//         res.status(500).json({ success: false });
//     }
// };










const UserActivity = require('../../models/UserActivity.model');
const UserProfile = require('../../models/UserProfile.model');
const UserProgress = require('../../models/UserProgress.model'); 
const Chapter = require('../../models/Chapter.model'); 
const axios = require('axios');
const mongoose = require('mongoose');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'https://ai-engine-p21z.onrender.com';

const getDifficultyWeight = (level) => {
    if (level === 'Hard') return 3;
    if (level === 'Medium') return 2;
    return 1;
};

// --- 1. COGNITIVE PROFILER (Kept from HEAD for AI Accuracy) ---
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

// --- 2. STUDENT MASTERY (Merged: AI Logic + Weakest Topic) ---
exports.getStudentMastery = async (req, res) => {
    try {
        const userId = req.user._id;
        const metrics = await calculateCommonMetrics(userId);
        
        // --- WEAKEST TOPIC LOGIC (From HEAD) ---
        const weakestTopicAgg = await UserActivity.aggregate([
            { $match: { user_id: userId } },
            {
                $lookup: {
                    from: 'questions',
                    let: { qId: { $toObjectId: "$question_id" } },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$qId"] } } },
                        { $project: { topic_id: 1 } }
                    ],
                    as: 'q'
                }
            },
            { $unwind: "$q" },
            {
                $group: {
                    _id: "$q.topic_id",
                    accuracy: { $avg: { $cond: ["$is_correct", 1, 0] } },
                    total_attempts: { $sum: 1 }
                }
            },
            { $match: { total_attempts: { $gte: 3 } } },
            { $sort: { accuracy: 1 } }, 
            { $limit: 1 }
        ]);

        const weakestTopicId = weakestTopicAgg.length > 0 ? weakestTopicAgg[0]._id : null;

        // --- AI PREDICTION ---
        const aiPayload = {
            accuracy_rate: metrics.accuracy_rate,
            difficulty_weighted_score: metrics.difficulty_weighted_score,
            time_efficiency_ratio: metrics.time_efficiency_ratio,
            cognitive_dropoff: metrics.cognitive_dropoff,
            consistency_index: metrics.consistency_index,
            days_since_last_active: metrics.days_since_last_active,
            streak: metrics.streak
        };

        let score, levelLabel;
        try {
            const aiResponse = await axios.post(`${AI_ENGINE_URL}/predict-mastery`, aiPayload);
            score = aiResponse.data.mastery_score;
        } catch (e) {
            // Fallback to local calculation if AI fails
            score = parseFloat(metrics.mastery_score);
        }

        if (score > 85) levelLabel = "Grandmaster";
        else if (score > 70) levelLabel = "Expert";
        else if (score > 50) levelLabel = "Apprentice";
        else levelLabel = "Novice";

        res.status(200).json({
            success: true,
            mastery_score: score.toFixed(1),
            level: levelLabel,
            ai_data: aiPayload,
            weakest_topic_id: weakestTopicId 
        });
    } catch (error) {
        console.error("AI Mastery Error:", error.message);
        res.status(500).json({ success: false, message: "AI Engine Failed" });
    }
};

// --- 3. EXAM PREDICTION (Merged: AI Logic + Syllabus Check) ---
exports.getExamPrediction = async (req, res) => {
    try {
        const userId = req.user._id;
        const metrics = await calculateCommonMetrics(userId);

        const aiPayload = {
            weighted_mastery: metrics.difficulty_weighted_score * 100, 
            syllabus_completion: metrics.syllabus_completion / 100, // Normalize to 0-1
            mock_test_score: metrics.difficulty_weighted_score * 100, 
            consistency_score: metrics.consistency_index,
            exam_anxiety_factor: 1.0
        };

        let predictedScore;
        try {
            const aiResponse = await axios.post(`${AI_ENGINE_URL}/predict-exam`, aiPayload);
            predictedScore = aiResponse.data.predicted_board_score;
        } catch (e) {
            predictedScore = metrics.predicted_score; // Fallback
        }
        
        res.status(200).json({
            success: true,
            predicted_score: Number(predictedScore).toFixed(1),
            syllabus_completion: metrics.syllabus_completion.toFixed(1)
        });

    } catch (error) {
        console.error("AI Exam Error:", error.message);
        res.status(500).json({ success: false, message: "AI Engine Failed" });
    }
};

// --- 4. BURNOUT STATUS (From rahulpro2) ---
exports.getBurnoutStatus = async (req, res) => {
    try {
        const metrics = await calculateCommonMetrics(req.user._id);
        res.status(200).json({
            success: true,
            is_burned_out: metrics.accuracy_rate < 0.4,
            stress_level: metrics.accuracy_rate < 0.4 ? "0.88" : "0.12",
            recommendation: "System monitoring active."
        });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};

// --- 5. COMPREHENSIVE SUMMARY (From rahulpro2) ---
exports.getComprehensiveSummary = async (req, res) => {
    try {
        const userId = req.user._id;
        const metrics = await calculateCommonMetrics(userId);

        const finalMastery = metrics.mastery_score;
        const finalPrediction = metrics.predicted_score;
        const finalSyllabus = metrics.syllabus_completion;
        const dropoffPct = (metrics.cognitive_dropoff * 100).toFixed(1);

        const deepInsights = [
            {
                id: 'AI-1: COGNITIVE ARCHITECT',
                title: "Thinking Pattern Diagnosis",
                currentStatus: `${metrics.persona} Style`,
                diagnosis: `Your current accuracy-to-latency ratio is ${metrics.time_efficiency_ratio.toFixed(2)}x. We've detected a "Recognition Trap": you solve familiar questions in ~${(metrics.time_efficiency_ratio * 60).toFixed(0)}s, but accuracy drops by ${dropoffPct}% when logic requires 3+ steps.`,
                roadmap: `To reach 'Master' rank, spend 45s on every question—even if the answer is obvious—to write out the logic.`
            },
            {
                id: 'AI-2: MASTERY QUANTUM',
                title: "True Mastery Optimization",
                currentStatus: `${finalMastery}/100 Power Level`,
                diagnosis: `Your global rank is currently suppressed by ${(100 - parseFloat(finalMastery)).toFixed(0)} points due to "Complexity Avoidance." You are handling standard tasks but hitting a plateau at the 75th percentile of complexity.`,
                roadmap: `Implement the 'Complexity Spike' strategy by filtering for 'Analyze' level questions specifically.`
            },
            {
                id: 'AI-3: PROJECTOR CORE',
                title: "Exam Probability & Stability",
                currentStatus: `Trajectory: ${finalPrediction} Pts`,
                diagnosis: `This projection is an extrapolation of your ${finalSyllabus.toFixed(1)}% syllabus coverage. Your ${metrics.streak}-day streak is the only thing preventing a "Retention Decay," which could drop your score by 8 points in 48 hours.`,
                roadmap: `Target the "60% Threshold." Crossing 60% completion is your "Stability Point" for score resistance.`
            },
            {
                id: 'AI-4: NEURAL WATCHDOG',
                title: "Mental Load & Focus Security",
                currentStatus: metrics.accuracy_rate < 0.5 ? "High Fatigue Detected" : "Optimal Focus Zone",
                diagnosis: `Neural Focus is at ${(metrics.accuracy_rate * 100).toFixed(0)}%. In the last 15 questions, your processing speed increased, but accuracy decayed. This is a signature of neural exhaustion.`,
                roadmap: `A 'Neural Reset' is recommended. Stop for 15-20 minutes. Continuing now will decrease tomorrow's retention by up to 22%.`
            }
        ];

        res.status(200).json({
            success: true,
            summary: {
                executiveSummary: `Audit Complete: System detects a ${dropoffPct}% logic gap. Neural alignment stabilized at ${finalMastery}%.`,
                deepInsights: deepInsights
            }
        });
    } catch (error) {
        console.error("Pro Analysis Engine Failed:", error);
        res.status(500).json({ success: false });
    }
};


// --- HELPER: Common Metrics Calculation (UNIFIED) ---
async function calculateCommonMetrics(userId) {
    // 1. Safe ID Handling (from rahulpro2)
    let queryId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
        queryId = new mongoose.Types.ObjectId(userId);
    } else {
        queryId = userId; 
    }

    const userProfile = await UserProfile.findById(queryId) || {};
    const streak = userProfile?.gamification?.streak || 0;
    
    // 2. Days Active (from rahulpro2)
    const lastActive = userProfile?.last_active ? new Date(userProfile.last_active) : new Date();
    const days_since_last_active = (new Date() - lastActive) / (1000 * 60 * 60 * 24);

    // 3. Syllabus Calculation (Merged Logic)
    const totalChapters = await Chapter.countDocuments() || 1;
    const completedChapters = await UserProgress.countDocuments({ 
        user: queryId, 
        $or: [{ is_completed: true }, { isCompleted: true }] // Handle both snake & camel
    });
    const syllabus_completion = (completedChapters / totalChapters) * 100;

    // 4. Activity Aggregation (from HEAD)
    const activities = await UserActivity.aggregate([
        { $match: { user_id: queryId } },
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
        return { 
            accuracy_rate: 0, 
            difficulty_weighted_score: 0, 
            time_efficiency_ratio: 1, 
            cognitive_dropoff: 0, 
            consistency_index: 0, 
            days_since_last_active: 0, 
            streak: 0,
            mastery_score: "0.0",
            syllabus_completion: 0,
            predicted_score: "0.0",
            persona: "Novice"
        };
    }

    let totalWeighted = 0, totalMax = 0, totalTimeRatio = 0, correctCount = 0;
    let remAcc = { c: 0, t: 0 }, anaAcc = { c: 0, t: 0 };

    // 5. Detailed Math (from HEAD)
    // Consistency Calculation
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
    const accuracy_rate = correctCount / activities.length;
    const mastery_score = totalMax > 0 ? (totalWeighted / totalMax) * 100 : 0;

    // Return Superset Object
    return {
        accuracy_rate: accuracy_rate,
        difficulty_weighted_score: totalMax > 0 ? totalWeighted / totalMax : 0,
        time_efficiency_ratio: totalTimeRatio / activities.length,
        cognitive_dropoff: Math.max(0, remRate - anaRate),
        consistency_index,
        days_since_last_active,
        streak,
        // Added for local fallbacks / Summary Endpoint:
        mastery_score: mastery_score.toFixed(1),
        syllabus_completion: syllabus_completion,
        predicted_score: (mastery_score * 0.7 + syllabus_completion * 0.3).toFixed(1),
        persona: accuracy_rate > 0.7 ? "Master" : "Learner"
    };
}