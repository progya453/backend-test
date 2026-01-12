// src/models/Feedback.model.js
const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  user_id: { 
    type: String, 
    ref: 'UserProfile', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['general', 'bug', 'feature', 'content'], 
    default: 'general' 
  },
  rating: { 
    type: Number, 
    min: 1, 
    max: 5, 
    required: true 
  },
  message: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  }
}, {
  timestamps: true,
  collection: 'User_Feedback'
});

module.exports = mongoose.model('Feedback', FeedbackSchema);