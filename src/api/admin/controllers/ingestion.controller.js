const mongoose = require('mongoose');
const Chapter = require('../../../models/Chapter.model');
const Question = require('../../../models/Question.model');
const Subject = require('../../../models/Subject.model');
const Topic = require('../../../models/Topic.model'); 
const { AppError } = require('../../../utils/apiError');

exports.publishChapter = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { metadata, questions } = req.body;

    // 1. Validate Subject
    const subject = await Subject.findById(metadata.subjectId);
    if (!subject) throw new AppError('Subject not found', 404);

    // 2. Check Order Conflict
    const existingNode = await Chapter.findOne({ subject_id: metadata.subjectId, order_index: metadata.orderIndex });
    if (existingNode) throw new AppError(`Path Node #${metadata.orderIndex} is already occupied.`, 409);

    // 3. Create Chapter
    const chapterStringId = metadata.id || `CH-${Date.now()}`;
    const newChapter = await Chapter.create([{
      id: chapterStringId,
      subjectId: subject.id || subject._id.toString(),
      chapterNumber: metadata.chapterNumber || metadata.orderIndex,
      examWeightage: metadata.examWeightage || 5,
      name: metadata.name,
      subject_id: metadata.subjectId,
      order_index: metadata.orderIndex,
      type: metadata.type || 'NORMAL',
      total_questions: questions.length,
      is_active: true
    }], { session });

    const chapterDoc = newChapter[0];

    // 4. Create Topic (Container)
    const topicStringId = `TOP-${Date.now()}`;
    const newTopic = await Topic.create([{
      id: topicStringId,
      chapterId: chapterStringId,
      description: `Default container for ${metadata.name}`,
      name: "General", 
      chapter_id: chapterDoc._id,
      order_index: 1,
      is_active: true
    }], { session });

    const topicDoc = newTopic[0];

    // 5. FORMAT QUESTIONS (Match Schema)
    const formattedQuestions = questions.map((q, qIndex) => {
        
        
        const formattedOptions = (q.options || []).map((optText, i) => ({
            id: `opt_${Date.now()}_${qIndex}_${i}`, 
            text: optText,
            isCorrect: optText === q.answer // Auto-set true if matches answer
        }));

        return {
            ...q, 
            topic_id: topicDoc._id,
            
            options: formattedOptions, 

            // Defaults
            type: q.type || "MCQ",
            marks: q.marks || 4,
            difficulty: q.difficulty || "Medium",
            cognitive_level: q.cognitive_level || "Apply",
            optimum_time: q.optimum_time || 60,
            
            subject: { name: subject.name, board_class: subject.boardClass || '12' },
            chapter: { name: chapterDoc.name, exam_weightage: chapterDoc.examWeightage },
            topic: { name: topicDoc.name, description: topicDoc.description }
        };
    });

    await Question.insertMany(formattedQuestions, { session });
    await session.commitTransaction();

    res.status(201).json({ status: 'success', message: 'Published!' });

  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};