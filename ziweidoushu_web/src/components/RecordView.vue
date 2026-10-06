<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { PersonRecord } from '../types';
import { loadRecords } from '../utils/storage';
import { buildChart, BRIGHTNESS, BRANCHES, STEMS, HUA_BY_YEAR } from '../utils/chart';
import { getStarInfo } from '../utils/starInfo';
import { Solar, Lunar } from 'lunar-javascript';

const props = defineProps<{
  recordId: string;
}>();

const record = ref<PersonRecord | null>(null);
const chart = computed(() => (record.value ? buildChart(record.value) : null));
const selected = ref<{ name: string; kind: string; hua?: string; brightness?: string; palace: string } | null>(null);

const GRID_LAYOUT: Array<number | null> = [
  5, 6, 7, 8,
  4, null, null, 9,
  3, null, null, 10,
  2, 1, 0, 11,
];

const yangText = computed(() => {
  if (!chart.value) return '';
  const yangStem = ['甲', '丙', '戊', '庚', '壬'].includes(chart.value.yearGZ[0]);
  return (yangStem ? '阳' : '阴') + chart.value.genderText;
});

function palaceAt(branchIndex: number) {
  return chart.value?.palaces[branchIndex];
}

function isMing(branchIndex: number) {
  return chart.value?.mingPalaceBranch === BRANCHES[branchIndex];
}

function starBrightness(starName: string, branchIndex: number): string | undefined {
  return BRIGHTNESS[starName]?.[branchIndex];
}

function openStar(star: { name: string; kind: string; hua?: string }, branchIndex: number, palaceName: string) {
  selected.value = {
    name: star.name,
    kind: star.kind,
    hua: star.hua,
    brightness: starBrightness(star.name, branchIndex),
    palace: palaceName,
  };
}

function closeDrawer() { selected.value = null; }

const starDetail = computed(() => (selected.value ? getStarInfo(selected.value.name) : null));

const daxianPreview = computed(() => {
  if (!chart.value) return [];
  return chart.value.palaces
    .slice()
    .sort((a, b) => a.daxianIndex - b.daxianIndex)
    .map(p => ({ index: p.daxianIndex, start: p.daxianStart, label: p.stemBranch }));
});

const 童限End = computed(() => (chart.value ? chart.value.起运Age - 1 : 0));

// ===== 宫位 / 大限 / 流年 / 流月 / 流日 / 流时 的选择状态 =====
const selectedBranch = ref<number | null>(null);
const selectedDecade = ref<number | null>(null);
const selectedYear = ref<{ year: number; age: number; ganzhi: string } | null>(null);
const selectedMonth = ref<number | null>(null);
const selectedDay = ref<number | null>(null);
const selectedHour = ref<number | null>(null);

const pad12 = (n: number) => (n + 120) % 12;
const mingBranch = () => chart.value ? BRANCHES.indexOf(chart.value.mingPalaceBranch) : 0;

function clickPalace(branchIndex: number) {
  selectedBranch.value = branchIndex;
  selectedDecade.value = null;
  selectedYear.value = null;
  selectedMonth.value = null;
  selectedDay.value = null;
  selectedHour.value = null;
}

function clickDecade(d: { index: number; start: number; label: string }) {
  selectedDecade.value = d.index;
  selectedBranch.value = null;
  selectedYear.value = null;
  selectedMonth.value = null;
  selectedDay.value = null;
  selectedHour.value = null;
}

function clickYear(l: { year: number; age: number; ganzhi: string }) {
  selectedYear.value = { ...l };
  selectedBranch.value = null;
  selectedMonth.value = null;
  selectedDay.value = null;
  selectedHour.value = null;
}

function clickMonth(m: number) {
  selectedMonth.value = m;
  selectedDay.value = null;
  selectedHour.value = null;
}

function clickDay(d: number) {
  selectedDay.value = d;
  selectedHour.value = null;
}

function clickHour(h: number) {
  selectedHour.value = h;
}

