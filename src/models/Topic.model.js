

const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
  // --- Schema 1 Fields ---
  id: { 
    type: String, 
    required: true,
    unique: true 
  },
  image: {
    type: String
  },
  chapterId: { 
    type: String, 
    required: true 
  }, 
  description: { 
    type: String 
  },

  // --- Schema 2 Fields ---
  name: { 
    type: String, 
    required: true 
  },
  // ✅ ObjectId Reference
  chapter_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true,
    index: true
  },
  order_index: { 
    type: Number, 
    required: true
  }, 
  slug: { 
    type: String 
  },
  icon_url: { 
    type: String, 
    default: 'assets/icons/topic.svg' 
  },
  is_active: { 
    type: Boolean, 
    default: true 
  }
}, { 
  collection: 'Global_Topics', 
  timestamps: true 
});

module.exports = mongoose.model('Topic', TopicSchema);