import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import notificationReducer from './slices/notificationSlice';
import uiReducer from './slices/uiSlice';
import documentReducer from './documentSlice';
import mentorReducer from './mentorSlice';
import dashboardReducer from './dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    notifications: notificationReducer,
    ui: uiReducer,
    documents: documentReducer,
    mentors: mentorReducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
