import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  constructor() { }

  enableTouchId() {
    localStorage.setItem('useTouchId', 'true');
  }

  disableTouchId(): boolean {
    localStorage.setItem('useTouchId', 'false');
    return true;
  }

  touchIdEnabled(): boolean {
    const tId = localStorage.getItem('useTouchId');
    return (tId && tId === 'true') ? true : false;
  }
}