package com.fayo.healthcare.ui.screens.doctors

import android.util.Log
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.snapshotFlow
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
import androidx.compose.foundation.Image
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fayo.healthcare.data.models.DoctorDto
import com.fayo.healthcare.ui.theme.*
import org.koin.compose.koinInject
import com.fayo.healthcare.data.api.ApiClient
import com.fayo.healthcare.data.storage.AndroidTokenStorage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.collect

// Pastel colors for doctor cards
val LightGreen = Color(0xFFE8F5E9)
val LightTeal = Color(0xFFE0F2F1)
val LightPink = Color(0xFFFCE4EC)
val LightPurple = Color(0xFFF3E5F5)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorsScreen(
    onNavigateBack: () -> Unit,
    onNavigateToDetails: (String) -> Unit = {},
    apiClient: ApiClient = koinInject(),
    tokenStorage: AndroidTokenStorage = koinInject()
) {
    var doctors by remember { mutableStateOf<List<DoctorDto>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }
    var isLoadingMore by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var searchQuery by remember { mutableStateOf("") }
    var localSearchQuery by remember { mutableStateOf("") }
    var currentPage by remember { mutableStateOf(1) }
    var hasMore by remember { mutableStateOf(true) }
    var searchDebounceJob by remember { mutableStateOf<Job?>(null) }
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()
    
    // Get user name from storage
    val userName = remember { tokenStorage.getUserName() ?: "User" }
    
    val pageSize = 5 // Load 5 doctors per page
    
    // Load initial data
    LaunchedEffect(Unit) {
        Log.d("DoctorsScreen", "Initializing screen")
        if (doctors.isEmpty()) {
            Log.d("DoctorsScreen", "Loading initial doctors list (page=$currentPage, limit=$pageSize)")
            isLoading = true
                loadDoctors(apiClient, currentPage, pageSize, null) { result ->
                result.onSuccess { list ->
                    Log.d("DoctorsScreen", "Successfully loaded ${list.size} doctors")
                    doctors = list.distinctBy { it.id } // Deduplicate
                    hasMore = list.size >= pageSize
                    Log.d("DoctorsScreen", "Total doctors: ${doctors.size}, hasMore: $hasMore")
                }.onFailure {
                    Log.e("DoctorsScreen", "Error loading doctors: ${it.message}", it)
                    error = it.message
                }
                isLoading = false
                Log.d("DoctorsScreen", "Loading completed, isLoading: $isLoading")
            }
        } else {
            Log.d("DoctorsScreen", "Doctors already loaded (${doctors.size} doctors)")
        }
    }
    
    // Debounced search - trigger API call when search query changes
    LaunchedEffect(localSearchQuery) {
        searchDebounceJob?.cancel()
        val queryToSearch = localSearchQuery.trim()
        searchDebounceJob = CoroutineScope(Dispatchers.Main).launch {
            if (queryToSearch.isNotBlank()) {
                Log.d("DoctorsScreen", "Debouncing search for 500ms...")
                delay(500) // Debounce 500ms
                // Only trigger search if query actually changed
                val currentSearch = searchQuery.trim()
                if (queryToSearch != currentSearch) {
                    Log.d("DoctorsScreen", "Executing search: '$queryToSearch' (current: '$currentSearch')")
                    searchQuery = queryToSearch
                    currentPage = 1
                    doctors = emptyList()
                    hasMore = true
                    isLoading = true
                    error = null
                    loadDoctors(apiClient, 1, pageSize, queryToSearch) { result ->
                        result.onSuccess { list ->
                            Log.d("DoctorsScreen", "Search completed: found ${list.size} doctors")
                            doctors = list.distinctBy { it.id } // Deduplicate
                            hasMore = list.size >= pageSize
                            Log.d("DoctorsScreen", "Search results - Total: ${doctors.size}, hasMore: $hasMore")
                        }.onFailure {
                            Log.e("DoctorsScreen", "Search error: ${it.message}", it)
                            error = it.message
                        }
                        isLoading = false
                    }
                } else {
                    Log.d("DoctorsScreen", "Skipping search - query unchanged: '$queryToSearch'")
                }
            } else {
                // Search was cleared, reload initial data immediately (no debounce for clear)
                val currentSearch = searchQuery.trim()
                if (currentSearch.isNotBlank()) {
                    Log.d("DoctorsScreen", "Clearing search - reloading all doctors")
                    searchQuery = ""
                    currentPage = 1
                    doctors = emptyList()
                    hasMore = true
                    isLoading = true
                    error = null
                    loadDoctors(apiClient, 1, pageSize, null) { result ->
                        result.onSuccess { list ->
                            Log.d("DoctorsScreen", "Reloaded ${list.size} doctors after clearing search")
                            doctors = list.distinctBy { it.id } // Deduplicate
                            hasMore = list.size >= pageSize
                        }.onFailure {
                            Log.e("DoctorsScreen", "Error reloading doctors: ${it.message}", it)
                            error = it.message
                        }
                        isLoading = false
                    }
                }
            }
        }
    }
    
    // Pagination - load more when scrolling
    LaunchedEffect(listState) {
        snapshotFlow {
            val layoutInfo = listState.layoutInfo
            val lastVisibleItem = layoutInfo.visibleItemsInfo.lastOrNull()
            val shouldLoadMore = lastVisibleItem != null &&
                    lastVisibleItem.index >= layoutInfo.totalItemsCount - 3 &&
                    hasMore && !isLoadingMore && !isLoading
            shouldLoadMore
        }.collect { shouldLoad ->
            if (shouldLoad) {
                val nextPage = currentPage + 1
                Log.d("DoctorsScreen", "Loading more doctors - page $nextPage (current: $currentPage, total: ${doctors.size})")
                isLoadingMore = true
                loadDoctors(apiClient, nextPage, pageSize, searchQuery.takeIf { it.isNotBlank() }) { result ->
                    result.onSuccess { list ->
                        Log.d("DoctorsScreen", "Loaded ${list.size} more doctors (page $nextPage)")
                        // Remove duplicates by ID when appending
                        val existingIds = doctors.map { it.id }.toSet()
                        val newDoctors = list.filter { it.id !in existingIds }
                        doctors = doctors + newDoctors
                        hasMore = list.size >= pageSize
                        currentPage = nextPage
                        Log.d("DoctorsScreen", "Updated state - Total: ${doctors.size}, hasMore: $hasMore, currentPage: $currentPage")
                    }.onFailure {
                        Log.e("DoctorsScreen", "Error loading more doctors: ${it.message}", it)
                        error = it.message
                    }
                    isLoadingMore = false
                }
            }
        }
    }
    
    Scaffold(
        containerColor = BackgroundLight,
        contentWindowInsets = WindowInsets.systemBars
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Green Header with Welcome Message and Back Arrow
            WelcomeHeader(
                userName = userName,
                onNavigateBack = onNavigateBack,
                modifier = Modifier.fillMaxWidth()
            )
            
            // "Find Your Doctor" Title Section
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 20.dp, vertical = 16.dp)
            ) {
                Box {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Find Your ",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = Gray900
                        )
                        Text(
                            text = "Doctor",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = Gray900
                        )
                    }
                    // Light blue underline under "Doctor"
                    Box(
                        modifier = Modifier
                            .width(60.dp)
                            .height(3.dp)
                            .offset(x = 120.dp, y = 24.dp) // Position under "Doctor"
                            .background(SkyBlue400)
                    )
                }
            }
            
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
                    placeholder = { Text("Search doctors by name or specialty...") },
                    leadingIcon = {
                        Icon(Icons.Default.Search, contentDescription = null, tint = Gray500)
                    },
                    trailingIcon = {
                        if (localSearchQuery.isNotEmpty()) {
                            IconButton(onClick = { localSearchQuery = "" }) {
                                Icon(Icons.Default.Clear, contentDescription = "Clear", tint = Gray500)
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
            
            // Doctors List
            Box(modifier = Modifier.fillMaxSize()) {
                when {
                    isLoading && doctors.isEmpty() -> {
                        // Show skeleton loaders
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            items(5) {
                                DoctorCardSkeleton()
                            }
                        }
                    }
                    error != null && doctors.isEmpty() -> {
                        Column(
                            modifier = Modifier.align(Alignment.Center),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(text = error ?: "Unknown Error", color = ErrorRed)
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(onClick = {
                                error = null
                                isLoading = true
                                scope.launch {
                                    loadDoctors(apiClient, 1, pageSize, searchQuery.takeIf { it.isNotBlank() }) { result ->
                                        result.onSuccess { list ->
                                            doctors = list
                                            hasMore = list.size >= pageSize
                                        }.onFailure {
                                            error = it.message
                                        }
                                        isLoading = false
                                    }
                                }
                            }) {
                                Text("Retry")
                            }
                        }
                    }
                    doctors.isEmpty() && !isLoading -> {
                        EmptyStateIndicator(
                            message = if (searchQuery.isNotBlank()) {
                                "No doctors found matching your search."
                            } else {
                                "No doctors available."
                            }
                        )
                    }
                    else -> {
                        LazyColumn(
                            state = listState,
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                                   items(doctors) { doctor ->
                                       DoctorCard(
                                           doctor = doctor,
                                           index = doctors.indexOf(doctor),
                                           onClick = {
                                               onNavigateToDetails(doctor.id)
                                           }
                                       )
                                   }
                            
                            if (isLoadingMore) {
                                item {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(16.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(32.dp),
                                            color = SuccessGreen,
                                            strokeWidth = 3.dp
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// Custom shape for curved bottom edge (carved down)
class CurvedBottomShape : Shape {
    override fun createOutline(
        size: Size,
        layoutDirection: LayoutDirection,
        density: Density
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
fun WelcomeHeader(
    userName: String,
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(200.dp)
            .clip(CurvedBottomShape())
            .background(SkyBlue600) // Blue color like hospital screen
    ) {
        // Back Arrow (top-left)
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
        
        // Welcome text section (left side, below back arrow)
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(start = 24.dp, bottom = 40.dp)
        ) {
            Text(
                text = "Welcome",
                fontSize = 16.sp,
                color = Color.White.copy(alpha = 0.9f),
                fontWeight = FontWeight.Normal
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = userName,
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }
        
        // Doctor illustration (right side) - using image, fit whole height
        val context = LocalContext.current
        val imageResId = context.resources.getIdentifier("doctor_header", "drawable", context.packageName)
        Box(
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .fillMaxHeight()
                .width(140.dp)
                .padding(end = 16.dp),
            contentAlignment = Alignment.Center
        ) {
            if (imageResId != 0) {
                Image(
                    painter = painterResource(id = imageResId),
                    contentDescription = "Doctor illustration",
                    modifier = Modifier
                        .fillMaxSize(),
                    contentScale = ContentScale.FillHeight
                )
            } else {
                // Fallback to icon if image not found
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    tint = Color.White.copy(alpha = 0.9f),
                    modifier = Modifier.size(120.dp)
                )
            }
        }
    }
}

@Composable
fun DoctorCard(doctor: DoctorDto, index: Int, onClick: () -> Unit = {}) {
    // Cycle through pastel colors
    val cardColors = listOf(LightGreen, LightTeal, LightPink, LightPurple)
    val cardColor = cardColors[index % cardColors.size]
    
    val user = doctor.user
    val doctorName = if (user != null) {
        "Dr. ${user.firstName} ${user.lastName}".trim()
    } else {
        "Dr. ${doctor.id.takeLast(8)}"
    }
    
    // Default rating (since we don't have rating data yet)
    val rating = 4.8f
    
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 4.dp, vertical = 2.dp),
        shape = RoundedCornerShape(24.dp),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 4.dp,
            pressedElevation = 6.dp,
            hoveredElevation = 5.dp
        ),
        colors = CardDefaults.cardColors(
            containerColor = cardColor
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 20.dp, horizontal = 22.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Doctor Info (left side) - professional layout
            Column(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight()
                    .padding(end = 20.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    // Doctor name - professional typography with proper hierarchy
                    Text(
                        text = doctorName,
                        fontSize = 19.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF0F172A), // Professional deep slate
                        letterSpacing = (-0.2).sp,
                        lineHeight = 26.sp
                    )
                    
                    Spacer(modifier = Modifier.height(10.dp))
                    
                    // Specialty - clean, professional text
                    Text(
                        text = "${doctor.specialty.ifBlank { "General Practice" }}",
                        fontSize = 14.sp,
                        color = SkyBlue700,
                        fontWeight = FontWeight.Medium,
                        letterSpacing = 0.2.sp
                    )
                    
                    Spacer(modifier = Modifier.height(18.dp))
                    
                    // Experience - professional info display with subtle styling
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Work,
                            contentDescription = null,
                            modifier = Modifier.size(15.dp),
                            tint = Gray600
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "${doctor.experience} Years Experience",
                            fontSize = 13.sp,
                            color = Gray700,
                            fontWeight = FontWeight.Normal,
                            letterSpacing = 0.15.sp
                        )
                    }
                }
                
                // Rating - bottom aligned, clean professional style
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = null,
                        modifier = Modifier.size(15.dp),
                        tint = WarningYellow
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "$rating",
                        fontSize = 14.sp,
                        color = Gray800,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 0.1.sp
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Rating",
                        fontSize = 13.sp,
                        color = Gray600,
                        fontWeight = FontWeight.Normal,
                        letterSpacing = 0.1.sp
                    )
                }
            }
            
            Spacer(modifier = Modifier.width(18.dp))
            
            // Doctor Image (right side) - fit full height of card
            val context = LocalContext.current
            val doctorImageResId = context.resources.getIdentifier("doctor", "drawable", context.packageName)
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .width(120.dp)
                    .clip(RoundedCornerShape(18.dp))
                    .background(
                        brush = Brush.verticalGradient(
                            colors = listOf(
                                Color.White.copy(alpha = 0.3f),
                                cardColor.copy(alpha = 0.1f)
                            )
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(4.dp)
                        .clip(RoundedCornerShape(16.dp))
                ) {
                    if (doctorImageResId != 0) {
                        Image(
                            painter = painterResource(id = doctorImageResId),
                            contentDescription = "Doctor photo",
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.FillHeight
                        )
                    } else {
                        // Fallback to icon if image not found
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            modifier = Modifier.size(70.dp),
                            tint = Gray400
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun DoctorCardSkeleton() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        colors = CardDefaults.cardColors(
            containerColor = LightGreen
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Doctor Info skeleton (left side)
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
                Spacer(modifier = Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.6f)
                        .height(14.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .shimmerEffect()
                )
                Spacer(modifier = Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.4f)
                        .height(14.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .shimmerEffect()
                )
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            // Doctor Image skeleton (right side)
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(CircleShape)
                    .shimmerEffect()
            )
        }
    }
}

@Composable
fun EmptyStateIndicator(message: String) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(
                imageVector = Icons.Default.PersonOff,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = Gray400
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = message,
                fontSize = 16.sp,
                color = Gray600,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
        }
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

// Helper function to load doctors
fun loadDoctors(
    apiClient: ApiClient,
    page: Int,
    limit: Int,
    search: String?,
    onResult: (Result<List<DoctorDto>>) -> Unit
) {
    CoroutineScope(Dispatchers.Main).launch {
        Log.d("loadDoctors", "Calling API - page=$page, limit=$limit, search=$search")
        val result = apiClient.getDoctors(page, limit, search)
        result.onSuccess { doctors ->
            Log.d("loadDoctors", "API success - received ${doctors.size} doctors")
            doctors.forEachIndexed { idx, doctor ->
                val user = doctor.user
                Log.d("loadDoctors", "Doctor $idx: id=${doctor.id}, name=${user?.let { "${it.firstName} ${it.lastName}" } ?: "N/A"}, specialty=${doctor.specialty}, experience=${doctor.experience}")
            }
        }.onFailure { error ->
            Log.e("loadDoctors", "API failure: ${error.message}", error)
        }
        onResult(result)
    }
}
