import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { dashboardService } from '../services/api';

export const fetchStudentDashboard = createAsyncThunk(
  'dashboard/fetchStudent',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardService.getStudentDashboard();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard');
    }
  }
);

export const fetchAdminDashboard = createAsyncThunk(
  'dashboard/fetchAdmin',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardService.getAdminDashboard();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch admin dashboard');
    }
  }
);

const initialState = {
  student: null,
  admin: null,
  isLoading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboard: (state) => {
      state.student = null;
      state.admin = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentDashboard.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchStudentDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.student = action.payload.data;
      })
      .addCase(fetchStudentDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.admin = action.payload.data;
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
