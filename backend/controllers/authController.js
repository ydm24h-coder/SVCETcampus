const supabase = require('../config/db');
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
    let user = null;

    if (role === 'Student') {
      // Find student by register number, then get their user
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('user_id')
        .eq('register_number', id)
        .single();

      if (studentError || !student) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', student.user_id)
        .single();

      if (!userError && userData) user = userData;
    } else if (role === 'Faculty') {
      // Find faculty by faculty_id, then get their user
      const { data: faculty, error: facultyError } = await supabase
        .from('faculty')
        .select('user_id')
        .eq('faculty_id', id)
        .single();

      if (facultyError || !faculty) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', faculty.user_id)
        .single();

      if (!userError && userData) user = userData;
    } else if (role === 'Admin') {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', id)
        .eq('role', 'ADMIN')
        .single();

      if (!userError && userData) user = userData;
    }

    if (user && bcrypt.compareSync(password, user.password)) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id, user.role),
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
    const { data: adminExists } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'ADMIN')
      .single();

    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const { data: admin, error } = await supabase
      .from('users')
      .insert({
        role: 'ADMIN',
        name: 'Super Admin',
        email: 'admin@svcetcampus.edu',
        password: hashedPassword,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Admin seeded successfully', admin: { id: admin.id, email: admin.email } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { loginUser, seedAdmin };
