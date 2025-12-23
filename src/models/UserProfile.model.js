

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserProfileSchema = new mongoose.Schema({
  // ✅ 1. Identity (String ID)
  _id: {
    type: String,
    required: true
  },

  // ✅ 2. Core Profile
  profile: {
    email: { type: String, required: true, unique: true },
    stream: { type: String, required: true },
    district: String,
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['student', 'admin'], default: 'student', select: false }
  },

  // ✅ 3. Gamification
  gamification: {
    total_xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    last_active_date: { type: Date }
  },

  // ✅ 4. Dashboard Insights
  dashboard_insight: {
    status: {
      completion_avg: { type: Number, default: 0 },
      recent_accuracy: { type: Number, default: 0 },
      activity_status: { type: String, default: 'Active' }
    },
    analysis: {
      weak_topic: { type: String, default: 'None' },
      decay_risk: { type: String, default: 'None' },
      strongest_subject: { type: String, default: 'None' }
    },
    recommendation: {
      type: { type: String, default: 'continue' },
      label: { type: String, default: 'Start Learning' },
      context: { type: String, default: 'General' }
    }
  },

  // ✅ 5. AI Report Card
  ai_report: {
    predicted_percentile: Number,
    weakness_summary: String,
    focus_chapter: String,
    probability_score: Number, 
    reasoning: String
  },

  // ✅ 6. SRS Memory
  topic_states: [{
    topic: { type: String, required: true },
    memory_strength: { type: Number, default: 0 },
    next_review: { type: Date, default: Date.now },
    mastery_level: { type: Number, default: 0 }
  }]
}, {
  timestamps: true,
  collection: 'User_Smart_Profile'
});

// Middleware & Methods
UserProfileSchema.pre('save', async function(next) {
  if (!this.isModified('profile.password')) return next();
  this.profile.password = await bcrypt.hash(this.profile.password, 12);
  next();
});

UserProfileSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model('UserProfile', UserProfileSchema);