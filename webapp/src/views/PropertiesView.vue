<script setup>
import { ref } from "vue"
import {z} from 'zod'
import validator from "validator"
import { useProperties } from "@/composables/useProperties"

import SmartDialog from "@/components/SmartDialog.vue"
import SmartTable from "@/components/SmartTable.vue"

const { properties, columns, deleteProperty, submitProperty } = useProperties()
const showPropertyModal = ref(false)

const questions = [
{
    name: "name",
    label:"Property Name",
    type: "text",
    schema: z.string().min(1, {message: "Guest name is required!"}),
    attributes: {
      mask: "autofocus"
    }
  },
{
    name: "address",
    label:"Condo Address",
    type: "text",
    schema: z.string({invalid_type_error: "Invalid address!"}),
    attributes: {
      mask: "autofocus"
    }
  },
{
    name: "dtmf",
    label:"Dial Tone",
    type: "number",
    schema: z.number().int().nonnegative().lt(10),
    attributes: {
      min: 0,
      max: 9,
      inputId: "integeronly",
    }
  },
{
    name: "number",
    label:"Condo Phone Number",
    type: "mask",
    schema: z.string().refine(validator.isMobilePhone, {message: "Invalid phone number!"}),
    attributes: {
      mask: "+9 (999) 999-9999"
    }
  },
]

const initialPropertyValue = ref({})

const openProperty = ({data}) => {
  initialPropertyValue.value = {...data}
  showPropertyModal.value = true
}

const onSubmitProperty = ({ valid, values }) => {
  if (!valid) return
  try {
    submitProperty(values)
    showPropertyModal.value = false
  } catch (err) {
    console.error("ERROR: ", err)
  }
}
</script>

<template>
    <!-- Header -->
    <div class="w-[80%] ml-auto mr-auto mt-[5rem] flex items-center">
      <span class="text-xl font-bold">Properties</span>
    </div>

  <!-- Body -->
  <div class="w-[80%] ml-auto mr-auto my-[2rem]">
    <SmartTable :values="properties" :columns="columns" editable :open-form="openProperty" :del="deleteProperty" />
  </div>

  <SmartDialog :onSubmit="onSubmitProperty" :initial-values="initialPropertyValue" :questions="questions" v-model:visible="showPropertyModal" header="Property"/>
</template>
