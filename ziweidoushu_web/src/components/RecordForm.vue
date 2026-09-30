<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { PersonRecord } from '../types';
import { addRecord, updateRecord, loadRecords } from '../utils/storage';
import { generateId } from '../utils/helpers';

const props = defineProps<{
  editId?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const name = ref('');
const gender = ref<'male' | 'female'>('male');
const isLunar = ref(false);
const birthYear = ref(new Date().getFullYear());
const birthMonth = ref(1);
const birthDay = ref(1);
const birthHour = ref(0);
const group = ref('默认分组');

const showDatePicker = ref(false);

const isEdit = computed(() => !!props.editId);
const title = computed(() => isEdit.value ? '编辑命盘' : '新增命盘');

const LUNAR_MONTHS = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];

const LUNAR_LEAP_MONTHS: Record<number, number> = {
  2020: 4, 2023: 2, 2025: 6, 2027: 5, 2028: 4, 2029: 2, 2030: 5,
  2031: 3, 2032: 7, 2033: 11, 2034: 9, 2035: 6, 2036: 4, 2037: 2,
  2038: 7, 2039: 5, 2040: 2, 2041: 6, 2042: 4, 2043: 2, 2044: 7,
  2045: 5, 2046: 3, 2047: 8, 2048: 6, 2049: 4, 2050: 2,
};

const years = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 100 }, (_, i) => currentYear - i);
});

const months = computed(() => {
  if (!isLunar.value) {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }
  const leapMonth = LUNAR_LEAP_MONTHS[birthYear.value];
  if (leapMonth) {
    const result: number[] = [];
    for (let i = 1; i <= 12; i++) {
      result.push(i);
      if (i === leapMonth) {
        result.push(-leapMonth);
      }
    }
    return result;
  }
  return Array.from({ length: 12 }, (_, i) => i + 1);
});

const monthDisplay = computed(() => {
  return (month: number) => {
    if (isLunar.value) {
      if (month < 0) {
        return '闰' + LUNAR_MONTHS[-month - 1];
      }
      return LUNAR_MONTHS[month - 1] || '';
    }
    return month + '月';
  };
});

const days = computed(() => {
  if (isLunar.value) {
    return Array.from({ length: 30 }, (_, i) => i + 1);
  }
  const maxDay = new Date(birthYear.value, birthMonth.value, 0).getDate();
  return Array.from({ length: maxDay }, (_, i) => i + 1);
});



const dayDisplay = computed(() => {
  return (day: number) => {
    if (isLunar.value) {
      const LUNAR_DAYS = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
        '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
        '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
      return LUNAR_DAYS[day - 1] || '';
    }
    return day + '日';
  };
});

const dateDisplay = computed(() => {
  const hourLabel = hours.value.find(h => h.value === birthHour.value)?.label || '';
  const monthStr = monthDisplay.value(birthMonth.value);
  const dayStr = dayDisplay.value(birthDay.value);
  return `${birthYear.value}年${monthStr}${dayStr} ${hourLabel}`;
});

const hours = computed(() => [
  { value: 0, label: '子时 (23:00-01:00)' },
  { value: 1, label: '丑时 (01:00-03:00)' },
  { value: 2, label: '寅时 (03:00-05:00)' },
  { value: 3, label: '卯时 (05:00-07:00)' },
  { value: 4, label: '辰时 (07:00-09:00)' },
  { value: 5, label: '巳时 (09:00-11:00)' },
  { value: 6, label: '午时 (11:00-13:00)' },
  { value: 7, label: '未时 (13:00-15:00)' },
  { value: 8, label: '申时 (15:00-17:00)' },
  { value: 9, label: '酉时 (17:00-19:00)' },
  { value: 10, label: '戌时 (19:00-21:00)' },
  { value: 11, label: '亥时 (21:00-23:00)' },
]);

function openDatePicker() {
  showDatePicker.value = true;
}

function closeDatePicker() {
  showDatePicker.value = false;
}

function confirmDate() {
  showDatePicker.value = false;
}

function handleSubmit() {
  if (!name.value.trim()) {
    alert('请输入姓名');
    return;
  }

  const record: PersonRecord = {
    id: isEdit.value ? props.editId! : generateId(),
    name: name.value.trim(),
    birthYear: birthYear.value,
    birthMonth: birthMonth.value,
    birthDay: birthDay.value,
    birthHour: birthHour.value,
    isLunar: isLunar.value,
    gender: gender.value,
    group: group.value,
    createdAt: isEdit.value ? (loadRecords().find(r => r.id === props.editId)?.createdAt || Date.now()) : Date.now(),
    updatedAt: Date.now(),
  };

  if (isEdit.value) {
    updateRecord(props.editId!, record);
  } else {
    addRecord(record);
  }

  emit('saved');
  emit('close');
}

