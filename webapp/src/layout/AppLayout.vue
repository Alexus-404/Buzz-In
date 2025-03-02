<script setup>
import AppMenu from "./AppMenu.vue";
import AppHeader from "./AppHeader.vue";
import AppLoading from "./AppLoading.vue";

import { useUserData } from "@/composables/useUserData";
const { loading } = useUserData();
</script>

<template>
  <!-- Top Bar -->
  <nav class="fixed top-0 left-0 right-0 z-10">
    <div class="w-full h-[50px] bg-surface border-b shadow-sm">
      <app-header />
    </div>
  </nav>

  <!-- Wrapper for Body -->
  <div class="pt-[50px]"> 
    <!-- Side Bar-->
    <aside class="h-full fixed">
      <app-menu />
    </aside>

    <!-- Main Content -->
    <main class="ml-64">
      <div class="w-full h-full bg-surface">
        <app-loading v-if="loading" />
        <router-view v-else />
      </div>
    </main>
  </div>
</template>
