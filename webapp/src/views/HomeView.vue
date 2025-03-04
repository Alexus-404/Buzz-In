<script setup>
import { ref, onMounted } from "vue";
import { auth, db, ref as fbRef, set } from "@/firebase";
import { push, remove } from "firebase/database";
import { queryCheckIns } from "@/services/checkInService";
import { getProperties } from "@/services/propertyService";

const MAX_DELTA = 30 * 24 * 60 * 60 * 1000; //display all check ins before 30 days
const GRACE_PERIOD = 2 * 60 * 60 * 1000; //able to check in 2 hours away from check in time

const checkInDialog = ref(false);
const filterDialog = ref(false);
const pathToUser = "users/" + auth.currentUser.uid;
let formValues = {};
let queryValues = {};

let isLoaded = false;

let orderOptions = ref(["oldest", "newest"]);

const queryFilters = ref({
  order: "recent",
  limit: 25,
  minDate: new Date(Date.now() - GRACE_PERIOD),
  maxDate: new Date(Date.now() + MAX_DELTA),
  keywords: [],
});

const queryFormResolver = ({ values }) => {
  queryValues = values;

  return {};
};

const formCreateResolver = ({ values }) => {
  const errors = {};

  if (!values.name) {
    errors.name = [{ message: "Guest name required." }];
  }

  if (!values.property) {
    errors.property = [{ message: "Property is required." }];
  }

  if (!values.time) {
    errors.time = [{ message: "Time is required." }];
  }

  formValues = values;

  return { errors };
};

const refreshQuery = async (query) => {
  checkIns.value = await queryCheckIns(query);
};

const checkInValue = ref({
  name: "",
  property: "",
  time: "",
});

const properties = ref();
const selectProperty = ref();

const updateProperties = async () => {
  properties.value = await getProperties();
  selectProperty.value = await getProperties();
};

const updateProperty = (value) => {
  if (value.name === "any") {
    queryFilters.value.keywords = [];
  } else {
    queryFilters.value.keywords = [value];
  }
};

const checkIns = ref();

const deleteCheckIn = (currentCheckIn = {}) => {
  const checkInRef = fbRef(db, pathToUser + "/CheckIns/" + currentCheckIn.id);
  remove(checkInRef)
    .then(() => {
      refreshQuery(queryFilters.value);
    })
    .catch((err) => {
      console.error("ERR: ", err);
    });
};

const openFilterDialog = () => {
  filterDialog.value = true;
};

