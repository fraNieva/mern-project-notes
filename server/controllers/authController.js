const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

// @desc Login
// @route POST /auth
// @access Public
/**
 * Logs in a user by validating the username and password, and returns an access token.
 *
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {object} - The access token and sets a secure cookie with the refresh token.
 * @throws {object} - Unauthorized or Bad Request error messages.
 */
const login = asyncHandler(async (req, res) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(400).json({ message: 'All fields are required' });
	}

	const foundUser = await User.findOne({ username }).exec();

	if (!foundUser || !foundUser.active) {
		return res.status(401).json({ message: 'Unauthorized' });
	}

	const match = await bcrypt.compare(password, foundUser.password);

	if (!match) return res.status(401).json({ message: 'Unauthorized' });

	const accessToken = jwt.sign(
		{
			UserInfo: {
				username: foundUser.username,
				roles: foundUser.roles,
			},
		},
		process.env.ACCESS_TOKEN_SECRET,
		{ expiresIn: '15m' }
	);

	const refreshToken = jwt.sign(
		{ username: foundUser.username },
		process.env.REFRESH_TOKEN_SECRET,
		{ expiresIn: '7d' }
	);

	// Create secure cookie with refresh token
	res.cookie('jwt', refreshToken, {
		httpOnly: true, //accessible only by web server
		secure: true, //https
		sameSite: 'None', //cross-site cookie
		maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
	});

	// Send accessToken containing username and roles
	res.json({ accessToken });
});

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
/**
 * Refreshes the access token for an authenticated user.
 *
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {object} - The new access token.
 * @throws {object} - Unauthorized or Forbidden error messages.
 */
const refresh = (req, res) => {
	const cookies = req.cookies;

	if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' });

	const refreshToken = cookies.jwt;

	jwt.verify(
		refreshToken,
		process.env.REFRESH_TOKEN_SECRET,
		asyncHandler(async (err, decoded) => {
			if (err) return res.status(403).json({ message: 'Forbidden' });

			const foundUser = await User.findOne({ username: decoded.username }).exec();

			if (!foundUser) return res.status(401).json({ message: 'Unauthorized' });

			const accessToken = jwt.sign(
				{
					UserInfo: {
						username: foundUser.username,
						roles: foundUser.roles,
					},
				},
				process.env.ACCESS_TOKEN_SECRET,
				{ expiresIn: '15m' }
			);

			res.json({ accessToken });
		})
	);
};

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
/**
 * Logs out the user by clearing the JWT cookie.
 *
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {object} - A JSON response indicating success.
 */
const logout = (req, res) => {
	const cookies = req.cookies;
	if (!cookies?.jwt) return res.sendStatus(204); //No content
	res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
	res.json({ message: 'Cookie cleared' });
};

module.exports = {
	login,
	refresh,
	logout,
};
