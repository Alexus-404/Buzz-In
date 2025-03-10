<script setup>
import { useCallLogs } from "@/composables/useCallLog";
import SmartTable from "@/components/SmartTable.vue";

const {callLogs, columns} = useCallLogs()

</script>

<template>
  <!-- Header -->
  <div class="w-[80%] ml-auto mr-auto mt-[5rem] flex items-center">
    <span class="text-xl font-bold">Call Log</span>
  </div>

  <!-- Body -->
  <div class="w-[80%] ml-auto mr-auto my-[5rem]">
    <SmartTable :values="callLogs" :columns="columns" exportable />
  </div>
</template>
