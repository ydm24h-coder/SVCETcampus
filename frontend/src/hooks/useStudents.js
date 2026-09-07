import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getToken = () => {
  try {
    const adminSession = localStorage.getItem('svcet_session_admin');
    if (adminSession) {
      const parsed = JSON.parse(adminSession);
      return parsed.token;
    }
  } catch (e) {
    console.error(e);
  }
  return '';
};

export const useStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await fetch(`${API_URL}/api/admin/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      
      const formatted = data.map(s => ({
        id: s.id,
        name: s.user?.name,
        email: s.user?.email,
        registerNumber: s.register_number,
        department: s.department,
        year: s.year,
        pendingFees: 0,
        parentPhoneNumber: ''
      }));
      setStudents(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const addStudent = async (studentData) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(studentData)
      });
      if (response.ok) {
        fetchStudents();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to add student');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteStudent = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/students/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (response.ok) {
        setStudents(prev => prev.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateStudent = async (id, updatedData) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/students/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(updatedData)
      });
      if (response.ok) {
        fetchStudents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk operations (Not fully supported by API yet, fallback to iterative for now)
  const bulkUpdateStudents = async (ids, updatedData) => {
    for (const id of ids) {
      await updateStudent(id, updatedData);
    }
    fetchStudents();
  };

  const applyBulkUpdates = async (updatesArray) => {
    for (const update of updatesArray) {
      await updateStudent(update.id, update.data);
    }
    fetchStudents();
  };

  const bulkDeleteStudents = async (ids) => {
    for (const id of ids) {
      await deleteStudent(id);
    }
    fetchStudents();
  };

  const bulkAddStudents = async (studentsArray) => {
    for (const student of studentsArray) {
      await addStudent(student);
    }
    fetchStudents();
  };

  // Auth helper for frontend fallback (no longer used for real auth)
  const getStudentByCredentials = (registerNumber, password) => {
    return students.find(s => s.registerNumber === registerNumber && s.password === password);
  };

  return { students, loading, addStudent, deleteStudent, updateStudent, bulkUpdateStudents, applyBulkUpdates, bulkDeleteStudents, bulkAddStudents, getStudentByCredentials };
};
