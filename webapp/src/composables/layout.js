import { reactive, computed } from "vue";

const layoutState = reactive({
  sideBarMenuActive: true,
  activeMenuItem: null,
});

export function useLayout() {
  const setActiveMenuItem = (item) => {
    layoutState.activeMenuItem = item.value || item;
  };

  const toggleMenu = () => {
    layoutState.sideBarMenuActive = !layoutState.sideBarMenuActive;
    console.log(layoutState.sideBarMenuActive);
  };

  const isSidebarActive = computed(() => layoutState.sideBarMenuActive);

  return {
    layoutState,
    setActiveMenuItem,
    toggleMenu,
    isSidebarActive,
  };
}