function handleCancel() {
  emit('close');
}

onMounted(() => {
  if (isEdit.value && props.editId) {
    const record = loadRecords().find(r => r.id === props.editId);
    if (record) {
      name.value = record.name;
      gender.value = record.gender;
      isLunar.value = record.isLunar;
      birthYear.value = record.birthYear;
      birthMonth.value = record.birthMonth;
      birthDay.value = record.birthDay;
      birthHour.value = record.birthHour;
      group.value = record.group || '默认分组';
    }
  }
});
</script>

<template>
  <div class="drawer-overlay" @click="handleCancel">
    <div class="drawer" @click.stop>
      <div class="drawer-header">
        <h2>{{ title }}</h2>
        <button class="btn-close" @click="handleCancel">&times;</button>
      </div>

      <div class="drawer-content">
        <div class="form-group">
          <label>姓名</label>
          <input v-model="name" type="text" placeholder="输入姓名或标记" />
        </div>

        <div class="form-group">
          <label>性别</label>
          <div class="radio-group">
            <label class="radio-label">
              <input v-model="gender" type="radio" value="male" />
              <span>男</span>
            </label>
            <label class="radio-label">
              <input v-model="gender" type="radio" value="female" />
              <span>女</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label>历法</label>
          <div class="radio-group">
            <label class="radio-label">
              <input v-model="isLunar" type="radio" :value="false" />
              <span>阳历</span>
            </label>
            <label class="radio-label">
              <input v-model="isLunar" type="radio" :value="true" />
              <span>农历</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label>出生时间</label>
          <div class="date-display" @click="openDatePicker">
            {{ dateDisplay }}
          </div>
        </div>

        <div class="form-group">
          <label>分组</label>
          <input v-model="group" type="text" placeholder="输入分组名称" />
        </div>
      </div>

      <div class="drawer-footer">
        <button class="btn-submit" @click="handleSubmit">保存</button>
      </div>
    </div>

    <!-- 日期时辰选择器抽屉 -->
    <div v-if="showDatePicker" class="picker-overlay" @click="closeDatePicker">
      <div class="picker-drawer" @click.stop>
        <div class="picker-header">
          <button class="picker-btn" @click="closeDatePicker">取消</button>
          <h3>选择出生时间</h3>
          <button class="picker-btn confirm" @click="confirmDate">确定</button>
        </div>
        <div class="picker-content">
          <div class="picker-column">
            <div class="picker-label">年</div>
            <div class="picker-scroll">
              <div v-for="y in years" :key="y" class="picker-item" :class="{ active: y === birthYear }" @click="birthYear = y">
                {{ y }}年
              </div>
            </div>
          </div>
          <div class="picker-column">
            <div class="picker-label">月</div>
            <div class="picker-scroll">
              <div v-for="m in months" :key="m" class="picker-item" :class="{ active: m === birthMonth }" @click="birthMonth = m">
                {{ monthDisplay(m) }}
              </div>
            </div>
          </div>
          <div class="picker-column">
            <div class="picker-label">日</div>
            <div class="picker-scroll">
              <div v-for="d in days" :key="d" class="picker-item" :class="{ active: d === birthDay }" @click="birthDay = d">
                {{ dayDisplay(d) }}
              </div>
            </div>
          </div>
          <div class="picker-column">
            <div class="picker-label">时</div>
            <div class="picker-scroll">
              <div v-for="h in hours" :key="h.value" class="picker-item" :class="{ active: h.value === birthHour }" @click="birthHour = h.value">
                {{ h.label.split(' ')[0] }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.drawer {
  background: white;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.drawer-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.form-group input[type="text"] {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}

.form-group input[type="text"]:focus {
  outline: none;
  border-color: #10b981;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
}

.radio-label input[type="radio"] {
  width: 18px;
  height: 18px;
  accent-color: #10b981;
}

.date-display {
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  background: #f9fafb;
}

.date-display:active {
  background: #f3f4f6;
}

.drawer-footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-submit {
  width: 100%;
  padding: 14px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.btn-submit:hover {
  background: #059669;
}

/* 选择器样式 */
.picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.picker-drawer {
  background: white;
  width: 100%;
  max-width: 600px;
  max-height: 70vh;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.picker-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.picker-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
}

.picker-btn.confirm {
  color: #10b981;
  font-weight: 500;
}

.picker-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.picker-content.single {
  padding: 0;
}

.picker-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #f3f4f6;
}

.picker-column:last-child {
  border-right: none;
}

.picker-label {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  border-bottom: 1px solid #f3f4f6;
}

.picker-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.picker-item {
  padding: 10px 16px;
  text-align: center;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
}

.picker-item.active {
  color: #10b981;
  font-weight: 600;
  background: #f0fdf4;
}
</style>
