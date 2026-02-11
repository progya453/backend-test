// // const mongoose = require('mongoose');
// // const Chapter = require('../models/Chapter.model');
// // const Subject = require('../models/Subject.model');
// // const Stream = require('../models/Stream.model');
// // const UserActivity = require('../models/UserActivity.model');
// // const UserProfile = require('../models/UserProfile.model');

// // const Topic = require('../models/Topic.model'); 
// // const Question = require('../models/Question.model');
// // const { redisClient } = require('../config/redis');

// // let UserProgress;
// // try {
// //   UserProgress = require('../models/UserProgress.model');
// // } catch (e) {
// //   console.error("⚠️ WARNING: UserProgress model is missing. Create it to track progress.");
// // }
// // class GameplayService {
  
// //   /**
// //    * 1. GET SUBJECTS (The Dashboard)
// //    * Fetches all active subjects, grouped by Stream.
// //    * Uses the new CMS 'Subject' and 'Stream' models.
// //    */
// //   async getSubjectMap() {
// //     // 1. Check Cache
// //     const cacheKey = 'meta:subject_map_v2';
// //     const cached = await redisClient.get(cacheKey);
// //     if (cached) return JSON.parse(cached);

// //     // 2. Fetch Streams & Subjects
// //     // We aggregate to count chapters per subject dynamically
// //     const map = await Subject.aggregate([
// //       { $match: { is_active: true } },
// //       {
// //         $lookup: {
// //           from: 'Global_Chapters',
// //           localField: '_id',
// //           foreignField: 'subject_id',
// //           as: 'chapters'
// //         }
// //       },
// //       {
// //         $project: {
// //           name: 1,
// //           stream: 1,
// //           icon_url: 1,
// //           theme_color: 1,
// //           total_chapters: { $size: "$chapters" },
// //           // We can also calculate total questions if needed
// //         }
// //       },
// //       { $sort: { name: 1 } }
// //     ]);

// //     // 3. Cache for 1 Hour (Admin updates will invalidate this key)
// //     await redisClient.setex(cacheKey, 3600, JSON.stringify(map));
// //     return map;
// //   }

// //   /**
// //    * 2. GET CHAPTERS (The Zig-Zag Path)
// //    * Fetches structured chapters for a specific subject.
// //    * critical: Sorts by 'order_index' for the path logic.
// //    */
// //   async getChaptersForSubject(subjectName) {
// //     const cacheKey = `path:${subjectName}`;
// //     const cached = await redisClient.get(cacheKey);
// //     if (cached) return JSON.parse(cached);

// //     // A. Find Subject ID (Since URL uses name like 'Physics')
// //     const subjectDoc = await Subject.findOne({ name: subjectName });
// //     if (!subjectDoc) return [];

// //     // B. Fetch Chapters (Sorted by Zig-Zag Position)
// //     const chapters = await Chapter.find({ 
// //       subject_id: subjectDoc._id,
// //       is_active: true 
// //     })
// //     .sort({ order_index: 1 })
// //     .select('name order_index type icon_url total_questions is_active');

// //     // C. Cache for 10 mins
// //     await redisClient.setex(cacheKey, 600, JSON.stringify(chapters));
// //     return chapters;
// //   }

// //   /**
// //    * 3. GET QUESTIONS (The Game Arena)
// //    * Fetches questions for a specific chapter ID.
// //    */
// //   async getQuestionsForChapter(chapterId) {
// //     const cacheKey = `quiz:${chapterId}`;
// //     const cached = await redisClient.get(cacheKey);
// //     if (cached) return JSON.parse(cached);

// //     // Fetch questions linked to this Chapter ID
// //     // We exclude heavy AI fields to keep the payload light for mobile/web
// //     const questions = await Question.find({ chapter_link: chapterId })
// //       .select('-ai_prediction -prerequisites -created_at -updated_at');

// //     // Shuffle questions randomly for variation (Optional)
// //     // questions.sort(() => Math.random() - 0.5);

// //     await redisClient.setex(cacheKey, 1800, JSON.stringify(questions));
// //     return questions;
// //   }



// //   /**
// //    * NEW: Get Topics for the Zig-Zag Map
// //    */
// //   async getTopicsForChapter(chapterId) {
// //     // 1. Check Cache (Disabled for dev)
// //     // const cacheKey = `topics:${chapterId}`;
    
// //     // 2. Fetch Topics sorted by Order
// //     const topics = await Topic.find({ 
// //       chapter_id: chapterId,
// //       is_active: true 
// //     })
// //     .sort({ order_index: 1 }) 
// //     .select('name order_index icon_url is_active');

// //     return topics;
// //   }

