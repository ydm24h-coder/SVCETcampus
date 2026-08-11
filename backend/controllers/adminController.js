const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private/Admin
const getStudents = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      }
    });
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
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const regExists = await prisma.student.findUnique({ where: { registerNumber } });
    if (regExists) {
      return res.status(400).json({ message: 'Student with this register number already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newStudent = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'STUDENT',
        student: {
          create: {
            registerNumber,
            department,
            year: parseInt(year),
            section
          }
        }
      },
      include: {
        student: true
      }
    });

    res.status(201).json(newStudent);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all faculty
// @route   GET /api/admin/faculty
// @access  Private/Admin
const getFaculty = async (req, res) => {
  try {
    const faculty = await prisma.faculty.findMany({
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      }
    });
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
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const idExists = await prisma.faculty.findUnique({ where: { facultyId } });
    if (idExists) {
      return res.status(400).json({ message: 'Faculty with this ID already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newFaculty = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'FACULTY',
        faculty: {
          create: {
            facultyId,
            department,
            designation
          }
        }
      },
      include: {
        faculty: true
      }
    });

    res.status(201).json(newFaculty);
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
