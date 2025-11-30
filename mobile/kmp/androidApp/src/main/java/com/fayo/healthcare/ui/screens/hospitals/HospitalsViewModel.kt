package com.fayo.healthcare.ui.screens.hospitals

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fayo.healthcare.data.api.ApiClient
import com.fayo.healthcare.data.models.HospitalDto
import com.fayo.healthcare.data.models.HospitalUpdateEvent
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject

data class HospitalsUiState(
    val hospitals: List<HospitalDto> = emptyList(),
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val isRefreshing: Boolean = false,
    val error: String? = null,
    val currentPage: Int = 1,
    val hasMore: Boolean = true,
    val searchQuery: String = ""
)

class HospitalsViewModel : ViewModel(), KoinComponent {
    private val apiClient: ApiClient by inject()
    
    private val _uiState = MutableStateFlow(HospitalsUiState())
    val uiState: StateFlow<HospitalsUiState> = _uiState.asStateFlow()
    
    private val pageSize = 5
    
    init {
        loadHospitals()
        observeRealtimeUpdates()
    }

    fun loadHospitals(isRefresh: Boolean = false) {
        viewModelScope.launch {
            val currentState = _uiState.value
            // Prevent multiple simultaneous loads only if not refreshing (allow refresh to interrupt)
            if (currentState.isLoading && !isRefresh) {
                println("⏸️ [ViewModel] Skipping load - already loading")
                return@launch
            }
            if (currentState.isRefreshing && isRefresh) {
                println("⏸️ [ViewModel] Skipping refresh - already refreshing")
                return@launch
            }
            
            val page = if (isRefresh) 1 else currentState.currentPage
            val search = currentState.searchQuery.takeIf { it.isNotBlank() }
            
            println("🔄 [ViewModel] Loading hospitals: page=$page, limit=$pageSize, search=$search, isRefresh=$isRefresh")
            
            _uiState.value = currentState.copy(
                isLoading = !isRefresh && page == 1,
                isRefreshing = isRefresh,
                currentPage = page,
                error = null
            )
            
            apiClient.getHospitals(page = page, limit = pageSize, search = search)
                .onSuccess { hospitals ->
                    println("✅ [ViewModel] Loaded ${hospitals.size} hospitals")
                    val updatedHospitals = if (isRefresh || page == 1) {
                        // Deduplicate even on refresh/page 1 in case API returns duplicates
                        hospitals.distinctBy { it.id }
                    } else {
                        // Remove duplicates by ID when appending
                        val existingIds = currentState.hospitals.map { it.id }.toSet()
                        val newHospitals = hospitals.filter { it.id !in existingIds }
                        currentState.hospitals + newHospitals
                    }
                    
                    _uiState.value = _uiState.value.copy(
                        hospitals = updatedHospitals,
                        isLoading = false,
                        isRefreshing = false,
                        isLoadingMore = false,
                        hasMore = hospitals.size == pageSize,
                        currentPage = if (hospitals.isNotEmpty()) page else currentState.currentPage
                    )
                }
                .onFailure { error ->
                    println("❌ [ViewModel] Error loading hospitals: ${error.message}")
                    _uiState.value = _uiState.value.copy(
                        error = error.message ?: "Failed to load hospitals",
                        isLoading = false,
                        isRefreshing = false,
                        isLoadingMore = false
                    )
                }
        }
    }
    
    fun loadMoreHospitals() {
        if (_uiState.value.isLoadingMore || !_uiState.value.hasMore) return
        
        viewModelScope.launch {
            val currentState = _uiState.value
            val nextPage = currentState.currentPage + 1
            // Include search query if present (allows pagination of search results)
            val search = currentState.searchQuery.takeIf { it.isNotBlank() }
            
            _uiState.value = currentState.copy(isLoadingMore = true)
            
            apiClient.getHospitals(page = nextPage, limit = pageSize, search = search)
                .onSuccess { hospitals ->
                    // Remove duplicates by ID when appending
                    val existingIds = currentState.hospitals.map { it.id }.toSet()
                    val newHospitals = hospitals.filter { it.id !in existingIds }
                    
                    _uiState.value = _uiState.value.copy(
                        hospitals = currentState.hospitals + newHospitals,
                        isLoadingMore = false,
                        hasMore = hospitals.size == pageSize,
                        currentPage = nextPage
                    )
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        error = error.message ?: "Failed to load more hospitals",
                        isLoadingMore = false
                    )
                }
        }
    }
    
    fun searchHospitals(query: String) {
        viewModelScope.launch {
            val trimmedQuery = query.trim()
            val isClearingSearch = trimmedQuery.isBlank() && _uiState.value.searchQuery.isNotBlank()
            
            println("🔍 [ViewModel] Search hospitals: '$trimmedQuery' (clearing: $isClearingSearch)")
            
            // Set refreshing state immediately to prevent empty state flash
            _uiState.value = _uiState.value.copy(
                searchQuery = trimmedQuery,
                currentPage = 1,
                hospitals = emptyList(), // Clear list when search changes
                hasMore = true,
                error = null,
                isRefreshing = true, // Set refreshing immediately to prevent empty state
                isLoading = false // Will be set by loadHospitals if needed
            )
            loadHospitals(isRefresh = true)
        }
    }
    
    private fun observeRealtimeUpdates() {
        viewModelScope.launch {
            apiClient.observeHospitalUpdates().collect { event ->
                val currentHospitals = _uiState.value.hospitals.toMutableList()
                when (event) {
                    is HospitalUpdateEvent.Created -> {
                        if (!currentHospitals.any { it.id == event.hospital.id }) {
                            currentHospitals.add(0, event.hospital)
                        }
                    }
                    is HospitalUpdateEvent.Updated -> {
                        val index = currentHospitals.indexOfFirst { it.id == event.hospital.id }
                        if (index != -1) {
                            currentHospitals[index] = event.hospital
                        }
                    }
                    is HospitalUpdateEvent.Deleted -> {
                        currentHospitals.removeAll { it.id == event.hospitalId }
                    }
                }
                _uiState.value = _uiState.value.copy(hospitals = currentHospitals)
            }
        }
    }
}