// 当前生效被选中的宫位 branchIndex（传统顺法：流年命宫→流月命宫→流日命宫→流时命宫，均顺行一路）
const activeBranch = computed<number | null>(() => {
  if (!chart.value) return null;
  const ming = mingBranch();
  if (selectedYear.value) {
    let b = pad12(ming + selectedYear.value.age - 1);
    if (selectedMonth.value !== null) b = pad12(b + (selectedMonth.value - 1));
    if (selectedDay.value !== null) b = pad12(b + (selectedDay.value - 1));
    if (selectedHour.value !== null) b = pad12(b + selectedHour.value);
    return b;
  }
  if (selectedDecade.value !== null) {
    const p = chart.value.palaces.find(p => p.daxianIndex === selectedDecade.value);
    return p ? p.branchIndex : null;
  }
  return selectedBranch.value !== null ? selectedBranch.value : ming;
});

// 三方四正
const sfBranches = computed(() => {
  const a = activeBranch.value;
  if (a === null) return new Set<number>();
  return new Set<number>([pad12(a), pad12(a + 4), pad12(a + 8), pad12(a + 6)].filter(b => b !== a));
});

// 宫名上方的层级标签（大限、流年、流月、流日、流时，从下往上堆叠）
const LEVEL_COLORS: Record<string, string> = {
  限: '#1f2937',
  年: '#2563eb',
  月: '#7c3aed',
  日: '#0891b2',
  时: '#ea580c',
};

function palaceLevelLabels(name: string): Array<{ text: string; color: string }> {
  const short = name === '命宫' ? '命' : name.charAt(0);
  const out: Array<{ text: string; color: string }> = [];
  if (selectedHour.value !== null) out.push({ text: '时' + short, color: LEVEL_COLORS.时 });
  if (selectedDay.value !== null) out.push({ text: '日' + short, color: LEVEL_COLORS.日 });
  if (selectedMonth.value !== null) out.push({ text: '月' + short, color: LEVEL_COLORS.月 });
  if (selectedYear.value) out.push({ text: '年' + short, color: LEVEL_COLORS.年 });
  if (selectedDecade.value !== null) out.push({ text: '限' + short, color: LEVEL_COLORS.限 });
  return out;
}

// 大限/流年/流月/流日/流时的四化标签（落在哪个宫就显示在哪个宫的干支上方）
const levelHuaMap = computed(() => {
  const map = new Map<number, Array<{ text: string; color: string }>>();
  const push = (branch: number, text: string, color: string) => {
    const arr = map.get(branch) || [];
    arr.push({ text, color });
    map.set(branch, arr);
  };
  const stemIndex = (ch: string) => STEMS.indexOf(ch);
  // 年干→正月天干；正月干 = 寅首天干
  const YIN_STEM_START: Record<number, number> = { 0: 2, 5: 2, 1: 4, 6: 4, 2: 6, 7: 6, 3: 8, 8: 8, 4: 0, 9: 0 };

  const addLevel = (abbr: string, color: string, yStemIdx: number | null) => {
    if (yStemIdx === null || !chart.value) return;
    const huaMap = HUA_BY_YEAR[yStemIdx];
    for (const [type, starName] of Object.entries(huaMap) as Array<['禄' | '权' | '科' | '忌', string]>) {
      const palace = chart.value.palaces.find(p => p.stars.some(s => s.name === starName));
      if (palace) push(palace.branchIndex, abbr + type, color);
    }
  };

  // 大限：选中的大限盘命宫天干
  if (selectedDecade.value !== null && chart.value) {
    const p = chart.value.palaces.find(p => p.daxianIndex === (selectedDecade.value as number));
    if (p) addLevel('限', LEVEL_COLORS.限, stemIndex(p.stemBranch[0]));
  }
  // 流年：选中年份的天干
  if (selectedYear.value) addLevel('年', LEVEL_COLORS.年, stemIndex(selectedYear.value.ganzhi[0]));
  // 流月：年→正月干→生水月干
  if (selectedYear.value && selectedMonth.value !== null) {
    const yStem = stemIndex(selectedYear.value.ganzhi[0]);
    if (yStem >= 0) {
      const monthStem = (YIN_STEM_START[yStem] + (selectedMonth.value - 1)) % 10;
      addLevel('月', LEVEL_COLORS.月, monthStem);
    }
  }
  // 流日 / 流时：选中年+月+日，按农历日干支
  if (selectedYear.value && selectedMonth.value !== null && selectedDay.value !== null) {
    try {
      const lunar = Lunar.fromYmd(selectedYear.value.year, selectedMonth.value, selectedDay.value);
      const dStem = stemIndex(lunar.getDayInGanZhi()[0]);
      if (dStem >= 0) {
        addLevel('日', LEVEL_COLORS.日, dStem);
        if (selectedHour.value !== null) {
          const ziStem: Record<number, number> = { 0: 0, 5: 0, 1: 2, 6: 2, 2: 4, 7: 4, 3: 6, 8: 6, 4: 8, 9: 8 };
          const hourStem = (ziStem[dStem] + selectedHour.value) % 10;
          addLevel('时', LEVEL_COLORS.时, hourStem);
        }
      }
    } catch { /* ignore */ }
  }
  return map;
});

