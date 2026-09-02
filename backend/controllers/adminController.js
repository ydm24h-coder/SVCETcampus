const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const bcrypt = require('bcryptjs');

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private/Admin
const getStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('user', 'name email role');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Add new student
// @route   POST /api/admin/students
// @access  Private/Admin
const addStudent = async (req, res) => {
  const { name, email, password, registerNumber, department, year, section } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const regExists = await Student.findOne({ registerNumber });
    if (regExists) {
      return res.status(400).json({ message: 'Student with this register number already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'STUDENT',
    });

    const newStudent = await Student.create({
      user: newUser._id,
      registerNumber,
      department,
      year: parseInt(year),
      section
    });

    const result = {
      ...newUser.toObject(),
      student: newStudent.toObject()
    };
    
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all faculty
// @route   GET /api/admin/faculty
// @access  Private/Admin
const getFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find().populate('user', 'name email role');
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Add new faculty
// @route   POST /api/admin/faculty
// @access  Private/Admin
const addFaculty = async (req, res) => {
  const { name, email, password, facultyId, department, designation } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const idExists = await Faculty.findOne({ facultyId });
    if (idExists) {
      return res.status(400).json({ message: 'Faculty with this ID already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'FACULTY',
    });

    const newFaculty = await Faculty.create({
      user: newUser._id,
      facultyId,
      department,
      designation
    });

    const result = {
      ...newUser.toObject(),
      faculty: newFaculty.toObject()
    };

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getStudents,
  addStudent,
  getFaculty,
  addFaculty
};
