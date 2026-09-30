<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { PersonRecord } from '../types';
import { loadRecords } from '../utils/storage';
import { getYearGanZhi, getHourGanZhi, getVirtualAge, getMajorLimit } from '../utils/helpers';

const props = defineProps<{
  recordId: string;
}>();

const record = ref<PersonRecord | null>(null);

const PALACE_NAMES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母'];

const recordInfo = computed(() => {
  if (!record.value) return null;
  const r = record.value;
  const yearGZ = getYearGanZhi(r.birthYear);
  const hourGZ = getHourGanZhi(r.birthHour);
  const virtualAge = getVirtualAge(r.birthYear, new Date().getFullYear());
  const majorLimit = getMajorLimit(virtualAge);

  return {
    name: r.name,
    gender: r.gender === 'male' ? '男' : '女',
    calendar: r.isLunar ? '农历' : '公历',
    birthDate: `${r.birthYear}年${r.birthMonth}月${r.birthDay}日 ${r.birthHour}时`,
    yearGanZhi: yearGZ,
    hourGanZhi: hourGZ,
    virtualAge,
    majorLimit: majorLimit ? `${majorLimit.start}-${majorLimit.end}` : '未知',
  };
});

function goBack() {
  window.location.hash = '#/';
}

function goEdit() {
  window.location.hash = `#/edit/${props.recordId}`;
}

onMounted(() => {
  const records = loadRecords();
  record.value = records.find(r => r.id === props.recordId) || null;
});
</script>

<template>
  <div class="record-view">
    <div class="header">
      <button class="btn-back" @click="goBack">← 返回</button>
      <h1>命盘详情</h1>
      <button class="btn-edit" @click="goEdit">编辑</button>
    </div>

    <div v-if="!recordInfo" class="empty-state">
      <p>记录不存在</p>
    </div>

    <div v-else class="content">
      <div class="info-card">
        <h2>基本信息</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">姓名</span>
            <span class="value">{{ recordInfo.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">性别</span>
            <span class="value">{{ recordInfo.gender }}</span>
          </div>
          <div class="info-item">
            <span class="label">历法</span>
            <span class="value">{{ recordInfo.calendar }}</span>
          </div>
          <div class="info-item">
            <span class="label">出生时间</span>
            <span class="value">{{ recordInfo.birthDate }}</span>
          </div>
          <div class="info-item">
            <span class="label">年柱</span>
            <span class="value">{{ recordInfo.yearGanZhi }}</span>
          </div>
          <div class="info-item">
            <span class="label">时柱</span>
            <span class="value">{{ recordInfo.hourGanZhi }}</span>
          </div>
          <div class="info-item">
            <span class="label">虚岁</span>
            <span class="value">{{ recordInfo.virtualAge }}</span>
          </div>
          <div class="info-item">
            <span class="label">大限</span>
            <span class="value">{{ recordInfo.majorLimit }}</span>
          </div>
        </div>
      </div>

      <div class="palace-grid">
        <h2>十二宫位</h2>
        <div class="grid">
          <div v-for="(name, index) in PALACE_NAMES" :key="index" class="palace">
            <div class="palace-name">{{ name }}</div>
            <div class="palace-stars">星曜待排</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.record-view {
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.header h1 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.btn-back {
  background: none;
  border: none;
  color: #6366f1;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
}

.btn-edit {
  background: #e0e7ff;
  color: #4338ca;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.info-card h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  font-size: 12px;
  color: #9ca3af;
}

.info-item .value {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.palace-grid h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.palace {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  min-height: 80px;
}

.palace-name {
  font-size: 12px;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 4px;
}

.palace-stars {
  font-size: 11px;
  color: #9ca3af;
}
</style>
