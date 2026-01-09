
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
  task: string;
  pic: string;
  category: 'equip' | 'logistik' | 'peserta';
  isDone: boolean;
  notes?: string;
  createdAt: any;
}

export type ViewMode = 'home' | 'rental' | 'trip' | 'merch';
