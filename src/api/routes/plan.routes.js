const express = require('express')
const router = express.Router()

const {getAllPlans, createPlan} = require('../controllers/plan.controller')

const { protect } = require('../middlewares/auth.middleware');


// router.use(protect)
router.get('/allplans', getAllPlans)
// router.post('/create', restrictTo('admin'), createPlan)
router.post('/create',  createPlan)

module.exports = router