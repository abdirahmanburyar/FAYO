import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { doctorApi, Doctor, CreateDoctorDto, UpdateDoctorDto } from '@/services/doctorApi';
import { AsyncState } from '../types';

interface DoctorsState extends AsyncState<Doctor[]> {
  selectedDoctor: Doctor | null;
  filters: {
    searchTerm: string;
    specialtyIds: string[];
    isVerified: boolean | null;
    isAvailable: boolean | null;
  };
}

const initialState: DoctorsState = {
  data: null,
  loading: false,
  error: null,
  selectedDoctor: null,
  filters: {
    searchTerm: '',
    specialtyIds: [],
    isVerified: null,
    isAvailable: null,
  },
};

// Async thunks
export const fetchDoctors = createAsyncThunk(
  'doctors/fetchDoctors',
  async (_, { rejectWithValue }) => {
    try {
      const doctors = await doctorApi.getDoctors();
      return doctors;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to fetch doctors',
      });
    }
  }
);

export const fetchDoctorById = createAsyncThunk(
  'doctors/fetchDoctorById',
  async (id: string, { rejectWithValue }) => {
    try {
      const doctor = await doctorApi.getDoctorById(id);
      return doctor;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to fetch doctor',
      });
    }
  }
);

export const createDoctor = createAsyncThunk(
  'doctors/createDoctor',
  async (doctorData: CreateDoctorDto, { rejectWithValue }) => {
    try {
      const doctor = await doctorApi.createDoctor(doctorData);
      return doctor;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to create doctor',
      });
    }
  }
);

export const updateDoctor = createAsyncThunk(
  'doctors/updateDoctor',
  async ({ id, doctorData }: { id: string; doctorData: UpdateDoctorDto }, { rejectWithValue }) => {
    try {
      const doctor = await doctorApi.updateDoctor(id, doctorData);
      return doctor;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to update doctor',
      });
    }
  }
);

export const deleteDoctor = createAsyncThunk(
  'doctors/deleteDoctor',
  async (id: string, { rejectWithValue }) => {
    try {
      await doctorApi.deleteDoctor(id);
      return id;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to delete doctor',
      });
    }
  }
);

// Slice
const doctorsSlice = createSlice({
  name: 'doctors',
  initialState,
  reducers: {
    setSelectedDoctor: (state, action: PayloadAction<Doctor | null>) => {
      state.selectedDoctor = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.filters.searchTerm = action.payload;
    },
    setSpecialtyFilter: (state, action: PayloadAction<string[]>) => {
      state.filters.specialtyIds = action.payload;
    },
    setVerifiedFilter: (state, action: PayloadAction<boolean | null>) => {
      state.filters.isVerified = action.payload;
    },
    setAvailableFilter: (state, action: PayloadAction<boolean | null>) => {
      state.filters.isAvailable = action.payload;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch doctors
    builder
      .addCase(fetchDoctors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctors.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchDoctors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as { message: string };
      });

    // Fetch doctor by ID
    builder
      .addCase(fetchDoctorById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctorById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedDoctor = action.payload;
        // Update in list if exists
        if (state.data) {
          const index = state.data.findIndex((d) => d.id === action.payload.id);
          if (index !== -1) {
            state.data[index] = action.payload;
          } else {
            state.data.push(action.payload);
          }
        }
      })
      .addCase(fetchDoctorById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as { message: string };
      });

    // Create doctor
    builder
      .addCase(createDoctor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDoctor.fulfilled, (state, action) => {
        state.loading = false;
        if (state.data) {
          state.data.push(action.payload);
        } else {
          state.data = [action.payload];
        }
      })
      .addCase(createDoctor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as { message: string };
      });

    // Update doctor
    builder
      .addCase(updateDoctor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDoctor.fulfilled, (state, action) => {
        state.loading = false;
        const updatedDoctor = action.payload;
        // Update in list
        if (state.data) {
          const index = state.data.findIndex((d) => d.id === updatedDoctor.id);
          if (index !== -1) {
            state.data[index] = updatedDoctor;
          }
        }
        // Update selected doctor if it's the same
        if (state.selectedDoctor?.id === updatedDoctor.id) {
          state.selectedDoctor = updatedDoctor;
        }
      })
      .addCase(updateDoctor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as { message: string };
      });

    // Delete doctor
    builder
      .addCase(deleteDoctor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDoctor.fulfilled, (state, action) => {
        state.loading = false;
        if (state.data) {
          state.data = state.data.filter((d) => d.id !== action.payload);
        }
        if (state.selectedDoctor?.id === action.payload) {
          state.selectedDoctor = null;
        }
      })
      .addCase(deleteDoctor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as { message: string };
      });
  },
});

export const {
  setSelectedDoctor,
  setSearchTerm,
  setSpecialtyFilter,
  setVerifiedFilter,
  setAvailableFilter,
  clearFilters,
  clearError,
} = doctorsSlice.actions;

export default doctorsSlice.reducer;

