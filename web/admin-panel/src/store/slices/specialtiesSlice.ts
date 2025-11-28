import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { specialtiesApi, Specialty } from '@/services/specialtiesApi';
import { AsyncState } from '../types';

// DTOs for specialty operations
interface CreateSpecialtyDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

interface UpdateSpecialtyDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

interface SpecialtiesState extends AsyncState<Specialty[]> {
  filters: {
    searchTerm: string;
    isActive: boolean | null;
  };
}

const initialState: SpecialtiesState = {
  data: null,
  loading: false,
  error: null,
  filters: {
    searchTerm: '',
    isActive: true,
  },
};

// Async thunks
export const fetchSpecialties = createAsyncThunk(
  'specialties/fetchSpecialties',
  async (includeInactive: boolean = false, { rejectWithValue }) => {
    try {
      const specialties = await specialtiesApi.getSpecialties(includeInactive);
      return specialties;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to fetch specialties',
      });
    }
  }
);

export const fetchSpecialtyById = createAsyncThunk(
  'specialties/fetchSpecialtyById',
  async (id: string, { rejectWithValue }) => {
    try {
      const specialty = await specialtiesApi.getSpecialtyById(id);
      return specialty;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to fetch specialty',
      });
    }
  }
);

export const createSpecialty = createAsyncThunk(
  'specialties/createSpecialty',
  async (specialtyData: CreateSpecialtyDto, { rejectWithValue }) => {
    try {
      const specialty = await specialtiesApi.createSpecialty(specialtyData);
      return specialty;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to create specialty',
      });
    }
  }
);

export const updateSpecialty = createAsyncThunk(
  'specialties/updateSpecialty',
  async ({ id, specialtyData }: { id: string; specialtyData: UpdateSpecialtyDto }, { rejectWithValue }) => {
    try {
      const specialty = await specialtiesApi.updateSpecialty(id, specialtyData);
      return specialty;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to update specialty',
      });
    }
  }
);

export const deleteSpecialty = createAsyncThunk(
  'specialties/deleteSpecialty',
  async (id: string, { rejectWithValue }) => {
    try {
      await specialtiesApi.deleteSpecialty(id);
      return id;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to delete specialty',
      });
    }
  }
);

// Slice
const specialtiesSlice = createSlice({
  name: 'specialties',
  initialState,
  reducers: {
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
    // Fetch specialties
    builder
      .addCase(fetchSpecialties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSpecialties.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchSpecialties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as { message: string };
      });

    // Fetch specialty by ID
    builder
      .addCase(fetchSpecialtyById.fulfilled, (state, action) => {
        if (state.data) {
          const index = state.data.findIndex((s) => s.id === action.payload.id);
          if (index !== -1) {
            state.data[index] = action.payload;
          } else {
            state.data.push(action.payload);
          }
        }
      });

    // Create specialty
    builder
      .addCase(createSpecialty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSpecialty.fulfilled, (state, action) => {
        state.loading = false;
        if (state.data) {
          state.data.push(action.payload);
        } else {
          state.data = [action.payload];
        }
      })
      .addCase(createSpecialty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as { message: string };
      });

    // Update specialty
    builder
      .addCase(updateSpecialty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSpecialty.fulfilled, (state, action) => {
        state.loading = false;
        if (state.data) {
          const index = state.data.findIndex((s) => s.id === action.payload.id);
          if (index !== -1) {
            state.data[index] = action.payload;
          }
        }
      })
      .addCase(updateSpecialty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as { message: string };
      });

    // Delete specialty
    builder
      .addCase(deleteSpecialty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSpecialty.fulfilled, (state, action) => {
        state.loading = false;
        if (state.data) {
          state.data = state.data.filter((s) => s.id !== action.payload);
        }
      })
      .addCase(deleteSpecialty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as { message: string };
      });
  },
});

export const {
  setSearchTerm,
  setIsActiveFilter,
  clearFilters,
  clearError,
} = specialtiesSlice.actions;

export default specialtiesSlice.reducer;

