package com.fayo.healthcare.ui.screens.hospitals

import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fayo.healthcare.data.models.HospitalDto
import com.fayo.healthcare.ui.theme.*
import org.koin.androidx.compose.koinViewModel
import androidx.compose.material3.pulltorefresh.PullToRefreshContainer
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.runtime.snapshotFlow
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import androidx.compose.ui.layout.ContentScale
import androidx.compose.foundation.Image
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HospitalsScreen(
    onNavigateBack: () -> Unit,
    onNavigateToDetails: (String) -> Unit,
    viewModel: HospitalsViewModel = koinViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    // Use ViewModel state as source of truth, but allow local editing
    var localSearchQuery by remember { mutableStateOf(uiState.searchQuery) }
    var searchDebounceJob by remember { mutableStateOf<Job?>(null) }
    val listState = rememberLazyListState()
    
    // Sync local search query with ViewModel state (only when ViewModel state changes externally, not from our own updates)
    // This prevents the TextField from being out of sync when state is updated from other sources
    LaunchedEffect(uiState.searchQuery) {
        // Only sync if the local query doesn't match and we're not in the middle of typing
        // This allows the user to type freely without interference
        val currentLocal = localSearchQuery.trim()
        val currentViewModel = uiState.searchQuery.trim()
        if (currentLocal != currentViewModel && searchDebounceJob?.isActive != true) {
            localSearchQuery = uiState.searchQuery
        }
    }
    
    val pullRefreshState = rememberPullToRefreshState()
    if (pullRefreshState.isRefreshing) {
        LaunchedEffect(true) {
            viewModel.loadHospitals(isRefresh = true)
            pullRefreshState.endRefresh()
        }
    }
    
    // Sync refreshing state with ViewModel
    LaunchedEffect(uiState.isRefreshing) {
        if (uiState.isRefreshing) {
            pullRefreshState.startRefresh()
        } else {
            pullRefreshState.endRefresh()
        }
    }
    
    // Load initial data only once (skip if there's already a search query)
    LaunchedEffect(Unit) {
        // Since we added loadHospitals() to ViewModel init, we only need to check if empty and not loading
        // This covers cases where init might have failed or we navigated back and list is empty
        if (uiState.hospitals.isEmpty() && !uiState.isLoading && uiState.error == null) {
            viewModel.loadHospitals()
        }
    }
    
    // Debounced search - trigger API call when search query changes
    LaunchedEffect(localSearchQuery) {
        searchDebounceJob?.cancel()
        val queryToSearch = localSearchQuery.trim()
        searchDebounceJob = CoroutineScope(Dispatchers.Main).launch {
            if (queryToSearch.isNotBlank()) {
                delay(500) // 500ms debounce
                // Only trigger search if query actually changed (compare trimmed versions)
                val currentViewModelQuery = uiState.searchQuery.trim()
                if (queryToSearch != currentViewModelQuery) {
                    println("🔍 [Screen] Triggering search for: '$queryToSearch'")
                    viewModel.searchHospitals(queryToSearch)
                } else {
                    println("⏭️ [Screen] Skipping search - query unchanged: '$queryToSearch'")
                }
            } else {
                // Search was cleared, reload initial data immediately (no debounce for clear)
                val currentViewModelQuery = uiState.searchQuery.trim()
                if (currentViewModelQuery.isNotBlank()) {
                    println("🗑️ [Screen] Clearing search - reloading all hospitals")
                    viewModel.searchHospitals("")
                } else if (uiState.hospitals.isEmpty() && !uiState.isLoading && !uiState.isRefreshing) {
                    // If search is already empty but no data, reload
                    println("🔄 [Screen] Search empty and no data - reloading")
                    viewModel.loadHospitals(isRefresh = true)
                }
            }
        }
    }
    
    // Pagination - load more when scrolling near the end
    LaunchedEffect(listState) {
        snapshotFlow { 
            val layoutInfo = listState.layoutInfo
            val lastVisibleItem = layoutInfo.visibleItemsInfo.lastOrNull()
            lastVisibleItem?.index == layoutInfo.totalItemsCount - 1
        }.collect { shouldLoadMore ->
            if (shouldLoadMore && !uiState.isLoadingMore && uiState.hasMore) {
                viewModel.loadMoreHospitals()
            }
        }
    }
    
    Scaffold(
        containerColor = BackgroundLight,
        contentWindowInsets = WindowInsets.systemBars
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .nestedScroll(pullRefreshState.nestedScrollConnection)
        ) {
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                // Hero Image Section
                HeroImageSection(onNavigateBack = onNavigateBack)
                
                // Search Bar - Fixed
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(BackgroundLight)
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                ) {
                    OutlinedTextField(
                        value = localSearchQuery,
                        onValueChange = { localSearchQuery = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Search hospitals...") },
                        leadingIcon = {
                            Icon(Icons.Default.Search, contentDescription = null)
                        },
                        trailingIcon = {
                            if (localSearchQuery.isNotEmpty()) {
                                IconButton(onClick = { localSearchQuery = "" }) {
                                    Icon(Icons.Default.Clear, contentDescription = "Clear")
                                }
                            }
                        },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = SkyBlue600,
                            unfocusedBorderColor = Gray300,
                            focusedContainerColor = Color.White,
                            unfocusedContainerColor = Color.White
                        )
                    )
                }
                
                // Scrollable List
                LazyColumn(
                    state = listState,
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    contentPadding = PaddingValues(bottom = padding.calculateBottomPadding() + 16.dp)
                ) {
                
                when {
                    uiState.isLoading && !uiState.isRefreshing -> {
                        items(5) {
                            HospitalCardSkeleton()
                        }
                    }
                    uiState.error != null -> {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(32.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(
                                        text = uiState.error ?: "Error loading hospitals",
                                        color = ErrorRed
                                    )
                                    Spacer(modifier = Modifier.height(16.dp))
                                    Button(onClick = { viewModel.loadHospitals() }) {
                                        Text("Retry")
                                    }
                                }
                            }
                        }
                    }
                    else -> {
                        // Only show empty state if:
                        // 1. List is empty
                        // 2. Not currently loading (initial load, refresh, or loading more)
                        // 3. No error occurred
                        // 4. We've actually tried to load data (not in initial state)
                        val shouldShowEmpty = uiState.hospitals.isEmpty() && 
                            !uiState.isLoading && 
                            !uiState.isRefreshing && 
                            !uiState.isLoadingMore &&
                            uiState.error == null
                        
                        if (shouldShowEmpty) {
                            // Empty state
                            item {
                                EmptyStateIndicator(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(32.dp)
                                )
                            }
                        } else {
                            itemsIndexed(
                                items = uiState.hospitals,
                                key = { _, hospital -> hospital.id }
                            ) { index, hospital ->
                                HospitalCard(
                                    hospital = hospital,
                                    onClick = { onNavigateToDetails(hospital.id) }
                                )
                                // Divider between cards (not after last item)
                                if (index < uiState.hospitals.size - 1 || uiState.isLoadingMore) {
                                    HorizontalDivider(
                                        color = Gray300,
                                        thickness = 1.dp,
                                        modifier = Modifier.padding(horizontal = 16.dp)
                                    )
                                }
                            }
                            
                            // Loading more indicator
                            if (uiState.isLoadingMore) {
                                item {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(16.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(32.dp),
                                            color = SkyBlue600
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
                }
            }

            PullToRefreshContainer(
                state = pullRefreshState,
                modifier = Modifier.align(Alignment.TopCenter)
            )
            
            // Bottom safe area with color
            val bottomPadding = padding.calculateBottomPadding()
            if (bottomPadding > 0.dp) {
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .fillMaxWidth()
                        .height(bottomPadding)
                        .background(BackgroundLight)
                )
            }
        }
    }
}

