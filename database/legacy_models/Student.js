const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  registerNumber: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  year: { type: Number, required: true },
  semester: { type: Number, required: true },
  attendance: { type: Number, default: 0 },
  cgpa: { type: Number, default: 0.0 }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
