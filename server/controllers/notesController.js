const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

// @desc Get all notes
// @route GET /notes
// @access Private
const getAllNotes = asyncHandler(async (req, res) => {
	// lean method returns only data and not the whole mongoose object with methods and more
	const notes = await Note.find().lean();
	if (!notes?.length) {
		return res.status(400).json({ message: 'No notes found' });
	}

	/**
	 * Add username to each note before sending the response
	 */
	const notesWithUser = await Promise.all(
		notes.map(async (note) => {
			const user = await User.findById(note.user).lean().exec();
			return { ...note, username: user.username };
		})
	);

	res.json(notesWithUser);
});

// @desc Get a note
// @route GET /notes/{id}
// @access Private
const getNote = asyncHandler(async (req, res) => {});

// @desc Create a note
// @route POST /notes
// @access Private
const createNote = asyncHandler(async (req, res) => {
	const { user, title, text, completed } = req.body;

	// confirm data
	if (!user || !title || !text) {
		return res.status(400).json({ message: 'All fields are required' });
	}

	// Check for duplicate title
	const duplicate = await Note.findOne({ title }).lean().exec();

	if (duplicate) {
		return res.status(409).json({ message: 'Duplicate note title' });
	}
	// create and store new user
	const newNoteObject = { user, title, text, completed };
	const newNote = await Note.create(newNoteObject);

	if (newNote) {
		res.status(201).json({ message: `New note ${title} created` });
	} else {
		res.status(400).json({ message: 'Invalid note data received' });
	}
});

// @desc Update a note
// @route PATCH /notes
// @access Private
const updateNote = asyncHandler(async (req, res) => {
	const { user, title, text, completed, id } = req.body;

	// confirm data
	if (!user || !title || !text || typeof completed !== 'boolean') {
		res.status(400).json({ message: 'All fields are required' });
	}

	// we don't use lean here because we need the mongoose methods later
	const note = await Note.findById(id).exec();

	if (!note) {
		return res.status(400).json({ message: 'Note not found' });
	}

	// Check for duplicate title
	const duplicate = await Note.findOne({ title }).lean().exec();

	// Allow renaming of the original note
	if (duplicate && duplicate?._id.toString() !== id) {
		return res.status(409).json({ message: 'Duplicate note title' });
	}

	note.user = user;
	note.title = title;
	note.text = text;
	note.completed = completed;

	const updatedNote = await note.save();

	res.json({ message: `${updatedNote.title} updated` });
});

// @desc Delete a note
// @route DELETE /notes
// @access Private
const deleteNote = asyncHandler(async (req, res) => {
	const { id } = req.body;

	if (!id) {
		return res.status(400).json({ message: 'Note ID required' });
	}

	const note = await Note.findById(id).exec();

	if (!note) {
		return res.status(400).json({ message: 'Note not found' });
	}

	const result = await note.deleteOne();

	const reply = `Note ${result.title} with ID ${result.id} deleted successfully`;

	res.json(reply);
});

module.exports = {
	getAllNotes,
	createNote,
	updateNote,
	deleteNote,
};
