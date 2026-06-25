import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchClientStats,
  fetchFreelancerStats,
  fetchAdminStats,
  fetchEscrows,
  fetchActivities,
  fetchMessages,
  fetchGigs,
  fetchDisputes,
  fetchUsers,
  assignDisputeToDAO,
} from '../api/dashboard.api';

export const useClientStats = () =>
  useQuery({
    queryKey: ['client_stats'],
    queryFn: fetchClientStats,
    refetchInterval: 15000,
  });

export const useFreelancerStats = () =>
  useQuery({
    queryKey: ['freelancer_stats'],
    queryFn: fetchFreelancerStats,
    refetchInterval: 15000,
  });

export const useAdminStats = () =>
  useQuery({
    queryKey: ['admin_stats'],
    queryFn: fetchAdminStats,
    refetchInterval: 15000,
  });

export const useEscrows = () =>
  useQuery({
    queryKey: ['escrows'],
    queryFn: fetchEscrows,
    refetchInterval: 15000,
  });

export const useActivities = () =>
  useQuery({
    queryKey: ['activities'],
    queryFn: fetchActivities,
    refetchInterval: 15000,
  });

export const useMessages = () =>
  useQuery({
    queryKey: ['messages'],
    queryFn: fetchMessages,
    refetchInterval: 15000,
  });

export const useGigs = () =>
  useQuery({
    queryKey: ['gigs'],
    queryFn: fetchGigs,
    refetchInterval: 15000,
  });

export const useDisputes = () =>
  useQuery({
    queryKey: ['disputes'],
    queryFn: fetchDisputes,
    refetchInterval: 15000,
  });

export const useUsers = () =>
  useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    refetchInterval: 15000,
  });

export const useAssignDisputeToDAO = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignDisputeToDAO,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
  });
};
