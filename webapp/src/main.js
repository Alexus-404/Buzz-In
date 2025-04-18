//Stylings
import "./assets/styles/tailwind.css";
import "primeicons/primeicons.css";

//Import app
import { createApp } from "vue";
import router from "./router/router.js";
import App from "./App.vue";

import "./firebase.js";
import Theme from "./assets/themes/theme.js";

//Primevue imports and custom components
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import {
  Button,
  ButtonGroup,
  DataTable,
  Column,
  Avatar,
  Select,
  Dialog,
  Menu,
  InputText,
  Message,
  DatePicker,
  InputMask,
  InputNumber,
  Paginator,
  Toast,
  ToggleSwitch,
} from "primevue";
import { Form } from "@primevue/forms";

//Initialize app
const app = createApp(App)
  .use(router)
  .use(PrimeVue, {
    theme: {
      preset: Theme,
      options: {
        prefix: "p",
        darkModeSelector: "system",
      },
    },
  })
  .use(ToastService)
  .component("Form", Form)
  .component("Button", Button)
  .component("ButtonGroup", ButtonGroup)
  .component("DataTable", DataTable)
  .component("Column", Column)
  .component("Avatar", Avatar)
  .component("Menu", Menu)
  .component("Dialog", Dialog)
  .component("Message", Message)
  .component("Select", Select)
  .component("InputText", InputText)
  .component("DatePicker", DatePicker)
  .component("InputMask", InputMask)
  .component("InputNumber", InputNumber)
  .component("Paginator", Paginator)
  .component("Toast", Toast)
  .component("Switch", ToggleSwitch)

app.mount("#app");
