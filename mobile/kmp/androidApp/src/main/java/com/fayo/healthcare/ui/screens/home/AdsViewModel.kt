package com.fayo.healthcare.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fayo.healthcare.data.api.ApiClient
import com.fayo.healthcare.data.models.AdDto
import com.fayo.healthcare.data.models.AdUpdateEvent
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.launch

data class AdsUiState(
    val ads: List<AdDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

class AdsViewModel(
    private val apiClient: ApiClient
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(AdsUiState())
    val uiState: StateFlow<AdsUiState> = _uiState.asStateFlow()
    
    private var adsUpdatesJob: kotlinx.coroutines.Job? = null
    
    init {
        loadAds()
        startObservingAdsUpdates()
    }
    
    fun loadAds() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            apiClient.getActiveAds()
                .onSuccess { ads ->
                    _uiState.value = _uiState.value.copy(
                        ads = ads,
                        isLoading = false
                    )
                    println("✅ [AdsViewModel] Loaded ${ads.size} ads")
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message ?: "Failed to load ads"
                    )
                    println("❌ [AdsViewModel] Error loading ads: ${error.message}")
                }
        }
    }
    
    private fun startObservingAdsUpdates() {
        adsUpdatesJob = viewModelScope.launch {
            apiClient.observeAdsUpdates()
                .catch { error ->
                    println("❌ [AdsViewModel] Error observing ads updates: ${error.message}")
                    error.printStackTrace()
                }
                .collect { event ->
                    when (event.type) {
                        "ad.created" -> {
                            event.ad?.let { ad ->
                                val currentAds = _uiState.value.ads.toMutableList()
                                // Add new ad if it's active and not already in the list
                                if (ad.status == com.fayo.healthcare.data.models.AdStatus.ACTIVE && 
                                    !currentAds.any { it.id == ad.id }) {
                                    currentAds.add(ad)
                                    currentAds.sortByDescending { it.priority }
                                    _uiState.value = _uiState.value.copy(ads = currentAds)
                                    println("✅ [AdsViewModel] Ad created: ${ad.id}")
                                }
                            }
                        }
                        "ad.updated" -> {
                            event.ad?.let { updatedAd ->
                                val currentAds = _uiState.value.ads.toMutableList()
                                val index = currentAds.indexOfFirst { it.id == updatedAd.id }
                                if (index >= 0) {
                                    // Update existing ad
                                    if (updatedAd.status == com.fayo.healthcare.data.models.AdStatus.ACTIVE) {
                                        currentAds[index] = updatedAd
                                    } else {
                                        // Remove if no longer active
                                        currentAds.removeAt(index)
                                    }
                                    currentAds.sortByDescending { it.priority }
                                    _uiState.value = _uiState.value.copy(ads = currentAds)
                                    println("✅ [AdsViewModel] Ad updated: ${updatedAd.id}")
                                } else if (updatedAd.status == com.fayo.healthcare.data.models.AdStatus.ACTIVE) {
                                    // Add if it's now active and wasn't in the list
                                    currentAds.add(updatedAd)
                                    currentAds.sortByDescending { it.priority }
                                    _uiState.value = _uiState.value.copy(ads = currentAds)
                                    println("✅ [AdsViewModel] Ad added after update: ${updatedAd.id}")
                                }
                            }
                        }
                        "ad.deleted" -> {
                            event.adId?.let { adId ->
                                val currentAds = _uiState.value.ads.toMutableList()
                                currentAds.removeAll { it.id == adId }
                                _uiState.value = _uiState.value.copy(ads = currentAds)
                                println("✅ [AdsViewModel] Ad deleted: $adId")
                            }
                        }
                    }
                }
        }
    }
    
    fun trackAdView(adId: String) {
        viewModelScope.launch {
            apiClient.incrementAdView(adId)
                .onFailure { error ->
                    println("❌ [AdsViewModel] Error tracking ad view: ${error.message}")
                }
        }
    }
    
    fun trackAdClick(adId: String) {
        viewModelScope.launch {
            apiClient.incrementAdClick(adId)
                .onFailure { error ->
                    println("❌ [AdsViewModel] Error tracking ad click: ${error.message}")
                }
        }
    }
    
    override fun onCleared() {
        super.onCleared()
        adsUpdatesJob?.cancel()
    }
}

