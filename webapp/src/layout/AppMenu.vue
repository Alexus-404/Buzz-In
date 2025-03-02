<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useLayout } from "@/composables/layout";

const { setActiveMenuItem, layoutState } = useLayout();
const router = useRouter();

const model = ref([
  { label: "Dashboard", icon: "pi pi-home", to: "Dashboard" },
  { label: "Check-In Logs", icon: "pi pi-address-book", to: "Logs" },
  { label: "Properties", icon: "pi pi-map-marker", to: "Properties" },
]);

setActiveMenuItem(model.value[0]);

const onClick = (item) => {
  setActiveMenuItem(item);
  router.push({ name: item.to });
};
</script>

<template>
  <div
    class="h-full top-[50px] left-0 bottom-0 w-64 bg-surface border-r shadow-sm"
    v-if="layoutState.sideBarMenuActive"
  >
    <ButtonGroup class="w-full flex flex-col">
      <Button
        v-for="item in model"
        :key="item.label"
        @click="onClick(item)"
        variant="text"
        style="justify-content: flex-start; align-items: center"
        :style="
          layoutState.activeMenuItem === item
            ? { backgroundColor: '#f0f0f0' }
            : {}
        "
      >
        <i :class="item.icon" style="margin-right: 8px" />
        {{ item.label }}
      </Button>
    </ButtonGroup>
  </div>
</template>
