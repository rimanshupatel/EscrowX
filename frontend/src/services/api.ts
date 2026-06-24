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
};
