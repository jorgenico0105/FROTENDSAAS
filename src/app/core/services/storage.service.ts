import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Storage Type - determines where data is stored
 */
export type StorageType = 'local' | 'session';

/**
 * Storage Service
 * Abstraction layer for localStorage and sessionStorage
 * Handles SSR compatibility and provides type-safe methods
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /**
   * Get the appropriate storage based on type
   */
  private getStorage(type: StorageType): Storage | null {
    if (!this.isBrowser) {
      return null;
    }
    return type === 'local' ? localStorage : sessionStorage;
  }

  /**
   * Get item from storage
   * @param key - Storage key
   * @param type - Storage type (local or session)
   * @returns Parsed value or null
   */
  get<T>(key: string, type: StorageType = 'local'): T | null {
    const storage = this.getStorage(type);
    if (!storage) {
      return null;
    }

    try {
      const item = storage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error parsing storage item "${key}":`, error);
      return null;
    }
  }

  /**
   * Get raw string from storage (without JSON parsing)
   * @param key - Storage key
   * @param type - Storage type
   * @returns Raw string value or null
   */
  getString(key: string, type: StorageType = 'local'): string | null {
    const storage = this.getStorage(type);
    if (!storage) {
      return null;
    }
    return storage.getItem(key);
  }

  /**
   * Set item in storage
   * @param key - Storage key
   * @param value - Value to store (will be JSON stringified)
   * @param type - Storage type
   */
  set<T>(key: string, value: T, type: StorageType = 'local'): void {
    const storage = this.getStorage(type);
    if (!storage) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      storage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error setting storage item "${key}":`, error);
    }
  }

  /**
   * Set raw string in storage (without JSON stringification)
   * @param key - Storage key
   * @param value - String value
   * @param type - Storage type
   */
  setString(key: string, value: string, type: StorageType = 'local'): void {
    const storage = this.getStorage(type);
    if (!storage) {
      return;
    }
    storage.setItem(key, value);
  }

  /**
   * Remove item from storage
   * @param key - Storage key
   * @param type - Storage type
   */
  remove(key: string, type: StorageType = 'local'): void {
    const storage = this.getStorage(type);
    if (!storage) {
      return;
    }
    storage.removeItem(key);
  }

  /**
   * Remove item from both storages
   * @param key - Storage key
   */
  removeFromBoth(key: string): void {
    this.remove(key, 'local');
    this.remove(key, 'session');
  }

  /**
   * Clear all items from storage
   * @param type - Storage type
   */
  clear(type: StorageType = 'local'): void {
    const storage = this.getStorage(type);
    if (!storage) {
      return;
    }
    storage.clear();
  }

  /**
   * Clear all items from both storages
   */
  clearAll(): void {
    this.clear('local');
    this.clear('session');
  }

  /**
   * Check if key exists in storage
   * @param key - Storage key
   * @param type - Storage type
   * @returns True if key exists
   */
  has(key: string, type: StorageType = 'local'): boolean {
    const storage = this.getStorage(type);
    if (!storage) {
      return false;
    }
    return storage.getItem(key) !== null;
  }

  /**
   * Get all keys from storage
   * @param type - Storage type
   * @returns Array of keys
   */
  keys(type: StorageType = 'local'): string[] {
    const storage = this.getStorage(type);
    if (!storage) {
      return [];
    }
    return Object.keys(storage);
  }

  /**
   * Get storage size (number of items)
   * @param type - Storage type
   * @returns Number of items
   */
  size(type: StorageType = 'local'): number {
    const storage = this.getStorage(type);
    if (!storage) {
      return 0;
    }
    return storage.length;
  }

  /**
   * Check if browser storage is available
   * @returns True if running in browser
   */
  isAvailable(): boolean {
    return this.isBrowser;
  }
}
