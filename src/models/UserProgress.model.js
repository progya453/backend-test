const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
  //  MUST BE STRING for user IDs like "ram"
  user_id: { type: String, ref: 'UserProfile', required: true, index: true },
  

  entity_id: { type: String, required: true, index: true, ref: 'Topic' }, 

  entity_type: { type: String, enum: ['subject', 'chapter', 'topic'], required: true },
  
  progress: {
    total_items: { type: Number, default: 0 },
    solved_items: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  },

  last_activity: { type: Date, default: Date.now }
}, {
  collection: 'User_Progress_Cache',
  timestamps: true 
});

// Compound index for uniqueness
UserProgressSchema.index({ user_id: 1, entity_id: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', UserProgressSchema);