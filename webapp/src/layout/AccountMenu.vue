<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const menuOptions = ref([
  {
    label: "Account Info",
    command: () => {
      router.push({ name: "Account" });
    },
  },
  {
    label: "Security",
    command: () => {
      router.push({ name: "Security" });
    },
  },
]);
</script>

<template>
  <div class="w-[25%] h-full bg-surface border-r flex">
    <Menu :model="menuOptions" class="flex-grow"/>
  </div>
</template>
