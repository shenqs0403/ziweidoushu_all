import type { PersonRecord } from '../types';
import { Solar, Lunar } from 'lunar-javascript';

// 地支：子 丑 寅 卯 辰 巳 午 未 申 酉 戌 亥
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
// 天干：甲 乙 丙 丁 戊 己 庚 辛 壬 癸
export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const PALACE_NAMES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母'];
export const JU_NAMES: Record<number, string> = { 2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局' };

export type StarKind = 'major' | 'support' | 'misc';
export interface StarInstance {
  name: string;
  kind: StarKind;
  hua?: '禄' | '权' | '科' | '忌';
}
export interface Palace {
  branchIndex: number;
  branch: string;
  name: string;        // 宫名
  stemBranch: string;  // 本宫干支
  daxianIndex: number; // 大限序号 0..11
  daxianStart: number; // 大限起始年龄
  stars: StarInstance[];
}
export interface Chart {
  yearGZ: string;
  monthGZ: string;
  dayGZ: string;
  timeGZ: string;
  solarText: string;
  lunarText: string;
  zodiac: string;
  virtualAge: number;
  genderText: string;
  juText: string;
  mingPalaceBranch: string;
  bodyPalaceBranch: string;
  起运Age: number;
  mingZhu: string;
  bodyZhu: string;
  palaces: Palace[]; // 以地支序号排好
}

// 纳音五行 → 五行局数
const NAYIN: string[] = ['金', '火', '木', '土', '金', '火', '水', '土', '金', '木', '水', '土', '火', '木', '水', '金', '火', '木', '土', '金', '火', '水', '土', '金', '木', '水', '土', '火', '木', '水'];
const JU_BY_ELEMENT: Record<string, number> = { 金: 4, 木: 3, 水: 2, 火: 6, 土: 5 };

function juFromStemBranch(stemIdx: number, branchIdx: number): number {
  // k = stemIdx + 10*t, k % 12 == branchIdx
  let k = 0;
  for (let i = 0; i < 60; i++) {
    if (i % 10 === stemIdx && i % 12 === branchIdx) { k = i; break; }
  }
  const element = NAYIN[Math.floor(k / 2)];
  return JU_BY_ELEMENT[element];
}

// 寅首起天干：甲己丙作首...
const YIN_STEM: Record<number, number> = { 0: 2, 5: 2, 1: 4, 6: 4, 2: 6, 7: 6, 3: 8, 8: 8, 4: 0, 9: 0 };
function palaceStem(yearStemIdx: number, branchIdx: number): number {
  return (YIN_STEM[yearStemIdx] + (branchIdx - 2 + 120) % 12) % 10;
}

// 紫微星定位
function getZiweiBranch(day: number, ju: number): number {
  // 商数需使 (商*ju) >= day
  const quot = Math.ceil(day / ju);
  const diff = quot * ju - day;
  const count = diff % 2 === 0 ? quot + diff : quot - diff;
  // 自寅宫起顺数 count
  return (2 + count - 1) % 12;
}

// 天府位置是与紫微关于过寅申轴的镜像
function getTianfuBranch(ziweiBranch: number): number {
  return (4 - ziweiBranch + 120) % 12;
}

// 各年干四化
export const HUA_BY_YEAR: Record<number, { 禄: string; 权: string; 科: string; 忌: string }> = {
  0: { 禄: '廉贞', 权: '破军', 科: '武曲', 忌: '太阳' },
  1: { 禄: '天机', 权: '天梁', 科: '紫微', 忌: '太阴' },
  2: { 禄: '天同', 权: '天机', 科: '文昌', 忌: '廉贞' },
  3: { 禄: '太阴', 权: '天同', 科: '天机', 忌: '巨门' },
  4: { 禄: '贪狼', 权: '太阴', 科: '右弼', 忌: '天机' },
  5: { 禄: '武曲', 权: '贪狼', 科: '天梁', 忌: '文曲' },
  6: { 禄: '太阳', 权: '武曲', 科: '太阴', 忌: '天同' },
  7: { 禄: '巨门', 权: '太阳', 科: '文曲', 忌: '文昌' },
  8: { 禄: '天梁', 权: '紫微', 科: '左辅', 忌: '武曲' },
  9: { 禄: '破军', 权: '巨门', 科: '太阴', 忌: '贪狼' },
};

export const MAIN_STARS = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];

