const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { id, password, role } = req.body;

  try {
    let user;

    if (role === 'Student') {
      const student = await Student.findOne({ registerNumber: id }).populate('user');
      if (student) user = student.user;
    } else if (role === 'Faculty') {
      const faculty = await Faculty.findOne({ facultyId: id }).populate('user');
      if (faculty) user = faculty.user;
    } else if (role === 'Admin') {
      user = await User.findOne({ email: id, role: 'ADMIN' });
    }

    if (user && bcrypt.compareSync(password, user.password)) {
      res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Seed initial Admin
// @route   POST /api/auth/seed-admin
// @access  Public
const seedAdmin = async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: 'ADMIN' });

    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const admin = await User.create({
      role: 'ADMIN',
      name: 'Super Admin',
      email: 'admin@svcetcampus.edu',
      password: hashedPassword,
    });

    res.status(201).json({ message: 'Admin seeded successfully', admin: { id: admin._id, email: admin.email } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { loginUser, seedAdmin };
