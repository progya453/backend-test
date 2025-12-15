const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  // ✅ ADDED THIS FIELD to link back to the Stream
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