// 庙旺平陷简表（子~亥，下标为地支序号）
export const BRIGHTNESS: Record<string, string[]> = {
  紫微: ['旺', '庙', '得', '平', '庙', '平', '旺', '庙', '得', '平', '庙', '平'],
  天机: ['平', '庙', '旺', '庙', '陷', '平', '旺', '庙', '旺', '平', '陷', '平'],
  太阳: ['庙', '得', '得', '旺', '得', '陷', '旺', '得', '得', '陷', '陷', '旺'],
  武曲: ['得', '庙', '旺', '得', '庙', '平', '庙', '得', '得', '旺', '陷', '平'],
  天同: ['平', '庙', '得', '得', '庙', '旺', '陷', '陷', '平', '庙', '旺', '得'],
  廉贞: ['平', '得', '庙', '陷', '平', '旺', '平', '得', '庙', '陷', '平', '旺'],
  天府: ['旺', '得', '庙', '平', '得', '庙', '旺', '得', '平', '庙', '旺', '得'],
  太阴: ['庙', '得', '陷', '陷', '陷', '陷', '不', '得', '得', '旺', '庙', '旺'],
  贪狼: ['平', '庙', '得', '旺', '平', '庙', '旺', '得', '庙', '平', '陷', '旺'],
  巨门: ['庙', '旺', '得', '平', '庙', '旺', '庙', '旺', '得', '平', '庙', '陷'],
  天相: ['平', '庙', '旺', '得', '庙', '得', '平', '庙', '旺', '得', '庙', '得'],
  天梁: ['庙', '旺', '得', '得', '庙', '旺', '庙', '旺', '得', '平', '庙', '平'],
  七杀: ['旺', '得', '庙', '平', '旺', '庙', '陷', '旺', '得', '庙', '平', '旺'],
  破军: ['平', '庙', '得', '陷', '平', '庙', '平', '庙', '得', '陷', '平', '庙'],
};

function pad(n: number) { return (n + 120) % 12; }

