const mongoose = require('mongoose');
const Chapter = require('../models/Chapter.model');
const Subject = require('../models/Subject.model');
const Stream = require('../models/Stream.model');
const UserActivity = require('../models/UserActivity.model');
const UserProfile = require('../models/UserProfile.model');

const Topic = require('../models/Topic.model'); 
const Question = require('../models/Question.model');
const { redisClient } = require('../config/redis');

class GameplayService {
  
  /**
   * 1. GET SUBJECTS (The Dashboard)
   * Fetches all active subjects, grouped by Stream.
   * Uses the new CMS 'Subject' and 'Stream' models.
   */
  async getSubjectMap() {
    // 1. Check Cache
    const cacheKey = 'meta:subject_map_v2';
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // 2. Fetch Streams & Subjects
    // We aggregate to count chapters per subject dynamically
    const map = await Subject.aggregate([
      { $match: { is_active: true } },
      {
        $lookup: {
          from: 'Global_Chapters',
          localField: '_id',
          foreignField: 'subject_id',
          as: 'chapters'
        }
      },
      {
        $project: {
          name: 1,
          stream: 1,
          icon_url: 1,
          theme_color: 1,
          total_chapters: { $size: "$chapters" },
          // We can also calculate total questions if needed
        }
      },
      { $sort: { name: 1 } }
    ]);

    // 3. Cache for 1 Hour (Admin updates will invalidate this key)
    await redisClient.setex(cacheKey, 3600, JSON.stringify(map));
    return map;
  }

  /**
   * 2. GET CHAPTERS (The Zig-Zag Path)
   * Fetches structured chapters for a specific subject.
   * critical: Sorts by 'order_index' for the path logic.
   */
  async getChaptersForSubject(subjectName) {
    const cacheKey = `path:${subjectName}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // A. Find Subject ID (Since URL uses name like 'Physics')
    const subjectDoc = await Subject.findOne({ name: subjectName });
    if (!subjectDoc) return [];

    // B. Fetch Chapters (Sorted by Zig-Zag Position)
    const chapters = await Chapter.find({ 
      subject_id: subjectDoc._id,
      is_active: true 
    })
    .sort({ order_index: 1 })
    .select('name order_index type icon_url total_questions is_active');

    // C. Cache for 10 mins
    await redisClient.setex(cacheKey, 600, JSON.stringify(chapters));
    return chapters;
  }

  /**
   * 3. GET QUESTIONS (The Game Arena)
   * Fetches questions for a specific chapter ID.
   */
  async getQuestionsForChapter(chapterId) {
    const cacheKey = `quiz:${chapterId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // Fetch questions linked to this Chapter ID
    // We exclude heavy AI fields to keep the payload light for mobile/web
    const questions = await Question.find({ chapter_link: chapterId })
      .select('-ai_prediction -prerequisites -created_at -updated_at');

    // Shuffle questions randomly for variation (Optional)
    // questions.sort(() => Math.random() - 0.5);

    await redisClient.setex(cacheKey, 1800, JSON.stringify(questions));
    return questions;
  }



  /**
   * NEW: Get Topics for the Zig-Zag Map
   */
  async getTopicsForChapter(chapterId) {
    // 1. Check Cache (Disabled for dev)
    // const cacheKey = `topics:${chapterId}`;
    
    // 2. Fetch Topics sorted by Order
    const topics = await Topic.find({ 
      chapter_id: chapterId,
      is_active: true 
    })
    .sort({ order_index: 1 }) 
    .select('name order_index icon_url is_active');

    return topics;
  }

  /**
   * UPDATE: Get Questions for a TOPIC (Level 3)
   */
 async getQuestionsForTopic(topicId) {
    console.log("========================================");
    console.log("🔎 DIAGNOSTIC REPORT");
    console.log("🎯 Looking for Topic ID:", topicId);
    
    // 1. Check if the collection is completely empty
    const totalCount = await Question.countDocuments();
    console.log("📊 Total Questions in Database:", totalCount);

    if (totalCount === 0) {
        console.log("❌ ERROR: The 'questions' collection is EMPTY.");
        console.log("👉 FIX: You need to run the Insert Script again while connected to CLOUD.");
    } else {
        // 2. If data exists, print the first one to check ID format
        const sample = await Question.findOne();
        console.log("✅ Data exists! First Question found:");
        console.log("   - ID:", sample._id);
        console.log("   - Topic ID:", sample.topic_id);
        console.log("   - Topic ID Type:", typeof sample.topic_id);
        
        // 3. Check for specific match
        const exactMatch = await Question.find({ topic_id: topicId });
        console.log(`🔎 Found ${exactMatch.length} matches for your specific ID.`);
    }
    console.log("========================================");

    // Return the result
    return Question.find({ topic_id: topicId })
      .select('-ai_prediction -created_at -updated_at');
  }





  /**
   * 4. SUBMIT ANSWER (The Feedback Loop)
   * Handles scoring, streaks, and activity logging.
   */
  async submitAnswer(userId, questionId, isCorrect, timeTaken) {
    // A. Fire & Forget Activity Log (Async Write)
    // We don't await this because the user shouldn't wait for logging
    UserActivity.create({
      user_id: userId,
      question_id: questionId,
      // We can fetch topic_tag from question cache if needed, 
      // or frontend sends it. For now, default or look up.
      topic_tag: 'General', 
      is_correct: isCorrect,
      selected_option_id: isCorrect ? 'correct' : 'wrong', // Simplified
      time_taken: timeTaken,
      timestamp: new Date()
    }).catch(err => console.error('Activity Log Error:', err));

    // B. Update User Profile (Gamification)
    if (isCorrect) {
      const xpGain = 10;
      
      // Atomic Update: Increment XP and Update Last Active
      await UserProfile.updateOne(
        { _id: userId },
        { 
          $inc: { "gamification.total_xp": xpGain },
          $set: { "gamification.last_active_date": new Date() }
          // Streak logic would go here (complex date diff checking)
        }
      );

      // C. Update Global Leaderboard (Redis Sorted Set)
      // Score = Total XP
      const user = await UserProfile.findById(userId).select('gamification');
      if (user) {
        await redisClient.zadd('leaderboard:global', user.gamification.total_xp, userId);
      }

      return { correct: true, xp: xpGain };
    }
    
    return { correct: false, xp: 0 };
  }
}

module.exports = new GameplayService();