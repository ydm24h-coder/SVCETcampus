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

export const useFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFaculty = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await fetch(`${API_URL}/api/admin/faculty`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      
      const formatted = data.map(f => ({
        id: f.id,
        name: f.user?.name,
        email: f.user?.email,
        facultyId: f.faculty_id,
        department: f.department,
        designation: f.designation,
      }));
      setFaculty(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const addFaculty = async (facultyData) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/faculty`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(facultyData)
      });
      if (response.ok) {
        fetchFaculty();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to add faculty');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteFaculty = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/faculty/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (response.ok) {
        setFaculty(prev => prev.filter(f => f.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateFaculty = async (id, updatedData) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/faculty/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(updatedData)
      });
      if (response.ok) {
        fetchFaculty();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const applyBulkUpdates = async (updatesArray) => {
    for (const update of updatesArray) {
      await updateFaculty(update.id, update.data);
    }
    fetchFaculty();
  };

  const bulkDeleteFaculty = async (ids) => {
    for (const id of ids) {
      await deleteFaculty(id);
    }
    fetchFaculty();
  };

  const bulkAddFaculty = async (facultyArray) => {
    for (const fac of facultyArray) {
      await addFaculty(fac);
    }
    fetchFaculty();
  };

  return { faculty, loading, addFaculty, deleteFaculty, updateFaculty, applyBulkUpdates, bulkDeleteFaculty, bulkAddFaculty };
};
