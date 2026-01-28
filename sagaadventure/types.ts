
export interface RentalItem {
  id: number;
  name: string;
  price: number;
  stok: number;
}

export interface CustomRentalItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

export interface OpenTripTask {
  id: string;
  tripId?: string;
  task: string;
  pic: string;
  qty: number;
  unit?: string;
  price: number;
  status: string;
  category: 'equip' | 'logistik' | 'peserta' | 'operasional' | 'sponsor';
  isDone: boolean;
  ticketId?: string;
  createdAt: any;
}

export interface StaffAttendance {
  id: string;
  tripId: string;
  staffName: string;
  role: string;
  status: 'hadir' | 'izin' | 'sakit' | 'tugas' | 'Meeting 1' | 'Meeting 2' | 'Hari H Event';
  timestamp: string;
}

export interface MerchInvoice {
  id?: string;
  invoiceId: string;
  customer: string;
  items: any[];
  total: number;
  createdAt: any;
}

export interface TripEvent {
  id: string;
  name: string;
  date: string;
  pic: string;
  location: string;
  status: 'planning' | 'active' | 'completed';
  createdAt: any;
}

export interface KasSpending {
  id: string;
  item: string;
  amount: number;
  date: string;
  category: 'peralatan' | 'operasional';
  note?: string;
  createdAt: string;
}

export interface RentalSpending {
  id: string;
  item: string;
  amount: number;
  date: string;
  category: 'maintenance' | 'purchase';
  createdAt: any;
}

export interface OwnerPayout {
  id: string;
  amount: number;
  month: number;
  year: number;
  distributedTo: string;
  createdAt: any;
}

export type ViewMode = 'home' | 'rental' | 'trip' | 'merch' | 'owner';
