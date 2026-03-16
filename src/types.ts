export interface Employee {
  id: string;
  name: string;
  role?: string;
  dailyRate?: number;
  pixKey?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  project?: string;
  ownerId: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  type: 'D' | 'M' | 'F'; // Diária, Meia, Falta
  location?: string;
  monthYear: string; // YYYY-MM
  ownerId: string;
}

export interface UserConfig {
  ownerId: string;
  pin?: string;
}
