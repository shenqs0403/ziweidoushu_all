import type { PersonRecord } from '../types';

const STORAGE_KEY = 'ziweidoushu_records';
const ENCRYPTION_KEY = 'zwd_secret_2024';
export const RECORDS_CHANGED_EVENT = 'ziweidoushu:records-changed';

function encrypt(data: string): string {
  const xorKey = ENCRYPTION_KEY;
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ xorKey.charCodeAt(i % xorKey.length));
  }
  return btoa(String.fromCharCode(...new TextEncoder().encode(result)));
}

function decrypt(data: string): string {
  const xorKey = ENCRYPTION_KEY;
  const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
  const decoded = new TextDecoder().decode(bytes);
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ xorKey.charCodeAt(i % xorKey.length));
  }
  return result;
}

export function saveRecords(records: PersonRecord[]): void {
  try {
    const data = JSON.stringify(records);
    const encrypted = encrypt(data);
    localStorage.setItem(STORAGE_KEY, encrypted);
    window.dispatchEvent(new Event(RECORDS_CHANGED_EVENT));
  } catch (e) {
    console.error('保存失败:', e);
    throw new Error('保存失败，请重试');
  }
}

export function loadRecords(): PersonRecord[] {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) return [];
    const data = decrypt(encrypted);
    return JSON.parse(data);
  } catch (e) {
    console.error('读取失败:', e);
    return [];
  }
}

export function addRecord(record: PersonRecord): PersonRecord[] {
  const records = loadRecords();
  records.push(record);
  saveRecords(records);
  return records;
}

export function updateRecord(id: string, updates: Partial<PersonRecord>): PersonRecord[] {
  const records = loadRecords();
  const index = records.findIndex(r => r.id === id);
  if (index !== -1) {
    records[index] = { ...records[index], ...updates, updatedAt: Date.now() };
    saveRecords(records);
  }
  return records;
}

export function deleteRecord(id: string): PersonRecord[] {
  const records = loadRecords().filter(r => r.id !== id);
  saveRecords(records);
  return records;
}
