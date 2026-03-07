/**
 * Network Manager - Reliable Network Detection
 * 
 * Bitta joyda network holatini boshqaradi
 * Race condition va inconsistent state muammolarini hal qiladi
 */

import { NetworkStatus } from '../types/base';

export class NetworkManager {
  private static instance: NetworkManager;
  private status: NetworkStatus;
  private listeners = new Set<(status: NetworkStatus) => void>();
  private checkInterval: NodeJS.Timeout | null = null;
  private isChecking = false;

  private constructor() {
    // Quick initial status based on browser
    const browserOnline = navigator.onLine;
    
    this.status = {
      isOnline: browserOnline, // Start with browser status
      isChecking: browserOnline, // Only check if browser says online
      lastChecked: new Date(),
      backendHealthy: false,
      internetConnected: browserOnline
    };

    this.setupEventListeners();
    this.startPeriodicCheck();
    
    // Initial check only if browser says online
    if (browserOnline) {
      this.checkNetworkStatus();
    }
  }

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  public getStatus(): NetworkStatus {
    return { ...this.status };
  }

  public isOnline(): boolean {
    return this.status.isOnline;
  }

  public isBackendHealthy(): boolean {
    return this.status.backendHealthy;
  }

  public hasInternetConnection(): boolean {
    return this.status.internetConnected;
  }

  public onStatusChange(callback: (status: NetworkStatus) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current status
    callback(this.getStatus());
    
    return () => this.listeners.delete(callback);
  }

  public async forceCheck(): Promise<NetworkStatus> {
    await this.checkNetworkStatus();
    return this.getStatus();
  }

  private debounceTimer: NodeJS.Timeout | null = null;

  private debouncedCheck(delay = 300): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.checkNetworkStatus(), delay);
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      // Birozdan keyin tekshir — tarmoq to'liq ulanguncha
      this.debouncedCheck(500);
    });

    window.addEventListener('offline', () => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.updateStatus({
        isOnline: false,
        internetConnected: false,
        backendHealthy: false
      });
    });
  }

  private startPeriodicCheck(): void {
    // Har 30 sekundda tekshir — agar status o'zgarmagan bo'lsa listener chaqirilmaydi
    this.checkInterval = setInterval(() => {
      if (!this.isChecking) {
        this.checkNetworkStatus();
      }
    }, 30_000);
  }

  private async checkNetworkStatus(): Promise<void> {
    if (this.isChecking) {
      return;
    }

    this.isChecking = true;
    this.updateStatus({ isChecking: true });

    try {
      // Browser offline bo'lsa - tezda offline qo'y
      if (!navigator.onLine) {
        this.updateStatus({
          isOnline: false,
          internetConnected: false,
          backendHealthy: false,
          isChecking: false,
          lastChecked: new Date()
        });
        this.isChecking = false;
        return;
      }

      // Faqat backend health tekshir — bu yetarli
      // Agar backend ishlayotgan bo'lsa = online
      const backendHealthy = await this.checkBackendHealth();

      this.updateStatus({
        isOnline: backendHealthy,
        internetConnected: backendHealthy,
        backendHealthy,
        isChecking: false,
        lastChecked: new Date()
      });

    } catch (error) {
      console.error('Network check failed:', error);
      this.updateStatus({
        isOnline: false,
        internetConnected: false,
        backendHealthy: false,
        isChecking: false,
        lastChecked: new Date()
      });
    } finally {
      this.isChecking = false;
    }
  }

  private async checkBackendHealth(): Promise<boolean> {
    const TIMEOUT_MS = 5000; // 5 sekund — yetarli vaqt
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });
      clearTimeout(timeoutId);
      return response.ok || response.status === 401;
    } catch (error: any) {
      clearTimeout(timeoutId);
      // Network o'zgarganda (WiFi→4G) 1 marta retry qil
      if (error?.name === 'AbortError') {
        return false; // Timeout — offline
      }
      if (error?.message?.includes('network change') || error?.message?.includes('NetworkError')) {
        await new Promise(resolve => setTimeout(resolve, 800));
        try {
          const response = await fetch('/api/health', { method: 'HEAD', cache: 'no-cache' });
          return response.ok || response.status === 401;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  private updateStatus(updates: Partial<NetworkStatus>): void {
    const oldStatus = { ...this.status };
    this.status = { ...this.status, ...updates };

    // Only notify if status actually changed
    if (this.hasStatusChanged(oldStatus, this.status)) {
      // Notify all listeners
      this.listeners.forEach(callback => {
        try {
          callback(this.getStatus());
        } catch (error) {
          console.error('Network status listener error:', error);
        }
      });
    }
  }

  private hasStatusChanged(oldStatus: NetworkStatus, newStatus: NetworkStatus): boolean {
    // Only notify on meaningful status changes, ignore isChecking changes
    return (
      oldStatus.isOnline !== newStatus.isOnline ||
      oldStatus.internetConnected !== newStatus.internetConnected ||
      oldStatus.backendHealthy !== newStatus.backendHealthy
      // REMOVED: isChecking - to prevent frequent listener triggers
    );
  }

  public destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.listeners.clear();
    
    window.removeEventListener('online', this.checkNetworkStatus);
    window.removeEventListener('offline', this.checkNetworkStatus);
    document.removeEventListener('visibilitychange', this.checkNetworkStatus);
    window.removeEventListener('focus', this.checkNetworkStatus);
  }
}
