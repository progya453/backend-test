const mongoose = require('mongoose');
const Chapter = require('../models/Chapter.model');
const Subject = require('../models/Subject.model');
const Stream = require('../models/Stream.model');
const UserActivity = require('../models/UserActivity.model');
const UserProfile = require('../models/UserProfile.model');

const Topic = require('../models/Topic.model'); 
const Question = require('../models/Question.model');
const { redisClient } = require('../config/redis');

let UserProgress;
try {
  UserProgress = require('../models/UserProgress.model');
} catch (e) {
  console.error("⚠️ WARNING: UserProgress model is missing. Create it to track progress.");
}
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
      

  async submitAnswer(userId, questionId, isCorrect, timeTaken) {
    console.log(`[Submit] Processing User: ${userId} | Q: ${questionId} | Correct: ${isCorrect}`);

    // 1. VALIDATION
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new Error(`Invalid Question ID`);
    }

    // 2. FETCH QUESTION
    const question = await Question.findById(questionId);
    
    // ERROR CHECK: This is where it was failing before
    if (!question) {
        console.error(`[Submit] ERROR: Question not found in DB for ID: ${questionId}`);
        return { correct: isCorrect, xp: 0, error: "Question not found" };
    }

    // 3. EXTRACT CONTEXT (Use embedded data from Question model)
    const topicId = question.topic_id;
    // Fallback to embedded names if lookups fail
    const subjectName = question.subject?.name || 'General';
    const chapterName = question.chapter?.name || 'General'; 
    const topicName = question.topic?.name || 'General';

    // We still fetch Topic to get Chapter ID for the progress ring link
    const topic = await Topic.findById(topicId);
    const chapterId = topic ? topic.chapter_id : null;

    // 4. LOG ACTIVITY
    UserActivity.create({
      user_id: userId,
      question_id: questionId,
      topic_tag: topicName,
      is_correct: isCorrect,
      selected_option_id: isCorrect ? 'correct' : 'wrong',
      time_taken: timeTaken || 5,
      timestamp: new Date()
    }).catch(e => console.error("[Submit] Log Failed:", e.message));

    // 5. UPDATE PROGRESS (Only if Correct)
    let updates = null;
    let xpGain = 0;

    if (isCorrect) {
      xpGain = 10;

      // A. Update XP
      await UserProfile.updateOne(
        { _id: userId },
        { 
          $inc: { "gamification.total_xp": xpGain },
          $set: { "gamification.last_active_date": new Date() }
        }
      ).catch(e => console.error("[Submit] XP Error:", e.message));

      // B. Update Progress Rings
      if (UserProgress) {
        try {
          console.log("[Submit] Updating Progress Rings...");
          
          // 1. Topic Progress
          const topicProg = await this.incrementProgress(userId, topicId, 'topic');
          
          // 2. Chapter Progress (Use ID if available, else Name key)
          let chapterProg = { percentage: 0 };
          const chapKey = chapterId || chapterName;
          chapterProg = await this.incrementProgress(userId, chapKey, 'chapter');

          // 3. Subject Progress (Use Name key)
          const subjectProg = await this.incrementProgress(userId, subjectName, 'subject');

          // C. Construct Response
          updates = {
            topic: { id: topicId, percent: topicProg.percentage },
            chapter: { id: chapterId, percent: chapterProg.percentage }, // ID for Path Mapping
            subject: { name: subjectName, percent: subjectProg.percentage } // Name for Dashboard
          };
          
          console.log("[Submit] Progress Updated:", JSON.stringify(updates));

        } catch (err) {
          console.error("[Submit] Ring Update Failed:", err.message);
        }
      }
    }

    return { correct: isCorrect, xp: xpGain, updatedProgress: updates };
  }

  // Helper
  async incrementProgress(userId, entityId, type) {
    if (!entityId || !UserProgress) return { percentage: 0 };

    try {
        const doc = await UserProgress.findOneAndUpdate(
          { user_id: userId, entity_id: entityId.toString() },
          { 
            $setOnInsert: { entity_type: type, 'progress.total_items': 10 },
            $inc: { 'progress.solved_items': 1 },
            $set: { last_activity: new Date() }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const percent = Math.min(100, Math.round((doc.progress.solved_items / doc.progress.total_items) * 100));
        return { percentage: percent };
    } catch (err) {
        console.error(`[Submit] Progress DB Error (${type}):`, err.message);
        return { percentage: 0 };
    }
  }

}

module.exports = new GameplayService();