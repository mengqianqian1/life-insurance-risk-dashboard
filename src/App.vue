<template>
  <ScreenContainer>
    <TopBar />
    <main class="app-main">
      <router-view v-slot="{ Component, route }">
        <!-- keep-alive 保留总览页状态，避免切换页面时重新加载数据 -->
        <keep-alive include="OverviewView">
          <component :is="Component" :key="route.fullPath" />
        </keep-alive>
      </router-view>
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
