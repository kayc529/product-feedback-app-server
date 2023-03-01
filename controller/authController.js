const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, UnauthenticatedError } = require('../errors');
const createTokenUser = require('../utils/createTokenUser');
const crypto = require('crypto');
const { attachCookieToResponse } = require('../utils/jwt');

const register = async (req, res) => {
  const { username, firstname, lastname, email, password } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new BadRequestError('Email already exists');
  }

  const user = await User.create({
    username,
    firstname,
    lastname,
    email,
    password,
    joinedDate: Date.now(),
  });

  //contains info that can be used by client
  const tokenUser = createTokenUser(user);

  const refreshToken = crypto.randomBytes(40).toString('hex');

  attachCookieToResponse({ res, user: tokenUser, refreshToken });

  res.status(StatusCodes.CREATED).json({
    success: true,
    user: tokenUser,
  });
};

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new BadRequestError('Please provide username and password');
  }

  const user = await User.findOne({ username: username });

  if (!user) {
    throw new UnauthenticatedError('Invalid credentials');
  }

  const isPasswordCorrect = await user.comparePasswords(password);

  if (!isPasswordCorrect) {
    throw new UnauthenticatedError('Invalid credentials');
  }

  const tokenUser = createTokenUser(user);
  const refreshToken = crypto.randomBytes(40).toString('hex');

  attachCookieToResponse({ res, user: tokenUser, refreshToken });

  res.status(StatusCodes.OK).json({ success: true, user: tokenUser });
};

const logout = async (req, res) => {
  res.cookie('accessToken', '', {
    httpOnly: true,
    signed: true,
    maxAge: -1,
  });

  res.cookie('refreshToken', '', {
    httpOnly: true,
    signed: true,
    maxAge: -1,
  });

  res.status(StatusCodes.OK).json({ success: true });
};

const getAllUsers = async (req, res) => {
  const users = await User.find({}).sort('-createdAt');
  res.status(StatusCodes.OK).json({ users });
};

const updateUser = async (req, res) => {
  //temporary
  const userInfo = req.body;
  const user = await User.findOne({ _id: userInfo.id });

  if (!user) {
    throw new BadRequestError('User does not exist');
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userInfo.id },
    userInfo,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(StatusCodes.OK).json({ success: true, user: updatedUser });
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  await User.findOneAndDelete({ _id: id });
  res.status(StatusCodes.OK).json({ success: true, msg: 'user deleted' });
};

module.exports = {
  register,
  login,
  logout,
  getAllUsers,
  updateUser,
  deleteUser,
};
