package com.fayo.healthcare.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fayo.healthcare.data.api.ApiClient
import com.fayo.healthcare.data.models.AppointmentDto
import com.fayo.healthcare.data.models.DoctorDto
import com.fayo.healthcare.ui.theme.*
import kotlinx.coroutines.launch
import org.koin.compose.koinInject
import org.koin.androidx.compose.koinViewModel
import java.text.SimpleDateFormat
import java.util.*
import coil.compose.AsyncImage
import coil.request.ImageRequest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppointmentsScreen(
    onNavigateBack: () -> Unit,
    @Suppress("UNUSED_PARAMETER") onNavigateToDetails: (String) -> Unit = {}, // Optional callback if we add details screen
    viewModel: AppointmentsViewModel = koinViewModel(),
    apiClient: ApiClient = koinInject()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    LaunchedEffect(Unit) {
        viewModel.loadAppointments()
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        "My Appointments",
                        fontWeight = FontWeight.SemiBold
                    ) 
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = Color.White
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = SkyBlue600
                )
            )
        },
        containerColor = BackgroundLight
    ) { padding ->
        when {
            uiState.isLoading -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    items(3) {
                        AppointmentTicketSkeleton()
                    }
                }
            }
            uiState.error != null -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = uiState.error ?: "Error loading appointments",
                            color = ErrorRed
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { viewModel.loadAppointments() }) {
                            Text("Retry")
                        }
                    }
                }
            }
            uiState.appointments.isEmpty() -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.CalendarToday,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = Gray400
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "No appointments yet",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Gray700
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Book your first appointment",
                            fontSize = 14.sp,
                            color = Gray600
                        )
                    }
                }
            }
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    items(uiState.appointments) { appointment ->
                        AirlineTicketCard(
                            appointment = appointment,
                            apiClient = apiClient
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun AirlineTicketCard(
    appointment: AppointmentDto,
    apiClient: ApiClient
) {
    var doctor by remember { mutableStateOf<DoctorDto?>(null) }
    val scope = rememberCoroutineScope()
    
    // Load doctor information
    LaunchedEffect(appointment.doctorId) {
        scope.launch {
            if (appointment.doctorId != null) {
                apiClient.getDoctorById(appointment.doctorId!!) // Use non-null assertion since we checked for null
                    .onSuccess { doctorData ->
                        doctor = doctorData
                    }
                    .onFailure {
                        // Doctor not found, continue without doctor info
                    }
            }
        }
    }
    
    val doctorName = doctor?.user?.let { 
        "Dr. ${it.firstName} ${it.lastName}".trim()
    } ?: "Doctor"
    
    val statusColor = when (appointment.status) {
        "CONFIRMED" -> SuccessGreen
        "PENDING" -> WarningYellow
        "COMPLETED" -> InfoBlue
        "CANCELLED" -> ErrorRed
        else -> Gray500
    }
    
    Box(
        modifier = Modifier.fillMaxWidth()
    ) {
        // Main Ticket Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
            colors = CardDefaults.cardColors(
                containerColor = Color.White
            )
        ) {
            Column(
                modifier = Modifier.fillMaxWidth()
            ) {
                // Header Section with Status
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(
                                    statusColor.copy(alpha = 0.1f),
                                    Color.White
                                )
                            )
                        )
                        .padding(20.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "APPOINTMENT",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Gray500,
                                letterSpacing = 1.5.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = formatDateForTicket(appointment.appointmentDate),
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Bold,
                                color = Gray900
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = formatTimeForTicket(appointment.appointmentTime),
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Medium,
                                color = SkyBlue600
                            )
                        }
                        StatusBadge(status = appointment.status, statusColor = statusColor)
                    }
                }
                
                // Perforated Edge Effect
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(Color.White)
                ) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val dashPathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 5f), 0f)
                        drawLine(
                            color = Gray300,
                            start = Offset(0f, 0f),
                            end = Offset(size.width, 0f),
                            strokeWidth = 1.dp.toPx(),
                            pathEffect = dashPathEffect
                        )
                    }
                }
                
                // Main Content Section
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    // Left Side - Doctor Info
                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = "DOCTOR",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Gray500,
                            letterSpacing = 1.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        // Avatar + Name
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (doctor?.imageUrl != null) {
                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .clip(CircleShape)
                                        .background(SkyBlue100)
                                ) {
                                    AsyncImage(
                                        model = ImageRequest.Builder(LocalContext.current)
                                            .data(doctor!!.imageUrl)
                                            .crossfade(true)
                                            .build(),
                                        contentDescription = "Doctor avatar",
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                            }
                            
                            Column {
                                Text(
                                    text = doctorName,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Gray900,
                                    lineHeight = 22.sp
                                )
                                
                                doctor?.specialty?.takeIf { it.isNotBlank() }?.let { specialty ->
                                    Text(
                                        text = specialty,
                                        fontSize = 14.sp,
                                        color = Gray600
                                    )
                                }
                            }
                        }
                    }
                    
                    // Right Side - Details
                    Column(
                        modifier = Modifier.weight(0.7f),
                        horizontalAlignment = Alignment.End
                    ) {
                        Text(
                            text = "CONSULTATION",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Gray500,
                            letterSpacing = 1.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = appointment.consultationType.replace("_", " "),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Gray900,
                            textAlign = TextAlign.End
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.AttachMoney,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp),
                                tint = SuccessGreen
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "$${appointment.consultationFee / 100.0}",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = SuccessGreen
                            )
                        }
                    }
                }
                
                // Reason Section (if available)
                appointment.reason?.takeIf { it.isNotBlank() }?.let { reason ->
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Gray50)
                            .padding(16.dp)
                    ) {
                        Column {
                            Text(
                                text = "REASON",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Gray500,
                                letterSpacing = 1.sp
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = reason,
                                fontSize = 14.sp,
                                color = Gray700
                            )
                        }
                    }
                }
                
                // Ticket Stub Section
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(SkyBlue50)
                        .padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "APPOINTMENT NUMBER",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                color = Gray500,
                                letterSpacing = 1.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = formatAppointmentNumber(appointment.appointmentNumber),
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = SkyBlue800,
                                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                            )
                        }
                        Icon(
                            imageVector = Icons.Default.MedicalServices,
                            contentDescription = null,
                            modifier = Modifier.size(32.dp),
                            tint = SkyBlue600.copy(alpha = 0.5f)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun StatusBadge(status: String, statusColor: Color) {
    val statusText = when (status) {
        "CONFIRMED" -> "CONFIRMED"
        "PENDING" -> "PENDING"
        "COMPLETED" -> "COMPLETED"
        "CANCELLED" -> "CANCELLED"
        else -> status
    }
    
    Surface(
        color = statusColor.copy(alpha = 0.15f),
        shape = RoundedCornerShape(12.dp)
    ) {
        Text(
            text = statusText,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = statusColor,
            letterSpacing = 0.5.sp
        )
    }
}

fun formatDateForTicket(dateString: String): String {
    return try {
        // Try parsing as ISO format first
        val inputFormat = try {
            SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        } catch (e: Exception) {
            SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        }
        val outputFormat = SimpleDateFormat("MMM dd", Locale.getDefault())
        val date = inputFormat.parse(dateString)
        date?.let { outputFormat.format(it) } ?: dateString
    } catch (e: Exception) {
        // Fallback: try simple date format
        try {
            val simpleFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val date = simpleFormat.parse(dateString)
            val outputFormat = SimpleDateFormat("MMM dd", Locale.getDefault())
            date?.let { outputFormat.format(it) } ?: dateString
        } catch (e2: Exception) {
            dateString
        }
    }
}

fun formatTimeForTicket(timeString: String): String {
    return try {
        // Parse 24-hour format (HH:mm)
        val parts = timeString.split(":")
        if (parts.size == 2) {
            val hour = parts[0].toInt()
            val minute = parts[1]
            val period = if (hour < 12) "AM" else "PM"
            val displayHour = when {
                hour == 0 -> 12
                hour > 12 -> hour - 12
                else -> hour
            }
            "$displayHour:$minute $period"
        } else {
            timeString
        }
    } catch (e: Exception) {
        timeString
    }
}

fun formatAppointmentNumber(number: Int?): String {
    // Format: 001, 002, ..., 999, 1000, 1001, etc.
    // Numbers < 1000: pad with leading zeros (001, 225, 263, 999)
    // Numbers >= 1000: no padding (1000, 1001, etc.)
    if (number == null) return "N/A"
    
    return if (number < 1000) {
        String.format("%03d", number)
    } else {
        number.toString()
    }
}

@Composable
fun AppointmentTicketSkeleton() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        )
    ) {
        Column(
            modifier = Modifier.fillMaxWidth()
        ) {
            // Header Section Skeleton
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Gray100)
                    .padding(20.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Box(
                            modifier = Modifier
                                .width(100.dp)
                                .height(12.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .shimmerEffect()
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Box(
                            modifier = Modifier
                                .width(80.dp)
                                .height(24.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .shimmerEffect()
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Box(
                            modifier = Modifier
                                .width(70.dp)
                                .height(16.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .shimmerEffect()
                        )
                    }
                    // Status badge skeleton
                    Box(
                        modifier = Modifier
                            .width(90.dp)
                            .height(28.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .shimmerEffect()
                    )
                }
            }
            
            // Perforated Edge Skeleton
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .background(Gray200)
            )
            
            // Main Content Section Skeleton
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Left Side - Doctor Info Skeleton
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Box(
                        modifier = Modifier
                            .width(60.dp)
                            .height(10.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .shimmerEffect()
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .width(140.dp)
                            .height(18.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .shimmerEffect()
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Box(
                        modifier = Modifier
                            .width(100.dp)
                            .height(14.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .shimmerEffect()
                    )
                }
                
                // Right Side - Details Skeleton
                Column(
                    modifier = Modifier.weight(1f),
                    horizontalAlignment = Alignment.End
                ) {
                    Box(
                        modifier = Modifier
                            .width(90.dp)
                            .height(10.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .shimmerEffect()
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .width(80.dp)
                            .height(14.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .shimmerEffect()
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Box(
                        modifier = Modifier
                            .width(60.dp)
                            .height(18.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .shimmerEffect()
                    )
                }
            }
            
            // Ticket Stub Section Skeleton
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SkyBlue50)
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Box(
                            modifier = Modifier
                                .width(120.dp)
                                .height(9.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .shimmerEffect()
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Box(
                            modifier = Modifier
                                .width(60.dp)
                                .height(16.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .shimmerEffect()
                        )
                    }
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .shimmerEffect()
                    )
                }
            }
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
