<script setup>
import { ref, onMounted } from "vue"
import {z} from 'zod'
import {Question} from "@/services/question"
import { useCheckIns } from "@/composables/useCheckIn"
import { useProperties } from "@/composables/useProperties"
import CheckInTable from "@/components/CheckInTable.vue"
import SmartDialog from "@/components/SmartDialog.vue"

const {queryFilters, columns, orderOptions, checkIns, refreshQuery, deleteCheckIn, editCheckIn, createCheckIn} = useCheckIns()
const {properties} = useProperties()

const GRACE_PERIOD = 2 * 60 * 60 * 1000 //able to check in 2 hours away from check in time
let isLoaded = false
const selectProperty = ref()

const checkInQuestions = ref([
  new Question({
    name: "name",
    label:"Guest Name",
    placeholder: "Input guest name",
    type: "text",
    schema: z.string().min(1, {message: "Guest name is required!"}),
    attributes: {
      autofocus : true,
    }
  }),
  new Question({
    name: "property",
    label:"Property",
    placeholder: "Select a property",
    type: "select",
    schema: z.object({
      name: z.string(),
      address: z.string(),
      dtmf: z.number(),
      number: z.string()
    }),
    attributes: {
      options: [],
      optionLabel: "name",
    }
  }),
  new Question({
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
  }), 
])

const filterQuestions = ref([
  new Question({
    name: "order",
    label:"Order By",
    type: "select",
    schema: z.string().min(1, {message: "Valid order required!"}),
    attributes: {
      "v-model": queryFilters.order,
      options: orderOptions
    }
  }),
  new Question({
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
  }),
  new Question({
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
  }),  
])

const display = ref({
  checkIn : false,
  filter : false,
})

const openFilterDialog = () => {
  display.value.filter = true
}

const openCheckIn = () => {
  display.value.checkIn = true
}

const onFilterSubmit = async ({ valid, values }) => {
  if (!valid) return
  queryFilters.value = values
  refreshQuery()
  display.value.filter = false
}

const formatPhoneNumber = (phone) => {
  return phone.replace(/\D/g, "")
}

const onCheckInSubmit = ({ valid, values }) => {
  if (!valid) return
  values.time = values.time.getTime()
  values.property = formatPhoneNumber(values.property.number)
  const id = ""

  if (id != "") {
    editCheckIn(id, values)
  } else {
    createCheckIn(values)   
  }

  try {
    display.value.checkIn = false
    refreshQuery()
  } catch (err) {
    console.log("ERROR: ", err)
  }

}

const updateProperty = (value) => {
  if (value.name === "any") {
    queryFilters.value.keywords = []
  } else {
    queryFilters.value.keywords = [value]
  }
}

onMounted(async () => {
  if (!isLoaded) {
    refreshQuery(queryFilters.value)
    checkInQuestions.value[1].attributes.options = properties
    isLoaded = true
  }
})
</script>

<template>
  <!-- Header -->
  <div class="w-[80%] ml-auto mr-auto mt-[5rem] flex items-center">
    <span class="text-xl font-bold">Displaying check-ins for </span>
    <span class="text-xl font-bold px-2">
      <Select :update:model-value="updateProperty" name="property" :options="selectProperty" optionLabel="name"
        class="w-56" :default-value="All">
      </Select>
    </span>
  </div>

  <!-- Body -->
  <div class="w-[80%] ml-auto mr-auto my-[5rem]">
    <CheckInTable :values="checkIns" :columns="columns" editable filterable :open-form="openCheckIn" :open-filter="openFilterDialog" :del="deleteCheckIn" />
  </div>

  <!-- Check-In Dialog -->
  <SmartDialog :onSubmit="onCheckInSubmit" :questions="checkInQuestions" v-model:visible="display.checkIn" header="Create or Edit Check In" />
  
  <!-- Filter Check In Dialog -->
  <SmartDialog :onSubmit="onFilterSubmit" :questions="filterQuestions" v-model:visible="display.filter" header="Filters" />

</template>
