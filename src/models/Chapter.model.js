const mongoose = require('mongoose');

const ChapterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subject', // We will create this next
    required: true,
    index: true 
  },
  order_index: { 
    type: Number, 
    required: true, 
    description: "Position in the zig-zag path" 
  },
  type: {
    type: String,
    enum: ['NORMAL', 'MIXED', 'FINAL'],
    default: 'NORMAL'
  },
  icon_url: { type: String, default: 'assets/icons/default-chapter.svg' },
  is_active: { type: Boolean, default: true },
  
  // Cache for performance (so we don't count questions every time)
  total_questions: { type: Number, default: 0 }
}, { collection: 'Global_Chapters', timestamps: true });

// Ensure no two chapters have the same position in a subject
ChapterSchema.index({ subject_id: 1, order_index: 1 }, { unique: true });

module.exports = mongoose.model('Chapter', ChapterSchema);