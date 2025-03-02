<script setup>
import logo from "@/assets/images/logo-generic.svg";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { auth } from "@/firebase"; //TODO: Change to airbnb auth
import { useLayout } from "@/composables/layout";

const { toggleMenu } = useLayout();

const router = useRouter();
const currentRouteName = computed(() => {
  return router.currentRoute.value.name;
});

const user = auth.currentUser;
const userProfileUrl = user ? user.photoURL : null;

const notifMenu = ref();
const pfpMenu = ref();
const accOptions = ref([
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

const notifToggle = (event) => {
  notifMenu.value.toggle(event);
};
const pfpToggle = (event) => {
  pfpMenu.value.toggle(event);
};
</script>

<template>
  <div class="h-full flex items-center justify-between">
    <!-- Path -->
    <span class="flex items-center h-full overflow-hidden gap-2">
      <Button icon="pi pi-bars" text rounded @click="toggleMenu" />
      <img :src="logo" class="h-[60%]" />
      <i class="pi pi-angle-right text-surface-400" />
      <h3 class="whitespace-nowrap text-surface-400">{{ currentRouteName }}</h3>
    </span>

    <!-- Buttons -->
    <div class="flex justify-end items-center px-10 space-x-2">
      <Button
        icon="pi pi-bell"
        text
        rounded
        class="text-primary"
        aria-haspopup="true"
        aria-controls="overlay_menu1"
        @click="notifToggle"
      />
      <Menu ref="notifMenu" id="overlay_menu1" :popup="true" />

      <Avatar
        :image="userProfileUrl"
        :icon="!userProfileUrl ? 'pi pi-user' : null"
        shape="circle"
        class="bg-primary.500 text-white"
        aria-haspopup="true"
        aria-controls="overlay_menu"
        @click="pfpToggle"
      />
      <Menu ref="pfpMenu" id="overlay_menu" :model="accOptions" :popup="true" />
    </div>
  </div>
</template>