// Custom shape for curved bottom edge (carved down)
class CurvedBottomShape : Shape {
    override fun createOutline(
        size: Size,
        layoutDirection: androidx.compose.ui.unit.LayoutDirection,
        density: androidx.compose.ui.unit.Density
    ): androidx.compose.ui.graphics.Outline {
        val path = Path().apply {
            // Start from top-left
            moveTo(0f, 0f)
            // Line to top-right
            lineTo(size.width, 0f)
            // Line to bottom-right (before curve)
            lineTo(size.width, size.height - 50f)
            // Create smooth curved bottom - arc downward
            cubicTo(
                x1 = size.width, y1 = size.height - 50f,
                x2 = size.width * 0.5f, y2 = size.height + 20f,
                x3 = 0f, y3 = size.height - 50f
            )
            // Line back to start
            lineTo(0f, 0f)
            close()
        }
        return androidx.compose.ui.graphics.Outline.Generic(path)
    }
}

@Composable
fun HeroImageSection(onNavigateBack: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(250.dp)
            .clip(CurvedBottomShape())
            .background(SkyBlue600)
    ) {
        // Back arrow button - positioned at top-left
        IconButton(
            onClick = onNavigateBack,
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(16.dp)
        ) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "Back",
                tint = Color.White,
                modifier = Modifier.size(24.dp)
            )
        }
        
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Text on the left
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "Find Your Healthcare",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            // Image on the right
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.White.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                val context = LocalContext.current
                val imageResId = context.resources.getIdentifier("hospital", "drawable", context.packageName)
                
                if (imageResId != 0) {
                    Image(
                        painter = painterResource(id = imageResId),
                        contentDescription = "Hospital illustration",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.LocalHospital,
                        contentDescription = null,
                        modifier = Modifier.size(80.dp),
                        tint = Color.White
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HospitalCard(
    hospital: HospitalDto,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 10.dp)
    ) {
        Card(
            onClick = onClick,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            colors = CardDefaults.cardColors(
                containerColor = Color.White
            )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                // Leading image/icon
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(SkyBlue100),
                    contentAlignment = Alignment.Center
                ) {
                    val context = LocalContext.current
                    val imageResId = context.resources.getIdentifier("hospital", "drawable", context.packageName)
                    
                    if (imageResId != 0) {
                        Image(
                            painter = painterResource(id = imageResId),
                            contentDescription = "Hospital logo",
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Default.MedicalServices,
                            contentDescription = null,
                            modifier = Modifier.size(36.dp),
                            tint = SkyBlue600
                        )
                    }
                }
                
                Spacer(modifier = Modifier.width(16.dp))
                
                // Content section
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                ) {
                    // Hospital name
                    Text(
                        text = hospital.name,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = Gray900
                    )
                    
                    Spacer(modifier = Modifier.height(4.dp))
                    
                    // Hospital type
                    Text(
                        text = hospital.type,
                        fontSize = 14.sp,
                        color = SkyBlue600,
                        fontWeight = FontWeight.Medium
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // Address with icon
                    hospital.address?.let { address ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = Gray500
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = address,
                                fontSize = 13.sp,
                                color = Gray600,
                                maxLines = 1,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }
        }
        
        // Blue right border overlay
        Box(
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .width(4.dp)
                .fillMaxHeight()
                .background(
                    color = SkyBlue600,
                    shape = RoundedCornerShape(topEnd = 16.dp, bottomEnd = 16.dp)
                )
        )
    }
}

