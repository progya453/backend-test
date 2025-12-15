const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserProfileSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    description: "User ID (e.g., 'u_rahul_123')"
  },
  profile: {
    email: { type: String, required: true, unique: true },
    stream: { type: String, required: true },
    district: String,
    // ✅ MOVED PASSWORD HERE
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false // Hidden by default
    },
    role: { 
    type: String, 
    enum: ['student', 'admin'], 
    default: 'student',
    select: false // Security
  }
  },
  gamification: {
    total_xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    last_active_date: { type: Date }
  },
  ai_report: {
    predicted_percentile: Number,
    weakness_summary: String,
    focus_chapter: String
  },
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

// ✅ UPDATED HASHING LOGIC
UserProfileSchema.pre('save', async function(next) {
  // Check if 'profile.password' was modified
  if (!this.isModified('profile.password')) return next();

  // Hash the nested password
  this.profile.password = await bcrypt.hash(this.profile.password, 12);
  
  next();
});

// PASSWORD VERIFICATION METHOD (Unchanged)
UserProfileSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

UserProfileSchema.index({ "profile.email": 1 });
UserProfileSchema.index({ "gamification.total_xp": -1 });

module.exports = mongoose.model('UserProfile', UserProfileSchema);