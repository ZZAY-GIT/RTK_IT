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

const warehouseSlice = createSlice({
  name: 'warehouse',
  initialState: {
    robots: [],
    zones: [],
    recentScans: [],
    aiPredictions: [],
    historyData: [],
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
      });
  },
});

export const { setFilters, setWebsocketStatus } = warehouseSlice.actions;
export default warehouseSlice.reducer;