const mongoose = require('mongoose');
const Chapter = require('../../../models/Chapter.model');
const Question = require('../../../models/Question.model');
const Subject = require('../../../models/Subject.model');
const { AppError } = require('../../../utils/apiError');
// Removed: Redis/Socket imports (Not needed for static content updates)

exports.publishChapter = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { metadata, questions } = req.body;

    // 1. Validate Parent Subject
    const subject = await Subject.findById(metadata.subjectId);
    if (!subject) throw new AppError('Subject not found', 404);

    // 2. Check for Position Conflict
    const existingNode = await Chapter.findOne({ 
      subject_id: metadata.subjectId, 
      order_index: metadata.orderIndex 
    });
    
    if (existingNode) {
      throw new AppError(`Path Node #${metadata.orderIndex} is already occupied.`, 409);
    }

    // 3. Create Chapter Node
    const newChapter = await Chapter.create([{
      name: metadata.name,
      subject_id: metadata.subjectId,
      order_index: metadata.orderIndex,
      type: metadata.type,
      total_questions: questions.length,
      is_active: true // Active by default
    }], { session });

    const chapterId = newChapter[0]._id;

    // 4. Format Questions
    const formattedQuestions = questions.map(q => ({
      ...q,
      _id: `q_${chapterId}_${new mongoose.Types.ObjectId()}`,
      subject: { name: subject.name, board_class: '12' },
      chapter: { name: metadata.name, exam_weightage: 5 },
      topic: { name: q.topic || 'General', description: '' },
      chapter_link: chapterId
    }));

    // 5. Bulk Write
    await Question.insertMany(formattedQuestions, { session });

    // 6. Commit & Finish
    await session.commitTransaction();

    // REMOVED: Socket.io emit block
    // The student will see this update the next time they open the map.

    res.status(201).json({ 
      status: 'success', 
      message: 'Chapter published successfully!',
      data: { chapter: newChapter[0], count: formattedQuestions.length }
    });

  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};