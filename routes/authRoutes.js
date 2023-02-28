const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getAllUsers,
  updateUser,
  deleteUser,
} = require('../controller/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);

//admin
router.get('/', getAllUsers);
router.patch('/update-user', updateUser);
router.delete('/delete-user/:id', deleteUser);

module.exports = router;
