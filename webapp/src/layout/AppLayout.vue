<script setup>
import {computed} from 'vue'
import {getAuth} from 'firebase/auth'
import Sidebar from '../components/SideBar.vue';
import TopBar from "../components/TopBar.vue";

const auth = getAuth()
const isLoggedIn = computed(() => auth.currentUser)

</script>

<template>
  <!-- Top Bar -->
  <nav class="fixed top-0 left-0 right-0 z-10">
    <div class="w-full h-[50px] bg-surface border-b shadow-sm">
      <TopBar />
    </div>
  </nav>

  <!-- Wrapper for Body -->
  <div class="pt-[50px]">
    <!-- Side Bar-->
    <aside class="h-full fixed">
      <Sidebar />
    </aside>

    <!-- Main Content -->
    <main class="ml-64">
      <div class="w-full h-full bg-surface">
        <router-view v-if="isLoggedIn" />
        <i class="pi pi-spin pi-spinner text-xl" v-else />
      </div>
    </main>
  </div>
</template>
