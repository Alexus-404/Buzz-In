<script setup>
import { defineProps, ref, watch } from 'vue'

const { currentPage, rows, totalRecords, onNextPage, onPrevPage } = defineProps({
    currentPage : {
        type: ref,
        required: true
    },
    rows: {
        type: ref,
        required: true
    },
    totalRecords: {
        type: ref,
        required: true
    },
    onNextPage: {
        type: Function,
        required: true
    },
    onPrevPage: {
        type: Function,
        required: true
    }
})

const currentRow = ref(0)

const onPageChange = (row) => {
    const page = row / rows
    if (page > currentPage) {
        onNextPage()
    } else if (page < currentPage) {
        onPrevPage()
    }
}

watch(() => currentPage, async (newPage) => {
    currentRow.value = newPage * rows
})

</script>

<template>
    <Paginator v-model:first="currentRow" @update:first="onPageChange" :rows :totalRecords
        template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink" />
</template>