import { useRequests } from './useRequests';

export const useRequestWorkflow = () => {
  const { updateRequestStatus, requests } = useRequests();

  const getNextStage = (currentStage, workflow) => {
    if (!workflow || workflow.length === 0) return 'Completed';
    const currentIndex = workflow.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex === workflow.length - 1) {
      return 'Completed';
    }
    return workflow[currentIndex + 1];
  };

  const getPreviousStage = (currentStage, workflow) => {
    if (!workflow || workflow.length === 0) return 'Student';
    const currentIndex = workflow.indexOf(currentStage);
    if (currentIndex <= 0) return 'Student';
    return workflow[currentIndex - 1];
  };

  const approveRequest = (requestId, currentStage, workflow, userDetails, remarks = '') => {
    const nextStage = getNextStage(currentStage, workflow);
    const newStatus = nextStage === 'Completed' ? 'Approved' : 'Under Review';
    updateRequestStatus(requestId, newStatus, currentStage, nextStage, userDetails, remarks || `Approved at ${currentStage} level`);
  };

  const rejectRequest = (requestId, currentStage, userDetails, remarks = '') => {
    // Rejection always terminates the workflow
    updateRequestStatus(requestId, 'Rejected', currentStage, 'Completed', userDetails, remarks || `Rejected at ${currentStage} level`);
  };

  const forwardRequest = (requestId, currentStage, targetStage, userDetails, remarks = '') => {
    // Manually jumping to a specific stage
    updateRequestStatus(requestId, 'Under Review', currentStage, targetStage, userDetails, remarks || `Forwarded to ${targetStage}`);
  };

  const requestDocuments = (requestId, currentStage, userDetails, remarks = '') => {
    // Sends back to Student asking for docs, but stays at current stage waiting
    updateRequestStatus(requestId, 'Waiting for Documents', currentStage, currentStage, userDetails, remarks || `Requested additional documents`);
  };

  return {
    approveRequest,
    rejectRequest,
    forwardRequest,
    requestDocuments,
    getNextStage,
    getPreviousStage
  };
};
