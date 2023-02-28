const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      require: true,
    },
    desc: {
      type: String,
      require: true,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['suggestion', 'planned', 'in-progress', 'live'],
      default: 'suggestion',
    },
    category: {
      type: String,
      enum: ['feature', 'ui', 'ux', 'enhancement', 'bug'],
      default: 'feature',
    },
    comments: {
      // type: [commentSchema],
      type: [
        {
          content: {
            type: String,
            require: true,
          },
          user: {
            type: {
              image: {
                type: String,
              },
              username: {
                type: String,
                require: true,
              },
              firstname: {
                type: String,
                require: true,
              },
              lastname: {
                type: String,
                require: true,
              },
            },
            require: true,
          },
          replies: {
            type: [
              {
                content: {
                  type: String,
                  require: true,
                },
                repliedOn: {
                  type: Date,
                },
                replyingTo: {
                  type: String,
                  require: true,
                },
                user: {
                  type: {
                    image: {
                      type: String,
                    },
                    username: {
                      type: String,
                      require: true,
                    },
                    firstname: {
                      type: String,
                      require: true,
                    },
                    lastname: {
                      type: String,
                      require: true,
                    },
                  },
                  require: true,
                },
              },
            ],
          },
        },
      ],
      require: true,
    },
    upvotedBy: {
      type: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Suggestion', suggestionSchema);
