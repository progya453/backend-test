const mongoose = require('mongoose')
const UserProfile = require('../models/UserProfile.model')
const Feedback = require('../models/Feedback.model');


class UserProfileService {
    
    async getUserInfo(userId) {
        const user = await UserProfile.findById(userId).select('profile')
        if(!user) return null

        return user
    }

    async getUserGems(userId) {
        const userGems = await UserProfile.findById(userId).select('wallet.gems')
        if(!userGems) return null

        return userGems
    }

    async getUserStats(userId) {
        const userStats = await UserProfile.findById(userId).select('gamification')

        if(!userStats) return null

        return userStats
    }


    async submitFeedback(userId, type, rating, message) {
        const feedback = await Feedback.create({
            user_id: userId,
            type,
            rating,
            message
        });
        return feedback;
    }

}

module.exports = new UserProfileService()