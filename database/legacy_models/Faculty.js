const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  facultyId: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  designation: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Faculty', facultySchema);
