export interface PersonRecord {
  id: string;
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  isLunar: boolean;
  gender: 'male' | 'female';
  group: string;
  createdAt: number;
  updatedAt: number;
}

export interface StarInfo {
  name: string;
  type: 'major' | 'auxiliary' | 'misc';
  brightness?: string;
  transformation?: 'huaquan' | 'huake' | 'hualu' | 'huaji';
}

export interface PalaceInfo {
  name: string;
  stems: string;
  branches: string;
  stars: StarInfo[];
  majorLimit?: string;
  minorLimit?: string;
}

export type CalendarType = 'solar' | 'lunar';
