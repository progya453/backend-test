// const UserProgress = require('../models/UserProgress.model');
// const UserActivity = require('../models/UserActivity.model');
// const Topic = require('../models/Topic.model');

// class DailyPlans {
//   async generateDailyPlan(userId) {
//     // 1. Fetch progress
//     const allProgress = await UserProgress.find({ 
//       user_id: userId, 
//       entity_type: 'topic' 
//     }).populate('entity_id', 'name'); 

//     // 2. Fetch recent activity (unchanged)
//     const yesterday = new Date();
//     yesterday.setDate(yesterday.getDate() - 1);
    
//     const recentErrors = await UserActivity.find({
//       user_id: userId,
//       timestamp: { $gte: yesterday },
//       is_correct: false
//     }).limit(20);

//     let warmUpCandidates = [];
//     let deepWorkCandidates = [];
//     let reviewCandidates = [];
//     const now = new Date();

//     allProgress.forEach(p => {
//       // 🛡️ SECURITY CHECK: If populate failed, p.entity_id might be null or just an ID
//       if (!p.entity_id || !p.entity_id.name) return; 

//       const daysSinceLast = (now - new Date(p.last_activity)) / (1000 * 60 * 60 * 24);
      
//       // ✅ FIX: Ensure we extract the ID string correctly
//       const safeId = p.entity_id._id.toString(); 

//       const topicData = {
//         id: safeId,               // Use the safe string ID
//         name: p.entity_id.name, 
//         progress: p.progress.percentage
//       };

//       if (p.progress.percentage < 50) {
//         deepWorkCandidates.push({ ...topicData, score: (100 - p.progress.percentage) * 1.5 });
//       } else if (p.progress.percentage >= 70) {
//         warmUpCandidates.push({ ...topicData, score: p.progress.percentage });
//       } else if (daysSinceLast > 3) {
//         reviewCandidates.push({ ...topicData, score: daysSinceLast * 10 });
//       }
//     });

//     // Sort
//     deepWorkCandidates.sort((a, b) => b.score - a.score);
//     warmUpCandidates.sort((a, b) => b.score - a.score);
//     reviewCandidates.sort((a, b) => b.score - a.score);

//     // 3. Assemble Plan (Handle nulls gracefully)
    
//     // Logic for critical topic (ensure your UserActivity actually HAS 'topic_id' or 'topic_tag')
//     // Assuming UserActivity might store topic_id populated, otherwise we skip this optimization for now
//     const criticalTopicId = recentErrors.length > 0 && recentErrors[0].topic_id 
//         ? recentErrors[0].topic_id.toString() 
//         : null;

//     const plan = {
//       warmup: warmUpCandidates[0] 
//         ? { topicId: warmUpCandidates[0].id, topic: warmUpCandidates[0].name, note: 'High confidence topic' } 
//         : { topicId: null, topic: 'General Basics', note: 'Start easy!' },
        
//       deepWork: deepWorkCandidates[0]
//         ? { topicId: deepWorkCandidates[0].id, topic: deepWorkCandidates[0].name, note: 'Focus needed here.' }
//         : { topicId: null, topic: 'Next Chapter', note: 'Moving forward.' },
        
//       review: reviewCandidates[0]
//         ? { topicId: reviewCandidates[0].id, topic: reviewCandidates[0].name, note: 'Spaced Repetition' }
//         : { topicId: null, topic: 'None', note: 'All caught up!' }
//     };

//     return plan;
//   }
// }

// module.exports = new DailyPlans();




const mongoose = require('mongoose');
const UserProgress = require('../models/UserProgress.model');
const UserActivity = require('../models/UserActivity.model');
const Topic = require('../models/Topic.model');

// 🔧 ADMIN VARIABLES
const ADMIN_CONFIG = {
  MIN_SOLVED_HISTORY: 10,       // User must have solved 10+ questions total
  MIN_MISTAKE_SESSION_SIZE: 5,  // Threshold: If 5+ wrong answers found, trigger "Mistake Review"
  RECENCY_WINDOW_DAYS: 7        // Look at errors from the last 7 days
};

class DailyPlans {

