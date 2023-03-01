const { UnauthenticatedError } = require('../errors');
const { isTokenValid, attachCookieToResponse } = require('../utils/jwt');

const authenticateUser = async (req, res, next) => {
  const { accessToken, refreshToken } = req.signedCookies;

  console.log('authenticateUser');
  try {
    //if access token is present in the cookie
    //meaning both access and refresh tokens haven't expired
    if (accessToken) {
      console.log('has access token!');
      const payload = isTokenValid(accessToken);
      req.user = payload.user;
      return next();
    }

    console.log('no access token!');

    //if access token is absent, get user from refreshToken
    const payload = isTokenValid(refreshToken);

    //attach an updated cookie to client
    //reset the expiry time for both access and refresh tokens whenever the client
    //makes an API call that requires authentication
    attachCookieToResponse({ res, user: payload.user, refreshToken });

    //add user to the req for controller
    req.user = payload.user;

    next();
  } catch (error) {
    console.log(error);
    throw new UnauthenticatedError('Invalid token');
  }
};

module.exports = { authenticateUser };
