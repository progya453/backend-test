const gameplayService = require('../../services/gameplay.service');
const { AppError } = require('../../utils/apiError');
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