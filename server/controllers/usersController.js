const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
	// lean method returns only data and not the whole mongoose object with methods and more
	const users = await User.find().select('-password').lean();
	if (!users?.length) {
		return res.status(400).json({ message: 'No users found' });
	}
	res.json(users);
});

// @desc Get an user
// @route GET /users/{id}
// @access Private
const getUser = asyncHandler(async (req, res) => {});

// @desc Create an user
// @route POST /users
// @access Private
const createUser = asyncHandler(async (req, res) => {
	const { username, password, roles } = req.body;

	// confirm data
	if (!username || !password || !Array.isArray(roles) || !roles.length) {
		return res.status(400).json({ message: 'All fields are required' });
	}

	// check for duplicate
	const duplicate = await User.findOne({ username }).lean().exec();
	if (duplicate) {
		return res.status(409).json({ message: 'Duplicate username' });
	}

	// hash password
	const hashedPwd = await bcrypt.hash(password, 10);

	// create and store new user
	const newUserObject = { username, password: hashedPwd, roles };
	const newUser = await User.create(newUserObject);

	if (newUser) {
		res.status(201).json({ message: `New user ${username} created` });
	} else {
		res.status(400).json({ message: 'Invalid user data received' });
	}
});

// @desc Update an user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
	const { username, password, id, roles, active } = req.body;

	// confirm data
	if (
		!username ||
		!password ||
		!Array.isArray(roles) ||
		!roles.length ||
		typeof active !== 'boolean'
	) {
		res.status(400).json({ message: 'All fields are required' });
	}

	// we don't use lean here because we need the mongoose methods later
	const user = await User.findOne({ username }).exec();

	if (!user) {
		return res.status(400).json({ message: 'User not found' });
	}

	// check for duplicate
	if (user && user?._id.toString() !== id) {
		return res.status(400).json({ message: 'Duplicate username' });
	}

	user.username = username;
	user.roles = roles;
	user.active = active;

	if (password) {
		// hash password
		user.password = await bcrypt.hash(password, 10);
	}

	const updatedUser = await user.save();

	res.json({ message: `${updatedUser.username} updated` });
});

// @desc Delete an user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
	const { id } = req.body;

	if (!id) {
		return res.status(400).json({ message: 'User ID required' });
	}

	const note = await Note.findOne({ id }).lean().exec();
	if (note) {
		return res.status(400).json({ message: 'User has assigned notes' });
	}
	const user = await User.findById(id).exec();

	if (!user) {
		return res.status(400).json({ message: 'User not found' });
	}

	const result = await user.deleteOne();

	const reply = `Username ${result.username} with ID ${result.id} deleted successfully`;

	res.json(reply);
});

module.exports = {
	getAllUsers,
	createUser,
	updateUser,
	deleteUser,
};
