import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersApi, User, CreateUserDto, UpdateUserDto } from '@/services/usersApi';
import { AsyncState } from '../types';

interface UsersState extends AsyncState<User[]> {
  selectedUser: User | null;
  filters: {
    searchTerm: string;
    role: string | null;
    isActive: boolean | null;
  };
}

const initialState: UsersState = {
  data: null,
  loading: false,
  error: null,
  selectedUser: null,
  filters: {
    searchTerm: '',
    role: null,
    isActive: true,
  },
};

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const users = await usersApi.getUsers();
      return users;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to fetch users',
      });
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchUserById',
  async (id: string, { rejectWithValue }) => {
    try {
      const user = await usersApi.getUserById(id);
      return user;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to fetch user',
      });
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: CreateUserDto, { rejectWithValue }) => {
    try {
      const user = await usersApi.createUser(userData);
      return user;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to create user',
      });
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, userData }: { id: string; userData: UpdateUserDto }, { rejectWithValue }) => {
    try {
      const user = await usersApi.updateUser(id, userData);
      return user;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'Failed to update user',
      });
    }
  }
);

// Slice
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    setSearchTerm: (state, action) => {
      state.filters.searchTerm = action.payload;
    },
    setRoleFilter: (state, action) => {
      state.filters.role = action.payload;
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
    // Fetch users
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as { message: string };
      });

    // Fetch user by ID
    builder
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.selectedUser = action.payload;
        // Update in list if exists
        if (state.data) {
          const index = state.data.findIndex((u) => u.id === action.payload.id);
          if (index !== -1) {
            state.data[index] = action.payload;
          } else {
            state.data.push(action.payload);
          }
        }
      });

    // Create user
    builder
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        if (state.data) {
          state.data.push(action.payload);
        } else {
          state.data = [action.payload];
        }
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as { message: string };
      });

    // Update user
    builder
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const updatedUser = action.payload;
        // Update in list
        if (state.data) {
          const index = state.data.findIndex((u) => u.id === updatedUser.id);
          if (index !== -1) {
            state.data[index] = updatedUser;
          }
        }
        // Update selected user if it's the same
        if (state.selectedUser?.id === updatedUser.id) {
          state.selectedUser = updatedUser;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as { message: string };
      });
  },
});

export const {
  setSelectedUser,
  setSearchTerm,
  setRoleFilter,
  setIsActiveFilter,
  clearFilters,
  clearError,
} = usersSlice.actions;

export default usersSlice.reducer;