// //   /**
// //    * UPDATE: Get Questions for a TOPIC (Level 3)
// //    */
// //  async getQuestionsForTopic(topicId) {
// //     console.log("========================================");
// //     console.log("🔎 DIAGNOSTIC REPORT");
// //     console.log("🎯 Looking for Topic ID:", topicId);
    
// //     // 1. Check if the collection is completely empty
// //     const totalCount = await Question.countDocuments();
// //     console.log("📊 Total Questions in Database:", totalCount);

// //     if (totalCount === 0) {
// //         console.log("❌ ERROR: The 'questions' collection is EMPTY.");
// //         console.log("👉 FIX: You need to run the Insert Script again while connected to CLOUD.");
// //     } else {
// //         // 2. If data exists, print the first one to check ID format
// //         const sample = await Question.findOne();
// //         console.log("✅ Data exists! First Question found:");
// //         console.log("   - ID:", sample._id);
// //         console.log("   - Topic ID:", sample.topic_id);
// //         console.log("   - Topic ID Type:", typeof sample.topic_id);
        
// //         // 3. Check for specific match
// //         const exactMatch = await Question.find({ topic_id: topicId });
// //         console.log(`🔎 Found ${exactMatch.length} matches for your specific ID.`);
// //     }
// //     console.log("========================================");

// //     // Return the result
// //     return Question.find({ topic_id: topicId })
// //       .select('-ai_prediction -created_at -updated_at');
// //   }
      

// //   async submitAnswer(userId, questionId, isCorrect, timeTaken) {
// //     console.log(`[Submit] Processing User: ${userId} | Q: ${questionId} | Correct: ${isCorrect}`);

// //     // 1. VALIDATION
// //     if (!mongoose.Types.ObjectId.isValid(questionId)) {
// //       throw new Error(`Invalid Question ID`);
// //     }

// //     // 2. FETCH QUESTION
// //     const question = await Question.findById(questionId);
    
// //     // ERROR CHECK: This is where it was failing before
// //     if (!question) {
// //         console.error(`[Submit] ERROR: Question not found in DB for ID: ${questionId}`);
// //         return { correct: isCorrect, xp: 0, error: "Question not found" };
// //     }

// //     // 3. EXTRACT CONTEXT (Use embedded data from Question model)
// //     const topicId = question.topic_id;
// //     // Fallback to embedded names if lookups fail
// //     const subjectName = question.subject?.name || 'General';
// //     const chapterName = question.chapter?.name || 'General'; 
// //     const topicName = question.topic?.name || 'General';

// //     // We still fetch Topic to get Chapter ID for the progress ring link
// //     const topic = await Topic.findById(topicId);
// //     const chapterId = topic ? topic.chapter_id : null;

// //     // 4. LOG ACTIVITY
// //     UserActivity.create({
// //       user_id: userId,
// //       question_id: questionId,
// //       topic_tag: topicName,
// //       is_correct: isCorrect,
// //       selected_option_id: isCorrect ? 'correct' : 'wrong',
// //       time_taken: timeTaken || 5,
// //       timestamp: new Date()
// //     }).catch(e => console.error("[Submit] Log Failed:", e.message));

// //     // 5. UPDATE PROGRESS (Only if Correct)
// //     let updates = null;
// //     let xpGain = 0;

// //     if (isCorrect) {
// //       xpGain = 10;

// //       // A. Update XP
// //       await UserProfile.updateOne(
// //         { _id: userId },
// //         { 
// //           $inc: { "gamification.total_xp": xpGain },
// //           $set: { "gamification.last_active_date": new Date() }
// //         }
// //       ).catch(e => console.error("[Submit] XP Error:", e.message));

// //       // B. Update Progress Rings
// //       if (UserProgress) {
// //         try {
// //           console.log("[Submit] Updating Progress Rings...");
          
// //           // 1. Topic Progress
// //           const topicProg = await this.incrementProgress(userId, topicId, 'topic');
          
// //           // 2. Chapter Progress (Use ID if available, else Name key)
// //           let chapterProg = { percentage: 0 };
// //           const chapKey = chapterId || chapterName;
// //           chapterProg = await this.incrementProgress(userId, chapKey, 'chapter');

// //           // 3. Subject Progress (Use Name key)
// //           const subjectProg = await this.incrementProgress(userId, subjectName, 'subject');

// //           // C. Construct Response
// //           updates = {
// //             topic: { id: topicId, percent: topicProg.percentage },
// //             chapter: { id: chapterId, percent: chapterProg.percentage }, // ID for Path Mapping
// //             subject: { name: subjectName, percent: subjectProg.percentage } // Name for Dashboard
// //           };
          
// //           console.log("[Submit] Progress Updated:", JSON.stringify(updates));

// //         } catch (err) {
// //           console.error("[Submit] Ring Update Failed:", err.message);
// //         }
// //       }
// //     }

