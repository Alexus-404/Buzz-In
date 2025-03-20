<script setup>
import { ref, onMounted, watch, computed } from "vue"
import { z } from "zod"
import { useCheckIns } from "@/composables/useCheckIn"
import { useProperties } from "@/composables/useProperties"
import SmartTable from "@/components/SmartTable.vue"
import SmartDialog from "@/components/SmartDialog.vue"

//Composable functions for check-ins and properties
const { queryFilters, columns, orderOptions, checkIns,
  currentPage, totalRows, loadFirstPage, loadNextPage, loadPrevPage,
  deleteCheckIn, editCheckIn, createCheckIn } = useCheckIns()

const { properties } = useProperties()

//Constants and reactives
const GRACE_PERIOD = 2 * 60 * 60 * 1000 // 2 hours grace period for check-ins
const propertyOptions = ref([])
const selectedProperty = ref({ name: "all" })
const initialCheckInValue = ref({})
const isEdit = ref(false)

// Configuration for a paginator
const paginator = ref({
  currentPage: currentPage,
  rows: computed(() => queryFilters.value.limit),
  totalRecords: totalRows,
  onNextPage: loadNextPage,
  onPrevPage: loadPrevPage
})

// Check-in form questions and a validation schema
const checkInQuestions = ref([
  {
    name: "name",
    label: "Guest Name",
    placeholder: "Input guest name",
    type: "text",
    schema: z.string().min(1, { message: "Guest name is required!" }),
    attributes: { autofocus: true }
  },
  {
    name: "property",
    label: "Property",
    placeholder: "Select a property",
    type: "select",
    schema: z.object({
      name: z.string(),
      address: z.string(),
      dtmf: z.number(),
      number: z.string(),
      phoneString: z.string()
    }),
    attributes: {
      options: [],
      optionLabel: "name"
    }
  },
  {
    name: "time",
    label: "Check-In Time",
    type: "datetime",
    schema: z.date({ invalid_type_error: "Invalid date." }),
    attributes: {
      minDate: new Date(Date.now() - GRACE_PERIOD),
      manualInput: false,
      showTime: true,
      hourFormat: "12"
    }
  }
])

// Filters form questions and a validation schema
const filterQuestions = ref([
  {
    name: "order",
    label: "Order By",
    type: "select",
    schema: z.string().min(1, { message: "Valid order required!" }),
    attributes: {
      "v-model": queryFilters.value.order,
      options: orderOptions
    }
  },
  {
    name: "minDate",
    label: "After:",
    type: "datetime",
    schema: z.date({ invalid_type_error: "Invalid date." }),
    attributes: {
      minDate: new Date(Date.now() - GRACE_PERIOD),
      manualInput: false,
      showTime: true,
      hourFormat: "12"
    }
  },
  {
    name: "maxDate",
    label: "Before:",
    type: "datetime",
    schema: z.date({ invalid_type_error: "Invalid date." }),
    attributes: {
      minDate: new Date(Date.now() - GRACE_PERIOD),
      manualInput: false,
      showTime: true,
      hourFormat: "12"
    }
  },
  {
    name: "limit",
    label: "Display",
    type: "number",
    schema: z.number({
      required_error: "Display limit is required.",
      invalid_type_error: "Display limit must be a number."
    }).gte(1).lte(50),
    attributes: { inputId: "integeronly" }
  }
])

// To control dialog visibilities
const display = ref({
  checkIn: false,
  filter: false
})

// Dialog visibility functions
const openFilterDialog = () => display.value.filter = true
const hideFilterDialog = () => display.value.filter = false
const hideCheckIn = () => display.value.checkIn = false

// Open check-in dialog for creating / editing
const openCheckIn = ({ data, edit }) => {
  if (edit) initialCheckInValue.value = { ...data }
  display.value.checkIn = true
  isEdit.value = edit
}

// Handle a check-in form submission
const onFilterSubmit = async ({ valid, values }) => {
  if (!valid) return
  queryFilters.value = values
  loadFirstPage()
  display.value.filter = false
}

// Update existing check-in values
const onCheckInSubmit = ({ valid, values }) => {
  if (!valid) return
  isEdit.value ? editCheckIn(initialCheckInValue.value.id, values) : createCheckIn(values)
  display.value.checkIn = false
  isEdit.value = false
}

// Update selected property
const updateProperty = (value) => {
  queryFilters.value.property = value.name === "all" ? "" : value.number
  loadFirstPage()
}

// Load first page of check-ins upon mounting of page
onMounted(loadFirstPage)

// watches the state changes of different variables
watch(
  () => properties.length,
  (newLength) => {
    if (newLength > 0) {
      checkInQuestions.value[1].attributes.options = properties
      propertyOptions.value = [...properties]
      if (!propertyOptions.value.find(prop => prop.name === "all")) {
        propertyOptions.value.unshift({ name: "all" })
      }
    }
  }
)
</script>

<template>
  <div class="w-[80%] ml-auto mr-auto mt-[5rem] flex items-center">
    <span class="text-xl font-bold">Displaying check-ins for</span>
    <span class="text-xl font-bold px-2">
      <Select 
        v-on:update:model-value="updateProperty" 
        :modelValue="selectedProperty" 
        name="property"
        :options="propertyOptions" 
        option-label="name" 
        class="w-56"
      />
    </span>
  </div>

  <div class="w-[80%] ml-auto mr-auto my-[5rem]">
    <SmartTable 
      :values="checkIns" 
      :columns="columns" 
      editable 
      filterable 
      paginated 
      :paginator 
      :open-form="openCheckIn"
      :open-filter="openFilterDialog" 
      :del="deleteCheckIn" 
    />
  </div>

  <SmartDialog 
    :onSubmit="onCheckInSubmit" 
    :initial-values="initialCheckInValue" 
    :questions="checkInQuestions"
    :visible="display.checkIn" 
    @update:visible="hideCheckIn" 
    header="Create or Edit Check In" 
  />

  <SmartDialog 
    :onSubmit="onFilterSubmit" 
    :initial-values="queryFilters" 
    :questions="filterQuestions"
    :visible="display.filter" 
    @update:visible="hideFilterDialog" 
    header="Filters" 
  />
</template>
