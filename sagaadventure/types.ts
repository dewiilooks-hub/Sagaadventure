
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
  task: string; // Nama Barang / Nama Peserta
  pic: string;
  qty: number;
  unit?: string;
  price: number; // Harga / Uang Masuk
  status: string; // Buy/Rent/Stok/Paid/Unpaid
  category: 'equip' | 'logistik' | 'peserta';
  isDone: boolean; // Kolom Ceklis
  createdAt: any;
}

export interface Participant {
  id: string;
  name: string;
  payment: number;
  status: 'unpaid' | 'partial' | 'paid';
  createdAt: any;
}

export interface TripEvent {
  id: string;
  name: string;
  date: string;
  quota: number;
  status: 'planning' | 'active' | 'completed';
  createdAt: any;
}

export interface TripExpense {
  id: string;
  tripId: string;
  description: string;
  amount: number;
  category: 'logistik' | 'transport' | 'crew' | 'alat' | 'lainnya';
  createdAt: any;
}

export type ViewMode = 'home' | 'rental' | 'trip' | 'merch';
