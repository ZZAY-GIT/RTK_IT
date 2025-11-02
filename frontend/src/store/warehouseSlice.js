import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// =============== Dashboard ===============
export const fetchDashboardData = createAsyncThunk(
  'warehouse/fetchDashboardData',
  async () => {
    const response = await axios.get('http://backend:8000/api/dashboard/current');
    return response.data;
  }
);

export const fetchHistoryData = createAsyncThunk(
  'warehouse/fetchHistoryData',
  async (filters) => {
    const response = await axios.get('http://backend:8000/api/inventory/history', { params: filters });
    return response.data;
  }
);

export const uploadCSV = createAsyncThunk(
  'warehouse/uploadCSV',
  async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    const headers = {
      'Content-Type': 'multipart/form-data'
    };
    
    if (user) {
      headers['X-User-Data'] = user;
    }
    
    const response = await axios.post('http://backend:8000/api/inventory/import', formData, { headers });
    return response.data;
  }
);

export const fetchAIPredictions = createAsyncThunk(
  'warehouse/fetchAIPredictions',
  async () => {
    const response = await axios.get('http://backend:8000/api/ai/predict');
    return response.data;
  }
);

// =============== Products ===============
export const fetchProducts = createAsyncThunk(
  'warehouse/fetchProducts',
  async (filters) => {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    const response = await axios.get('http://backend:8000/api/admin/products/', { 
      params: filters,
      headers: {
        'X-User-Data': JSON.stringify(user)
      }
    });
    return response.data;
  }
);

export const addProduct = createAsyncThunk(
  'warehouse/addProduct',
  async (product) => {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    const response = await axios.post('http://backend:8000/api/admin/products/', product, {
      headers: {
        'X-User-Data': user
      }
    });
    return response.data;
  }
);
export const updateProduct = createAsyncThunk(
  'warehouse/updateProduct',
  async ({ id, product }) => {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    const response = await axios.put(`http://backend:8000/api/admin/products/${id}`, product, {
      headers: {
        'X-User-Data': user,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }
);

export const deleteProduct = createAsyncThunk(
  'warehouse/deleteProduct',
  async (id) => {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    await axios.delete(`http://backend:8000/api/admin/products/${id}`, {
      headers: {
        'X-User-Data': user
      }
    });
    return id;
  }
);

// =============== Users ===============
export const fetchUsers = createAsyncThunk(
  'warehouse/fetchUsers',
  async () => {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    const response = await axios.get('http://backend:8000/api/admin/users/', {
      headers: {
        'X-User-Data': JSON.stringify(user)
      }
    });
    return response.data;
  }
);

export const createUser = createAsyncThunk(
  'warehouse/createUser',
  async (userData) => {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    const response = await axios.post('http://backend:8000/api/admin/users/', userData, {
      headers: {
        'X-User-Data': user
      }
    });
    return response.data;
  }
);

export const updateUser = createAsyncThunk(
  'warehouse/updateUser',
  async ({ id, user }) => {
    const currentUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    try {
      const response = await axios.put(`http://backend:8000/api/admin/users/${id}`, user, {
        headers: {
          'X-User-Data': currentUser,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      // Пробрасываем ошибку с сообщением от сервера
      throw new Error(error.response?.data?.detail || 'Failed to update user');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'warehouse/deleteUser',
  async (id) => {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    try {
      const response = await axios.delete(`http://backend:8000/api/admin/users/${id}`, {
        headers: {
          'X-User-Data': user
        }
      });
      return id;
    } catch (error) {
      // Пробрасываем ошибку с сообщением от сервера
      throw new Error(error.response?.data?.detail || 'Failed to delete user');
    }
  }
);

// =============== Robots ===============
export const createRobot = createAsyncThunk(
  'warehouse/createRobot',
  async (robot) => {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    const response = await axios.post('http://backend:8000/api/admin/robots/', robot, {
      headers: {
        'X-User-Data': user  // ← ДОБАВИТЬ этот заголовок
      }
    });
    return response.data;
  }
);

// Также исправьте другие запросы для роботов:
export const fetchRobots = createAsyncThunk(
  'warehouse/fetchRobots',
  async () => {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    const response = await axios.get('http://backend:8000/api/admin/robots/', {
      headers: {
        'X-User-Data': JSON.stringify(user)  // ← ДОБАВИТЬ
      }
    });
    return response.data;
  }
);

export const updateRobot = createAsyncThunk(
  'warehouse/updateRobot',
  async ({ id, robot }) => {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    const response = await axios.put(`http://backend:8000/api/admin/robots/${id}`, robot, {
      headers: {
        'X-User-Data': user,  // ← ДОБАВИТЬ
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }
);

export const deleteRobot = createAsyncThunk(
  'warehouse/deleteRobot',
  async (id) => {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    await axios.delete(`http://backend:8000/api/admin/robots/${id}`, {
      headers: {
        'X-User-Data': user  // ← ДОБАВИТЬ
      }
    });
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
    // УБРАЛИ дублирование loading
    error: null,
    filters: {
      startDate: null,
      endDate: null,
      zones: [],
      categories: [],
      status: [],
      search: '',
    },
    websocketStatus: 'disconnected',
    loading: false, // ← ОСТАВИЛИ ТОЛЬКО ОДИН loading
    statistics: {
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
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
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
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // History Data
      .addCase(fetchHistoryData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHistoryData.fulfilled, (state, action) => {
        state.loading = false;
        state.historyData = action.payload;
      })
      .addCase(fetchHistoryData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // AI Predictions
      .addCase(fetchAIPredictions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAIPredictions.fulfilled, (state, action) => {
        state.loading = false;
        state.aiPredictions = action.payload.predictions || [];
      })
      .addCase(fetchAIPredictions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // CSV Upload
      .addCase(uploadCSV.pending, (state) => {
        state.loading = true;
      })
      .addCase(uploadCSV.fulfilled, (state, action) => {
        state.loading = false;
        const result = action.payload;
        
        if (result.status === "success" || result.status === "partial_success") {
          console.log(`✅ CSV импорт: ${result.message}`);
        } else {
          console.error(`❌ CSV импорт: ${result.error}`);
        }
      })
      .addCase(uploadCSV.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        console.error('❌ Ошибка при загрузке CSV:', action.error.message);
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