// //     return { correct: isCorrect, xp: xpGain, updatedProgress: updates };
// //   }

// //   // Helper
// //   async incrementProgress(userId, entityId, type) {
// //     if (!entityId || !UserProgress) return { percentage: 0 };

// //     try {
// //         const doc = await UserProgress.findOneAndUpdate(
// //           { user_id: userId, entity_id: entityId.toString() },
// //           { 
// //             $setOnInsert: { entity_type: type, 'progress.total_items': 10 },
// //             $inc: { 'progress.solved_items': 1 },
// //             $set: { last_activity: new Date() }
// //           },
// //           { upsert: true, new: true, setDefaultsOnInsert: true }
// //         );

// //         const percent = Math.min(100, Math.round((doc.progress.solved_items / doc.progress.total_items) * 100));
// //         return { percentage: percent };
// //     } catch (err) {
// //         console.error(`[Submit] Progress DB Error (${type}):`, err.message);
// //         return { percentage: 0 };
// //     }
// //   }

// // }

// // module.exports = new GameplayService();



// const mongoose = require('mongoose');
// const Chapter = require('../models/Chapter.model');
// const Subject = require('../models/Subject.model');
// const Topic = require('../models/Topic.model'); 
// const Question = require('../models/Question.model');
// const UserActivity = require('../models/UserActivity.model');
// const UserProfile = require('../models/UserProfile.model');
// const { redisClient } = require('../config/redis');
// const axios = require('axios');

// // Safe Import for UserProgress Model
// let UserProgress;
// try {
//   UserProgress = require('../models/UserProgress.model');
// } catch (e) {
//   console.error("⚠️ UserProgress Model Missing - Progress will not be saved.");
// }

// const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:8000';

// class GameplayService {

//   /**
//    * 1. GET SUBJECTS (Dashboard)
//    * Merges static subject data with User's persistent progress.
//    * 
//    * 
//    */

  
// async getStudentInsights(userId) {
//      const user = await UserProfile.findById(userId).select('dashboard_insight gamification');
//      if (!user) return null;

//      // Merge dynamic streak (since it changes daily) with cached insights
//      return {
//          ...user.dashboard_insight,
//          status: {
//              ...user.dashboard_insight.status,
//              streak: user.gamification.streak
//          }
//      };
//   }






//   /**
//    * 2. WRITE: Calculate and Cache Insights (Async)
//    * Call this inside 'submitAnswer' but DON'T await it (fire & forget).
//    */
//   async updateInsightsBackground(userId) {
//     try {
//         console.log(`[Insight] Recalculating for ${userId}...`);
        
//         // --- perform the heavy logic here (same as previous solution) ---
//         const recentActivity = await UserActivity.find({ user_id: userId })
//           .sort({ timestamp: -1 }).limit(50).select('is_correct topic_tag');
          
//         const total = recentActivity.length;
//         const correct = recentActivity.filter(a => a.is_correct).length;
//         const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        
//         // Weakness logic
//         const wrongMap = {};
//         recentActivity.filter(a => !a.is_correct).forEach(a => {
//             wrongMap[a.topic_tag] = (wrongMap[a.topic_tag] || 0) + 1;
//         });
//         const weakTopic = Object.keys(wrongMap).sort((a,b) => wrongMap[b] - wrongMap[a])[0] || "None";

//         // Recommendation Logic (Simplified)
//         let rec = { type: 'resume', label: 'Continue Path', context: 'General' };
//         if (accuracy < 50 && weakTopic !== "None") {
//             rec = { type: 'revision', label: `Revise ${weakTopic}`, context: 'Weakness' };
//         }

//         // --- UPDATE PROFILE ---
//         await UserProfile.updateOne(
//             { _id: userId },
//             {
//                 $set: {
//                     "dashboard_insight.status.recent_accuracy": accuracy,
//                     "dashboard_insight.analysis.weak_topic": weakTopic,
//                     "dashboard_insight.recommendation": rec
//                     // Update other fields as needed
//                 }
//             }
//         );
//         console.log(`[Insight] Updated for ${userId}`);

//     } catch (err) {
//         console.error("[Insight] Update Failed:", err.message);
//     }
//   }









// async getQuestionsForTopic(topicId, userId = null) {
//   console.log("========================================h");
//     console.log(`[GameService] Fetching questions for Topic: ${topicId}`);
    
//     // 1. Fetch Raw Questions from DB
//     const questions = await Question.find({ topic_id: topicId })
//       .select('-ai_prediction -created_at -updated_at')
//       .lean();

//     if (!questions || questions.length === 0) return [];

//     // 2. If Guest (No ID), return default order
//     if (!userId) {
//         console.log("⚠️ No User ID provided to Service. Serving default order.");
//         return questions;
//     }