export function buildChart(record: PersonRecord): Chart {
  const hourBranchIdx = record.birthHour; // 0=子 ... 11=亥
  // 阳历 → 农历
  const lunar = record.isLunar
    ? Lunar.fromYmd(record.birthYear, record.birthMonth, record.birthDay)
    : Solar.fromYmd(record.birthYear, record.birthMonth, record.birthDay).getLunar();
  const solar = lunar.getSolar();

  const yearStemIdx = lunar.getYearGanIndex();
  const month = Math.abs(lunar.getMonth());
  const day = lunar.getDay();

  // 命宫、身宫：寅宫起正月，命宫逆数时辰、身宫顺数时辰
  const mingBranch = (2 + (month - 1) - hourBranchIdx + 120) % 12;
  const bodyBranch = pad(2 + (month - 1) + hourBranchIdx);

  // 命宫干支 & 五行局
  const mingStemIdx = palaceStem(yearStemIdx, mingBranch);
  const ju = juFromStemBranch(mingStemIdx, mingBranch);
  const juText = JU_NAMES[ju];
  const 起运Age = ju === 6 ? 6 : ju === 2 ? 2 : ju === 3 ? 3 : ju === 4 ? 4 : 5;

  // 安主星
  const ziwei = getZiweiBranch(day, ju);
  const tianfu = getTianfuBranch(ziwei);
  const headStars: Array<[string, number]> = [
    ['紫微', ziwei],
    ['天机', pad(ziwei - 1)],
    ['太阳', pad(ziwei - 3)],
    ['武曲', pad(ziwei - 4)],
    ['天同', pad(ziwei - 5)],
    ['廉贞', pad(ziwei - 8)],
    ['天府', tianfu],
    ['太阴', pad(tianfu + 1)],
    ['贪狼', pad(tianfu + 2)],
    ['巨门', pad(tianfu + 3)],
    ['天相', pad(tianfu + 4)],
    ['天梁', pad(tianfu + 5)],
    ['七杀', pad(tianfu + 6)],
    ['破军', pad(tianfu + 10)],
  ];

  // 安辅星（文昌文曲按时辰）
  const yearBranchForMa: number = lunar.getYearZhiIndex();
  const yearBranchMap = yearBranchForMa; // 子0..亥11
  const aux: Array<[string, number]> = [];
  const add = (name: string, branch: number) => aux.push([name, branch]);
  add('左辅', pad(4 + month - 1));             // 辰起正月顺
  add('右弼', pad(10 - month + 1));             // 戌起正月逆
  add('文昌', pad(10 - hourBranchIdx));        // 戌上逆时觅文昌
  add('文曲', pad(4 + hourBranchIdx));          // 辰上顺时文曲位
  // 天魁天钺（按年干）
  const kuiYueIndexes: Record<number, [number, number]> = {
    0: [1, 7], 4: [1, 7], 6: [1, 7],
    1: [0, 8], 5: [0, 8],
    2: [11, 9], 3: [11, 9],
    7: [6, 2],
    8: [3, 5], 9: [3, 5],
  };
  const kyu = kuiYueIndexes[yearStemIdx];
  add('天魁', kyu[0]);
  add('天钺', kyu[1]);
  // 禄存/擎羊/陀罗（按年干）
  const luIdxByYear: Record<number, number> = { 0: 2, 1: 3, 2: 5, 3: 6, 4: 5, 5: 6, 6: 8, 7: 9, 8: 11, 9: 0 };
  const lu = luIdxByYear[yearStemIdx];
  add('禄存', lu);
  add('擎羊', pad(lu + 1));
  add('陀罗', pad(lu - 1));
  // 红鸾/天喜
  const hong = pad(3 - yearBranchMap);
  add('红鸾', hong);
  add('天喜', pad(hong + 6));
  // 天马
  let ma = 8;
  if ([0, 4, 8].includes(yearBranchMap)) ma = 2;       // 申子辰年寅马
  else if ([3, 7, 11].includes(yearBranchMap)) ma = 5;  // 寅午戌年巳马
  else if ([2, 6, 10].includes(yearBranchMap)) ma = 8;  // 巳酉丑年申马
  else ma = 11;                                          // 亥卯未年亥马
  add('天马', ma);
  // 地空地劫
  add('地空', pad(11 - hourBranchIdx));      // 亥上子时逆数到地空
  add('地劫', pad(11 + hourBranchIdx));      // 亥上子时顺数到地劫

  const starsAt = new Map<number, StarInstance[]>();
  const push = (branch: number, s: StarInstance) => {
    const arr = starsAt.get(branch) || [];
    arr.push(s);
    starsAt.set(branch, arr);
  };
  for (const [name, b] of headStars) push(b, { name, kind: 'major' });
  for (const [name, b] of aux) push(b, { name, kind: 'support' });
  // 杂耀：三台、八座、恩光、天贵、解神、天刑、天姚、天月、天哭、天虚、龙池、凤阁、天才、天寿
  const misc: Array<[string, number]> = [
    ['三台', pad(4 + month - 1 + (day - 1))],
    ['八座', pad(10 - month + 1 - (day - 1))],
    ['恩光', pad(10 - hourBranchIdx + (day - 2))],
    ['天贵', pad(4 + hourBranchIdx + (day - 2))],
    ['解神', [8, 10, 0, 2, 4, 6][Math.floor((month - 1) / 2)]],
    ['天刑', pad(9 + month - 1)],
    ['天姚', pad(1 + month - 1)],
    ['天月', [10, 5, 4, 2, 7, 3, 11, 7, 2, 6, 10, 2][month - 1]],
    ['天哭', pad(6 - yearBranchMap)],
    ['天虚', pad(6 + yearBranchMap)],
    ['龙池', pad(4 + yearBranchMap)],
    ['凤阁', pad(10 - yearBranchMap)],
    ['天才', pad(mingBranch + yearBranchMap)],
    ['天寿', pad(bodyBranch + yearBranchMap)],
  ];
  for (const [name, b] of misc) push(b, { name, kind: 'misc' });
  // 四化
  const huaMap = HUA_BY_YEAR[yearStemIdx];
  for (const [type, name] of Object.entries(huaMap) as Array<['禄' | '权' | '科' | '忌', string]>) {
    // 找到该星所在宫并打标签
    for (const [, list] of starsAt) {
      const found = list.find(s => s.name === name);
      if (found) found.hua = type;
    }
  }

  // 阳/阴年与男/女决定大限方向
  const isYangYear = yearStemIdx % 2 === 0;
  const isMale = record.gender === 'male';
  const forward = isYangYear === isMale; // 阳男/阴女顺行（宫序+1）

  const palaces: Palace[] = BRANCHES.map((_, i) => {
    const n = (i - mingBranch + 120) % 12; // 该宫距命宫偏移数（顺行）
    const nameOffset = (mingBranch - i + 120) % 12; // 十二宫由命宫逆数
    const daxianIndex = forward ? n : (12 - n) % 12;
    return {
      branchIndex: i,
      branch: BRANCHES[i],
      name: PALACE_NAMES[nameOffset],
      stemBranch: STEMS[palaceStem(yearStemIdx, i)] + BRANCHES[i],
      daxianIndex,
      daxianStart: 起运Age + daxianIndex * 10,
      stars: (starsAt.get(i) || []).sort((a, b) => (a.kind === 'major' ? 0 : a.kind === 'support' ? 1 : 2) - (b.kind === 'major' ? 0 : b.kind === 'support' ? 1 : 2)),
    };
  });

  const MING_ZHU_BY_BRANCH = ['贪狼', '巨门', '禄存', '文曲', '廉贞', '武曲', '破军', '武曲', '廉贞', '文曲', '禄存', '巨门'];
  const mingZhu = MING_ZHU_BY_BRANCH[mingBranch];
  const BODY_ZHU_BY_YEAR = ['火星', '天相', '天梁', '天同', '文昌', '天机', '火星', '天相', '天梁', '天同', '文昌', '天机'];
  const bodyZhu = BODY_ZHU_BY_YEAR[(lunar.getYearZhiIndex() + 0) % 12];

  return {
    yearGZ: lunar.getYearInGanZhi(),
    monthGZ: lunar.getMonthInGanZhi(),
    dayGZ: lunar.getDayInGanZhi(),
    timeGZ: lunar.getTimeInGanZhi(),
    solarText: `${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日 ${BRANCHES[hourBranchIdx]}时`,
    lunarText: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${BRANCHES[hourBranchIdx]}时`,
    zodiac: lunar.getYearShengXiao(),
    virtualAge: new Date().getFullYear() - record.birthYear + 1,
    genderText: record.gender === 'male' ? '男' : '女',
    juText,
    mingPalaceBranch: BRANCHES[mingBranch],
    bodyPalaceBranch: BRANCHES[bodyBranch],
    起运Age,
    mingZhu,
    bodyZhu,
    palaces,
  };
}
