
export type UserRole = 'admin' | 'manager' | 'seller' | 'support';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export type LeadStatus = 'new' | 'contacted' | 'proposal' | 'won' | 'lost' | 'expired';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  status: LeadStatus;
  estimated_value: number;
  seller_id: string;
  company_id?: string;
  category_id?: string;
  expiration_date?: string;
  categories?: Category; // Para joins do Supabase
  ai_score?: number;
  ai_insights?: {
    reason: string;
    nextSteps: string[];
    document?: string;
  };
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  user_id: string;
  lead_id?: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  description: string;
  lead_id: string;
  user_id: string;
  created_at: string;
}
