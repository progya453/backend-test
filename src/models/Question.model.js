const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    description: "Unique ID (e.g., 'q_phy_05')"
  },
  topic_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true, // Questions MUST belong to a topic now
    index: true
  },
  text: {
    type: String,
    required: true,
    index: 'text' // Optimizes text search
  },
  image_url: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: ["MCQ", "Numerical", "Fill_Blank"],
    required: true
  },
  marks: {
    type: Number,
    min: 1,
    required: true
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"], // Maps to Frontend A1/B1/C1 logic
    required: true
  },
  cognitive_level: {
    type: String,
    enum: ["Remember", "Understand", "Apply", "Analyze"],
    required: true
  },
  optimum_time: {
    type: Number,
    required: true,
    description: "Ideal time in seconds"
  },
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
  // --- AI DATA ---
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

// INDEXING STRATEGY FOR PERFORMANCE
// 1. Fast Retrieval by hierarchy (e.g., "Give me all Physics questions")
QuestionSchema.index({ "subject.name": 1, "chapter.name": 1, "topic.name": 1 });

// 2. Difficulty filtering (e.g., "Give me Hard questions for Physics")
QuestionSchema.index({ "subject.name": 1, difficulty: 1 });

module.exports = mongoose.model('Question', QuestionSchema);