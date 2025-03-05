<script setup>
import { ref, onMounted } from "vue"
import {z} from 'zod'
import validator from "validator"
import {Question} from "@/services/question"
import { formatPhoneNumber } from "@/services/formatPhone"
import { useProperties } from "@/composables/useProperties"

import SmartDialog from "@/components/SmartDialog.vue"
import CheckInTable from "@/components/CheckInTable.vue"

const { properties, columns, refreshProperties, deleteProperty, submitProperty } = useProperties()

const showPropertyModal = ref(false)

let isLoaded = false

const questions = [
new Question({
    name: "name",
    label:"Property Name",
    type: "text",
    schema: z.string().min(1, {message: "Guest name is required!"}),
    attributes: {
      mask: "autofocus"
    }
  }),
new Question({
    name: "address",
    label:"Condo Address",
    type: "text",
    schema: z.string({invalid_type_error: "Invalid address!"}),
    attributes: {
      mask: "autofocus"
    }
  }),
new Question({
    name: "dtmf",
    label:"Dial Tone",
    type: "number",
    schema: z.number().int().nonnegative().lt(10),
    attributes: {
      min: 0,
      max: 9,
      inputId: "integeronly",
    }
  }),
new Question({
    name: "number",
    label:"Condo Phone Number",
    type: "mask",
    schema: z.string().refine(validator.isMobilePhone, {message: "Invalid phone number!"}),
    attributes: {
      mask: "+9 (999) 999-9999"
    }
  }),
]

const openProperty = () => {
  showPropertyModal.value = true
}

const onSubmitProperty = ({ valid, values }) => {
  if (!valid) return
  console.log(values)
  const number = formatPhoneNumber(values.number)
  values.number = null

  try {
    submitProperty(number, values)
    showPropertyModal.value = false
    refreshProperties()
  } catch (err) {
    console.log("ERROR: ", err)
  }
}

onMounted(async () => {
  if (!isLoaded) {
    await refreshProperties()
    isLoaded = true
  }
})
</script>

<template>
  <!-- Body -->
  <div class="w-[80%] ml-auto mr-auto my-[5rem]">
    <CheckInTable :values="properties" :columns="columns" editable :open-form="openProperty" :del="deleteProperty" />
  </div>

  <SmartDialog :onSubmit="onSubmitProperty" :questions="questions" v-model:visible="showPropertyModal" header="Property"/>
</template>