//     // 3. AI RANKING PROCESS
//     try {
//         console.log(`[GameService] 🧠 Invoking AI #5 to rank ${questions.length} items...`);

//         // A. Fetch User Context (Mastery)
//         const userProfile = await UserProfile.findById(userId).select('gamification');
//         const userMastery = userProfile?.gamification?.total_xp 
//             ? Math.min(100, Math.max(0, userProfile.gamification.total_xp / 100)) 
//             : 50; 

//         // B. Fetch History (To calculate "Days Since Attempt")
//         const history = await UserActivity.find({ 
//             user_id: userId, 
//             question_id: { $in: questions.map(q => q._id) } 
//         }).select('question_id timestamp is_correct');
        
//         const historyMap = {};
//         history.forEach(h => {
//             const qId = h.question_id.toString();
//             if (!historyMap[qId] || h.timestamp > historyMap[qId].timestamp) {
//                 historyMap[qId] = h;
//             }
//         });

//         // C. Build AI Payload
//         const candidates = questions.map(q => {
//             const lastAttempt = historyMap[q._id.toString()];
//             let daysSince = 999;
//             let memoryStrength = 0;

//             if (lastAttempt) {
//                 const diffTime = Math.abs(new Date() - lastAttempt.timestamp);
//                 daysSince = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
//                 const base = lastAttempt.is_correct ? 1.0 : 0.3;
//                 memoryStrength = Math.max(0, base - (daysSince * 0.05)); 
//             }

//             return {
//                 question_id: q._id.toString(),
//                 difficulty: q.difficulty || 1,
//                 exam_weightage: q.exam_weightage || 5,
//                 days_since_attempt: daysSince,
//                 topic_memory_strength: memoryStrength
//             };
//         });

//         // D. Call Python AI Engine
//         const aiResponse = await axios.post(`${AI_ENGINE_URL}/recommend-questions`, {
//             user_mastery: userMastery,
//             prerequisite_strength: 100,
//             candidates: candidates
//         });

//         // E. Reorder Questions
//         if (aiResponse.data && aiResponse.data.ranked_questions) {
//             const rankedIds = aiResponse.data.ranked_questions.map(r => r.question_id);
//             questions.sort((a, b) => {
//                 return rankedIds.indexOf(a._id.toString()) - rankedIds.indexOf(b._id.toString());
//             });
//             console.log("✅ AI Successfully Reordered Questions for Flow State");
//         }

//     } catch (err) {
//         console.error("⚠️ AI Connection Failed (Serving Default Order):", err.message);
//     }

//     return questions;
//   }






//   async getSubjectMap(userId) {
//     // A. Fetch Static Data (Active Subjects)
//     // In production, you should cache this query in Redis: 'meta:subjects'
//     const subjects = await Subject.find({ is_active: true }).lean();

//     // B. Fetch User Progress (Indexed Query)
//     let progressMap = {};
//     if (userId && UserProgress) {
//         const logs = await UserProgress.find({ 
//             user_id: userId, 
//             entity_type: 'subject' 
//         }).lean();
        
//         // Convert to Map for O(1) lookup: { "Physics": 45, "Math": 20 }
//         logs.forEach(log => {
//             progressMap[log.entity_id] = log.progress.percentage;
//         });
//     }

//     // C. Merge Static Data + User Progress
//     return subjects.map(sub => ({
//         ...sub,
//         // If progress exists in DB, use it. Else default to 0.
//         progress: progressMap[sub.name] || 0 
//     }));
//   }

//   /**
//    * 2. GET CHAPTERS (Path View)
//    * Merges chapters with User's persistent progress.
//    */
//   async getChaptersForSubject(subjectName, userId) {
//     // A. Find Subject
//     const subjectDoc = await Subject.findOne({ name: subjectName });
//     if (!subjectDoc) return [];

//     // B. Fetch Chapters (Sorted by Zig-Zag Order)
//     const chapters = await Chapter.find({ 
//       subject_id: subjectDoc._id, 
//       is_active: true 
//     })
//     .sort({ order_index: 1 })
//     .lean();

//     // C. Fetch User Progress for these chapters
//     let progressMap = {};
//     if (userId && UserProgress) {
//         const logs = await UserProgress.find({ 
//             user_id: userId, 
//             entity_type: 'chapter',
//             // Optimization: Only fetch progress for chapters in this list
//             entity_id: { $in: chapters.map(c => c._id.toString()) }
//         }).lean();

//         logs.forEach(log => {
//             progressMap[log.entity_id] = log.progress.percentage;
//         });
//     }

//     // D. Merge
//     return chapters.map(c => ({
//         ...c,
//         progress: progressMap[c._id.toString()] || 0
//     }));
//   }

