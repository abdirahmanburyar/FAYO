package com.fayo.healthcare.ui.screens.doctors

import android.util.Log
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fayo.healthcare.data.api.ApiClient
import com.fayo.healthcare.data.models.DoctorDto
import com.fayo.healthcare.ui.theme.*
import org.koin.compose.koinInject
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorDetailScreen(
    doctorId: String,
    onNavigateBack: () -> Unit,
    onNavigateToBooking: (DoctorDto) -> Unit = {},
    apiClient: ApiClient = koinInject()
) {
    var doctor by remember { mutableStateOf<DoctorDto?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    // Load doctor data
    LaunchedEffect(doctorId) {
        scope.launch {
            isLoading = true
            apiClient.getDoctorById(doctorId)
                .onSuccess {
                    doctor = it
                    isLoading = false
                    Log.d("DoctorDetailScreen", "Loaded doctor: ${it.id}")
                }
                .onFailure {
                    error = it.message
                    isLoading = false
                    Log.e("DoctorDetailScreen", "Error loading doctor: ${it.message}", it)
                }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        "Doctor Profile",
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
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            when {
                isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center),
                        color = SkyBlue600
                    )
                }
                error != null -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.ErrorOutline,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = ErrorRed
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = error ?: "Unknown Error",
                            color = ErrorRed,
                            fontSize = 16.sp
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = {
                                isLoading = true
                                error = null
                                scope.launch {
                                    apiClient.getDoctorById(doctorId)
                                        .onSuccess {
                                            doctor = it
                                            isLoading = false
                                        }
                                        .onFailure {
                                            error = it.message
                                            isLoading = false
                                        }
                                }
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = SkyBlue600
                            )
                        ) {
                            Text("Retry")
                        }
                    }
                }
                doctor != null -> {
                    DoctorDetailContent(
                        doctor = doctor!!,
                        onNavigateToBooking = onNavigateToBooking
                    )
                }
            }
        }
    }
}

