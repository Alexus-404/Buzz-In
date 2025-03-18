<script setup>
import logo from "@/assets/images/logo.png";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { auth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useLayout } from "@/composables/useLayout";

const { toggleMenu } = useLayout();

const router = useRouter();
const currentRouteName = computed(() => {
  return router.currentRoute.value.name;
});

const user = auth.currentUser;
const userProfileUrl = user ? user.photoURL : null;

const pfpMenu = ref();
const accOptions = ref([
  {
    label: "Log Out",
    command: () => {
      signOut(auth)
      router.push("login")
    },
  }
]);

const pfpToggle = (event) => {
  pfpMenu.value.toggle(event);
};
</script>

<template>
  <div class="h-full flex items-center justify-between bg-surface">
    <!-- Path -->
    <span class="flex items-center h-full overflow-hidden gap-2">
      <Button icon="pi pi-bars" text rounded @click="toggleMenu" />
      <img :src="logo" class="h-[60%]" />
      <i class="pi pi-angle-right text-surface-400" />
      <h3 class="whitespace-nowrap text-surface-400">{{ currentRouteName }}</h3>
    </span>

    <!-- Buttons -->
    <div class="flex justify-end items-center px-10 space-x-2">
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
