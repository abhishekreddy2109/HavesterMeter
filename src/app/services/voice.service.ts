import { Injectable } from '@angular/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Capacitor } from '@capacitor/core';

type FieldKey = 'farmer' | 'address';

@Injectable({ providedIn: 'root' })
export class VoiceService {
  private lang: string = 'te-IN';
  private isVoiceMode = true;

  // session control
  private activeSessionId: string | null = null;
  private speaking = false;
  private listening = false;

  async setLanguage(lang: 'te-IN' | 'en-US') {
    this.lang = lang;
    localStorage.setItem('appLang', lang);
    try { await SpeechRecognition.stop(); } catch {}
    try { await TextToSpeech.stop(); } catch {}
  }

  getLanguage() {
    return localStorage.getItem('appLang') || this.lang;
  }

  setVoiceMode(enabled: boolean) { this.isVoiceMode = enabled; }
  getVoiceMode() { return this.isVoiceMode; }

  /** 🔊 Speak with cancellation of prior speech */
  async speak(text: string) {
    if (!this.isVoiceMode) return;
    try {
      this.speaking = true;
      // stop any previous speech first
      try { await TextToSpeech.stop(); } catch {}
      await TextToSpeech.speak({
        text,
        lang: this.lang,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
      });
    } catch (e) {
      // best-effort, ignore
    } finally {
      this.speaking = false;
    }
  }

  /** 🛑 Cancel any ongoing listening */
  async cancel() {
    this.activeSessionId = null;
    this.listening = false;
    try { await SpeechRecognition.stop(); } catch {}
  }

  /**
   * 🎙 Listen once, bound to a target field with a session token.
   * Only the *latest* session is allowed to produce a result.
   */
  async listenFor(field: FieldKey, opts?: { timeoutMs?: number; prompt?: string }): Promise<{ field: FieldKey; text: string }> {
    const timeoutMs = opts?.timeoutMs ?? 7000;

    // end any ongoing speech before we listen (avoids audio focus conflicts)
    try { await TextToSpeech.stop(); } catch {}

    // create a unique session id
    const sessionId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.activeSessionId = sessionId;

    // platform branch
    if (Capacitor.getPlatform() === 'web') {
      const text = await this.listenWeb(sessionId, timeoutMs);
      return { field, text };
    }

    // native
    try {
      const perm = await SpeechRecognition.checkPermissions();
      if (perm.speechRecognition !== 'granted') {
        await SpeechRecognition.requestPermissions();
      }
    } catch {
      // if permission flow fails, return empty
      return { field, text: '' };
    }

    this.listening = true;

    return new Promise<{ field: FieldKey; text: string }>(async (resolve) => {
      let resolved = false;

      // ensure only this session can resolve
      const guardResolve = (text: string) => {
        if (resolved) return;
        if (this.activeSessionId !== sessionId) return; // outdated
        resolved = true;
        this.listening = false;
        resolve({ field, text });
      };

      // subscribe to partials for snappy UX
      const partialListener = await SpeechRecognition.addListener('partialResults', (ev: any) => {
        if (this.activeSessionId !== sessionId) return;
        const text = (ev?.matches?.[0] || '').trim();
        if (text) {
          // early resolve on first good partial
          guardResolve(text);
          try { SpeechRecognition.stop(); } catch {}
          partialListener.remove();
        }
      });

      // start listening (partialResults true for quick capture)
      try {
        await SpeechRecognition.start({
          language: this.lang,
          popup: false,
          partialResults: true,
        });
      } catch {
        partialListener.remove();
        guardResolve('');
        return;
      }

      // hard timeout safety
      setTimeout(async () => {
        try { await SpeechRecognition.stop(); } catch {}
        partialListener.remove();
        guardResolve('');
      }, timeoutMs);
    });
  }

  /** 🌐 Web fallback */
  private listenWeb(sessionId: string, timeoutMs: number): Promise<string> {
    return new Promise((resolve) => {
      const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SR) return resolve('');

      const rec = new SR();
      rec.lang = this.lang;
      rec.continuous = false;
      rec.interimResults = false;

      let done = false;
      const guardResolve = (text: string) => {
        if (done) return;
        if (this.activeSessionId !== sessionId) return; // outdated session
        done = true;
        try { rec.stop(); } catch {}
        resolve(text.trim());
      };

      rec.onresult = (e: any) => guardResolve(e.results?.[0]?.[0]?.transcript || '');
      rec.onerror = () => guardResolve('');
      rec.onend = () => guardResolve('');
      try { rec.start(); } catch { guardResolve(''); }

      // safety timeout
      setTimeout(() => guardResolve(''), timeoutMs);
    });
  }
}
