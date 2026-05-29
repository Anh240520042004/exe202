import { createSlice } from '@reduxjs/toolkit';

const applyDarkTheme = () => {
  document.documentElement.classList.add('dark');
  localStorage.setItem('theme', 'dark');
};

applyDarkTheme();

const initialState = {
  theme: 'dark',
  sidebarOpen: true,
  isMobileMenuOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = 'dark';
      applyDarkTheme();
    },
    setTheme: (state) => {
      state.theme = 'dark';
      applyDarkTheme();
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    setMobileMenuOpen: (state, action) => {
      state.isMobileMenuOpen = action.payload;
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
} = uiSlice.actions;

export default uiSlice.reducer;
