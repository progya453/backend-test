const mongoose = require('mongoose');

const UserActivitySchema = new mongoose.Schema({
  user_id: {
    type: String,
    ref: 'UserProfile',
    required: true,
    index: true 
  },
  question_id: {
    type: String,
    ref: 'Question',
    required: true
  },
  topic_tag: {
    type: String,
    required: true
  },
  is_correct: {
    type: Boolean,
    required: true
  },
  selected_option_id: {
    type: String,
    required: true
  },
  time_taken: {
    type: Number, 
    required: true
  },
  attempt_number: {
    type: Number,
    default: 1
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'Global_User_Activity'
});

// INDEXING STRATEGY
// 1. User History 
UserActivitySchema.index({ user_id: 1, timestamp: -1 });

// 2. AI Analytics 
UserActivitySchema.index({ question_id: 1, is_correct: 1 });

module.exports = mongoose.model('UserActivity', UserActivitySchema);