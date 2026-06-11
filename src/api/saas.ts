import { apiClient } from './apiClient';

export interface SaaSProvider {
  id: string;
  name: string;
  website_url?: string;
  category?: string;
  contact_email?: string;
  created_at: string;
}

export interface SaaSSubscription {
  id: string;
  provider_id: string;
  provider?: SaaSProvider;
  plan_name: string;
  billing_cycle: string;
  cost_per_seat: number;
  total_seats: number;
  renewal_date?: string;
  status: string;
  created_at: string;
}

export interface SaaSAssignment {
  id: string;
  subscription_id: string;
  subscription?: SaaSSubscription;
  user_id: string;
  user?: any;
  assigned_date: string;
  last_login_date?: string;
  is_active: boolean;
}

export const saasApi = {
  getProviders: () => apiClient.get<SaaSProvider[]>('/SaaS/providers').then(res => res.data),
  createProvider: (data: Partial<SaaSProvider>) => apiClient.post<SaaSProvider>('/SaaS/providers', data).then(res => res.data),
  updateProvider: (id: string, data: Partial<SaaSProvider>) => apiClient.put<SaaSProvider>(`/SaaS/providers/${id}`, data).then(res => res.data),
  deleteProvider: (id: string) => apiClient.delete(`/SaaS/providers/${id}`),

  getSubscriptions: () => apiClient.get<SaaSSubscription[]>('/SaaS/subscriptions').then(res => res.data),
  createSubscription: (data: Partial<SaaSSubscription>) => apiClient.post<SaaSSubscription>('/SaaS/subscriptions', data).then(res => res.data),
  updateSubscription: (id: string, data: Partial<SaaSSubscription>) => apiClient.put<SaaSSubscription>(`/SaaS/subscriptions/${id}`, data).then(res => res.data),
  deleteSubscription: (id: string) => apiClient.delete(`/SaaS/subscriptions/${id}`),

  getAllAssignments: () => apiClient.get<SaaSAssignment[]>('/SaaS/assignments').then(res => res.data),
  getAssignments: (subscriptionId: string) => apiClient.get<SaaSAssignment[]>(`/SaaS/subscriptions/${subscriptionId}/assignments`).then(res => res.data),
  assignUser: (data: Partial<SaaSAssignment>) => apiClient.post<SaaSAssignment>('/SaaS/assignments', data).then(res => res.data),
  unassignUser: (id: string) => apiClient.delete(`/SaaS/assignments/${id}`),
};