function levelHuaAt(branchIndex: number): Array<{ text: string; color: string }> {
  return levelHuaMap.value.get(branchIndex) || [];
}

// 流年列表（选中大限后显示该大限对应的十年）
const liunianPreview = computed(() => {
  if (!chart.value || !record.value) return [];
  let startAge = 1;
  if (selectedDecade.value !== null) {
    const p = chart.value.palaces.find(p => p.daxianIndex === (selectedDecade.value as number));
    startAge = p ? p.daxianStart : 1;
  } else {
    const first = chart.value.palaces.find(p => p.daxianIndex === 0);
    startAge = first ? first.daxianStart : chart.value.起运Age;
  }
  const list: Array<{ year: number; age: number; ganzhi: string }> = [];
  for (let age = startAge; age < startAge + 10; age++) {
    const y = record.value.birthYear + age - 1;
    const solar = Solar.fromYmd(y, record.value.birthMonth, Math.min(record.value.birthDay, 28));
    list.push({ year: y, age, ganzhi: solar.getLunar().getYearInGanZhi() });
  }
  return list;
});

const DAY_NAMES = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
const HOUR_NAMES = ['子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时'];

// 选中流年+流月后，流日显示该农历月的天数范围；否则默认 30 天
const monthDayCount = computed(() => {
  if (!selectedYear.value || !selectedMonth.value) return 30;
  try {
    const lunarYear = selectedYear.value.year;
    const m = selectedMonth.value;
    let c = 0;
    for (let d = 1; d <= 30; d++) {
      try {
        const l = Lunar.fromYmd(lunarYear, m, d);
        c = Math.abs(l.getMonth()) === m ? d : c;
        if (Math.abs(l.getMonth()) !== m) break;
      } catch { break; }
    }
    return c || 30;
  } catch { return 30; }
});

function goBack() { window.location.hash = '#/'; }
onMounted(() => {
  const records = loadRecords();
  record.value = records.find(r => r.id === props.recordId) || null;
});
</script>