const openCheckIn = (currentCheckIn = {}) => {
  //optional value
  checkInValue.value = currentCheckIn;

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

const onCheckInSubmit = async ({ valid }) => {
  if (!valid) {
    return;
  }

  const id = checkInValue.value.id || "";
  let checkInRef;

  //transform values
  formValues.time = formValues.time.getTime();
  formValues.property = formatPhoneNumber(formValues.property.number);

  if (id != "") {
    //edit
    checkInRef = fbRef(db, pathToUser + "/CheckIns/" + id);
  } else {
    //append
    checkInRef = push(fbRef(db, pathToUser + "/CheckIns")); // Creates an object with a unique ID
  }

  try {
    await set(checkInRef, formValues);
    checkInDialog.value = false;
    refreshQuery(queryFilters.value);
  } catch (err) {
    console.log("ERROR: ", err);
  }

  //clear initial values
  checkInValue.value = {};
};

onMounted(async () => {
  if (!isLoaded) {
    properties.value = updateProperties();
    refreshQuery(queryFilters.value);
    isLoaded = true;
  }
});
</script>

<template>
  <!-- Header -->
  <div class="w-[80%] ml-auto mr-auto mt-[5rem] flex items-center">
    <span class="text-xl font-bold">Displaying check-ins for </span>
    <span class="text-xl font-bold px-2">
      <Select
        :update:model-value="updateProperty"
        name="property"
        :options="selectProperty"
        optionLabel="name"
        class="w-56"
        :default-value="All"
      >
      </Select>
    </span>
  </div>

  <!-- Body -->
  <div class="w-[80%] ml-auto mr-auto my-[5rem]">
    <DataTable
      :value="checkIns"
      tableStyle="min-width: 50rem"
      selectionMode="single"
      :rowClass="() => 'group'"
    >
      <template #header>
        <div class="flex flex-wrap align-items-center justify-between gap-2">
          <span class="text-xl text-900 font-bold">Upcoming Check-ins</span>
          <span class="flex px-4 gap-2">
            <Button
              icon="pi pi-plus"
              label="New"
              raised
              @click="openCheckIn"
            ></Button>
            <Button
              icon="pi pi-filter"
              label="Filters"
              raised
              @click="openFilterDialog"
            ></Button>
          </span>
        </div>
      </template>
      <Column field="name" header="Guest"></Column>
      <Column field="property" header="Property"></Column>
      <Column field="status" header="Status"></Column>
      <Column class="w-24 !text-end">
        <template #body="{ data }">
          <div
            class="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <Button
              @click="openCheckIn(data)"
              icon="pi pi-pencil"
              severity="secondary"
              rounded
            ></Button>
            <Button
              @click="deleteCheckIn(data)"
              icon="pi pi-trash"
              severity="urgent"
              variant="text"
              rounded
            ></Button>
          </div>
        </template>
      </Column>
    </DataTable>
  </div>

  <!-- Create new Check-In Dialog -->
  <Dialog
    v-model:visible="checkInDialog"
    class="w-[450px]"
    header="Create or Edit Check In"
    :modal="true"
  >
    <Form
      v-slot="$form"
      :initial-values="checkInValue"
      :resolver="formCreateResolver"
      class="flex flex-col gap-6"
      @submit="onCheckInSubmit"
    >
      <div class="flex flex-col gap-1">
        <label for="name" class="block font-bold mb-3">Guest Name</label>
        <InputText name="name" autofocus placeholder="John Doe" fluid />
        <Message
          v-if="$form?.name?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form?.name?.error.message }}
        </Message>
      </div>
      <div class="flex flex-col gap-1">
        <label for="property" class="block font-bold mb-3">Property</label>
        <Select
          name="property"
          :options="properties"
          optionLabel="name"
          class="w-56"
          placeholder="Select a Property"
        />
        <Message
          v-if="$form?.property?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form?.property?.error.message }}
        </Message>
      </div>
      <div class="flex flex-col gap-1">
        <label for="time" class="block font-bold mb-3">Check-In Time</label>
        <DatePicker
          name="time"
          :min-date="new Date(Date.now() - GRACE_PERIOD)"
          :manual-input="false"
          showTime
          hourFormat="12"
          fluid
        />
        <Message
          v-if="$form?.time?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form?.time?.error.message }}
        </Message>
      </div>
      <Button type="submit" severity="danger" label="Submit" />
    </Form>
  </Dialog>

  <!-- Filter Check In Dialog -->
  <Dialog
    v-model:visible="filterDialog"
    class="w-[450px]"
    header="Filters"
    :modal="true"
  >
    <Form
      v-slot="$form"
      :initial-values="queryFilters"
      :resolver="queryFormResolver"
      class="flex flex-col gap-6"
      @submit="onFilterSubmit"
    >
      <div class="flex flex-col gap-1">
        <label for="order" class="block font-bold mb-3">Order By</label>
        <Select name="order" :options="orderOptions" class="w-56" />
        <Message
          v-if="$form?.order?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form?.order?.error.message }}
        </Message>
      </div>
      <div class="flex flex-col gap-1">
        <label for="limit" class="block font-bold mb-3">Limit</label>
        <InputNumber name="limit" fluid />
        <Message
          v-if="$form?.limit?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form?.limit?.error.message }}
        </Message>
      </div>
      <div class="flex flex-col gap-1">
        <label for="minDate" class="block font-bold mb-3">After</label>
        <DatePicker
          name="minDate"
          :min-date="new Date(Date.now() - GRACE_PERIOD)"
          :manual-input="false"
          showTime
          hourFormat="12"
          fluid
        />
        <Message
          v-if="$form?.minDate?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form?.minDate?.error.message }}
        </Message>
      </div>
      <div class="flex flex-col gap-1">
        <label for="maxDate" class="block font-bold mb-3">Before</label>
        <DatePicker
          name="maxDate"
          :min-date="new Date(Date.now() - GRACE_PERIOD)"
          :manual-input="false"
          showTime
          hourFormat="12"
          fluid
        />
        <Message
          v-if="$form?.maxDate?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form?.maxDate?.error.message }}
        </Message>
      </div>
      <Button type="submit" severity="danger" label="Submit" />
    </Form>
  </Dialog>
</template>
