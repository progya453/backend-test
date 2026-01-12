const User = require('../../models/UserProfile.model')
const UserProfileService = require('../../services/userprofile.service')
const multer = require('multer');
const { storage } = require('../../config/cloudinary')


const upload = multer({ storage: storage });


exports.getUserProfileInfo = async(req, res, next) => {
    
    try {
        const userId = req.user ? req.user.id : null;
        const profileInfo = await UserProfileService.getUserInfo(userId)
        res.status(200).json({status: 'success', data: profileInfo})
    }
    catch(err) {
        next(err)
    }
} 

exports.getUserGems = async(req, res, next) => {
    try {
        
        const userId = req.user ? req.user.id : null
        const userGems = await UserProfileService.getUserGems(userId)
        res.status(200).json({status: 'success', data: userGems})

    } catch (err) {
        next(err)
    }
    
}


exports.getUserStats = async(req, res, next) => {
    try {
        
        const userId = req.user ? req.user.id : null
        const userStats = await UserProfileService.getUserStats(userId)
        res.status(200).json({status: 'success', data: userStats})

    } catch (err) {
        next(err)
    }
}


// The Controller Function
exports.updateProfile = async (req, res) => {
    try {
      // We use a flat object with dot-notation keys to target nested Mongoose fields
      const updates = {};
  
      // 1. Handle the Image
      if (req.file) {
        console.log('File uploaded to Cloudinary:', req.file.path);
        // 🟢 Target the nested field using quotes
        updates['profile.avatar'] = req.file.path; 
      }
  
      // 2. Handle Text Fields
      if (req.body.name) {
        // 🟢 Target the nested field using quotes
        updates['profile.name'] = req.body.name; 
      }
  
      // 3. Update using $set
      // Using $set ensures we only modify the specific fields listed in 'updates'
      console.log(updates)
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updates }, 
        { new: true }
      );
      console.log(updatedUser)
      res.json({
        success: true,
        data: updatedUser, // Return the full user or the updates
        message: 'Profile updated successfully'
      });
  
    } catch (error) {
      console.error('Upload Error:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  };



  exports.submitFeedback = async (req, res, next) => {
    try {
        const userId = req.user ? req.user.id : null;
        const { type, rating, message } = req.body;

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated' });
        }

        // Validate input
        if (!rating || !message) {
             return res.status(400).json({ status: 'error', message: 'Rating and message are required' });
        }

        const feedback = await UserProfileService.submitFeedback(userId, type, rating, message);

        res.status(201).json({
            status: 'success',
            message: 'Feedback submitted successfully',
            data: feedback
        });

    } catch (err) {
        next(err);
    }
};