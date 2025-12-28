const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  // 1. Internal Identifier (e.g., 'pro_monthly', 'gold_yearly')
  slug: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    index: true 
  },

  // 2. Display Information (Sent to Frontend)
  name: { type: String, required: true }, 
  subtitle: { type: String },             
  description: { type: String },          
  
  // 3. Pricing Logic
  price: { type: Number, required: true }, 
  currency: { type: String, default: 'INR' },
  duration_days: { type: Number, required: true }, 
  
  // 4. Feature Gating (What does this plan unlock?)
  features: [{ type: String }],
  
  // 5. Config Flags
  isActive: { type: Boolean, default: true }, 
  isRecommended: { type: Boolean, default: false }, 
  
  // 6. Payment Gateway IDs (Crucial for real payments)
  razorpay_plan_id: { type: String },
  stripe_price_id: { type: String },

  // 7. Styling (Optional: Store gradient colors here to make UI dynamic)
  style: {
    gradient: { type: String, default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    accent_color: { type: String, default: '#764ba2' }
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Plan', PlanSchema);






// {
//     "slug": "pro-monthly",
//     "name": "Topper Pro",
//     "price": 99,
//     "duration_days": 30,
//     "features": ["Unlimited Hearts", "AI Predictions"],
//     "style": { "gradient": "linear-gradient(180deg, #FFC837 0%, #FF8008 100%)" }
//   }