//   /**
//    * 3. GET TOPICS (Level 3 View)
//    * Merges topics with User's persistent progress.
//    */
//   async getTopicsForChapter(chapterId, userId) {
//     const topics = await Topic.find({ 
//       chapter_id: chapterId, 
//       is_active: true 
//     })
//     .sort({ order_index: 1 })
//     .lean();

//     let progressMap = {};
//     if (userId && UserProgress) {
//         const logs = await UserProgress.find({ 
//             user_id: userId, 
//             entity_type: 'topic',
//             entity_id: { $in: topics.map(t => t._id.toString()) }
//         }).lean();

//         logs.forEach(log => {
//             progressMap[log.entity_id] = log.progress.percentage;
//         });
//     }

//     return topics.map(t => ({
//         ...t,
//         progress: progressMap[t._id.toString()] || 0
//     }));
//   }

//   /**
//    * 4. GET QUESTIONS (Game Arena)
//    * Fetches questions for a specific Topic ID.
//    */
//   async getQuestionsForTopic(topicId) {
//     // Diagnostic Log
//     console.log(`[GameService] Fetching questions for Topic: ${topicId}`);
    
//     // Check if questions exist for this topic
//     const questions = await Question.find({ topic_id: topicId })
//       .select('-ai_prediction -created_at -updated_at'); // Exclude heavy AI fields

//     if (!questions || questions.length === 0) {
//         console.warn(`[GameService] Warning: No questions found for Topic ${topicId}`);
//     }

//     return questions;
//   }

//   /**
//    * 5. SUBMIT ANSWER (The Feedback Loop)
//    * Handles scoring, logging, and REAL-TIME progress calculation.
//    */
//   async submitAnswer(userId, questionId, isCorrect, timeTaken) {
//     console.log(`[Submit] User: ${userId} | Q: ${questionId} | Correct: ${isCorrect}`);

//     // A. Validation
//     if (!mongoose.Types.ObjectId.isValid(questionId)) {
//       throw new Error(`Invalid Question ID: ${questionId}`);
//     }

//     // B. Fetch Context (Question -> Topic -> Chapter -> Subject)
//     const question = await Question.findById(questionId);
//     if (!question) throw new Error('Question not found');

//     const topicId = question.topic_id;
//     // Fallback to embedded names if lookups fail or for speed
//     const subjectName = question.subject?.name || 'General';
    
//     // Fetch IDs for hierarchy linking
//     const topic = await Topic.findById(topicId);
//     const topicName = topic ? topic.name : (question.topic?.name || 'Unknown');
//     const chapterId = topic ? topic.chapter_id : null;

//     // C. Log Activity (Fire & Forget)
//     UserActivity.create({
//       user_id: userId,
//       question_id: questionId,
//       topic_tag: topicName,
//       is_correct: isCorrect,
//       selected_option_id: isCorrect ? 'correct' : 'wrong',
//       time_taken: timeTaken || 5,
//       timestamp: new Date()
//     }).catch(e => console.error("[Submit] Log Error:", e.message));

//     // D. Process Progress (Only if Correct)
//     let updates = null;
//     let xpGain = 0;

//     if (isCorrect) {
//       xpGain = 10;

//       // 1. Update User XP
//       await UserProfile.updateOne(
//         { _id: userId },
//         { 
//           $inc: { "gamification.total_xp": xpGain },
//           $set: { "gamification.last_active_date": new Date() }
//         }
//       ).catch(e => console.error("[Submit] XP Error:", e.message));

//       // 2. Update Redis Leaderboard (Optional)
//       try {
//         if (redisClient?.status === 'ready') {
//             const user = await UserProfile.findById(userId).select('gamification');
//             if (user) {
//                 await redisClient.zadd('leaderboard:global', user.gamification.total_xp, userId.toString());
//             }
//         }
//       } catch (err) { /* Ignore Redis errors */ }

//       // 3. Update Progress Rings (Persistent)
//       if (UserProgress) {
//         try {
//           // Count total questions for Topic to allow partial progress (e.g. 1/3 = 33%)
//           // In high-scale apps, store 'total_questions' on the Topic document instead of counting here
//           const topicTotal = await Question.countDocuments({ topic_id: topicId }) || 10;
          
//           // Update Topic
//           const topicProg = await this.incrementProgress(userId, topicId, 'topic', topicTotal);
          
//           // Update Chapter
//           // Simplified: Chapter total could be aggregated or fixed
//           const chapterTotal = 50; 
//           let chapterProg = { percentage: 0 };
//           if (chapterId) {
//              chapterProg = await this.incrementProgress(userId, chapterId, 'chapter', chapterTotal);
//           }

//           // Update Subject
//           const subjectTotal = 200;
//           let subjectProg = { percentage: 0 };
//           if (subjectName !== 'General') {
//              subjectProg = await this.incrementProgress(userId, subjectName, 'subject', subjectTotal);
//           }

