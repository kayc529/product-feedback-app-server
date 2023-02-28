const createTokenUser = (user) => {
  return {
    userId: user._id,
    email: user.email,
    username: user.username,
    firstname: user.firstname,
    lastname: user.lastname,
    role: user.role,
    image: user.image || '',
  };
};

module.exports = createTokenUser;
