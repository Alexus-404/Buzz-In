<script setup>
import { ref, onMounted, watch } from "vue"
import {z} from 'zod'
import { useCheckIns } from "@/composables/useCheckIn"
import { useProperties } from "@/composables/useProperties"
import SmartTable from "@/components/SmartTable.vue"
import SmartDialog from "@/components/SmartDialog.vue"

const {queryFilters, columns, orderOptions, checkIns, refreshQuery, deleteCheckIn, editCheckIn, createCheckIn} = useCheckIns()
const {properties} = useProperties()

const GRACE_PERIOD = 2 * 60 * 60 * 1000 //able to check in 2 hours away from check in time
const propertyOptions = ref([]) //to be populated with other properties
const selectedProperty = ref({
  name : "all"
}) //default value
const initialCheckInValue = ref({})
const isEdit = ref(false)

const checkInQuestions = ref([
  {
    name: "name",
    label:"Guest Name",
    placeholder: "Input guest name",
    type: "text",
    schema: z.string().min(1, {message: "Guest name is required!"}),
    attributes: {
      autofocus : true,
    }
  },
  {
    name: "property",
    label:"Property",
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
      optionLabel: "name",
    }
  },
  {
    name: "time",
    label:"Check-In Time",
    type: "datetime",
    schema: z.date({invalid_type_error: "Invalid date."}),
    attributes: {
      minDate: new Date(Date.now() - GRACE_PERIOD),
      manualInput: false,
      showTime: true,
      hourFormat: "12",
    }
  }, 
])

const filterQuestions = ref([
  {
    name: "order",
    label:"Order By",
    type: "select",
    schema: z.string().min(1, {message: "Valid order required!"}),
    attributes: {
      "v-model": queryFilters.value.order,
      options: orderOptions
    }
  },
  {
    name: "minDate",
    label:"After:",
    type: "datetime",
    schema: z.date({invalid_type_error: "Invalid date."}),
    attributes: {
      minDate: new Date(Date.now() - GRACE_PERIOD),
      manualInput: false,
      showTime: true,
      hourFormat: "12",
    }
  },
  {
    name: "maxDate",
    label:"Before:",
    type: "datetime",
    schema: z.date({invalid_type_error: "Invalid date."}),
    attributes: {
      minDate: new Date(Date.now() - GRACE_PERIOD),
      manualInput: false,
      showTime: true,
      hourFormat: "12",
    }
  },
  {
    name: "limit",
    label:"Display",
    type: "number",
    schema: z.number({
      required_error: "Display limit is required.",
      invalid_type_error: "Display limit must be a number."
    }),
    attributes: {
      inputId: "integeronly",
      min: 25,
      max: 50,
    }
  },    
])

const display = ref({
  checkIn : false,
  filter : false,
})

const openFilterDialog = () => {
  display.value.filter = true
}

const hideFilterDialog = () => {
  display.value.filter = false
}

const openCheckIn = ({data, edit}) => {
  if (edit) initialCheckInValue.value = {...data}
  display.value.checkIn = true

  isEdit.value = edit
}

const hideCheckIn = () => {
  display.value.checkIn = false
}

const onFilterSubmit = async ({ valid, values }) => {
  if (!valid) return
  queryFilters.value = values
  refreshQuery()
  display.value.filter = false
}

const onCheckInSubmit = ({ valid, values }) => {
  if (!valid) return
  if (isEdit.value) editCheckIn(initialCheckInValue.value.id, values)
  else createCheckIn(values)
  display.value.checkIn = false
  isEdit.value = false
}

const updateProperty = (value) => {
  if (value.name === "all") queryFilters.value.property = ""
  else queryFilters.value.property = value.number
  refreshQuery()
}

onMounted(async () => {
  refreshQuery()
})

watch(
  () => properties.length,
  (newLength) => {
    if (newLength > 0) {
      checkInQuestions.value[1].attributes.options = properties
      propertyOptions.value = [...properties]
      if (!propertyOptions.value.includes({name : "all"})) {
        propertyOptions.value.unshift({name : "all"})
      }
    }
  }
)

</script>

<template>
  <!-- Header -->
  <div class="w-[80%] ml-auto mr-auto mt-[5rem] flex items-center">
    <span class="text-xl font-bold">Displaying check-ins for </span>
    <span class="text-xl font-bold px-2">
      <Select v-on:update:model-value="updateProperty" :modelValue="selectedProperty" name="property" :options="propertyOptions" option-label="name"
        class="w-56">
      </Select>
    </span>
  </div>

  <!-- Body -->
  <div class="w-[80%] ml-auto mr-auto my-[5rem]">
    <SmartTable :values="checkIns" :columns="columns" editable filterable :open-form="openCheckIn" :open-filter="openFilterDialog" :del="deleteCheckIn" />
  </div>

  <!-- Check-In Dialog -->
  <SmartDialog :onSubmit="onCheckInSubmit" :initial-values="initialCheckInValue" :questions="checkInQuestions" :visible="display.checkIn" @update:visible="hideCheckIn" header="Create or Edit Check In" />
  
  <!-- Filter Check In Dialog -->
  <SmartDialog :onSubmit="onFilterSubmit" :initial-values="queryFilters" :questions="filterQuestions" :visible="display.filter" @update:visible="hideFilterDialog" header="Filters" />

</template>
