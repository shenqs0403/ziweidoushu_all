<script setup lang="ts">
const emit = defineEmits<{
  (e: 'close'): void;
}>();

const version = '0.1.0';
const developerEmail = 'shenqs0403@163.com';

function goBack() {
  emit('close');
}
</script>

<template>
  <div class="about-page">
    <div class="header">
      <button class="btn-back" @click="goBack">← 返回</button>
      <h1>关于</h1>
    </div>

    <div class="content">
      <div class="app-info">
        <h2>紫微斗数</h2>
        <p class="version">版本 {{ version }}</p>
      </div>

      <div class="info-section">
        <h3>开发者信息</h3>
        <p>开发者邮箱：{{ developerEmail }}</p>
      </div>

      <div class="info-section">
        <h3>AI 声明</h3>
        <p>本软件由 AI 程序辅助开发，可能存在功能缺陷或错误。</p>
        <p>使用本软件所产生的任何后果由使用者自行承担，开发者不承担任何责任。</p>
        <p>请勿将本软件用于商业用途或非法用途。</p>
      </div>

      <div class="info-section">
        <h3>风险提示</h3>
        <p>1. 本软件提供的命理分析结果仅供参考，不构成任何决策建议。</p>
        <p>2. 用户数据保存在本地，请自行备份重要数据。</p>
        <p>3. 本软件不保证数据的绝对安全性，请妥善保管个人信息。</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-page {
  padding: 16px;
  max-width: 600px;
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
}

.btn-back {
  background: none;
  border: none;
  color: #6366f1;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.app-info {
  text-align: center;
  padding: 24px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.app-info h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.version {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.info-section {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 20px;
}

.info-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #374151;
}

.info-section p {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 8px 0;
  line-height: 1.6;
}

.info-section p:last-child {
  margin-bottom: 0;
}
</style>
