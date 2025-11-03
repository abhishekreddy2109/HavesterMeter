import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export interface BillRecord {
  id: string;
  farmerName: string;
  fieldName: string;
  totalHours: number;
  ratePerHour: number;
  totalAmount: number;
  date: string;

  // ✅ New fields
  mobile?: string;
  address?: string;
}


@Injectable({ providedIn: 'root' })
export class StorageService {
  async set(key: string, value: any) {
    await Preferences.set({ key, value: JSON.stringify(value) });
  }

  async get(key: string) {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : null;
  }

  async remove(key: string) {
    await Preferences.remove({ key });
  }


  async getAllBills(): Promise<BillRecord[]> {
  return (await this.get('bills')) || [];
}

async addBill(bill: BillRecord) {
  const bills = await this.getAllBills();
  bills.unshift(bill); // latest first
  await this.set('bills', bills);
}

async clearBills() {
  await this.remove('bills');
}

}
