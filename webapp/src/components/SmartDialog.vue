<script setup>
import {zodResolver} from "@primevue/forms/resolvers/zod"
import {Question} from '@/services/question'
import { InputMask, InputNumber, InputText, Select } from "primevue"
import {z} from 'zod'

import DatePicker from "primevue/datepicker"

const {onSubmit, questions} = defineProps({
    onSubmit: {
        type: Function,
        required: true
    },
    questions: {
        type: [{Question}],
        required: true
    }
})

const resolver = zodResolver(
    z.object(Object.fromEntries(
        questions.map(q => [q.name, q.schema]) //ensures auto type validation
    ))
)

console.log(z.object(Object.fromEntries(
        questions.map(q => [q.name, q.schema]) //ensures auto type validation
    ))
)
const initialValues = Object.fromEntries(
    questions.map(q => [q.name, q.init])
)

function getComponent(type) {
    switch(type) {
        case 'text':
            return InputText
        case 'select':
            return Select
        case 'datetime':
            return DatePicker
        case 'number':
            return InputNumber
        case 'mask':
            return InputMask
        default:
            return InputText
    }
}

</script>

<template>
<Dialog class="w-[450px]" :modal="true">
    <Form v-slot="$form" :initialValues :resolver @submit="onSubmit" class="flex flex-col gap-6">
    
    <div v-for="q in questions" :key="q.name" class="flex flex-col gap-1">
        <label :for="q.name" class="block font-bold mb-3">
            {{ q.label }}
        </label>
        <!-- Dynamically choose component based on question type. Use spread operator to pass all props from q.attr-->
        <component :is="getComponent(q.type)" v-bind="q.getAttributes()" class="w-56" fluid/>
        <Message v-if="$form?.[q.name]?.invalid" severity="error" size="small" variant="simple">
        {{ $form[q.name]?.error?.message }}
        </Message>
    </div>
    <Button type="submit" severity="danger" label="Submit" />
    </Form>
</Dialog>
</template>