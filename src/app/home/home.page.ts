import { Component, OnDestroy } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonToast,
  IonAlert,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { TimerService } from '../services/timer.service';
import { Router } from '@angular/router';
import { VoiceService } from '../services/voice.service';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonToast,
    IonAlert,
  ],
})
export class HomePage implements OnDestroy {
  displayTimer = '00:00:00';
  totalDisplay = '00:00:00';
  intervalRef?: any;

constructor(
  public timer: TimerService,
  private router: Router,
  private voice: VoiceService
) {}


 async startWork() {
  this.timer.start();
  this.startDisplayUpdate();
  this.showToast('⏱️ Work started');
  this.voice.speak('పని మొదలైంది'); // Telugu: “Work started”
}

async pauseWork() {
  this.timer.pause();
  this.updateTotalDisplay();
  clearInterval(this.intervalRef);
  this.showToast('🟡 Paused');
  this.voice.speak('బండి ఆగింది'); // “Machine stopped”
}

async resumeWork() {
  this.timer.resume();
  this.startDisplayUpdate();
  this.showToast('▶️ Resumed');
  this.voice.speak('మళ్ళీ మొదలైంది'); // “Started again”
}

async finishWork() {
  this.timer.stop(); // mark final end time
  clearInterval(this.intervalRef);

  const totalMin = this.timer.totalMinutes();
  const totalHrs = totalMin / 60;
  const startTime = this.timer.startTime
    ? this.timer.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';
  const endTime = this.timer.endTime
    ? this.timer.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';
  const stopPeriods = this.timer.getStopPeriods();

  const confirmed = confirm(`Finish Work?\nTotal Active: ${this.totalDisplay}`);
  if (confirmed) {
    this.router.navigate(['/bill'], {
      state: {
        totalMinutes: totalMin,
        totalHours: totalHrs,
        startTime,
        endTime,
        stopPeriods,
      },
    });
    this.timer.reset();
  }
}

  /** Update Current + Total Display */
  startDisplayUpdate() {
    this.intervalRef = setInterval(() => {
      const currentSession = this.timer.sessions[this.timer.sessions.length - 1];
      if (currentSession && this.timer.running) {
        const diff = new Date().getTime() - new Date(currentSession.start).getTime();
        this.displayTimer = this.format(diff);
      }
      this.updateTotalDisplay();
    }, 1000);
  }

  updateTotalDisplay() {
    const totalMs = this.timer.totalMinutes() * 60_000;
    this.totalDisplay = this.format(totalMs);
  }

  format(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  async showToast(message: string) {
    const toastEl = document.createElement('ion-toast');
    toastEl.message = message;
    toastEl.duration = 1500;
    document.body.appendChild(toastEl);
    await toastEl.present();
  }

  ngOnDestroy() {
    clearInterval(this.intervalRef);
  }

    goToHistory() {
    this.router.navigateByUrl('/history');
  }
}