//           // Construct Response
//           updates = {
//             topic: { id: topicId, percent: topicProg.percentage },
//             chapter: { id: chapterId, percent: chapterProg.percentage },
//             subject: { name: subjectName, percent: subjectProg.percentage }
//           };
          
//         } catch (err) {
//           console.error("[Submit] Progress Calc Failed:", err.message);
//         }
//       }
//     }
//     this.updateInsightsBackground(userId);

//     return { correct: isCorrect, xp: xpGain, updatedProgress: updates };
//   }

//   /**
//    * Helper: Atomically updates progress
//    * Handles 1M+ users by using optimized upserts
//    */
//   async incrementProgress(userId, entityId, type, totalItems) {
//     if (!entityId || !UserProgress) return { percentage: 0 };

//     try {
//         const doc = await UserProgress.findOneAndUpdate(
//           { user_id: userId, entity_id: entityId.toString() },
//           { 
//             $setOnInsert: { entity_type: type },
//             $set: { 'progress.total_items': totalItems, last_activity: new Date() },
//             $inc: { 'progress.solved_items': 1 }
//           },
//           { upsert: true, new: true, setDefaultsOnInsert: true }
//         );

//         // Calculate Percentage (Capped at 100)
//         let percent = 0;
//         if (doc.progress.total_items > 0) {
//             percent = Math.round((doc.progress.solved_items / doc.progress.total_items) * 100);
//         }
//         if (percent > 100) percent = 100;

//         // Save calculated percentage only if it changed (Read optimization)
//         if (doc.progress.percentage !== percent) {
//             doc.progress.percentage = percent;
//             await doc.save();
//         }

//         return { percentage: percent };
//     } catch (err) {
//         console.error(`[Submit] DB Error (${type}):`, err.message);
//         return { percentage: 0 };
//     }
//   }
// }

// module.exports = new GameplayService();












const mongoose = require('mongoose');
const axios = require('axios'); // <--- REQUIRED FOR AI
const Chapter = require('../models/Chapter.model');
const Subject = require('../models/Subject.model');
const Topic = require('../models/Topic.model'); 
const Question = require('../models/Question.model');
const UserActivity = require('../models/UserActivity.model');
const UserProfile = require('../models/UserProfile.model');
const { redisClient } = require('../config/redis');

// Safe Import for UserProgress
let UserProgress;
try {
  UserProgress = require('../models/UserProgress.model');
} catch (e) {
  console.error("⚠️ UserProgress Model Missing - Progress will not be saved.");
}

// 1. 👇 DEFINE AI URL
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:8000';

class GameplayService {

  // --- 1. STUDENT INSIGHTS ---
  async getStudentInsights(userId) {
     if(!userId) return null;
     const user = await UserProfile.findById(userId).select('dashboard_insight gamification');
     if (!user) return null;
     return {
         ...user.dashboard_insight,
         status: {
             ...user.dashboard_insight.status,
             streak: user.gamification.streak
         }
     };
  }

  async updateInsightsBackground(userId) {
      // Background update logic
  }

  // --- 2. SUBJECTS & CHAPTERS ---
  async getSubjectMap(userId) {
      const subjects = await Subject.find({ is_active: true }).lean();
      let progressMap = {};
      if (userId && UserProgress) {
          const logs = await UserProgress.find({ user_id: userId, entity_type: 'subject' }).lean();
          logs.forEach(log => progressMap[log.entity_id] = log.progress.percentage);
      }
      return subjects.map(sub => ({ ...sub, progress: progressMap[sub.name] || 0 }));
  }

  async getChaptersForSubject(subjectName, userId) {
      const subjectDoc = await Subject.findOne({ name: subjectName });
      if (!subjectDoc) return [];
      const chapters = await Chapter.find({ subject_id: subjectDoc._id, is_active: true }).sort({ order_index: 1 }).lean();
      
      let progressMap = {};
      if (userId && UserProgress) {
          const logs = await UserProgress.find({ 
              user_id: userId, 
              entity_type: 'chapter',
              entity_id: { $in: chapters.map(c => c._id.toString()) }
          }).lean();
          logs.forEach(log => progressMap[log.entity_id] = log.progress.percentage);
      }
      return chapters.map(c => ({ ...c, progress: progressMap[c._id.toString()] || 0 }));
  }

  async getTopicsForChapter(chapterId, userId) {
      const topics = await Topic.find({ chapter_id: chapterId, is_active: true }).sort({ order_index: 1 }).lean();
      let progressMap = {};
      if (userId && UserProgress) {
          const logs = await UserProgress.find({ 
              user_id: userId, 
              entity_type: 'topic',
              entity_id: { $in: topics.map(t => t._id.toString()) }
          }).lean();
          logs.forEach(log => progressMap[log.entity_id] = log.progress.percentage);
      }
      return topics.map(t => ({ ...t, progress: progressMap[t._id.toString()] || 0 }));
  }

