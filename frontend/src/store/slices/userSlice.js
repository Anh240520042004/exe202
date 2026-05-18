import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from '../../services/userService';
import { transactionService } from '../../services/transactionService';

const initialState = {
  profile: null,
  settings: null,
  transactions: [],
  transactionStats: null,
  isLoading: false,
  error: null,
};

export const fetchProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await userService.getProfile();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lấy thông tin thất bại');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      return await userService.updateProfile(data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Cập nhật thất bại');
    }
  }
);

export const changePassword = createAsyncThunk(
  'user/changePassword',
  async (data, { rejectWithValue }) => {
    try {
      return await userService.changePassword(data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Đổi mật khẩu thất bại');
    }
  }
);

export const fetchSettings = createAsyncThunk(
  'user/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      return await userService.getSettings();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lấy cài đặt thất bại');
    }
  }
);

export const updateSettings = createAsyncThunk(
  'user/updateSettings',
  async (data, { rejectWithValue }) => {
    try {
      return await userService.updateSettings(data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Cập nhật cài đặt thất bại');
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'user/fetchTransactions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await transactionService.getAll(params);
      // response is already extracted array from service
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lấy lịch sử giao dịch thất bại');
    }
  }
);

export const fetchTransactionStats = createAsyncThunk(
  'user/fetchTransactionStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await transactionService.getStats();
      // stats is { totalIncome, totalExpense, balance, byCategory, recentTransactions }
      return stats;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lấy thống kê giao dịch thất bại');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchSettings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        if (Array.isArray(action.payload)) {
          state.transactions = action.payload;
        } else if (action.payload.transactions) {
          state.transactions = action.payload.transactions;
        }
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchTransactionStats.fulfilled, (state, action) => {
        state.transactionStats = action.payload;
      })
      .addCase(fetchTransactionStats.rejected, (state) => {
        // Silent fail for stats
      });
  },
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;