@Composable
fun DoctorDetailContent(
    doctor: DoctorDto,
    onNavigateToBooking: (DoctorDto) -> Unit = {}
) {
    val user = doctor.user
    val doctorName = if (user != null) {
        "Dr. ${user.firstName} ${user.lastName}".trim()
    } else {
        "Dr. ${doctor.id.takeLast(8)}"
    }

    // Parse education string
    val educationParts = doctor.education?.split(",")?.map { it.trim() } ?: emptyList()
    val educationDisplay = educationParts.joinToString(", ")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
    ) {
        // Professional Header Section with Gradient-like effect
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(280.dp)
                .background(SkyBlue600)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(modifier = Modifier.height(16.dp))
                
                // Doctor Image with Professional Border
                val context = LocalContext.current
                val doctorImageResId = context.resources.getIdentifier("doctor", "drawable", context.packageName)
                Box(
                    modifier = Modifier
                        .size(140.dp)
                        .clip(CircleShape)
                        .background(Color.White, CircleShape)
                        .padding(4.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(CircleShape)
                            .background(SkyBlue100),
                        contentAlignment = Alignment.Center
                    ) {
                        if (doctorImageResId != 0) {
                            Image(
                                painter = painterResource(id = doctorImageResId),
                                contentDescription = "Doctor photo",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        } else {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = null,
                                modifier = Modifier.size(70.dp),
                                tint = SkyBlue600
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(20.dp))
                
                // Doctor Name and Title
                Text(
                    text = doctorName,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "${doctor.specialty.ifBlank { "General Practice" }} Specialist",
                    fontSize = 16.sp,
                    color = Color.White.copy(alpha = 0.9f),
                    fontWeight = FontWeight.Medium
                )
                if (educationDisplay.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = educationDisplay,
                        fontSize = 14.sp,
                        color = Color.White.copy(alpha = 0.8f),
                        textAlign = TextAlign.Center
                    )
                }
            }
        }

        // Content Section
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(BackgroundLight)
                .padding(horizontal = 16.dp)
        ) {
            // Statistics Cards - Professional Grid
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 20.dp, bottom = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                ProfessionalStatCard(
                    icon = Icons.Default.People,
                    value = "5,000+",
                    label = "Patients",
                    modifier = Modifier.weight(1f)
                )
                ProfessionalStatCard(
                    icon = Icons.Default.Work,
                    value = "${doctor.experience}",
                    label = "Years Exp.",
                    modifier = Modifier.weight(1f)
                )
                ProfessionalStatCard(
                    icon = Icons.Default.Star,
                    value = "4.9",
                    label = "Rating",
                    modifier = Modifier.weight(1f)
                )
            }

            // Quick Actions
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp),
                shape = RoundedCornerShape(20.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    ProfessionalActionButton(
                        icon = Icons.Default.Phone,
                        label = "Call",
                        onClick = { /* Handle phone call */ },
                        color = SkyBlue600
                    )
                    ProfessionalActionButton(
                        icon = Icons.AutoMirrored.Filled.Chat,
                        label = "Chat",
                        onClick = { /* Handle chat */ },
                        color = SkyBlue600
                    )
                    ProfessionalActionButton(
                        icon = Icons.Default.VideoCall,
                        label = "Video",
                        onClick = { /* Handle video call */ },
                        color = SkyBlue600
                    )
                }
            }

            // Biography Section
            val bio = doctor.bio
            if (!bio.isNullOrBlank()) {
                ProfessionalSectionCard(
                    title = "About",
                    icon = Icons.Default.Info
                ) {
                    var isExpanded by remember { mutableStateOf(false) }
                    Text(
                        text = bio,
                        fontSize = 14.sp,
                        color = Gray700,
                        lineHeight = 22.sp,
                        maxLines = if (isExpanded) Int.MAX_VALUE else 4,
                        textAlign = TextAlign.Justify
                    )
                    if (bio.length > 150) {
                        TextButton(
                            onClick = { isExpanded = !isExpanded },
                            modifier = Modifier.padding(top = 8.dp)
                        ) {
                            Text(
                                text = if (isExpanded) "Read Less" else "Read More",
                                color = SkyBlue600,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }

            // Additional Information
            val certifications = doctor.certifications
            val languages = doctor.languages
            val awards = doctor.awards
            val publications = doctor.publications
            val memberships = doctor.memberships
            val researchInterests = doctor.researchInterests
            
            if (!certifications.isNullOrBlank() || !languages.isNullOrBlank() || 
                !awards.isNullOrBlank() || !publications.isNullOrBlank() ||
                !memberships.isNullOrBlank() || !researchInterests.isNullOrBlank()) {
                
                ProfessionalSectionCard(
                    title = "Professional Details",
                    icon = Icons.Default.School
                ) {
                    if (!certifications.isNullOrBlank()) {
                        ProfessionalInfoRow("Certifications", certifications)
                    }
                    if (!languages.isNullOrBlank()) {
                        ProfessionalInfoRow("Languages", languages)
                    }
                    if (!awards.isNullOrBlank()) {
                        ProfessionalInfoRow("Awards", awards)
                    }
                    if (!publications.isNullOrBlank()) {
                        ProfessionalInfoRow("Publications", publications)
                    }
                    if (!memberships.isNullOrBlank()) {
                        ProfessionalInfoRow("Memberships", memberships)
                    }
                    if (!researchInterests.isNullOrBlank()) {
                        ProfessionalInfoRow("Research Interests", researchInterests)
                    }
                }
            }

            // Consultation Fee Card
            doctor.consultationFee?.let { fee ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp),
                    shape = RoundedCornerShape(20.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    colors = CardDefaults.cardColors(containerColor = SkyBlue50)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Consultation Fee",
                                fontSize = 14.sp,
                                color = Gray600,
                                fontWeight = FontWeight.Medium
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "$${fee / 100}",
                                fontSize = 28.sp,
                                fontWeight = FontWeight.Bold,
                                color = SkyBlue600
                            )
                        }
                        Icon(
                            Icons.Default.AttachMoney,
                            contentDescription = null,
                            modifier = Modifier.size(40.dp),
                            tint = SkyBlue600.copy(alpha = 0.3f)
                        )
                    }
                }
            }

            // Book Appointment Button - Prominent
            Button(
                onClick = { onNavigateToBooking(doctor) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 16.dp)
                    .height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = SkyBlue600
                ),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 4.dp)
            ) {
                Icon(
                    Icons.Default.CalendarToday,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Book an Appointment",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
fun ProfessionalStatCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    value: String,
    label: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(28.dp),
                tint = SkyBlue600
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = value,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = Gray900
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = label,
                fontSize = 12.sp,
                color = Gray600,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
fun ProfessionalActionButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    onClick: () -> Unit,
    color: androidx.compose.ui.graphics.Color
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(8.dp)
    ) {
        IconButton(
            onClick = onClick,
            modifier = Modifier
                .size(64.dp)
                .background(
                    color = color.copy(alpha = 0.1f),
                    shape = CircleShape
                )
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(28.dp)
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            fontSize = 12.sp,
            color = Gray700,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
fun ProfessionalSectionCard(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    content: @Composable () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    modifier = Modifier.size(24.dp),
                    tint = SkyBlue600
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = title,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Gray900
                )
            }
            content()
        }
    }
}

@Composable
fun ProfessionalInfoRow(label: String, content: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
    ) {
        Text(
            text = label,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = Gray900
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = content,
            fontSize = 14.sp,
            color = Gray700,
            lineHeight = 20.sp
        )
        Spacer(modifier = Modifier.height(12.dp))
    }
}
