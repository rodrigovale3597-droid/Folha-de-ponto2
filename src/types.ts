export interface Employee {
  id: string;
  name: string;
  role?: string;
  dailyRate?: number;
  pixKey?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  paymentNote?: string;
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
  timestamp?: string; // ISO string for exact time of marking
  customRate?: number; // Optional custom daily rate for this specific record
}

export interface UserConfig {
  ownerId: string;
  pin?: string;
  notificationsEnabled?: boolean;
  notificationTime?: string; // HH:mm
  backupInterval?: 'off' | 'daily' | 'weekly';
  lastBackupDate?: string; // ISO string
}
