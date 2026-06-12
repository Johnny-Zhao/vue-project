<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
</script>

<template>
  <div class="app-layout">
    <AppSidebar />

    <main class="layout-main">
      <AppHeader />

      <section class="page-container">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: grid;
  grid-template-columns: 268px minmax(0, 1fr);
  gap: 1rem;
  min-height: calc(100vh - 40px);
}

.layout-main {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.page-container {
  min-width: 0;
}

@media (max-width: 980px) {
  .app-layout {
    grid-template-columns: 1fr;
  }
}
</style>
