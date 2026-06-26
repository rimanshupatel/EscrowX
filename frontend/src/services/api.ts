import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('escrowx_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// AUTH SERVICES
export const authService = {
  getChallenge: async (walletAddress: string) => {
    const res = await apiClient.post('/auth/challenge', { walletAddress });
    return res.data;
  },
  verifySignature: async (walletAddress: string, challenge: string, signature: string) => {
    const res = await apiClient.post('/auth/verify', { walletAddress, challenge, signature });
    return res.data;
  },
  register: async (registerData: any) => {
    const res = await apiClient.post('/auth/register', registerData);
    return res.data;
  },
  login: async (loginData: any) => {
    const res = await apiClient.post('/auth/login', loginData);
    return res.data;
  },
  signup: async (signupData: any) => {
    const res = await apiClient.post('/auth/signup', signupData);
    return res.data;
  },
  signin: async (signinData: any) => {
    const res = await apiClient.post('/auth/signin', signinData);
    return res.data;
  },
  logout: async () => {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  },
  me: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  checkWallet: async (walletAddress: string) => {
    const res = await apiClient.get('/auth/check-wallet', { params: { walletAddress } });
    return res.data;
  },
};

// JOBS SERVICES
export const jobService = {
  getJobs: async (params?: { search?: string; tokenType?: string; minBudget?: number; maxBudget?: number; page?: number; limit?: number }) => {
    const res = await apiClient.get('/jobs', { params });
    return res.data;
  },
  getMyJobs: async () => {
    const res = await apiClient.get('/jobs/my');
    return res.data;
  },
  getJob: async (id: string) => {
    const res = await apiClient.get(`/jobs/${id}`);
    return res.data;
  },
  createJob: async (jobData: any) => {
    const res = await apiClient.post('/jobs', jobData);
    return res.data;
  },
  updateJob: async (id: string, jobData: any) => {
    const res = await apiClient.put(`/jobs/${id}`, jobData);
    return res.data;
  },
  deleteJob: async (id: string) => {
    const res = await apiClient.delete(`/jobs/${id}`);
    return res.data;
  },
  publishJob: async (id: string) => {
    const res = await apiClient.put(`/jobs/${id}/publish`, {});
    return res.data;
  },
  applyToJob: async (jobId: string, bidAmount: number, coverLetter: string) => {
    const res = await apiClient.post(`/jobs/${jobId}/apply`, { bidAmount, coverLetter });
    return res.data;
  },
  getApplications: async (jobId: string) => {
    const res = await apiClient.get(`/jobs/${jobId}/applications`);
    return res.data;
  },
  updateApplicationStatus: async (appId: string, status: 'accepted' | 'rejected') => {
    const res = await apiClient.put(`/jobs/applications/${appId}`, { status });
    return res.data;
  },
  getMyApplications: async () => {
    const res = await apiClient.get('/jobs/applications/my');
    return res.data;
  },
  withdrawApplication: async (appId: string) => {
    const res = await apiClient.delete(`/jobs/applications/${appId}/withdraw`);
    return res.data;
  },
};

// ESCROW SERVICES
export const escrowService = {
  createProjectEscrow: async (data: any) => {
    const res = await apiClient.post('/escrows/project-escrow', data);
    return res.data;
  },
  getProjectEscrowByListing: async (listingId: string) => {
    const res = await apiClient.get(`/escrows/project-escrow/listing/${listingId}`);
    return res.data;
  },
  getProjectTransactions: async () => {
    const res = await apiClient.get('/escrows/project-escrow/transactions');
    return res.data;
  },
  getMyEscrows: async () => {
    const res = await apiClient.get('/escrows/my');
    return res.data;
  },
  getEscrow: async (id: string) => {
    const res = await apiClient.get(`/escrows/${id}`);
    return res.data;
  },
  createEscrow: async (escrowData: any) => {
    const res = await apiClient.post('/escrows', escrowData);
    return res.data;
  },
  fundEscrow: async (escrowId: string, txHash: string) => {
    const res = await apiClient.put(`/escrows/${escrowId}/fund`, { txHash });
    return res.data;
  },
  submitDelivery: async (escrowId: string, deliveryData: { ipfsHash: string; githubLink?: string; notes: string }) => {
    const res = await apiClient.post(`/escrows/${escrowId}/deliver`, deliveryData);
    return res.data;
  },
  approveEscrow: async (escrowId: string, txHash: string) => {
    const res = await apiClient.put(`/escrows/${escrowId}/approve`, { txHash });
    return res.data;
  },
  refundEscrow: async (escrowId: string, txHash: string) => {
    const res = await apiClient.put(`/escrows/${escrowId}/refund`, { txHash });
    return res.data;
  },
};

// DISPUTE SERVICES
export const disputeService = {
  getDisputes: async () => {
    const res = await apiClient.get('/disputes');
    return res.data;
  },
  raiseDispute: async (disputeData: { escrowId: string; reason: string; evidenceContent?: string }) => {
    const res = await apiClient.post('/disputes', disputeData);
    return res.data;
  },
  submitEvidence: async (disputeId: string, evidenceData: { type: 'text' | 'file' | 'link'; content: string; url?: string }) => {
    const res = await apiClient.post(`/disputes/${disputeId}/evidence`, evidenceData);
    return res.data;
  },
  resolveDispute: async (disputeId: string, resolutionData: { clientPayout: number; freelancerPayout: number; arbitratorNotes: string; resolution: string; txHash: string }) => {
    const res = await apiClient.put(`/disputes/${disputeId}/resolve`, resolutionData);
    return res.data;
  },
};

// REVIEW SERVICES
export const reviewService = {
  submitReview: async (reviewData: { escrowId: string; rating: number; comment: string }) => {
    const res = await apiClient.post('/reviews', reviewData);
    return res.data;
  },
  getUserReviews: async (userId: string) => {
    const res = await apiClient.get(`/reviews/user/${userId}`);
    return res.data;
  },
  getEscrowReviews: async (escrowId: string) => {
    const res = await apiClient.get(`/reviews/escrow/${escrowId}`);
    return res.data;
  },
};

// CHAT SERVICES
export const chatService = {
  getContacts: async () => {
    const res = await apiClient.get('/chat/contacts');
    return res.data;
  },
  getMessages: async (counterpartyId: string) => {
    const res = await apiClient.get(`/chat/messages/${counterpartyId}`);
    return res.data;
  },
  sendAttachment: async (formData: FormData) => {
    const res = await apiClient.post('/chat/attachment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  getConversations: async () => {
    const res = await apiClient.get('/chat/conversations');
    return res.data;
  },
  getOrCreateConversation: async (participantId: string, listingId?: string) => {
    const res = await apiClient.post('/chat/conversations', { participantId, listingId });
    return res.data;
  },
  getConversationMessages: async (conversationId: string) => {
    const res = await apiClient.get(`/chat/conversations/${conversationId}/messages`);
    return res.data;
  },
};

// LISTING SERVICES
export const listingService = {
  getListings: async (params?: { search?: string; type?: string; role?: string; minPrice?: number; maxPrice?: number; minBudget?: number; maxBudget?: number; skills?: string; sort?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get('/listings', { params });
    return res.data;
  },
  getListing: async (id: string) => {
    const res = await apiClient.get(`/listings/${id}`);
    return res.data;
  },
  createListing: async (listingData: any) => {
    const res = await apiClient.post('/listings', listingData);
    return res.data;
  },
  updateListing: async (id: string, listingData: any) => {
    const res = await apiClient.put(`/listings/${id}`, listingData);
    return res.data;
  },
  deleteListing: async (id: string) => {
    const res = await apiClient.delete(`/listings/${id}`);
    return res.data;
  },
  getMyListings: async () => {
    const res = await apiClient.get('/listings/my');
    return res.data;
  },
};

// APPLICATION SERVICES
export const applicationService = {
  applyToListing: async (listingId: string, applicationData: { coverLetter: string; portfolioUrl?: string; expectedDeliveryTime: number; bidAmount: number; previousExperience?: string }) => {
    const res = await apiClient.post(`/applications/listing/${listingId}`, applicationData);
    return res.data;
  },
  getMyApplications: async () => {
    const res = await apiClient.get('/applications/my');
    return res.data;
  },
  getListingApplications: async (listingId: string) => {
    const res = await apiClient.get(`/applications/listing/${listingId}`);
    return res.data;
  },
  reviewApplication: async (appId: string, status: 'ACCEPTED' | 'REJECTED') => {
    const res = await apiClient.put(`/applications/${appId}/review`, { status });
    return res.data;
  },
  withdrawApplication: async (appId: string) => {
    const res = await apiClient.delete(`/applications/${appId}/withdraw`);
    return res.data;
  }
};

// HIRE REQUEST SERVICES
export const hireRequestService = {
  createHireRequest: async (hireRequestData: { listingId: string; projectTitle: string; projectDescription: string; requirements: string; deadline: string; budgetAmount: number }) => {
    const res = await apiClient.post('/hire-requests', hireRequestData);
    return res.data;
  },
  getMyHireRequests: async () => {
    const res = await apiClient.get('/hire-requests/my');
    return res.data;
  },
  respondToHireRequest: async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    const res = await apiClient.put(`/hire-requests/${requestId}/respond`, { status });
    return res.data;
  }
};

// ESCROW UPDATE SERVICES
export const escrowUpdateService = {
  postUpdate: async (escrowId: string, updateData: { title: string; description: string; attachments?: string[] }) => {
    const res = await apiClient.post(`/escrows/${escrowId}/updates`, updateData);
    return res.data;
  },
  getUpdates: async (escrowId: string) => {
    const res = await apiClient.get(`/escrows/${escrowId}/updates`);
    return res.data;
  },
  reviewUpdate: async (updateId: string, action: 'approve' | 'revise', notes?: string) => {
    const res = await apiClient.put(`/escrows/updates/${updateId}/review`, { action, notes });
    return res.data;
  }
};

// PROPOSAL SERVICES
export const proposalService = {
  applyToProject: async (projectId: string, proposalData: { coverLetter: string; portfolio?: string; expectedDelivery: number; bidAmount: number; experienceNotes?: string }) => {
    const res = await apiClient.post(`/proposals/apply/${projectId}`, proposalData);
    return res.data;
  },
  getReceivedProposals: async () => {
    const res = await apiClient.get('/proposals/received');
    return res.data;
  },
  getSentProposals: async () => {
    const res = await apiClient.get('/proposals/sent');
    return res.data;
  },
  acceptProposal: async (proposalId: string, payload?: { txHash: string }) => {
    const res = await apiClient.put(`/proposals/${proposalId}/accept`, payload);
    return res.data;
  },
  rejectProposal: async (proposalId: string) => {
    const res = await apiClient.put(`/proposals/${proposalId}/reject`);
    return res.data;
  },
  withdrawProposal: async (proposalId: string) => {
    const res = await apiClient.delete(`/proposals/${proposalId}/withdraw`);
    return res.data;
  }
};

// PROFILE SERVICES
export const profileService = {
  getProfile: async () => {
    const res = await apiClient.get('/profiles/me');
    return res.data;
  },
  updateProfile: async (profileData: { name?: string; username?: string; bio?: string; location?: string; profileImage?: string; skills?: string | string[]; website?: string; twitter?: string; github?: string; portfolio?: string }) => {
    const res = await apiClient.put('/profiles/me', profileData);
    return res.data;
  },
  getPublicProfile: async (username: string) => {
    const res = await apiClient.get(`/profiles/user/${username}`);
    return res.data;
  }
};

// DELIVERY SERVICES
export const deliveryService = {
  getDeliveries: async () => {
    const res = await apiClient.get('/deliveries');
    return res.data;
  },
  initiateDelivery: async (projectId: string, freelancerId: string, clientId: string) => {
    const res = await apiClient.post('/deliveries/initiate', { projectId, freelancerId, clientId });
    return res.data;
  },
  getDelivery: async (escrowId: string) => {
    const res = await apiClient.get(`/deliveries/${escrowId}`);
    return res.data;
  },
  submitDelivery: async (escrowId: string, deliveryData: { notes: string; demoLink?: string; files: string[]; previewFiles: string[]; txHash?: string }) => {
    const res = await apiClient.post(`/deliveries/${escrowId}/submit`, deliveryData);
    return res.data;
  },
  approveDelivery: async (escrowId: string, txHash?: string) => {
    const res = await apiClient.put(`/deliveries/${escrowId}/approve`, { txHash });
    return res.data;
  },
  rejectDelivery: async (escrowId: string, reason: string) => {
    const res = await apiClient.put(`/deliveries/${escrowId}/reject`, { reason });
    return res.data;
  },
  refundDelivery: async (escrowId: string, txHash: string) => {
    const res = await apiClient.put(`/deliveries/${escrowId}/refund`, { txHash });
    return res.data;
  },
  addComment: async (escrowId: string, message: string) => {
    const res = await apiClient.post(`/deliveries/${escrowId}/comments`, { message });
    return res.data;
  }
};
