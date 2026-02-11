const gameplayService = require('../../services/gameplay.service');
const { AppError } = require('../../utils/apiError');

const DailyPlans = require('../../services/planGenerator.service')




// 1. GET SUBJECTS (Dashboard)
exports.getSubjects = async (req, res, next) => {
  try {
    // FIX: Pass userId if logged in
    const userId = req.user ? req.user.id : null; 
    
    const subjects = await gameplayService.getSubjectMap(userId);
    res.status(200).json({ status: 'success', data: subjects });
  } catch (err) {
    next(err);
  }
};




// 2. GET CHAPTERS (Path View)
exports.getChapters = async (req, res, next) => {
  try {
    const { subject } = req.query; 
    const userId = req.user ? req.user.id : null;

    if (!subject) throw new AppError('Subject is required', 400);

    const chapters = await gameplayService.getChaptersForSubject(subject, userId);
    res.status(200).json({ status: 'success', data: chapters });
  } catch (err) {
    next(err);
  }
};


exports.getInsights = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const insights = await gameplayService.getStudentInsights(userId);
    res.status(200).json({ status: 'success', data: insights });
  } catch (err) {
    next(err);
  }
};


// 3. GET TOPICS
exports.getTopics = async (req, res, next) => {
  try {
    const { chapterId } = req.query;
    const userId = req.user ? req.user.id : null;

    if (!chapterId) throw new AppError('Chapter ID is required', 400);

    const topics = await gameplayService.getTopicsForChapter(chapterId, userId);
    res.status(200).json({ status: 'success', data: topics });
  } catch (err) {
    next(err);
  }
};



exports.getInsights = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    
    // Call the service to get the analysis
    const insights = await gameplayService.getStudentInsights(userId);
    
    res.status(200).json({ status: 'success', data: insights });
  } catch (err) {
    next(err);
  }
};



// 4. SUBMIT ANSWER (Progress & Scoring)
exports.submitAnswer = async (req, res, next) => {
  try {
    const { questionId, isCorrect, timeTaken } = req.body;
    
    // Ensure user is logged in (req.user is set by protect middleware)
    if (!req.user || !req.user.id) {
       throw new AppError('User not authenticated', 401);
    }
    
    const userId = req.user.id;

    const result = await gameplayService.submitAnswer(userId, questionId, isCorrect, timeTaken);
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};





// UPDATE: Fetch Questions (Switch to Topic ID)
exports.getQuestions = async (req, res, next) => {
  try {
    // We now expect topicId, not chapterId
    const { topicId } = req.query; 
    if (!topicId) throw new AppError('Topic ID is required', 400);

    const questions = await gameplayService.getQuestionsForTopic(topicId);
    res.status(200).json({ status: 'success', data: questions });
  } catch (err) {
    next(err);
  }
};




// ... existing code ...

// 🔴 YOUR EXISTING LOGIC (Keep this as a helper function)
// Note: I renamed it to 'calculateStreak' to avoid confusion, 
// and removed 'exports' so it's just a local helper, or keep it exported if used elsewhere.
const calculateStreak = async (user) => {
  console.log("I am updating streak......")
  const now = new Date();
  const lastDate = user.gamification.lastActivityDate 
    ? new Date(user.gamification.lastActivityDate) 
    : null;

  const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  
  let lastMidnight = null;
  if (lastDate) {
    lastMidnight = new Date(Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth(), lastDate.getUTCDate()));
  }

  if (!lastMidnight) {
    user.gamification.streak = 1;
  } 
  else if (todayMidnight.getTime() === lastMidnight.getTime()) {
    // Already played today
  } 
  else if (todayMidnight.getTime() === lastMidnight.getTime() + (24 * 60 * 60 * 1000)) {
    user.gamification.streak += 1;
  } 
  else {
    user.gamification.streak = 1; 
  }

  user.gamification.lastActivityDate = now;
  await user.save();
  return user.gamification.streak;
};

// 🟢 NEW CONTROLLER FUNCTION (Link this to the Router)
exports.triggerStreakUpdate = async (req, res, next) => {

  console.log("ooooooooooooooooooooooo")

  try {
    // 1. Get user from the request (Auth Middleware put it there)
    const user = req.user;

    // 2. Run the logic
    const newStreak = await calculateStreak(user);

    // 3. Send response
    res.status(200).json({
      status: 'success',
      data: {
        streak: newStreak
      }
    });
  } catch (err) {
    next(err);
  }

};




exports.getPlans = async (req, res, next) => {
  
  try {
 
    const userId = req.user ? req.user.id : null; 
    if (!userId) throw new AppError('User is not found', 401);
    console.log("user is ", req.user)
    const questions = await DailyPlans.generateDailyPlan(userId);
    res.status(200).json({ status: 'success', data: questions });
    console.log(questions)
  } catch (err) {
    console.log(err)
    next(err);
  }
};



// ... existing imports ...

// 6. GET FORMULAS (AI Tutor)
exports.getFormulas = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    // Call the service
    const formulas = await gameplayService.getUserFormulas(userId);

    res.status(200).json({ 
      status: 'success', 
      count: formulas.length,
      data: formulas 
    });
  } catch (err) {
    next(err);
  }
};
