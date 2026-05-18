import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService } from '../../services/notificationService';

const initialState = {
  items: [],
  unreadCount: 0,
  pagination: null,
  isLoading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await notificationService.getAll(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lấy thông báo thất bại');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id, { rejectWithValue }) => {
    try {
      await notificationService.markAsRead(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Cập nhật thất bại');
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllAsRead();
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Cập nhật thất bại');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (id, { rejectWithValue }) => {
    try {
      await notificationService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Xóa thất bại');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.items.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data.notifications;
        state.pagination = action.payload.pagination;
        state.unreadCount = action.payload.data.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item._id === action.payload);
        if (index !== -1 && !state.items[index].isRead) {
          state.items[index].isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.items = state.items.map((item) => ({ ...item, isRead: true }));
        state.unreadCount = 0;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item._id === action.payload);
        if (index !== -1) {
          if (!state.items[index].isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.items.splice(index, 1);
        }
      });
  },
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
