import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import mentorService from '../services/api';

export const fetchMentors = createAsyncThunk(
  'mentors/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await mentorService.getAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch mentors');
    }
  }
);

export const fetchMentorById = createAsyncThunk(
  'mentors/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await mentorService.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch mentor');
    }
  }
);

export const fetchTopMentors = createAsyncThunk(
  'mentors/fetchTop',
  async (_, { rejectWithValue }) => {
    try {
      const response = await mentorService.getTop();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch top mentors');
    }
  }
);

export const createBooking = createAsyncThunk(
  'mentors/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await mentorService.createBooking(bookingData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create booking');
    }
  }
);

export const fetchBookings = createAsyncThunk(
  'mentors/fetchBookings',
  async (params, { rejectWithValue }) => {
    try {
      const response = await mentorService.getBookings(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

const initialState = {
  mentors: [],
  currentMentor: null,
  topMentors: [],
  bookings: [],
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  },
  isLoading: false,
  error: null,
};

const mentorSlice = createSlice({
  name: 'mentors',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMentors.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMentors.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload;
        state.mentors = payload?.data?.mentors || payload?.mentors || payload?.data || [];
        if (payload?.data?.pagination) {
          state.pagination = payload.data.pagination;
        }
      })
      .addCase(fetchMentors.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchMentorById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMentorById.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload;
        state.currentMentor = payload?.data || payload || null;
      })
      .addCase(fetchMentorById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchTopMentors.fulfilled, (state, action) => {
        const payload = action.payload;
        state.topMentors = payload?.data?.mentors || payload?.data || payload || [];
      })
      .addCase(createBooking.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createBooking.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.bookings = action.payload.data || [];
      });
  },
});

export const { clearError } = mentorSlice.actions;
export default mentorSlice.reducer;
