export const initializeMockData = () => {
  // 1500 Students
  const departments = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical'];
  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const students = Array.from({ length: 1500 }).map((_, i) => ({
    id: Date.now() + i,
    name: `Student ${i + 1}`,
    registerNumber: `STU${1000 + i}`,
    password: 'password123',
    department: departments[i % departments.length],
    year: years[i % years.length],
    email: `student${i+1}@svcet.edu`,
    phone: `98765${(40000 + i).toString().padStart(5, '0')}`,
    status: 'Active'
  }));
  localStorage.setItem('svcet_students', JSON.stringify(students));

  // 300 Faculty
  const faculty = Array.from({ length: 300 }).map((_, i) => ({
    id: Date.now() + 2000 + i,
    name: `Dr. Faculty ${i + 1}`,
    facultyId: `FAC${100 + i}`,
    password: 'password123',
    department: departments[i % departments.length],
    email: `faculty${i+1}@svcet.edu`,
    phone: `98765${(10000 + i).toString().padStart(5, '0')}`,
    status: 'Active'
  }));
  localStorage.setItem('svcet_faculty', JSON.stringify(faculty));

  // 4 Admins
  const admins = Array.from({ length: 4 }).map((_, i) => ({
    id: Date.now() + 3000 + i,
    name: `Admin ${i + 1}`,
    email: `admin${i + 1}@svcet.edu`,
    password: 'admin'
  }));
  // Add default super admin
  admins.push({
    id: 1,
    name: 'Super Admin',
    email: 'chandrumani1825@gmail.com',
    password: 'c#An@24M'
  });
  localStorage.setItem('svcet_admins', JSON.stringify(admins));

  // Leaderboard (start empty)
  localStorage.setItem('svcet_leaderboard', JSON.stringify([]));
};
