import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TimerService {
  sessions: { start: Date; end?: Date }[] = [];
  running = false;
  startTime?: Date;
  endTime?: Date;

  constructor() {}

  start() {
    if (!this.running) {
      this.startTime = new Date();
      this.running = true;
      this.sessions.push({ start: this.startTime });
    }
  }

  pause() {
    if (this.running && this.sessions.length) {
      const currentSession = this.sessions[this.sessions.length - 1];
      currentSession.end = new Date();
      this.running = false;
    }
  }

  resume() {
    if (!this.running) {
      this.running = true;
      this.sessions.push({ start: new Date() });
    }
  }

  reset() {
    this.sessions = [];
    this.running = false;
    this.startTime = undefined;
    this.endTime = undefined;
  }

  stop() {
    if (this.running && this.sessions.length) {
      const currentSession = this.sessions[this.sessions.length - 1];
      currentSession.end = new Date();
    }
    this.endTime = new Date();
    this.running = false;
  }

  totalMinutes(): number {
    let total = 0;
    this.sessions.forEach((s) => {
      if (s.end && s.start) {
        total += (s.end.getTime() - s.start.getTime()) / 60000;
      }
    });
    return total;
  }

  /** Helper to get readable stop periods for the bill */
  getStopPeriods(): { start: string; end: string }[] {
    return this.sessions
      .filter((s) => s.start && s.end)
      .map((s) => ({
        start: s.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        end: s.end!.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));
  }
}
