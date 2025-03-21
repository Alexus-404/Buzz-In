<script setup>
import { ref, computed } from 'vue'
import TablePaginator from './TablePaginator.vue'

// Defining props for component
const { values, paginator, columns, editable, filterable, exportable, paginated, openForm, openFilter, del } = defineProps({
  values: {
    type: Array,
    required: true
  },
  columns: {
    type: [{
      field: String,
      header: String
    }],
    required: true
  },
  paginator: {
    type: Object
  },
  editable: Boolean,
  filterable: Boolean,
  exportable: Boolean,
  paginated: Boolean,
  openForm: {
    type: Function,
  },
  openFilter: {
    type: Function,
  },
  del: {
    type: Function,
  },
})

// Get current date-time for export filename
const now = new Date().toLocaleDateString()

// Datatable reference
const dataTable = ref()

// Function to call to export data to CSV
const exportCSV = () => {
  dataTable.value.exportCSV()
}

// Function to format CSV's date
const formatCSV = ({ data, field }) => {
  switch (field) {
    case 'time':
      return data.toLocaleString('en-us')
    default:
      return String(data)
  }
}

// Checks if table is empty
const showMessage = computed(() => (values ?? []).length == 0);
</script>

<template>
  <DataTable :exportFunction="formatCSV" :exportFilename="'Logs ' + now" :value="values" ref="dataTable"
    tableStyle="min-width: 50rem" selectionMode="single" :rowClass="() => 'group'">
    <template #header>
      <div class="flex flex-wrap align-items-center justify-between gap-2">
        <span class="text-xl text-900 font-bold">
          <slot /> <!--Pass in name-->
        </span>
        <span class="flex px-4 gap-2">
          <Button icon="pi pi-plus" label="New" raised @click="openForm" v-if="editable"></Button>
          <Button icon="pi pi-filter" label="Filters" raised @click="openFilter" v-if="filterable"></Button>
          <Button icon="pi pi-external-link" label="Export" raised @click="exportCSV" v-if="exportable && !showMessage"></Button>
        </span>
      </div>
    </template>
    <Column v-for="col in columns" :key="col.field" :field="col.field" :header="col.header"></Column>

    <Column class="w-24 !text-end" v-if="editable">
      <template #body="{ data }">
        <div class="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button @click="openForm({ data: data, edit: true })" icon="pi pi-pencil" severity="secondary"
            rounded></Button>
          <Button @click="del(data)" icon="pi pi-trash" severity="urgent" variant="text" rounded></Button>
        </div>
      </template>
    </Column>
  </DataTable>

  <span v-show="showMessage">No results. Please broaden your filters.</span>

  <TablePaginator v-if="paginated" v-bind="{ ...paginator }" />
</template>