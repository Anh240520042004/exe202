import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import documentService from '../services/api';

export const fetchDocuments = createAsyncThunk(
  'documents/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await documentService.getAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch documents');
    }
  }
);

export const fetchDocumentById = createAsyncThunk(
  'documents/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await documentService.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch document');
    }
  }
);

export const fetchFeaturedDocuments = createAsyncThunk(
  'documents/fetchFeatured',
  async (_, { rejectWithValue }) => {
    try {
      const response = await documentService.getFeatured();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch featured');
    }
  }
);

export const fetchPopularDocuments = createAsyncThunk(
  'documents/fetchPopular',
  async (_, { rejectWithValue }) => {
    try {
      const response = await documentService.getPopular();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch popular');
    }
  }
);

export const fetchDocumentsBySubject = createAsyncThunk(
  'documents/fetchBySubject',
  async ({ subjectCode, params }, { rejectWithValue }) => {
    try {
      const response = await documentService.getBySubject(subjectCode, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch by subject');
    }
  }
);

export const addToFavorites = createAsyncThunk(
  'documents/addToFavorites',
  async (documentId, { rejectWithValue }) => {
    try {
      const response = await documentService.addToFavorites(documentId);
      return { documentId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to favorites');
    }
  }
);

export const addReview = createAsyncThunk(
  'documents/addReview',
  async ({ id, rating, comment }, { rejectWithValue }) => {
    try {
      const response = await documentService.addReview(id, { rating, comment });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add review');
    }
  }
);

const initialState = {
  documents: [],
  currentDocument: null,
  featured: [],
  popular: [],
  favorites: [],
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  },
  filters: {
    subjectCode: '',
    semester: '',
    type: '',
    minPrice: '',
    maxPrice: '',
    search: '',
  },
  isLoading: false,
  error: null,
};

const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload;
        // Handle various response structures
        state.documents = payload?.data?.documents 
          || payload?.documents 
          || payload?.data 
          || [];
        if (payload?.data?.pagination) {
          state.pagination = payload.data.pagination;
        } else if (payload?.pagination) {
          state.pagination = { ...state.pagination, ...payload.pagination };
        }
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchDocumentById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDocumentById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentDocument = action.payload.data;
      })
      .addCase(fetchDocumentById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchFeaturedDocuments.fulfilled, (state, action) => {
        state.featured = action.payload.data || [];
      })
      .addCase(fetchPopularDocuments.fulfilled, (state, action) => {
        state.popular = action.payload.data || [];
      })
      .addCase(addToFavorites.fulfilled, (state, action) => {
        const index = state.favorites.findIndex(id => id === action.payload.documentId);
        if (index === -1) {
          state.favorites.push(action.payload.documentId);
        } else {
          state.favorites.splice(index, 1);
        }
      });
  },
});

export const { setFilters, clearFilters, clearError } = documentSlice.actions;
export default documentSlice.reducer;
