const Suggestion = require('../models/Suggestion');
const { StatusCodes } = require('http-status-codes');
const { NotFoundError, UnauthorizedError } = require('../errors');
const ITEMS_PER_PAGE = 5;

const getAllSuggestions = async (req, res) => {
  let { s, c, p } = req.query;

  let aggregationArr = [];

  //categories
  if (c) {
    const categories = c.split(',');
    aggregationArr.push({
      $match: { category: { $in: categories } },
    });
  }

  //sorting
  if (s) {
    let index = s.indexOf('-');
    //get the name of the sorting field
    if (index !== -1) {
      s = s.substring(index + 1, s.length);
    }
    let order = index === -1 ? 1 : -1;
    if (s.includes('comments')) {
      //add a field for the size of comments array
      aggregationArr.push({
        $addFields: {
          comments_count: { $size: '$comments' },
        },
      });
      //sort based on the comment array size
      aggregationArr.push({ $sort: { comments_count: order } });
    } else {
      aggregationArr.push({ $sort: { [s]: order } });
    }
  } else {
    aggregationArr.push({ $sort: { createdAt: -1 } });
  }
  let suggestions = await Suggestion.aggregate(aggregationArr);

  const count = suggestions.length;
  //num of pages in total
  const numOfPages = Math.ceil(count / ITEMS_PER_PAGE);
  let pageNum = Number(p) || 1;
  pageNum = pageNum > numOfPages ? numOfPages : pageNum;
  let startIndex = (pageNum - 1) * ITEMS_PER_PAGE;
  let endIndex =
    startIndex + ITEMS_PER_PAGE >= count ? count : startIndex + ITEMS_PER_PAGE;

  //suggestions to display on that page
  suggestions = suggestions.slice(startIndex, endIndex);

  let counts = await Suggestion.aggregate([
    {
      $facet: {
        status: [
          {
            $group: { _id: '$status', count: { $sum: 1 } },
          },
        ],
        categories: [
          {
            $group: { _id: '$category' },
          },
        ],
      },
    },
  ]);

  const roadmap = counts[0]?.status || [];
  const categories =
    counts[0]?.categories.map((category) => category._id).sort() || [];

  res.status(StatusCodes.OK).json({
    suggestions,
    count,
    roadmap,
    categories,
    numOfPages,
    currentPage: pageNum,
  });
};

const getSuggestion = async (req, res) => {
  const { id } = req.params;
  const suggestion = await Suggestion.findOne({ _id: id });

  if (!suggestion) {
    throw new NotFoundError(`No memo with id ${id}`);
  }

  res.status(StatusCodes.OK).json({ suggestion });
};

const createSuggestion = async (req, res) => {
  const user = req.user;
  const suggestion = await Suggestion.create({
    ...req.body,
    createdBy: user.userId,
  });
  res.status(StatusCodes.CREATED).json({ success: true, suggestion });
};

const updateSuggestion = async (req, res) => {
  const { id } = req.params;
  const suggestionToUpdate = req.body;
  const user = req.user;

  const suggestion = await Suggestion.findOne({ _id: id });
  if (!suggestion) {
    throw new NotFoundError(`No memo with id ${id}`);
  }

  if (
    user.userId !== suggestion.createdBy.toString() &&
    user.role !== 'admin'
  ) {
    throw new UnauthorizedError('Unauthorized to update suggestion');
  }

  const updatedSuggestion = await Suggestion.findOneAndUpdate(
    { _id: id },
    suggestionToUpdate,
    { runValidators: true, new: true }
  );

  res
    .status(StatusCodes.OK)
    .json({ success: true, suggestion: updatedSuggestion });
};

const deleteSuggestion = async (req, res) => {
  const { id } = req.params;
  const suggestion = await Suggestion.findOne({ _id: id });

  if (!suggestion) {
    throw new NotFoundError(`No suggestion with id ${id}`);
  }

  await Suggestion.findOneAndDelete({ _id: id });

  res.status(StatusCodes.OK).json({ success: true });
};

const deleteAllSuggestions = async (req, res) => {
  await Suggestion.deleteMany({});
  res.status(StatusCodes.OK).json({ success: true });
};

const upvoteSuggestion = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const suggestion = await Suggestion.findOne({ _id: id });

  if (!suggestion) {
    throw new NotFoundError(`No suggestion with id ${id}`);
  }

  let updatedSuggestion;

  //if user has upvoted the suggestion before,
  //remove the user id from the upvotedBy list
  if (suggestion.upvotedBy.includes(user.userId)) {
    updatedSuggestion = await Suggestion.findOneAndUpdate(
      { _id: id },
      {
        $pull: { upvotedBy: user.userId },
        $inc: { upvotes: -1 },
      },
      {
        new: true,
        runValidators: true,
      }
    );
  } else {
    updatedSuggestion = await Suggestion.findOneAndUpdate(
      { _id: id },
      {
        $push: { upvotedBy: user.userId },
        $inc: { upvotes: 1 },
      },
      {
        new: true,
        runValidators: true,
      }
    );
  }

  res
    .status(StatusCodes.OK)
    .json({ success: true, suggestion: updatedSuggestion });
};

const createComment = async (req, res) => {
  const { id } = req.params;
  let comment = req.body;
  const user = req.user;

  comment.user = {
    username: user.username,
    firstname: user.firstname,
    lastname: user.lastname,
    image: user.image,
  };

  const suggestion = await Suggestion.findOne({ _id: id });

  if (!suggestion) {
    throw new NotFoundError(`No memo with id ${id}`);
  }

  const updatedSuggestion = await Suggestion.findOneAndUpdate(
    { _id: id },
    { $push: { comments: { $each: [comment], $position: 0 } } },
    { new: true, runValidators: true }
  );

  res
    .status(StatusCodes.OK)
    .json({ success: true, suggestion: updatedSuggestion });
};

const deleteComment = async (req, res) => {
  const { id: commentId } = req.params;
  const suggestion = await Suggestion.findOneAndUpdate(
    { 'comments._id': commentId },
    {
      $pull: {
        comments: { _id: commentId },
      },
    },
    {
      new: true,
    }
  );

  res.status(StatusCodes.OK).json({ success: true, suggestion });
};

const createReply = async (req, res) => {
  const { id: commentId } = req.params;
  let reply = req.body;
  const user = req.user;

  reply.user = {
    username: user.username,
    firstname: user.firstname,
    lastname: user.lastname,
    image: user.image,
  };

  let suggestion = await Suggestion.findOne({ 'comments._id': commentId });

  if (!suggestion) {
    throw new NotFoundError(`No suggestion with commentId ${id} found`);
  }

  reply = { ...reply, repliedOn: Date.now() };

  const updatedSuggestion = await Suggestion.findOneAndUpdate(
    { 'comments._id': commentId },
    { $push: { 'comments.$[t].replies': reply } },
    {
      arrayFilters: [
        {
          't._id': commentId,
        },
      ],
      new: true,
    }
  );

  res
    .status(StatusCodes.OK)
    .json({ success: true, suggestion: updatedSuggestion });
};

module.exports = {
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
};
