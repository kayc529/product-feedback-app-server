const express = require('express');
const router = express.Router();
const {
  getRoadmap,
  getFullRoadmap,
} = require('../controller/roadmapController');

router.get('/', getRoadmap);
router.get('/full', getFullRoadmap);

module.exports = router;
