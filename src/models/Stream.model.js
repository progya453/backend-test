const mongoose = require('mongoose');

const StreamSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    enum: ['Science', 'Commerce', 'Arts'] 
  },
  slug: {
    type: String,
    required: true,
    lowercase: true
  },
  icon_url: { 
    type: String, 
    default: 'assets/icons/default-stream.svg' 
  },
  is_visible: { 
    type: Boolean, 
    default: true 
  },
  order: { 
    type: Number, 
    default: 0 
  }
}, { 
  collection: 'Global_Streams', 
  timestamps: true 
});

module.exports = mongoose.model('Stream', StreamSchema);