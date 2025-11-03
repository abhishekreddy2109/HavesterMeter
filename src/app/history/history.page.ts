import { Component, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { StorageService, BillRecord } from '../services/storage.service';
import { Router } from '@angular/router';
import { Share } from '@capacitor/share';
import { trash, share } from 'ionicons/icons';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    DatePipe,
    CurrencyPipe,
  ],
})
export class HistoryPage implements OnInit {
  bills: BillRecord[] = [];

  constructor(private storage: StorageService, private router: Router) {}

  async ngOnInit() {
    this.bills = await this.storage.getAllBills();
  }

  async shareBill(bill: BillRecord) {
    await Share.share({
      title: 'Harvester Bill',
      text: `🌾 ${bill.farmerName}\nAmount: ₹${bill.totalAmount.toFixed(2)}\nHours: ${bill.totalHours.toFixed(
        2
      )}`,
      dialogTitle: 'Share Previous Bill',
    });
  }

  async clearAll() {
    if (confirm('Delete all saved bills?')) {
      await this.storage.clearBills();
      this.bills = [];
    }
  }

  goHome() {
    this.router.navigateByUrl('/');
  }
}
