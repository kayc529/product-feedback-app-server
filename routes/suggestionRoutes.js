const express = require('express');
const router = express.Router();

const {
  getAllSuggestions,
  getSuggestion,
  createSuggestion,
  updateSuggestion,
  deleteSuggestion,
  deleteAllSuggestions,
  upvoteSuggestion,
  createComment,
  deleteComment,
  createReply,
} = require('../controller/suggestionController');

const { authenticateUser } = require('../middleware/authentication');

router
  .route('/')
  .get(getAllSuggestions)
  .post(authenticateUser, createSuggestion)
  .delete(deleteAllSuggestions);

router
  .route('/comment/:id')
  .patch(authenticateUser, createComment)
  .delete(deleteComment);

router.patch('/reply/:id', authenticateUser, createReply);

router.patch('/upvote/:id', authenticateUser, upvoteSuggestion);

router
  .route('/:id')
  .get(getSuggestion)
  .patch(authenticateUser, updateSuggestion)
  .delete(deleteSuggestion);

module.exports = router;
