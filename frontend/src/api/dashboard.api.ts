import { api } from './axiosClient';
import {
  ClientStats,
  FreelancerStats,
  AdminStats,
  Escrow,
  Activity,
  Message,
  Gig,
  Dispute,
  User,
} from '../types/dashboard.types';

export const fetchClientStats = async (): Promise<ClientStats> => {
  const response = await api.get<ClientStats>('/client_stats');
  return response.data;
};

export const fetchFreelancerStats = async (): Promise<FreelancerStats> => {
  const response = await api.get<FreelancerStats>('/freelancer_stats');
  return response.data;
};

export const fetchAdminStats = async (): Promise<AdminStats> => {
  const response = await api.get<AdminStats>('/admin_stats');
  return response.data;
};

export const fetchEscrows = async (): Promise<Escrow[]> => {
  const response = await api.get<Escrow[]>('/escrows');
  return response.data;
};

export const fetchActivities = async (): Promise<Activity[]> => {
  const response = await api.get<Activity[]>('/activities');
  return response.data;
};

export const fetchMessages = async (): Promise<Message[]> => {
  const response = await api.get<Message[]>('/messages');
  return response.data;
};

export const fetchGigs = async (): Promise<Gig[]> => {
  const response = await api.get<Gig[]>('/gigs');
  return response.data;
};

export const fetchDisputes = async (): Promise<Dispute[]> => {
  const response = await api.get<Dispute[]>('/disputes');
  return response.data;
};

export const fetchUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/users');
  return response.data;
};

export const assignDisputeToDAO = async (id: string): Promise<Dispute> => {
  const response = await api.patch<Dispute>(`/disputes/${id}`, {
    assignedToDAO: true,
  });
  return response.data;
};
