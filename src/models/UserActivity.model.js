const mongoose = require('mongoose');

const UserActivitySchema = new mongoose.Schema({
  user_id: {
    type: String,
    ref: 'UserProfile', // Mongoose Virtual Reference
    required: true,
    index: true // Important for Sharding
  },
  question_id: {
    type: String,
    ref: 'Question',
    required: true
  },
  topic_tag: {
    type: String, // Denormalized for fast analytics without joins
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
    type: Number, // Seconds
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
// 1. User History (e.g., "Recent Activity" on Dashboard)
UserActivitySchema.index({ user_id: 1, timestamp: -1 });

// 2. AI Analytics (e.g., "How many people got this Question wrong?")
UserActivitySchema.index({ question_id: 1, is_correct: 1 });

module.exports = mongoose.model('UserActivity', UserActivitySchema);