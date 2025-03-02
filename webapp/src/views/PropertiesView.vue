<script setup>
import { ref, onMounted } from "vue";
import { auth, db, ref as fbRef, set } from "@/firebase";
import { remove } from "firebase/database";
import { getProperties } from "@/services/propertyService";

const properties = ref({});
const propertyValue = ref({});

const showPropertyModal = ref(false);
const pathToUser = "users/" + auth.currentUser.uid;

let formValues = {};
let isLoaded = false;

const formResolver = ({ values }) => {
  const errors = {};

  if (!values.name) {
    errors.name = [{ message: "Property name required." }];
  }

  if (!values.number) {
    errors.number = [{ message: "Property is required." }];
  }

  formValues = values;

  return { errors };
};

const deleteProperty = (currentProperty = {}) => {
  const propertyRef = fbRef(
    db,
    pathToUser + "/Properties/" + formatPhoneNumber(currentProperty.number)
  );
  remove(propertyRef)
    .then(() => {
      refreshProperties();
    })
    .catch((err) => {
      console.error("ERR: ", err);
    });
};

const openProperty = (currentProperty = {}) => {
  //optional value
  propertyValue.value = currentProperty;

  showPropertyModal.value = true;
};

const formatPhoneNumber = (phone) => {
  return phone.replace(/\D/g, "");
};

const onSubmitProperty = async ({ valid }) => {
  if (!valid) {
    return;
  }

  //transform values
  let number = formValues.number;
  formValues.number = null;

  const propertyRef = fbRef(
    db,
    pathToUser + "/Properties/" + formatPhoneNumber(number)
  );

  try {
    await set(propertyRef, formValues);
    showPropertyModal.value = false;
    refreshProperties();
  } catch (err) {
    console.log("ERROR: ", err);
  }

  //clear initial values
  propertyValue.value = {};
};

const refreshProperties = async () => {
  properties.value = await getProperties();
};

onMounted(() => {
  if (!isLoaded) {
    refreshProperties();
    isLoaded = true;
  }
});
</script>

<template>
  <!-- Body -->
  <div class="w-[80%] ml-auto mr-auto my-[5rem]">
    <DataTable
      :value="properties"
      tableStyle="min-width: 50rem"
      selectionMode="single"
      :rowClass="() => 'group'"
    >
      <template #header>
        <div class="flex flex-wrap align-items-center justify-between gap-2">
          <span class="text-xl text-900 font-bold">Properties</span>
          <Button
            icon="pi pi-plus"
            label="New"
            raised
            @click="openProperty"
          ></Button>
        </div>
      </template>
      <Column field="number" header="Number"></Column>
      <Column field="name" header="Property"></Column>
      <Column field="address" header="Address"></Column>
      <Column class="w-24 !text-end">
        <template #body="{ data }">
          <div
            class="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <Button
              @click="openProperty(data)"
              icon="pi pi-pencil"
              severity="secondary"
              rounded
            ></Button>
            <Button
              @click="deleteProperty(data)"
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

  <Dialog
    v-model:visible="showPropertyModal"
    class="w-[450px]"
    header="Create or Edit Property"
    :modal="true"
  >
    <Form
      v-slot="$form"
      :initial-values="propertyValue"
      :resolver="formResolver"
      class="flex flex-col gap-6"
      @submit="onSubmitProperty"
    >
      <div class="flex flex-col gap-1">
        <label for="name" class="block font-bold mb-3">Property Name</label>
        <InputText name="name" autofocus placeholder="Apartment Name" fluid />
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
        <label for="address" class="block font-bold mb-3">Address</label>
        <InputText name="address" autofocus placeholder="Address Here" />
        <Message
          v-if="$form?.address?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form?.address?.error.message }}
        </Message>
      </div>
      <div class="flex flex-col gap-1">
        <label for="number" class="block font-bold mb-3">Phone Number</label>
        <InputMask
          name="number"
          mask="+9 (999) 999-9999"
          placeholder="+1 (999) 999-9999"
          fluid
        />
        <Message
          v-if="$form?.number?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form?.number?.error.message }}
        </Message>
      </div>
      <Button type="submit" severity="danger" label="Submit" />
    </Form>
  </Dialog>
</template>
