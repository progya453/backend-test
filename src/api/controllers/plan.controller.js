const PlanService = require('../../services/plan.service')


exports.getAllPlans = async(req, res, next) => {
    try {
        
        const plans = await PlanService.getAllPlans()

        res.status(200).json({status: 'success', data: plans})

    } catch (err) {
        next(err)
    }
}



exports.createPlan = async(req, res, next) => {
    try {
        // 1. Call the service with the data from the body
        const newPlan = await PlanService.createPlan(req.body)

        // 2. Return the created plan
        res.status(201).json({
            status: 'success', 
            data: { plan: newPlan }
        })

    } catch (err) {
        next(err)
    }
}