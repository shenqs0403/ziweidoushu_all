export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const LUNAR_MONTHS = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
const LUNAR_DAYS = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export function getLunarMonthName(month: number): string {
  return LUNAR_MONTHS[month - 1] || '';
}

export function getLunarDayName(day: number): string {
  return LUNAR_DAYS[day - 1] || '';
}

export function getHeavenlyStem(year: number): string {
  return HEAVENLY_STEMS[(year - 4) % 10];
}

export function getEarthlyBranch(year: number): string {
  return EARTHLY_BRANCHES[(year - 4) % 12];
}

export function getYearGanZhi(year: number): string {
  return getHeavenlyStem(year) + getEarthlyBranch(year);
}

export function getHourGanZhi(hour: number): string {
  const branchIndex = Math.floor(((hour + 1) % 24) / 2);
  const stemIndex = (branchIndex % 10);
  return HEAVENLY_STEMS[stemIndex] + EARTHLY_BRANCHES[branchIndex];
}

export function getVirtualAge(birthYear: number, currentYear: number): number {
  return currentYear - birthYear + 1;
}

export function getMajorLimit(virtualAge: number): { start: number; end: number } | null {
  const limits = [
    { start: 1, end: 10 }, { start: 11, end: 20 }, { start: 21, end: 30 },
    { start: 31, end: 40 }, { start: 41, end: 50 }, { start: 51, end: 60 },
    { start: 61, end: 70 }, { start: 71, end: 80 }, { start: 81, end: 90 },
    { start: 91, end: 100 }, { start: 101, end: 110 }, { start: 111, end: 120 },
  ];
  return limits.find(l => virtualAge >= l.start && virtualAge <= l.end) || null;
}