<template>
  <div class="record-view">
    <div class="header">
      <button class="btn-back" @click="goBack">←</button>
      <h1 class="title">{{ record?.name }}</h1>
    </div>

    <div v-if="!chart" class="empty-state"><p>记录不存在</p></div>

    <div v-else>
      <div class="chart-grid">
        <template v-for="(branchIndex, idx) in GRID_LAYOUT" :key="idx">
          <div v-if="branchIndex !== null" class="palace" :class="{ ming: isMing(branchIndex), active: activeBranch === branchIndex, sf: sfBranches.has(branchIndex) }" @click="clickPalace(branchIndex)">
            <div v-if="palaceAt(branchIndex)">
              <div class="stars">
                <div
                  v-for="star in palaceAt(branchIndex)!.stars"
                  :key="star.name"
                  class="star-col"
                  :class="star.kind"
                  @click="openStar(star, palaceAt(branchIndex)!.branchIndex, palaceAt(branchIndex)!.name)"
                >
                  <span class="star-name">{{ star.name }}</span>
                  <span v-if="star.kind === 'major' && starBrightness(star.name, branchIndex)" class="mw">
                    {{ starBrightness(star.name, branchIndex) }}
                  </span>
                  <span v-if="star.hua" class="hua" :class="`hua-${star.hua}`">{{ star.hua }}</span>
                </div>
              </div>
              <div class="level-hua">
                <span v-for="chip in levelHuaAt(branchIndex)" :key="chip.text" class="lhua" :style="{ background: chip.color }">{{ chip.text }}</span>
              </div>
              <div class="cell-foot">
                <span class="gz">{{ palaceAt(branchIndex)!.stemBranch }}</span>
                <span class="age">{{ palaceAt(branchIndex)!.daxianStart }}-{{ palaceAt(branchIndex)!.daxianStart + 9 }}</span>
                <span class="foot-right">
                  <span class="level-stack">
                    <span
                      v-for="lbl in palaceLevelLabels(palaceAt(branchIndex)!.name)"
                      :key="lbl.text"
                      class="level-label"
                      :style="{ color: lbl.color }"
                    >{{ lbl.text }}</span>
                  </span>
                  <span class="pname">{{ palaceAt(branchIndex)!.name === '命宫' ? '命宫' : palaceAt(branchIndex)!.name }}</span>
                </span>
              </div>
            </div>
          </div>
          <div v-else-if="idx === 5" class="center">
            <div class="c-line">
              <span class="tag">{{ yangText }}　{{ chart.juText }}</span>
            </div>
            <div class="c-line">阳历时间　{{ chart.solarText }}</div>
            <div class="c-line">农历时间　{{ chart.lunarText }}</div>
            <div class="c-line">命宫：{{ chart.mingPalaceBranch }}宫　　　身宫：{{ chart.bodyPalaceBranch }}宫</div>
            <div class="pillars">
              <div class="p-row"><span class="pl">四柱</span><span>{{ chart.yearGZ }} {{ chart.monthGZ }} {{ chart.dayGZ }} {{ chart.timeGZ }}</span></div>
            </div>
            <div class="c-line">命主　{{ chart.mingZhu }}　　身主　{{ chart.bodyZhu }}</div>
            <div class="hua-tip">
              四化颜色　<span class="hua hua-禄">禄</span>
              <span class="hua hua-权">权</span>
              <span class="hua hua-科">科</span>
              <span class="hua hua-忌">忌</span>
            </div>
            <div class="hua-tip">
              时间颜色　<span style="color:#1f2937;font-weight:700">大限</span>
              <span style="color:#2563eb;font-weight:700">流年</span>
              <span style="color:#7c3aed;font-weight:700">流月</span>
              <span style="color:#0891b2;font-weight:700">流日</span>
              <span style="color:#ea580c;font-weight:700">流时</span>
            </div>
          </div>
        </template>
      </div>

      <div class="limit-block">
        <div class="limit-row daxian-row">
          <span class="lb-title">大限</span>
          <div class="lt-cells">
            <span v-for="d in daxianPreview" :key="'dx' + d.index" class="lt-cell" :class="{ sel: selectedDecade === d.index }" @click="clickDecade(d)">
              <span class="lt-age">{{ d.start }}-{{ d.start + 9 }}</span>
            </span>
            <span class="lt-cell">
              <span class="lt-age">童限 1-{{ 童限End }}</span>
            </span>
          </div>
        </div>
        <div class="limit-row liunian-row">
          <span class="lb-title">流年</span>
          <div class="lt-cells">
            <span v-for="l in liunianPreview" :key="'ln' + l.year" class="lt-cell" :class="{ sel: selectedYear && selectedYear.year === l.year && selectedYear.age === l.age }" @click="clickYear(l)">
              <span class="lt-gz">{{ l.year }}</span>
              <span class="lt-age">{{ l.age }}岁</span>
            </span>
          </div>
        </div>
        <div class="limit-row liuyue-row">
          <span class="lb-title">流月</span>
          <div class="lt-cells">
            <span class="lt-cell" v-for="m in 12" :key="'m' + m" :class="{ sel: selectedMonth === m }" @click="clickMonth(m)">
              <span class="lt-age">{{ ['正','二','三','四','五','六','七','八','九','十','冬','腊'][m-1] }}月</span>
            </span>
          </div>
        </div>
        <div class="limit-row liuri-row">
          <span class="lb-title">流日</span>
          <div class="lt-cells">
            <span class="lt-cell" v-for="d in monthDayCount" :key="'d' + d" :class="{ sel: selectedDay === d }" @click="clickDay(d)">
              <span class="lt-age">{{ DAY_NAMES[d-1] }}</span>
            </span>
          </div>
        </div>
        <div class="limit-row liushi-row">
          <span class="lb-title">流时</span>
          <div class="lt-cells">
            <span class="lt-cell" v-for="h in 12" :key="'h' + h" :class="{ sel: selectedHour === h - 1 }" @click="clickHour(h - 1)">
              <span class="lt-age">{{ HOUR_NAMES[h-1] }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 星曜介绍抽屉 -->
  <div v-if="selected" class="drawer-overlay" @click="closeDrawer">
    <div class="drawer" @click.stop>
      <div class="drawer-header">
        <h2>
          {{ selected.name }}
          <span v-if="selected.hua" class="hua" :class="`hua-${selected.hua}`">化{{ selected.hua }}</span>
        </h2>
        <button class="btn-close" @click="closeDrawer">&times;</button>
      </div>
      <div class="drawer-content">
        <p class="palace-label">{{ selected.palace }}</p>
        <div class="info-block"><h3>星曜原文</h3><p>{{ starDetail?.原文 }}</p></div>
        <div class="info-block"><h3>四化</h3><p>{{ starDetail?.四化 || '无显着四化' }}</p></div>
        <div class="info-block">
          <h3>庙旺平陷</h3>
          <p v-if="selected.brightness">本宫庙旺平陷：{{ selected.brightness }}</p>
          <p v-else>本宫无庙旺平陷标记（辅星/杂耀）。</p>
        </div>
        <div class="info-block"><h3>吉凶</h3><p>{{ starDetail?.吉凶 }}</p></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.record-view { padding: 8px; max-width: 1400px; margin: 0 auto; background: #fafafa; min-height: 100vh; }
.header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.header .title { font-size: 22px; font-weight: 700; color: #7c3aed; margin: 0; flex: 1; text-align: center; }
.btn-back { background: none; border: none; color: #111; font-size: 20px; cursor: pointer; }
.btn-edit { background: #ede9fe; color: #6d28d9; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; }
.hint { font-size: 11px; color: #9ca3af; text-align: center; margin: 0 0 8px; }
.empty-state { text-align: center; padding: 60px 20px; color: #9ca3af; }

/* 命盘网格 */
.chart-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 2px;
  background: #e5e7eb;
  border: 1px solid #e5e7eb;
  min-height: 660px;
}

.palace { background: white; padding: 4px 5px; display: flex; flex-direction: column; overflow: hidden; cursor: pointer; }
.palace.sf { background: #fee2e2; }
.palace.active { background: #ede9fe; }
.palace > div { flex: 1; display: flex; flex-direction: column; }

/* 星曜：同一行排，辅星比主星小、杂耀最小 */
.stars { display: flex; flex-wrap: wrap; gap: 1px; margin-bottom: 2px; justify-content: flex-start; }
.star-col { cursor: pointer; display: flex; flex-direction: column; align-items: flex-start; gap: 1px; padding: 1px 0; }
.star-name { writing-mode: vertical-rl; line-height: 1.2; white-space: nowrap; }
.star-col.major .star-name { color: #dc2626; font-weight: 700; font-size: 12px; }
.star-col.support .star-name { color: #7c3aed; font-size: 12px; }
.star-col.misc .star-name { color: #111827; font-size: 11px; }

.mw { padding: 1px 2px; font-size: 10px; color: #6b7280; text-align: left; line-height: 1.2; }
.hua {
  display: inline-block; padding: 0 1px; border-radius: 4px; font-size: 12px; color: #fff; line-height: 1.3;
}
.hua-禄 { background: #16a34a; }
.hua-权 { background: #6366f1; }
.hua-科 { background: #3b82f6; }
.hua-忌 { background: #ef4444; }

.years { font-size: 9px; color: #9ca3af; line-height: 1.5; margin-bottom: 4px; }

.cell-foot { margin-top: auto; display: flex; align-items: flex-end; gap: 4px; border-top: 1px dashed #e5e7eb; padding-top: 3px; }
.gz { flex: 1; font-size: 10px; font-weight: 400; color: #4b5563; }
.age { flex: 2; text-align: center; font-size: 10px; font-weight: 400; color: #4b5563; }
.pname { font-size: 10px; font-weight: 700; color: #ef4444; }
.foot-right { flex: 1; display: flex; flex-direction: column; align-items: flex-end; }
.level-stack { width: 100%; height: 60px; overflow: hidden; display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end; }

.center {
  grid-row: 2 / 4; grid-column: 2 / 4;
  background: #fff; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; align-items: flex-start;
}
.c-title-row { display: flex; justify-content: space-between; align-items: center; }
.pill { border: 1px solid #d1d5db; border-radius: 12px; padding: 0 8px; font-size: 11px; color: #7c3aed; }
.btn-ghost { border: 1px solid #e5e7eb; background: white; border-radius: 6px; font-size: 11px; padding: 2px 8px; color: #374151; cursor: pointer; }
.c-big { font-size: 24px; font-weight: 800; color: #111; text-align: center; }
.c-line { font-size: 11px; color: #374151; }
.tag { background: #ede9fe; color: #6d28d9; border-radius: 4px; padding: 0 4px; font-size: 10px; }
.pillars { border-top: 1px solid #f3f4f6; margin-top: 4px; padding-top: 6px; width: 100%; }
.p-row { display: flex; gap: 10px; font-size: 12px; justify-content: flex-start; padding: 0; align-items: baseline; }
.p-row .pl { color: #9ca3af; font-size: 11px; }
.p-row.g-row span { font-size: 16px; font-weight: 700; }
.p-row.g-row .pl { font-size: 11px; font-weight: 400; }
.hua-tip { font-size: 11px; color: #374151; margin-top: 4px; display: flex; align-items: center; gap: 6px; }
.hua-tip .hua { vertical-align: middle; }

.limit-block {
  margin-top: 8px; background: white; border: 1px solid #e5e7eb; border-radius: 8px;
  padding: 8px 4px; display: flex; flex-direction: column; gap: 6px;
}
.limit-row { display: flex; gap: 4px; align-items: stretch; }
.lt-cells { display: flex; gap: 4px; overflow-x: auto; flex: 1; }
.lb-title {
  min-width: 42px; text-align: center; background: #ede9fe; color: #6d28d9; font-size: 12px;
  border-radius: 6px; display: flex; align-items: center; justify-content: center; padding: 4px 0;
}
.lt-cell { min-width: 56px; flex: 1; text-align: center; display: flex; flex-direction: column; border-right: 1px dashed #f3f4f6; padding: 0 2px; cursor: pointer; }
.lt-cell.sel { background: #ede9fe; border-radius: 4px; }
.level-label { text-align: right; font-size: 10px; font-weight: 700; line-height: 1.2; white-space: nowrap; }
.level-hua { display: flex; flex-wrap: wrap; gap: 2px; margin-bottom: 2px; }
.lhua { display: inline-block; padding: 0 3px; border-radius: 3px; font-size: 10px; color: #fff; line-height: 1.5; }
.lt-age { font-size: 12px; font-weight: 700; color: #111; line-height: 1.2; }
.lt-gz { font-size: 11px; color: #6b7280; line-height: 1.2; }
.lt-cell { padding: 1px 2px; }

/* 各层级参数的字体颜色区分 */
.daxian-row .lt-age, .daxian-row .lt-gz { color: #1f2937; }
.liunian-row .lt-age, .liunian-row .lt-gz { color: #2563eb; }
.liuyue-row .lt-age, .liuyue-row .lt-gz { color: #7c3aed; }
.liuri-row .lt-age, .liuri-row .lt-gz { color: #0891b2; }
.liushi-row .lt-age, .liushi-row .lt-gz { color: #ea580c; }

/* 星曜介绍抽屉 */
.drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; display: flex; align-items: flex-end; }
.drawer { background: #fff; width: 100%; max-height: 75vh; border-radius: 12px 12px 0 0; overflow-y: auto; animation: slideUp .25s ease; }
@keyframes slideUp { from { transform: translateY(100%);} to { transform: translateY(0);} }
.drawer-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid #e5e7eb; }
.drawer-header h2 { font-size: 18px; margin: 0; display: flex; align-items: center; gap: 8px; }
.btn-close { background: none; border: none; font-size: 24px; color: #9ca3af; cursor: pointer; }
.drawer-content { padding: 16px 18px 24px; }
.palace-label { color: #9ca3af; font-size: 12px; margin: 0 0 12px; }
.info-block h3 { font-size: 14px; margin: 0 0 6px; color: #374151; }
.info-block p { font-size: 13px; line-height: 1.6; color: #1f2937; margin: 0 0 14px; }
</style>