  /**
   * ===========================================================================
   * 🔥 NEW: AI-POWERED QUESTION FETCHER (Robust V2)
   * Fetches questions -> Sanitizes Data -> Sends to AI -> Reorders
   * ===========================================================================
   */
  async getQuestionsForTopic(topicId, userId = null) {
    console.log(`[GameService] 🟢 STARTING FETCH for Topic: ${topicId}`);
    
    // 1. Fetch Raw Questions
    const questions = await Question.find({ topic_id: topicId })
      .select('-ai_prediction -created_at -updated_at')
      .lean();

    if (!questions || questions.length === 0) {
        console.log("⚠️ No questions found.");
        return [];
    }

    // 2. If Guest, return default
    if (!userId) {
        console.log("⚠️ Guest User. Skipping AI.");
        return questions;
    }

    // 3. AI RANKING PROCESS
    try {
        console.log(`[GameService] 🧠 CALLING AI ENGINE NOW...`);

        // A. Fetch Context
        const userProfile = await UserProfile.findById(userId).select('gamification');
        // Ensure Mastery is a Number (0-100)
        let userMastery = 50.0;
        if (userProfile?.gamification?.total_xp) {
            userMastery = Math.min(100.0, Math.max(0.0, Number(userProfile.gamification.total_xp) / 100.0));
        }

        // B. Fetch History
        const history = await UserActivity.find({ 
            user_id: userId, 
            question_id: { $in: questions.map(q => q._id) } 
        }).select('question_id timestamp is_correct');
        
        const historyMap = {};
        history.forEach(h => {
            const qId = h.question_id.toString();
            if (!historyMap[qId] || h.timestamp > historyMap[qId].timestamp) {
                historyMap[qId] = h;
            }
        });

        // C. Build Payload (With Strict Type Enforcement)
        const candidates = questions.map(q => {
            const lastAttempt = historyMap[q._id.toString()];
            let daysSince = 999.0;
            let memoryStrength = 0.0;

            if (lastAttempt) {
                const diffTime = Math.abs(new Date() - lastAttempt.timestamp);
                daysSince = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                const base = lastAttempt.is_correct ? 1.0 : 0.3;
                memoryStrength = Math.max(0.0, base - (daysSince * 0.05)); 
            }

            return {
                question_id: q._id.toString(),
                // FORCE INTEGER CONVERSION
                difficulty: parseInt(q.difficulty) || 1, 
                exam_weightage: parseInt(q.exam_weightage) || 5,
                days_since_attempt: Number(daysSince),
                topic_memory_strength: Number(memoryStrength)
            };
        });

        // 🔍 DEBUG: Log payload to see what's causing 422
        // console.log("AI Payload:", JSON.stringify(candidates[0])); 

        // D. Call Python AI
        const aiResponse = await axios.post(`${AI_ENGINE_URL}/recommend-questions`, {
            user_mastery: userMastery,
            prerequisite_strength: 100.0,
            candidates: candidates
        });

        // E. Reorder
        if (aiResponse.data && aiResponse.data.ranked_questions) {
            const rankedIds = aiResponse.data.ranked_questions.map(r => r.question_id);
            questions.sort((a, b) => {
                return rankedIds.indexOf(a._id.toString()) - rankedIds.indexOf(b._id.toString());
            });
            console.log("✅ SUCCESS: AI Reordered the questions!");
        }

    } catch (err) {
        // If 422 occurs, it means our data structure doesn't match Pydantic schema
        if (err.response && err.response.status === 422) {
            console.error("❌ AI DATA ERROR (422):", JSON.stringify(err.response.data.detail));
        } else {
            console.error("❌ AI ERROR:", err.message);
        }
    }

    return questions;
  }

