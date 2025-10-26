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

export const fetchUsers = createAsyncThunk(
  'warehouse/fetchUsers',
  async () => {
    // Замените на ваш API
    // const response = await axios.get('https://your-api.com/users');
    // return response.data;
    return [];
  }
);

export const createUser = createAsyncThunk(
  'warehouse/createUser',
  async (userData) => {
    // const response = await axios.post('https://your-api.com/users', userData);
    // return response.data;
    return userData;
  }
);

export const updateUser = createAsyncThunk(
  'warehouse/updateUser',
  async (userData) => {
    // const response = await axios.put(`https://your-api.com/users/${userData.id}`, userData);
    // return response.data;
    return userData;
  }
);

export const deleteUser = createAsyncThunk(
  'warehouse/deleteUser',
  async (id) => {
    // await axios.delete(`https://your-api.com/users/${id}`);
    return id;
  }
);

export const fetchRobots = createAsyncThunk(
  'warehouse/fetchRobots',
  async () => {
    // const response = await axios.get('https://your-api.com/robots');
    // return response.data;
    return [];
  }
);

export const createRobot = createAsyncThunk(
  'warehouse/createRobot',
  async (robotData) => {
    // const response = await axios.post('https://your-api.com/robots', robotData);
    // return response.data;
    return robotData;
  }
);

export const updateRobot = createAsyncThunk(
  'warehouse/updateRobot',
  async (robotData) => {
    // const response = await axios.put(`https://your-api.com/robots/${robotData.robotId}`, robotData);
    // return response.data;
    return robotData;
  }
);

export const deleteRobot = createAsyncThunk(
  'warehouse/deleteRobot',
  async (robotId) => {
    // await axios.delete(`https://your-api.com/robots/${robotId}`);
    return robotId;
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
    users: [],
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
        const index = state.products.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) state.products[index] = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p.id !== action.payload);
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users = action.payload;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.push(action.payload);
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((user) => user.id === action.payload.id);
        if (index !== -1) state.users[index] = action.payload;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((user) => user.id !== action.payload);
      })
      .addCase(fetchRobots.fulfilled, (state, action) => {
        state.robots = action.payload;
      })
      .addCase(createRobot.fulfilled, (state, action) => {
        state.robots.push(action.payload);
      })
      .addCase(updateRobot.fulfilled, (state, action) => {
        const index = state.robots.findIndex((robot) => robot.robotId === action.payload.robotId);
        if (index !== -1) state.robots[index] = action.payload;
      })
      .addCase(deleteRobot.fulfilled, (state, action) => {
        state.robots = state.robots.filter((robot) => robot.robotId !== action.payload);
      });
  },
});

export const { setFilters, setWebsocketStatus } = warehouseSlice.actions;
export default warehouseSlice.reducer;