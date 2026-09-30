<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import RecordList from './components/RecordList.vue';
import RecordForm from './components/RecordForm.vue';
import RecordView from './components/RecordView.vue';
import AboutPage from './components/AboutPage.vue';

const currentRoute = ref('list');
const editId = ref<string | undefined>(undefined);
const viewId = ref<string>('');
const showFormDrawer = ref(false);

function handleHashChange() {
  const hash = window.location.hash.slice(2) || '';
  const parts = hash.split('/').filter(Boolean);

  if (parts[0] === 'add') {
    currentRoute.value = 'list';
    showFormDrawer.value = true;
    editId.value = undefined;
  } else if (parts[0] === 'edit' && parts[1]) {
    currentRoute.value = 'list';
    showFormDrawer.value = true;
    editId.value = parts[1];
  } else if (parts[0] === 'view' && parts[1]) {
    currentRoute.value = 'view';
    viewId.value = parts[1];
    showFormDrawer.value = false;
  } else if (parts[0] === 'about') {
    currentRoute.value = 'about';
    showFormDrawer.value = false;
  } else {
    currentRoute.value = 'list';
    editId.value = undefined;
    showFormDrawer.value = false;
  }
}

function closeForm() {
  showFormDrawer.value = false;
  editId.value = undefined;
  window.location.hash = '#/';
}

function closeAbout() {
  currentRoute.value = 'list';
  window.location.hash = '#/';
}

function onSaved() {
  showFormDrawer.value = false;
  editId.value = undefined;
  window.location.hash = '#/';
}

onMounted(() => {
  handleHashChange();
  window.addEventListener('hashchange', handleHashChange);
});

onUnmounted(() => {
  window.removeEventListener('hashchange', handleHashChange);
});
</script>

<template>
  <div class="app">
    <RecordList v-if="currentRoute === 'list'" />
    <RecordView v-else-if="currentRoute === 'view'" :record-id="viewId" />
    <AboutPage v-else-if="currentRoute === 'about'" @close="closeAbout" />

    <RecordForm
      v-if="showFormDrawer"
      :edit-id="editId"
      @close="closeForm"
      @saved="onSaved"
    />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f3f4f6;
  color: #1f2937;
  line-height: 1.5;
}

.app {
  min-height: 100vh;
}
</style>