@Composable
fun HospitalCardSkeleton() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 10.dp)
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                // Leading skeleton
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .shimmerEffect()
                )
                
                Spacer(modifier = Modifier.width(16.dp))
                
                // Content skeleton
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(0.7f)
                            .height(20.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .shimmerEffect()
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(0.5f)
                            .height(16.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .shimmerEffect()
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(0.8f)
                            .height(14.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .shimmerEffect()
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(0.6f)
                            .height(14.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .shimmerEffect()
                    )
                }
            }
        }
        
        // Blue border skeleton
        Box(
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .width(4.dp)
                .fillMaxHeight()
                .background(
                    color = SkyBlue600,
                    shape = RoundedCornerShape(topEnd = 16.dp, bottomEnd = 16.dp)
                )
        )
    }
}

@Composable
fun EmptyStateIndicator(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.SearchOff,
            contentDescription = null,
            modifier = Modifier.size(80.dp),
            tint = Gray400
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "No hospitals found",
            fontSize = 18.sp,
            fontWeight = FontWeight.Medium,
            color = Gray600
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Try adjusting your search criteria",
            fontSize = 14.sp,
            color = Gray500,
            textAlign = TextAlign.Center
        )
    }
}

fun Modifier.shimmerEffect(): Modifier = composed {
    val transition = rememberInfiniteTransition(label = "shimmer")
    val translateAnimation by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1000f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = 1000,
                easing = FastOutSlowInEasing
            )
        ),
        label = "shimmer"
    )
    
    val shimmerColors = listOf(
        Color.LightGray.copy(alpha = 0.6f),
        Color.LightGray.copy(alpha = 0.2f),
        Color.LightGray.copy(alpha = 0.6f),
    )
    
    val brush = Brush.linearGradient(
        colors = shimmerColors,
        start = Offset.Zero,
        end = Offset(x = translateAnimation, y = translateAnimation)
    )
    
    background(brush)
}
