const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  // ✅ FIX: Remove the explicit '_id' definition or change it to ObjectId.
  // Letting Mongoose handle it automatically is the safest way.
  
  // _id: { type: String ... } <--- DELETE THIS BLOCK

  topic_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true,
    index: 'text'
  },
  // ... (Keep the rest of your schema exactly as is)
  image_url: { type: String, default: null },
  type: { type: String, enum: ["MCQ", "Numerical", "Fill_Blank"], required: true },
  marks: { type: Number, min: 1, required: true },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
  cognitive_level: { type: String, enum: ["Remember", "Understand", "Apply", "Analyze"], required: true },
  optimum_time: { type: Number, required: true },
  
  // --- FLATTENED HIERARCHY ---
  subject: {
    name: { type: String, required: true },
    board_class: { type: String, required: true }
  },
  chapter: {
    name: { type: String, required: true },
    exam_weightage: { type: Number, required: true }
  },
  topic: {
    name: { type: String, required: true },
    description: String
  },
  
  prerequisites: [{
    topic: { type: String, required: true },
    strength_req: { type: Number, required: true }
  }],
  ai_prediction: {
    probability_score: Number,
    reasoning: String
  }
}, {
  timestamps: true,
  collection: 'questions'
});

QuestionSchema.index({ "subject.name": 1, "chapter.name": 1, "topic.name": 1 });
QuestionSchema.index({ "subject.name": 1, difficulty: 1 });

module.exports = mongoose.model('Question', QuestionSchema);