  async generateDailyPlan(userId) {
    
    // --- 1. GATING CHECK ---
    const totalSolved = await UserActivity.countDocuments({ user_id: userId });

    if (totalSolved < ADMIN_CONFIG.MIN_SOLVED_HISTORY) {
      return this.generateStarterPlan();
    }

    // --- 2. COLLECT WRONG QUESTIONS (Mistake Review Logic) ---
    // Instead of grouping by topic, we gather ALL specific wrong questions
    const recentDateLimit = new Date();
    recentDateLimit.setDate(recentDateLimit.getDate() - ADMIN_CONFIG.RECENCY_WINDOW_DAYS);

    const wrongActivities = await UserActivity.find({ 
      user_id: userId, 
      is_correct: false,
      timestamp: { $gte: recentDateLimit } 
    })
    .sort({ timestamp: -1 })
    .limit(50) // Safety cap
    .select('question_id');

    // Extract unique question IDs to "throw" them later
    const uniqueWrongIds = [...new Set(wrongActivities.map(a => a.question_id.toString()))];
    
    const hasMistakeSession = uniqueWrongIds.length >= ADMIN_CONFIG.MIN_MISTAKE_SESSION_SIZE;

    // --- 3. FETCH PROGRESS & BUCKET TOPICS ---
    const allProgress = await UserProgress.find({ 
      user_id: userId, 
      entity_type: 'topic' 
    }).populate('entity_id', 'name'); 

    let warmUpCandidates = [];
    let deepWorkCandidates = [];
    let reviewCandidates = [];
    const now = new Date();

    // A. Inject Mistake Session (Highest Priority)
    if (hasMistakeSession) {
      console.log("YESSSSS")
      deepWorkCandidates.push({
        topicId: 'mistake-session', // Special flag for frontend
        topic: 'Mistake Review',
        note: `Retake ${uniqueWrongIds.length} questions you missed recently.`,
        score: 9999, // Force this to be #1
        questionIds: uniqueWrongIds // <--- THROWING THE QUESTIONS HERE
      });
    }

    // B. Standard Topic Analysis
    allProgress.forEach(p => {
      if (!p.entity_id || !p.entity_id._id) return;

      const daysSinceLast = (now - new Date(p.last_activity)) / (1000 * 60 * 60 * 24);
      const safeId = p.entity_id._id.toString();
      const topicName = p.entity_id.name;

      const topicData = { 
        topicId: safeId,
        topic: topicName,
        progress: p.progress.percentage
      };

      if (p.progress.percentage < 50) {
        deepWorkCandidates.push({ 
          ...topicData, 
          score: (100 - p.progress.percentage) * 1.5,
          note: 'Concept needs strengthening'
        });
      } else if (p.progress.percentage >= 70) {
        warmUpCandidates.push({ 
          ...topicData, 
          score: p.progress.percentage,
          note: 'Confidence Builder'
        });
      } else if (daysSinceLast > 3) {
        reviewCandidates.push({ 
          ...topicData, 
          score: daysSinceLast * 10,
          note: 'Spaced Repetition'
        });
      }
    });

    // Sort Candidates
    deepWorkCandidates.sort((a, b) => b.score - a.score);
    warmUpCandidates.sort((a, b) => b.score - a.score);
    reviewCandidates.sort((a, b) => b.score - a.score);

    // --- 4. ASSEMBLE FINAL PLAN ---
    const plan = {
      warmup: warmUpCandidates[0] || { topicId: null, topic: 'General Quiz', note: 'Start with the basics' },
      
      deepWork: deepWorkCandidates[0] || { topicId: null, topic: 'New Topic', note: 'Ready to advance' },
      
      review: reviewCandidates[0] || { topicId: null, topic: 'None', note: 'All caught up!' }
    };

    return plan;
  }

  async generateStarterPlan() {
    const firstTopic = await Topic.findOne().sort({ order_index: 1 });
    return {
      warmup: { topicId: null, topic: 'Welcome Session', note: 'Let\'s assess your skills' },
      deepWork: firstTopic 
        ? { topicId: firstTopic._id, topic: firstTopic.name, note: 'Your First Step' }
        : { topicId: null, topic: 'Getting Started', note: 'Begin your journey' },
      review: { topicId: null, topic: 'None', note: 'Nothing to review yet' }
    };
  }
}

module.exports = new DailyPlans();