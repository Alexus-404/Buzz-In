import AppLayout from "@/layout/AppLayout.vue";
import { createWebHistory, createRouter } from "vue-router";
import {auth} from "@/firebase"
import { onAuthStateChanged } from "firebase/auth";
import AccountLayout from "@/layout/AccountLayout.vue";

const routes = [
  {
    path: "/",
    component: AppLayout,
    children: [
      {
        path: "/",
        name: "Dashboard",
        component: () => import("../views/HomeView.vue"),
      },
      {
        path: "/logs",
        name: "Logs",
        component: () => import("../views/LogsView.vue"),
      },
      {
        path: "/properties",
        name: "Properties",
        component: () => import("../views/PropertiesView.vue"),
      },
      {
        path: "/account",
        component: AccountLayout,
        children: [
          {
            path: "/account",
            name: "Account",
            component: () => import("../views/PropertiesView.vue"),
          },
          {
            path: "/account/security",
            name: "Security",
            component: () => import("../views/PropertiesView.vue"),
          },
        ],
      },
    ],
    meta: { requiresAuth: true },
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/LoginView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

let user = null
onAuthStateChanged(auth, (firebaseUser) => {
  user = firebaseUser;
});

router.beforeEach((to, from, next) => {
  if (to.matched.some((record) => record.meta.requiresAuth) && !user) {
    next("/login");
  } else {
    next();
  }
});

export default router;
