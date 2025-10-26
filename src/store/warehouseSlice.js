import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchDashboardData = createAsyncThunk(
  'warehouse/fetchDashboardData',
  async () => {
    // Замените на ваш API
    const response = await axios.get('https://your-api.com/dashboard');
    return response.data;
  }
);

export const fetchHistoryData = createAsyncThunk(
  'warehouse/fetchHistoryData',
  async (filters) => {
    // Замените на ваш API
    const response = await axios.get('https://your-api.com/history', { params: filters });
    return response.data;
  }
);

export const uploadCSV = createAsyncThunk(
  'warehouse/uploadCSV',
  async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post('https://your-api.com/upload-csv', formData);
    return response.data;
  }
);

export const fetchAIPredictions = createAsyncThunk(
  'warehouse/fetchAIPredictions',
  async () => {
    const response = await axios.get('https://your-api.com/ai-predictions');
    return response.data;
  }
);

export const fetchProducts = createAsyncThunk(
  'warehouse/fetchProducts',
  async (filters) => {
    const response = await axios.get('https://your-api.com/products', { params: filters });
    return response.data;
  }
);

export const addProduct = createAsyncThunk(
  'warehouse/addProduct',
  async (product) => {
    const response = await axios.post('https://your-api.com/products', product);
    return response.data;
  }
);

export const updateProduct = createAsyncThunk(
  'warehouse/updateProduct',
  async ({ id, product }) => {
    const response = await axios.put(`https://your-api.com/products/${id}`, product);
    return response.data;
  }
);

export const deleteProduct = createAsyncThunk(
  'warehouse/deleteProduct',
  async (id) => {
    await axios.delete(`https://your-api.com/products/${id}`);
    return id;
  }
);

const warehouseSlice = createSlice({
  name: 'warehouse',
  initialState: {
    robots: [],
    zones: [],
    recentScans: [],
    aiPredictions: [],
    historyData: [],
    products: [],
    filters: {
      startDate: null,
      endDate: null,
      zones: [],
      categories: [],
      status: [],
      search: '',
    },
    websocketStatus: 'disconnected',
    loading: false,
    error: null,
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setWebsocketStatus: (state, action) => {
      state.websocketStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.robots = action.payload.robots;
        state.zones = action.payload.zones;
        state.recentScans = action.payload.recentScans;
      })
      .addCase(fetchHistoryData.fulfilled, (state, action) => {
        state.historyData = action.payload;
      })
      .addCase(fetchAIPredictions.fulfilled, (state, action) => {
        state.aiPredictions = action.payload;
      })
      .addCase(uploadCSV.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.products = action.payload;
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.products.push(action.payload);
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) state.products[index] = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter(p => p.id !== action.payload);
      });
  },
});

export const { setFilters, setWebsocketStatus } = warehouseSlice.actions;
export default warehouseSlice.reducer;