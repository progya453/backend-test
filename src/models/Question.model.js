const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  topic_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true,
    index: true
  },

  // --- Content ---
  text: { type: String, required: true, index: 'text' },
  image_url: { type: String, default: null },
  latex: { type: String, default: null },
  type: { 
    type: String, 
    enum: ["MCQ", "Numerical", "Fill_Blank"], 
    required: true 
  },
  
  // ---------------------------------------------------------
  // ✅ NEW FIELD ADDED HERE
  // ---------------------------------------------------------
  formulas_used: [{
    _id: false, // Prevents creating an ID for each formula sub-document
    latex: { type: String, required: true }, // e.g., "a^2 + b^2 = c^2"
    name: { type: String }, // e.g., "Pythagoras Theorem"
    variables: [String] // Optional: ["a", "b", "c"] for variable mapping
  }],
  // ---------------------------------------------------------

  options: [{
    id: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false } 
  }],
 
  explanation: { type: String, default: null },

  // --- Metrics ---
  marks: { type: Number, min: 1, required: true },
  difficulty: { 
    type: String, 
    enum: ["Easy", "Medium", "Hard"], 
    required: true 
  },
  cognitive_level: { 
    type: String, 
    enum: ["Remember", "Understand", "Apply", "Analyze"], 
    required: true 
  },
  optimum_time: { type: Number, required: true },

  // --- Analytics ---
  discrimination_index: { type: Number, min: -1, max: 1, default: 0 },
  frequency_count: { type: Number, default: 0 },
  latest_appearance_year: { type: Number },
  exam_metadata: {
    exams: [String],
    years: [Number],
    tags: [String]
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

  // --- AI & Dependencies ---
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

// Indexes
QuestionSchema.index({ "subject.name": 1, "chapter.name": 1, "topic.name": 1 });
QuestionSchema.index({ "subject.name": 1, difficulty: 1 });
// Optional: Index the formula names if you plan to search questions by formula
QuestionSchema.index({ "formulas_used.name": 1 }); 

module.exports = mongoose.model('Question', QuestionSchema);