  // --- 4. SUBMIT ANSWER ---
  async submitAnswer(userId, questionId, isCorrect, timeTaken) {
      // (Your existing submit logic remains exactly the same)
      console.log(`[Submit] User: ${userId} | Q: ${questionId} | Correct: ${isCorrect}`);
      
      if (!mongoose.Types.ObjectId.isValid(questionId)) throw new Error(`Invalid Question ID`);
      const question = await Question.findById(questionId);
      if (!question) throw new Error('Question not found');
      
      const topicId = question.topic_id;
      const subjectName = question.subject?.name || 'General';
      const topic = await Topic.findById(topicId);
      const topicName = topic ? topic.name : (question.topic?.name || 'Unknown');
      const chapterId = topic ? topic.chapter_id : null;

      UserActivity.create({
          user_id: userId, question_id: questionId, topic_tag: topicName,
          is_correct: isCorrect, selected_option_id: isCorrect ? 'correct' : 'wrong',
          time_taken: timeTaken || 5, timestamp: new Date()
      }).catch(e => console.error(e));

      let updates = null;
      let xpGain = 0;

      if (isCorrect) {
          xpGain = 10;
          await UserProfile.updateOne({ _id: userId }, { $inc: { "gamification.total_xp": xpGain }, $set: { "gamification.last_active_date": new Date() } }).catch(e => console.error(e));
          if (UserProgress) {
            try {
              const topicTotal = await Question.countDocuments({ topic_id: topicId }) || 10;
              const topicProg = await this.incrementProgress(userId, topicId, 'topic', topicTotal);
              const chapterTotal = 50; 
              let chapterProg = { percentage: 0 };
              if (chapterId) chapterProg = await this.incrementProgress(userId, chapterId, 'chapter', chapterTotal);
              const subjectTotal = 200;
              let subjectProg = { percentage: 0 };
              if (subjectName !== 'General') subjectProg = await this.incrementProgress(userId, subjectName, 'subject', subjectTotal);
              updates = { topic: { id: topicId, percent: topicProg.percentage }, chapter: { id: chapterId, percent: chapterProg.percentage }, subject: { name: subjectName, percent: subjectProg.percentage } };
            } catch (err) { console.error(err); }
          }
      }
      this.updateInsightsBackground(userId); 
      return { correct: isCorrect, xp: xpGain, updatedProgress: updates };
  }
  
  async incrementProgress(userId, entityId, type, totalItems) {
      if (!entityId || !UserProgress) return { percentage: 0 };
      try {
        const doc = await UserProgress.findOneAndUpdate(
          { user_id: userId, entity_id: entityId.toString() },
          { $setOnInsert: { entity_type: type }, $set: { 'progress.total_items': totalItems, last_activity: new Date() }, $inc: { 'progress.solved_items': 1 } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        let percent = 0;
        if (doc.progress.total_items > 0) percent = Math.round((doc.progress.solved_items / doc.progress.total_items) * 100);
        if (percent > 100) percent = 100;
        if (doc.progress.percentage !== percent) { doc.progress.percentage = percent; await doc.save(); }
        return { percentage: percent };
      } catch (err) { return { percentage: 0 }; }
  }


  /**
   * 6. GET FORMULAS (AI Tutor Vault)
   * Scans user activity to find formulas they have encountered.
   * Calculates mastery based on topic progress.
   */
async getUserFormulas(userId) {

  
  console.log(`[Service] Fetching formulas for user: ${userId}`);

  // A. Get IDs of questions the user has attempted
  const userActivities = await UserActivity.find({ user_id: userId })
    .sort({ timestamp: -1 })
    .select('question_id');

  if (!userActivities.length) return [];

  // Extract unique IDs
  const questionIds = [...new Set(userActivities.map(a => a.question_id.toString()))];

  // B. Fetch Questions that actually have formulas
  const questions = await Question.find({
    _id: { $in: questionIds },
    formulas_used: { $exists: true, $not: { $size: 0 } }
  }).select('formulas_used subject topic');

  // C. Fetch Topic Mastery (to badge the formulas)
  let topicMasteryMap = {};
  if (UserProgress) {
    const progress = await UserProgress.find({ 
      user_id: userId, 
      entity_type: 'topic' 
    }).populate('entity_id', 'name');

    progress.forEach(p => {
      if (p.entity_id && p.entity_id.name) {
        const score = p.progress.percentage || 0;
        let level = 'low';
        if (score >= 80) level = 'high';
        else if (score >= 50) level = 'medium';
        topicMasteryMap[p.entity_id.name] = level;
      }
    });
  }

  // D. Aggregate & Deduplicate
  const formulaMap = new Map();

  questions.forEach(q => {
    // Ensure the question has formula data
    if (!q.formulas_used || !Array.isArray(q.formulas_used)) return;

    q.formulas_used.forEach(formula => {
      const uniqueKey = formula.name || formula.latex;

      if (!formulaMap.has(uniqueKey)) {
        // Determine mastery level
        const topicName = q.topic ? q.topic.name : 'General';
        const mastery = topicMasteryMap[topicName] || 'medium'; // Default if no progress found

        formulaMap.set(uniqueKey, {
          id: uniqueKey, 
          title: formula.name || 'Unnamed Formula',
          expression: formula.latex,
          subject: q.subject ? q.subject.name : 'General',
          topic: topicName,
          lastUsedDate: new Date(), // Could be refined with activity timestamp
          masteryLevel: mastery
        });
      }
    });
  });

  return Array.from(formulaMap.values());
}
}





module.exports = new GameplayService();