import { useRequests } from './useRequests';

export const useRequestAnalytics = () => {
  const { requests } = useRequests();

  const getAnalytics = (department = null) => {
    // If a department is passed, filter requests where the student is in that department
    // Note: In our current mock data, students don't have a rigid department mapping on the request object itself, 
    // so we assume department filtering logic here (in real app, we'd join with svcet_students)
    
    // For now, we will calculate globally.
    const totalRequests = requests.length;
    const pending = requests.filter(r => r.status === 'Submitted' || r.status === 'Under Review' || r.status === 'Waiting for Documents').length;
    const approved = requests.filter(r => r.status === 'Approved').length;
    const rejected = requests.filter(r => r.status === 'Rejected').length;

    // Monthly data for charts
    const monthlyData = [
      { name: 'Jan', requests: 0, resolved: 0 },
      { name: 'Feb', requests: 0, resolved: 0 },
      { name: 'Mar', requests: 0, resolved: 0 },
      { name: 'Apr', requests: 0, resolved: 0 },
      { name: 'May', requests: 0, resolved: 0 },
      { name: 'Jun', requests: 0, resolved: 0 }
    ];

    requests.forEach(req => {
      const monthIndex = new Date(req.createdAt).getMonth();
      if (monthIndex < 6) { // Mocking for first half of year
        monthlyData[monthIndex].requests += 1;
        if (req.status === 'Approved' || req.status === 'Rejected') {
          monthlyData[monthIndex].resolved += 1;
        }
      }
    });

    // Category distribution
    const categoryDistribution = {};
    requests.forEach(req => {
      if (req.categoryId) {
        categoryDistribution[req.categoryId] = (categoryDistribution[req.categoryId] || 0) + 1;
      }
    });

    const categoryData = Object.keys(categoryDistribution).map(catId => ({
      name: catId.replace('CAT-', ''),
      value: categoryDistribution[catId]
    }));

    return {
      totalRequests,
      pending,
      approved,
      rejected,
      approvalRate: totalRequests > 0 ? Math.round((approved / totalRequests) * 100) : 0,
      monthlyData,
      categoryData
    };
  };

  return {
    getAnalytics
  };
};
