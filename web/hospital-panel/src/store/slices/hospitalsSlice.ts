import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { hospitalApi, Hospital } from '@/services/hospitalApi';
import { AsyncState } from '../types';

interface HospitalsState extends AsyncState<Hospital[]> {
  selectedHospital: Hospital | null;
  filters: {
    searchTerm: string;
    isActive: boolean | null;
  };
}

const initialState: HospitalsState = {
  data: null,
  loading: false,
  error: null,
  selectedHospital: null,
  filters: {
    searchTerm: '',
    isActive: true,
  },
};

// Async thunks
export const fetchHospitals = createAsyncThunk(
  'hospitals/fetchHospitals',
  async (_, { rejectWithValue }) => {
    try {
      const hospitals = await hospitalApi.getHospitals();
      return hospitals;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to fetch hospitals',
      });
    }
  }
);

export const fetchHospitalById = createAsyncThunk(
  'hospitals/fetchHospitalById',
  async (id: string, { rejectWithValue }) => {
    try {
      const hospital = await hospitalApi.getHospitalById(id);
      return hospital;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to fetch hospital',
      });
    }
  }
);

// Slice
const hospitalsSlice = createSlice({
  name: 'hospitals',
  initialState,
  reducers: {
    setSelectedHospital: (state, action) => {
      state.selectedHospital = action.payload;
    },
    setSearchTerm: (state, action) => {
      state.filters.searchTerm = action.payload;
    },
    setIsActiveFilter: (state, action) => {
      state.filters.isActive = action.payload;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch hospitals
    builder
      .addCase(fetchHospitals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHospitals.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchHospitals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as { message: string };
      });

    // Fetch hospital by ID
    builder
      .addCase(fetchHospitalById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHospitalById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedHospital = action.payload;
        // Update in list if exists
        if (state.data) {
          const index = state.data.findIndex((h) => h.id === action.payload.id);
          if (index !== -1) {
            state.data[index] = action.payload;
          } else {
            state.data.push(action.payload);
          }
        }
      })
      .addCase(fetchHospitalById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as { message: string };
      });
  },
});

export const {
  setSelectedHospital,
  setSearchTerm,
  setIsActiveFilter,
  clearFilters,
  clearError,
} = hospitalsSlice.actions;

export default hospitalsSlice.reducer;

