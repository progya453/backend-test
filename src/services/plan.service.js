const mongoose = require('mongoose')
const PlanSchema = require('../models/Plan.Model')


class PlanService {

    async getAllPlans() {

        const plans = await PlanSchema.find({isActive: true}).sort('price')

        if(!plans) return null
        return plans
    }

    async createPlan(planData) {
        // .create() is a Mongoose shortcut for new Model(data).save()
        const newPlan = await PlanSchema.create(planData)
        return newPlan
    }

}


module.exports = new PlanService()