
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
  tripId?: string; // Menghubungkan tugas/peserta ke trip tertentu
  task: string; // Nama Barang / Nama Peserta / Nama Biaya
  pic: string;
  qty: number;
  unit?: string; // Digunakan untuk 'gram/kg' di logistik
  price: number; // Harga / Uang Masuk
  status: string; // Buy/Rent/Stok/Paid/Unpaid/Ready
  category: 'equip' | 'logistik' | 'peserta' | 'operasional';
  isDone: boolean; // Kolom Ceklis
  ticketId?: string; // Menyimpan ID Tiket untuk kategori peserta
  createdAt: any;
}

export interface StaffAttendance {
  id: string;
  tripId: string;
  staffName: string;
  role: string;
  status: 'hadir' | 'izin' | 'sakit' | 'tugas';
  timestamp: string;
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
  pic: string; // Penanggung Jawab
  location: string; // Lokasi Event
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
