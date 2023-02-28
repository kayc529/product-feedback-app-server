const Suggestion = require('../models/Suggestion');
const { StatusCodes } = require('http-status-codes');

const getRoadmap = async (req, res) => {
  const suggestions = await Suggestion.find({
    status: { $in: ['planned', 'in-progress', 'live'] },
  });

  let roadmap = { planned: 0, inProgress: 0, live: 0 };

  suggestions.forEach((suggestion) => {
    switch (suggestion.status) {
      case 'planned':
        roadmap.planned += 1;
        break;
      case 'in-progress':
        roadmap.inProgress += 1;
        break;
      case 'live':
        roadmap.live += 1;
        break;
      default:
        break;
    }
  });

  res.status(StatusCodes.OK).json({ roadmap });
};

const getFullRoadmap = async (req, res) => {
  const suggestions = await Suggestion.find({
    status: { $in: ['planned', 'in-progress', 'live'] },
  }).sort('-createdAt');

  let roadmap = { planned: [], inProgress: [], live: [] };

  suggestions.forEach((suggestion) => {
    switch (suggestion.status) {
      case 'planned':
        roadmap.planned.push(suggestion);
        break;
      case 'in-progress':
        roadmap.inProgress.push(suggestion);
        break;
      case 'live':
        roadmap.live.push(suggestion);
        break;
      default:
        break;
    }
  });

  res.status(StatusCodes.OK).json({ roadmap });
};

module.exports = { getRoadmap, getFullRoadmap };
