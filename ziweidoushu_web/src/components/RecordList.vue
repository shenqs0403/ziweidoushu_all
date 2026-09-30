<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { PersonRecord } from '../types';
import { loadRecords, deleteRecord } from '../utils/storage';
import { formatDate } from '../utils/helpers';

const records = ref<PersonRecord[]>([]);
const searchQuery = ref('');
const selectedGroup = ref('全部');
const showDeleteConfirm = ref(false);
const deleteId = ref('');

const groups = computed(() => {
  const groupSet = new Set(records.value.map(r => r.group || '默认分组'));
  return ['全部', ...Array.from(groupSet)];
});

const filteredRecords = computed(() => {
  let result = records.value;

  if (selectedGroup.value !== '全部') {
    result = result.filter(r => (r.group || '默认分组') === selectedGroup.value);
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase();
    result = result.filter(r =>
      r.name.toLowerCase().includes(query) ||
      (r.group || '').toLowerCase().includes(query)
    );
  }

  return result;
});

const groupedRecords = computed(() => {
  const groups: Record<string, PersonRecord[]> = {};
  filteredRecords.value.forEach(r => {
    const groupName = r.group || '默认分组';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(r);
  });
  return groups;
});

function refreshRecords() {
  records.value = loadRecords();
}

function confirmDelete(id: string) {
  deleteId.value = id;
  showDeleteConfirm.value = true;
}

function handleDelete() {
  deleteRecord(deleteId.value);
  showDeleteConfirm.value = false;
  refreshRecords();
}

function cancelDelete() {
  showDeleteConfirm.value = false;
}

function goAdd() {
  window.location.hash = '#/add';
}

function goAbout() {
  window.location.hash = '#/about';
}

function editRecord(id: string) {
  window.location.hash = '#/edit/' + id;
}

function viewRecord(id: string) {
  window.location.hash = '#/view/' + id;
}

function selectGroup(group: string) {
  selectedGroup.value = group;
}

onMounted(refreshRecords);
</script>

<template>
  <div class="record-list">
    <div class="header">
      <h1>紫微斗数</h1>
      <button class="btn-about" @click="goAbout">关于</button>
    </div>

    <div class="search-box">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索姓名或分组..."
        class="search-input"
      />
    </div>

    <div class="group-tabs">
      <div
        v-for="group in groups"
        :key="group"
        class="group-tab"
        :class="{ active: selectedGroup === group }"
        @click="selectGroup(group)"
      >
        {{ group }}
      </div>
    </div>

    <div v-if="filteredRecords.length === 0" class="empty-state">
      <p>暂无记录</p>
      <p>点击下方新增按钮添加</p>
    </div>

    <div v-else class="list">
      <div v-for="(groupRecords, groupName) in groupedRecords" :key="groupName" class="group-section">
        <div class="group-header">{{ groupName }}</div>
        <div
          v-for="record in groupRecords"
          :key="record.id"
          class="record-item"
          @click="viewRecord(record.id)"
        >
          <div class="record-info">
            <div class="record-name">{{ record.name }}</div>
            <div class="record-detail">
              <span>{{ record.gender === 'male' ? '男' : '女' }}</span>
              <span>{{ record.isLunar ? '农历' : '公历' }}</span>
              <span>{{ record.birthYear }}年{{ record.birthMonth }}月{{ record.birthDay }}日 {{ record.birthHour }}时</span>
            </div>
            <div class="record-date">创建于 {{ formatDate(record.createdAt) }}</div>
          </div>
          <div class="record-actions" @click.stop>
            <button class="btn-edit" @click="editRecord(record.id)">编辑</button>
            <button class="btn-delete" @click="confirmDelete(record.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <button class="btn-add" @click="goAdd">+</button>

    <div v-if="showDeleteConfirm" class="modal-overlay" @click="cancelDelete">
      <div class="modal" @click.stop>
        <h3>确认删除</h3>
        <p>确定要删除这条记录吗？</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="cancelDelete">取消</button>
          <button class="btn-confirm" @click="handleDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.record-list {
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 80px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.btn-about {
  background: #f3f4f6;
  color: #374151;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.btn-about:hover {
  background: #e5e7eb;
}

.search-box {
  margin-bottom: 12px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #10b981;
}

.group-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.group-tab {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.group-tab.active {
  background: #10b981;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-header {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.record-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.record-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.record-info {
  flex: 1;
}

.record-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.record-detail {
  display: flex;
  gap: 12px;
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 4px;
}

.record-date {
  color: #9ca3af;
  font-size: 12px;
}

.record-actions {
  display: flex;
  gap: 8px;
}

.btn-edit, .btn-delete {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 13px;
}

.btn-edit {
  background: #e0e7ff;
  color: #4338ca;
}

.btn-delete {
  background: #fee2e2;
  color: #dc2626;
}

.btn-add {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #10b981;
  color: white;
  border: none;
  font-size: 52px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.btn-add:hover {
  background: #059669;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 24px;
  min-width: 300px;
}

.modal h3 {
  margin: 0 0 12px 0;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-cancel, .btn-confirm {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-confirm {
  background: #dc2626;
  color: white;
}
</style>
