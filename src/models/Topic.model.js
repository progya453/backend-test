const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  chapter_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true,
    index: true
  },
  order_index: { 
    type: Number, 
    required: true 
  }, // Defines Zig-Zag position (1, 2, 3...)
  slug: { type: String },
  icon_url: { type: String, default: 'assets/icons/topic.svg' },
  is_active: { type: Boolean, default: true }
}, { 
  collection: 'Global_Topics', 
  timestamps: true 
});

module.exports = mongoose.model('Topic', TopicSchema);