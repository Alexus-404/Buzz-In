<script setup>
import { ref, onMounted } from "vue";
import { useCheckIns } from "@/composables/useCheckIn";
import { useProperties } from "@/services/propertyService";
import {Question} from "@/services/question"
import {z} from 'zod'
import CheckInTable from "@/components/CheckInTable.vue";
import CheckInDialog from "@/components/CheckInDialog.vue";

const {queryFilters, checkIns, refreshQuery, deleteCheckIn, editCheckIn, createCheckIn} = useCheckIns()
const {getProperties} = useProperties()

const GRACE_PERIOD = 2 * 60 * 60 * 1000; //able to check in 2 hours away from check in time

let properties = getProperties();
const selectProperty = ref();

const questions = ref([
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

const checkInDialog = ref(false);
const filterDialog = ref(false);
let queryValues = {};

let isLoaded = false;

let orderOptions = ref(["oldest", "newest"]);

const queryFormResolver = ({ values }) => {
  queryValues = values;

  return {};
};

const updateProperties = async () => {
  properties = await getProperties();
  selectProperty.value = await getProperties();
};

const updateProperty = (value) => {
  if (value.name === "any") {
    queryFilters.value.keywords = [];
  } else {
    queryFilters.value.keywords = [value];
  }
};


const openFilterDialog = () => {
  filterDialog.value = true;
};

const openCheckIn = () => {
  //optional value

  checkInDialog.value = true;
};

const onFilterSubmit = async ({ valid }) => {
  if (!valid) {
    return;
  }

  refreshQuery(queryValues);
  queryFilters.value = queryValues;
  queryValues = {};
  filterDialog.value = false;
};

const formatPhoneNumber = (phone) => {
  return phone.replace(/\D/g, "");
};

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
    checkInDialog.value = false;
    refreshQuery();
  } catch (err) {
    console.log("ERROR: ", err);
  }

};

onMounted(async () => {
  if (!isLoaded) {
    await updateProperties();
    refreshQuery(queryFilters.value);
    questions.value[1].attributes.options = properties
    console.log(questions.value[1].attributes.options)
    isLoaded = true;
  }
});
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
    <CheckInTable :values="checkIns" editable :open-form="openCheckIn" :open-filter="openFilterDialog" :del="deleteCheckIn" />
  </div>

  <!-- Check-In Dialog -->
  <CheckInDialog :onSubmit="onCheckInSubmit" :questions="questions" v-model:visible="checkInDialog" header="Create or Edit Check In" />
  
  <!-- Filter Check In Dialog -->
  <Dialog v-model:visible="filterDialog" class="w-[450px]" header="Filters" :modal="true">
    <Form v-slot="$form" :initial-values="queryFilters" :resolver="queryFormResolver" class="flex flex-col gap-6"
      @submit="onFilterSubmit">
      <div class="flex flex-col gap-1">
        <label for="order" class="block font-bold mb-3">Order By</label>
        <Select name="order" :options="orderOptions" class="w-56" />
        <Message v-if="$form?.order?.invalid" severity="error" size="small" variant="simple">
          {{ $form?.order?.error.message }}
        </Message>
      </div>
      <div class="flex flex-col gap-1">
        <label for="limit" class="block font-bold mb-3">Limit</label>
        <InputNumber name="limit" fluid />
        <Message v-if="$form?.limit?.invalid" severity="error" size="small" variant="simple">
          {{ $form?.limit?.error.message }}
        </Message>
      </div>
      <div class="flex flex-col gap-1">
        <label for="minDate" class="block font-bold mb-3">After</label>
        <DatePicker name="minDate" :min-date="new Date(Date.now() - GRACE_PERIOD)" :manual-input="false" showTime
          hourFormat="12" fluid />
        <Message v-if="$form?.minDate?.invalid" severity="error" size="small" variant="simple">
          {{ $form?.minDate?.error.message }}
        </Message>
      </div>
      <div class="flex flex-col gap-1">
        <label for="maxDate" class="block font-bold mb-3">Before</label>
        <DatePicker name="maxDate" :min-date="new Date(Date.now() - GRACE_PERIOD)" :manual-input="false" showTime
          hourFormat="12" fluid />
        <Message v-if="$form?.maxDate?.invalid" severity="error" size="small" variant="simple">
          {{ $form?.maxDate?.error.message }}
        </Message>
      </div>
      <Button type="submit" severity="danger" label="Submit" />
    </Form>
  </Dialog>
</template>
