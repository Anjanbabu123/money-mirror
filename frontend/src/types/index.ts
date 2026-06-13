export interface User {
  id: number;
  email: string;
  name: string;
  age?: number;
  occupation?: string;
  monthly_income?: number;
  city?: string;
  financial_goal?: string;
}

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  source?: string;
  account?: string;
  category?: string;
  merchant?: string;
}

export interface MonthlySummary {
  year: number;
  month: number | null;
  income: number;
  expenses: number;
  emi: number;
  investments: number;
  savings: number;
  savings_ratio: number;
  by_category: Record<string, number>;
  transaction_count: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  name: string;
}
