
const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  // --- Fields from Schema B ---
  id: { 
    type: String, 
    required: true,
    unique: true 
  },
  boardClass: { 
    type: String, 
    required: true 
  },

  image: { 
    type: String, 
    default: 'https://res.cloudinary.com/demo/image/upload/v1/samples/animals/kitten-playing.gif' // Fallback
  },

  // --- Fields from Schema A ---
  name: { 
    type: String, 
    required: true 
  },
  // Linked to Stream
  stream_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stream',
    required: true,
    index: true
  },
  stream: { 
    type: String, 
    required: true 
  },
  icon_url: { 
    type: String, 
    default: 'assets/icons/default-subject.svg'
  },
  theme_color: { 
    type: String, 
    default: '#ffc800' 
  },
  is_active: { 
    type: Boolean, 
    default: true 
  }
}, { 
  collection: 'Global_Subjects', 
  timestamps: true 
});

module.exports = mongoose.model('Subject', SubjectSchema);
