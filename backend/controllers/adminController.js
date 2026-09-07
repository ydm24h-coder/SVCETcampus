const supabase = require('../config/db');
const bcrypt = require('bcryptjs');

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private/Admin
const getStudents = async (req, res) => {
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select(`
        id,
        register_number,
        department,
        year,
        section,
        created_at,
        updated_at,
        user:users!user_id (
          id,
          name,
          email,
          role
        )
      `);

    if (error) throw error;
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
    // Check if user with email exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check if register number exists
    const { data: existingReg } = await supabase
      .from('students')
      .select('id')
      .eq('register_number', registerNumber)
      .single();

    if (existingReg) {
      return res.status(400).json({ message: 'Student with this register number already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create user
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        role: 'STUDENT',
      })
      .select()
      .single();

    if (userError) throw userError;

    // Create student record
    const { data: newStudent, error: studentError } = await supabase
      .from('students')
      .insert({
        user_id: newUser.id,
        register_number: registerNumber,
        department,
        year: parseInt(year),
        section,
      })
      .select()
      .single();

    if (studentError) throw studentError;

    res.status(201).json({
      ...newUser,
      student: newStudent,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all faculty
// @route   GET /api/admin/faculty
// @access  Private/Admin
const getFaculty = async (req, res) => {
  try {
    const { data: facultyList, error } = await supabase
      .from('faculty')
      .select(`
        id,
        faculty_id,
        department,
        designation,
        created_at,
        updated_at,
        user:users!user_id (
          id,
          name,
          email,
          role
        )
      `);

    if (error) throw error;
    res.json(facultyList);
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
    // Check if user with email exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check if faculty ID exists
    const { data: existingFaculty } = await supabase
      .from('faculty')
      .select('id')
      .eq('faculty_id', facultyId)
      .single();

    if (existingFaculty) {
      return res.status(400).json({ message: 'Faculty with this ID already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create user
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        role: 'FACULTY',
      })
      .select()
      .single();

    if (userError) throw userError;

    // Create faculty record
    const { data: newFaculty, error: facultyError } = await supabase
      .from('faculty')
      .insert({
        user_id: newUser.id,
        faculty_id: facultyId,
        department,
        designation,
      })
      .select()
      .single();

    if (facultyError) throw facultyError;

    res.status(201).json({
      ...newUser,
      faculty: newFaculty,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getStudents,
  addStudent,
  getFaculty,
  addFaculty,
};
