// const express = require('express')
// const router = express.Router()

// const {getAllPlans, createPlan} = require('../controllers/plan.controller')

// const { protect } = require('../middlewares/auth.middleware');


// // router.use(protect)
// router.get('/allplans', getAllPlans)
// router.post('/create', restrictTo('admin'), createPlan)
// // router.post('/create',  createPlan)

// module.exports = router






const express = require('express');
const router = express.Router();

const { getAllPlans, createPlan } = require('../controllers/plan.controller');
// Import both middlewares
const { protect, restrictTo } = require('../middlewares/auth.middleware');

// Public Route (Anyone can see plans)
router.get('/allplans', getAllPlans);

// Protected Admin Route
// 1. protect: Ensures they are logged in
// 2. restrictTo('admin'): Ensures they have the admin role
router.post('/create', protect, restrictTo('admin'), createPlan); 

module.exports = router;