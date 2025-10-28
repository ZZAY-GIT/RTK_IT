import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// =============== Dashboard ===============
export const fetchDashboardData = createAsyncThunk(
  'warehouse/fetchDashboardData',
  async () => {
    const response = await axios.get('http://localhost:8000/api/dashboard/current');
    return response.data;
  }
);

export const fetchHistoryData = createAsyncThunk(
  'warehouse/fetchHistoryData',
  async (filters) => {
    const response = await axios.get('http://localhost:8000/api/inventory/history', { params: filters });
    return response.data;
  }
);

export const uploadCSV = createAsyncThunk(
  'warehouse/uploadCSV',
  async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post('http://localhost:8000/upload-csv', formData);
    return response.data;
  }
);

export const fetchAIPredictions = createAsyncThunk(
  'warehouse/fetchAIPredictions',
  async () => {
    const response = await axios.get('http://localhost:8000/api/ai/predict');
    return response.data;
  }
);

// =============== Products ===============
export const fetchProducts = createAsyncThunk(
  'warehouse/fetchProducts',
  async (filters) => {
    const response = await axios.get('http://localhost:8000/products', { params: filters });
    return response.data;
  }
);

export const addProduct = createAsyncThunk(
  'warehouse/addProduct',
  async (product) => {
    const response = await axios.post('http://localhost:8000/products', product);
    return response.data;
  }
);

export const updateProduct = createAsyncThunk(
  'warehouse/updateProduct',
  async ({ id, product }) => {
    const response = await axios.put(`http://localhost:8000/products/${id}`, product);
    return response.data;
  }
);

export const deleteProduct = createAsyncThunk(
  'warehouse/deleteProduct',
  async (id) => {
    await axios.delete(`http://localhost:8000/products/${id}`);
    return id;
  }
);

// =============== Users ===============
export const fetchUsers = createAsyncThunk(
  'warehouse/fetchUsers',
  async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log('🔐 Token from storage:', token); // ← Должен вывести токен
    
    const response = await axios.get('http://localhost:8000/api/admin/user', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  }
);

export const createUser = createAsyncThunk(
  'warehouse/createUser',
  async (user) => {
    const response = await axios.post('http://localhost:8000/api/admin/user', user);
    return response.data;
  }
);

export const updateUser = createAsyncThunk(
  'warehouse/updateUser',
  async ({ id, user }) => {
    const response = await axios.put(`http://localhost:8000/api/admin/user/${id}`, user);
    return response.data;
  }
);

export const deleteUser = createAsyncThunk(
  'warehouse/deleteUser',
  async (id) => {
    await axios.delete(`http://localhost:8000/api/admin/user/${id}`);
    return id;
  }
);

// =============== Robots ===============
export const fetchRobots = createAsyncThunk(
  'warehouse/fetchRobots',
  async () => {
    const response = await axios.get('http://localhost:8000/api/robots');
    return response.data;
  }
);

export const createRobot = createAsyncThunk(
  'warehouse/createRobot',
  async (robot) => {
    const response = await axios.post('http://localhost:8000/api/robots', robot);
    return response.data;
  }
);

export const updateRobot = createAsyncThunk(
  'warehouse/updateRobot',
  async ({ id, robot }) => {
    const response = await axios.put(`http://localhost:8000/api/robots/${id}`, robot);
    return response.data;
  }
);

export const deleteRobot = createAsyncThunk(
  'warehouse/deleteRobot',
  async (id) => {
    await axios.delete(`http://localhost:8000/api/robots/${id}`);
    return id;
  }
);

// Вспомогательная функция для преобразования данных роботов
const transformRobotData = (robot) => ({
  id: robot.id,
  status: robot.status,
  battery: robot.battery_level || 0, // преобразуем battery_level -> battery
  lastUpdate: robot.last_update || new Date().toISOString(),
  // Генерируем координаты на основе зоны/ряда/полки
  x: robot.current_zone ? (robot.current_zone.charCodeAt(0) - 65) * 20 : 0,
  y: robot.current_row ? (robot.current_row - 1) * 20 : 0 || 1,
  current_zone: robot.current_zone || 'A',
  current_row: robot.current_row || 1,
  current_shelf: robot.current_shelf
});

// Вспомогательная функция для преобразования данных сканирований
const transformScanData = (scan) => ({
  id: scan.id,
  time: scan.scanned_at || new Date().toISOString(), // scanned_at -> time
  robotId: scan.robot_id, // robot_id -> robotId
  zone: scan.zone,
  productId: scan.product_id,
  productName: scan.product_name || `Product ${scan.product_id}`, // добавляем productName
  quantity: scan.quantity || 0,
  status: scan.status ? scan.status.toLowerCase() : 'unknown' // приводим к нижнему регистру
});

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
    statistics: { // добавляем статистику
      active_robots: 0,
      total_robots: 0,
      scanned_today: 0,
      critical_stocks: 0,
      average_battery: 0
    }
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setWebsocketStatus: (state, action) => {
      state.websocketStatus = action.payload;
    },
    updateDashboardFromWebSocket: (state, action) => {
      const data = action.payload;
      
      if (data.robots) {
        state.robots = data.robots.map(transformRobotData);
      }
      if (data.recent_scans) {
        state.recentScans = data.recent_scans.map(transformScanData);
      }
      if (data.statistics) {
        state.statistics = data.statistics;
      }
      // zones пока не обрабатываем, так как их нет в данных бэкенда
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        const data = action.payload;
        
        if (data.robots) {
          state.robots = data.robots.map(transformRobotData);
        }
        if (data.recent_scans) {
          state.recentScans = data.recent_scans.map(transformScanData);
        }
        if (data.statistics) {
          state.statistics = data.statistics;
        }
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
      
      // Products
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
      })
      
      // Users
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users = action.payload;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.push(action.payload);
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(u => u.id === action.payload.id);
        if (index !== -1) state.users[index] = action.payload;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u.id !== action.payload);
      })
      
      // Robots
      .addCase(fetchRobots.fulfilled, (state, action) => {
        state.robots = action.payload.map(transformRobotData);
      })
      .addCase(createRobot.fulfilled, (state, action) => {
        state.robots.push(transformRobotData(action.payload));
      })
      .addCase(updateRobot.fulfilled, (state, action) => {
        const index = state.robots.findIndex(r => r.id === action.payload.id);
        if (index !== -1) state.robots[index] = transformRobotData(action.payload);
      })
      .addCase(deleteRobot.fulfilled, (state, action) => {
        state.robots = state.robots.filter(r => r.id !== action.payload);
      });
  },
});

export const { setFilters, setWebsocketStatus, updateDashboardFromWebSocket } = warehouseSlice.actions;
export default warehouseSlice.reducer;