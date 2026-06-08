export type AssetStatus = 'None' | 'Available' | 'Reserved' | 'OutForRepair' | 'Retired';
export type AssetCategory = 'None' | 'Laptop' | 'Monitor' | 'Peripheral' | 'NetworkDevice';
export type UserRole = 'Admin' | 'Manager' | 'Employee';
export type MaintenanceStatus = 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';
export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type ReservationStatus = 'Pending' | 'Active' | 'Returned' | 'Cancelled';

export interface Department {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  profile_image?: string;
  profile_image_url?: string;
  role: UserRole;
  department_id?: string;
  department?: Department;
  is_active: boolean;
  created_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  serial_number: string;
  status: AssetStatus;
  category: AssetCategory;
  description: string;
  price: number;
  image: string;
  image_url: string;
  image_url_https: string;
  purchase_date?: string;
  created_at: string;
}

export interface Reservation {
  id: string;
  equipment_id: string;
  equipment?: Equipment;
  user_id: string;
  user?: User;
  status: ReservationStatus;
  start_date: string;
  end_date?: string;
  return_date?: string;
  notes?: string;
  created_at: string;
}

export interface MaintenanceRequest {
  id: string;
  equipment_id: string;
  equipment?: Equipment;
  requested_by_id: string;
  requested_by?: User;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  description: string;
  scheduled_date?: string;
  completed_date?: string;
  technician_notes?: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  expires_at: string;
  user_id: string;
  email: string;
  role: UserRole;
}

export type AuditAction = 'Created' | 'Updated' | 'Deleted';

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: AuditAction;
  old_values?: string;
  new_values?: string;
  performed_by_id?: string;
  performed_by?: User;
  performed_at: string;
}
