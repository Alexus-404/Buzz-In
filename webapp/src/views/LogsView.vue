<script setup>
import { getCalls } from '@/services/callLogService'
import { ref, onMounted } from 'vue';

const callLog = ref()
const dt = ref()
let isLoaded = false

const refreshCallLog = async () => {
  callLog.value = await getCalls()
}

const exportCSV = () => {
  dt.value.exportCSV()
}

onMounted(async () => {
  if (!isLoaded) {
    refreshCallLog()
    isLoaded = true
  }
})

</script>

<template>
  <!-- Body -->
  <div class="w-[80%] ml-auto mr-auto my-[5rem]">
    <DataTable
      :value="callLog"
      ref="dt"
      tableStyle="min-width: 50rem"
      :rowClass="() => 'group'"
    >
      <template #header>
        <div class="flex flex-wrap align-items-center justify-between gap-2">
          <span class="text-xl text-900 font-bold">Recent Calls</span>
        </div>
        <div class="text-end pb-4">
            <Button icon="pi pi-external-link" label="Export" @click="exportCSV($event)" />
        </div>
      </template>
      <Column field="time" header="Time"></Column>
      <Column field="property" header="Property"></Column>
      <Column field="status" header="Status" style="width: 10%"></Column>
    </DataTable>
  </div>
</template>
