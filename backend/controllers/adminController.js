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
  const { name, email, password, registerNumber, department, year, section } = req.body || {};

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
  const { name, email, password, facultyId, department, designation } = req.body || {};

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

// @desc    Update student
// @route   PUT /api/admin/students/:id
// @access  Private/Admin
const updateStudent = async (req, res) => {
  const { id } = req.params; // this is the student table id
  const { name, email, password, registerNumber, department, year, section } = req.body || {};

  try {
    // get student to find user_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (studentError) throw studentError;

    // update user
    const userUpdates = { name, email };
    if (password && password.length > 0 && password !== '****') {
      userUpdates.password = bcrypt.hashSync(password, 10);
    }
    
    const { error: userUpdateError } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('id', student.user_id);
      
    if (userUpdateError) throw userUpdateError;

    // update student
    const studentUpdates = { department, year: parseInt(year) || 1, section };
    if (registerNumber) studentUpdates.register_number = registerNumber;

    const { data: updatedStudent, error: studentUpdateError } = await supabase
      .from('students')
      .update(studentUpdates)
      .eq('id', id)
      .select()
      .single();

    if (studentUpdateError) throw studentUpdateError;

    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete student
// @route   DELETE /api/admin/students/:id
// @access  Private/Admin
const deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (studentError) throw studentError;

    // Supabase foreign key with CASCADE might handle this, but let's delete user explicitly
    // First delete student
    await supabase.from('students').delete().eq('id', id);
    // Then delete user
    await supabase.from('users').delete().eq('id', student.user_id);

    res.json({ message: 'Student removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


// @desc    Update faculty
// @route   PUT /api/admin/faculty/:id
// @access  Private/Admin
const updateFaculty = async (req, res) => {
  const { id } = req.params; // this is the faculty table id
  const { name, email, password, facultyId, department, designation } = req.body || {};

  try {
    const { data: faculty, error: facultyError } = await supabase
      .from('faculty')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (facultyError) throw facultyError;

    // update user
    const userUpdates = { name, email };
    if (password && password.length > 0 && password !== '****') {
      userUpdates.password = bcrypt.hashSync(password, 10);
    }
    
    const { error: userUpdateError } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('id', faculty.user_id);
      
    if (userUpdateError) throw userUpdateError;

    // update faculty
    const facultyUpdates = { department, designation };
    if (facultyId) facultyUpdates.faculty_id = facultyId;

    const { data: updatedFaculty, error: facultyUpdateError } = await supabase
      .from('faculty')
      .update(facultyUpdates)
      .eq('id', id)
      .select()
      .single();

    if (facultyUpdateError) throw facultyUpdateError;

    res.json(updatedFaculty);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete faculty
// @route   DELETE /api/admin/faculty/:id
// @access  Private/Admin
const deleteFaculty = async (req, res) => {
  const { id } = req.params;
  try {
    const { data: faculty, error: facultyError } = await supabase
      .from('faculty')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (facultyError) throw facultyError;

    await supabase.from('faculty').delete().eq('id', id);
    await supabase.from('users').delete().eq('id', faculty.user_id);

    res.json({ message: 'Faculty removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  getFaculty,
  addFaculty,
  updateFaculty,
  deleteFaculty,
};
