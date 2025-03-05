<script setup>
const {values, editable, openForm, openFilter, del} = defineProps({
    values: {
        type: Array,
        required: true
    },
    editable: Boolean,
    openForm: {
        type: Function,
    },
    openFilter: {
        type: Function,
    },
    del: {
        type: Function,
    }
}) 
</script>

<template>
   <DataTable :value="values" tableStyle="min-width: 50rem" selectionMode="single" :rowClass="() => 'group'">
      <template #header>
        <div class="flex flex-wrap align-items-center justify-between gap-2">
          <span class="text-xl text-900 font-bold">
            <slot /> <!--Pass in name-->
          </span>
          <span class="flex px-4 gap-2" v-if="editable">
            <Button icon="pi pi-plus" label="New" raised @click="openForm"></Button>
            <Button icon="pi pi-filter" label="Filters" raised @click="openFilter"></Button>
          </span>
        </div>
      </template>
      <Column field="name" header="Guest"></Column>
      <Column field="property" header="Property"></Column>
      <Column field="status" header="Status"></Column>
      <Column class="w-24 !text-end" v-if="editable">
        <template #body="{ data }">
          <div class="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button @click="openForm(data)" icon="pi pi-pencil" severity="secondary" rounded></Button>
            <Button @click="del(data)" icon="pi pi-trash" severity="urgent" variant="text" rounded></Button>
          </div>
        </template>
      </Column>
    </DataTable>
</template>