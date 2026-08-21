<template>
  <ScreenContainer>
    <TopBar />
    <main class="app-main">
      <router-view />
    </main>
  </ScreenContainer>
</template>

<script setup lang="ts">
import ScreenContainer from '@/components/ScreenContainer.vue'
import TopBar from '@/components/TopBar.vue'
</script>

<style scoped>
.app-main {
  flex: 1;
  min-height: 0;
  padding: var(--gap);
  display: flex;
}
</style>
