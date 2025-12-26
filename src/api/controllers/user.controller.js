const UserProfile = require('../../models/UserProfile.model')
const UserProfileService = require('../../services/userprofile.service')


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