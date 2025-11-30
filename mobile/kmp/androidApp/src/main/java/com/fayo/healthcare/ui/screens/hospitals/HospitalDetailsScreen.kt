package com.fayo.healthcare.ui.screens.hospitals

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fayo.healthcare.data.api.ApiClient
import com.fayo.healthcare.data.models.HospitalDto
import com.fayo.healthcare.data.models.HospitalDoctorDto
import com.fayo.healthcare.ui.theme.*
import kotlinx.coroutines.launch
import org.koin.compose.koinInject
import androidx.compose.ui.layout.ContentScale
import androidx.compose.foundation.Image
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.foundation.clickable
import coil.compose.AsyncImage
import coil.request.ImageRequest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HospitalDetailsScreen(
    hospitalId: String,
    onNavigateBack: () -> Unit,
    onNavigateToBooking: (HospitalDto) -> Unit,
    onNavigateToDoctorBooking: (String, String) -> Unit = { _, _ -> }, // Added callback
    apiClient: ApiClient = koinInject()
) {
    var hospital by remember { mutableStateOf<HospitalDto?>(null) }
    var doctors by remember { mutableStateOf<List<HospitalDoctorDto>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var isLoadingDoctors by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    // Load hospital data
    LaunchedEffect(hospitalId) {
        if (hospitalId.isBlank()) {
            error = "Invalid hospital ID"
            isLoading = false
            return@LaunchedEffect
        }
        
        scope.launch {
            try {
                isLoading = true
                apiClient.getHospitalById(hospitalId)
                    .onSuccess { 
                        hospital = it
                        isLoading = false
                        error = null
                    }
                    .onFailure { e ->
                        error = e.message ?: "Failed to load hospital"
                        isLoading = false
                    }
            } catch (e: Exception) {
                error = e.message ?: "Unexpected error occurred"
                isLoading = false
            }
        }
    }

    // Load doctors immediately (no tab needed)
    LaunchedEffect(hospitalId) {
        if (doctors.isEmpty() && !isLoadingDoctors) {
            scope.launch {
                println("👨‍⚕️ [Screen] Loading doctors for hospital: $hospitalId")
                isLoadingDoctors = true
                apiClient.getHospitalDoctors(hospitalId)
                    .onSuccess { doctorList ->
                        println("✅ [Screen] Loaded ${doctorList.size} doctors for hospital: $hospitalId")
                        doctorList.forEachIndexed { index, hospitalDoctor ->
                            println("  Doctor $index: id=${hospitalDoctor.doctorId}, hasDoctor=${hospitalDoctor.doctor != null}, hasUser=${hospitalDoctor.doctor?.user != null}")
                        }
                        doctors = doctorList
                        isLoadingDoctors = false
                    }
                    .onFailure { error ->
                        println("❌ [Screen] Error loading doctors: ${error.message}")
                        isLoadingDoctors = false
                    }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(hospital?.name ?: "Hospital Details") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = BackgroundLight
                )
            )
        },
        containerColor = BackgroundLight,
        floatingActionButton = {
            hospital?.let { hospitalData ->
                if (hospitalData.isActive) {
                    ExtendedFloatingActionButton(
                        onClick = {
                            if (hospitalData.bookingPolicy == "DIRECT_DOCTOR") {
                                // Scroll to doctors section (they're already visible in scrollable layout)
                                // Just navigate to booking with hospital
                                onNavigateToBooking(hospitalData)
                            } else {
                                // Navigate to booking (Hospital Assigned)
                                onNavigateToBooking(hospitalData)
                            }
                        },
                        containerColor = SkyBlue600,
                        contentColor = Color.White,
                        elevation = FloatingActionButtonDefaults.elevation(defaultElevation = 6.dp)
                    ) {
                        Icon(Icons.Default.CalendarToday, "Book Appointment")
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = if (hospitalData.bookingPolicy == "DIRECT_DOCTOR") "Select Doctor" else "Book Appointment",
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = SkyBlue600
                )
            } else if (error != null) {
                Column(
                    modifier = Modifier.align(Alignment.Center),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(text = error ?: "Unknown Error", color = ErrorRed)
                    Button(onClick = { 
                        isLoading = true
                        error = null
                        scope.launch {
                            apiClient.getHospitalById(hospitalId)
                                .onSuccess { 
                                    hospital = it
                                    isLoading = false
                                }
                                .onFailure { 
                                    error = it.message
                                    isLoading = false
                                }
                        }
                    }) {
                        Text("Retry")
                    }
                }
            } else {
                hospital?.let { hospitalData ->
                    // Load doctors immediately (no tab needed)
                    LaunchedEffect(hospitalId) {
                        if (doctors.isEmpty() && !isLoadingDoctors) {
                            scope.launch {
                                try {
                                    isLoadingDoctors = true
                                    apiClient.getHospitalDoctors(hospitalId)
                                        .onSuccess { doctorList ->
                                            doctors = doctorList
                                            isLoadingDoctors = false
                                        }
                                        .onFailure { error ->
                                            println("❌ [Screen] Error loading doctors: ${error.message}")
                                            isLoadingDoctors = false
                                        }
                                } catch (e: Exception) {
                                    println("❌ [Screen] Exception loading doctors: ${e.message}")
                                    isLoadingDoctors = false
                                }
                            }
                        }
                    }
                    
                    // Filter doctors (outside LazyColumn)
                    val filteredDoctors = remember(doctors) {
                        doctors.filter { hospitalDoctor ->
                            hospitalDoctor.doctor != null
                        }
                    }
                    
                    // Scrollable layout with header and doctors - flattened structure (no nested LazyColumn)
                    LazyColumn(
                        modifier = Modifier.fillMaxSize()
                    ) {
                        // Header Section
                        item {
                            HospitalHeaderSection(hospital = hospitalData)
                        }
                        
                        // Doctors Section Title
                        item {
                            Text(
                                text = "Our Doctors",
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = Gray900,
                                modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)
                            )
                        }
                        
                        // Loading State
                        if (isLoadingDoctors) {
                            item {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 48.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    CircularProgressIndicator(color = SkyBlue600)
                                }
                            }
                        } else if (filteredDoctors.isEmpty()) {
                            // Empty State
                            item {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 48.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.PersonOff,
                                            contentDescription = null,
                                            modifier = Modifier.size(64.dp),
                                            tint = Gray400
                                        )
                                        Spacer(modifier = Modifier.height(16.dp))
                                        Text(
                                            text = if (doctors.isEmpty()) "No doctors available" else "No doctors found",
                                            fontSize = 16.sp,
                                            color = Gray600
                                        )
                                    }
                                }
                            }
                        } else {
                            // Doctors List
                            items(filteredDoctors) { hospitalDoctor ->
                                ProfessionalDoctorCard(
                                    hospitalDoctor = hospitalDoctor,
                                    isClickable = hospitalData.bookingPolicy == "DIRECT_DOCTOR",
                                    onClick = { 
                                        try {
                                            val id = hospitalDoctor.doctor?.id ?: hospitalDoctor.doctorId
                                            onNavigateToDoctorBooking(id, hospitalData.id)
                                        } catch (e: Exception) {
                                            println("❌ [Screen] Error navigating to doctor booking: ${e.message}")
                                        }
                                    }
                                )
                            }
                        }
                    }
                } ?: run {
                    // Hospital is null but not loading - show error
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = "Hospital not found",
                            fontSize = 18.sp,
                            color = ErrorRed
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = onNavigateBack) {
                            Text("Go Back")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun HospitalHeaderSection(hospital: HospitalDto) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(SkyBlue600)
            .padding(20.dp)
    ) {
        // Hospital Logo - Larger and more prominent
        Box(
            modifier = Modifier
                .size(100.dp)
                .clip(RoundedCornerShape(20.dp))
                .background(Color.White.copy(alpha = 0.2f)),
            contentAlignment = Alignment.Center
        ) {
            if (hospital.logoUrl != null) {
                AsyncImage(
                    model = ImageRequest.Builder(LocalContext.current)
                        .data(hospital.logoUrl)
                        .crossfade(true)
                        .build(),
                    contentDescription = "Hospital logo",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Icon(
                    imageVector = Icons.Default.LocalHospital,
                    contentDescription = null,
                    modifier = Modifier.size(60.dp),
                    tint = Color.White
                )
            }
        }

        Text(
            text = hospital.name,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = hospital.type,
            fontSize = 14.sp,
            color = Color.White.copy(alpha = 0.9f),
            fontWeight = FontWeight.Medium
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Info Section
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                InfoRow(icon = Icons.Default.LocationOn, text = "${hospital.address ?: ""}, ${hospital.city ?: ""}")
                Spacer(modifier = Modifier.height(8.dp))
                hospital.phone?.let { phone ->
                    InfoRow(icon = Icons.Default.Phone, text = phone)
                    Spacer(modifier = Modifier.height(8.dp))
                }
                hospital.email?.let { email ->
                    InfoRow(icon = Icons.Default.Email, text = email)
                    Spacer(modifier = Modifier.height(8.dp))
                }
                hospital.website?.let { website ->
                    InfoRow(icon = Icons.Default.Language, text = website)
                }
            }
        }
    }
}

@Composable
fun InfoRow(icon: ImageVector, text: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(imageVector = icon, contentDescription = null, tint = Gray600, modifier = Modifier.size(20.dp))
        Spacer(modifier = Modifier.width(12.dp))
        Text(text = text, fontSize = 14.sp, color = Gray800)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorsSection(
    doctors: List<HospitalDoctorDto>,
    isLoading: Boolean,
    isBookingEnabled: Boolean = true,
    onDoctorClick: (String) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedSpecialty by remember { mutableStateOf<String?>(null) }

    // Get unique specialties from doctors
    val specialties = remember(doctors) {
        doctors.mapNotNull { it.doctor?.specialty }.distinct().sorted()
    }

    // Filter doctors
    val filteredDoctors = remember(doctors, searchQuery, selectedSpecialty) {
        doctors.filter { hospitalDoctor ->
            val doctor = hospitalDoctor.doctor
            if (doctor == null) return@filter false

            val doctorName = "${doctor.user?.firstName ?: ""} ${doctor.user?.lastName ?: ""}".trim()
            val matchesName = searchQuery.isBlank() || 
                (if (doctorName.isNotBlank()) {
                    doctorName.contains(searchQuery, ignoreCase = true)
                } else {
                    doctor.id.contains(searchQuery, ignoreCase = true) ||
                    doctor.specialty.contains(searchQuery, ignoreCase = true)
                })

            val matchesSpecialty = selectedSpecialty == null || 
                doctor.specialty.equals(selectedSpecialty, ignoreCase = true)

            matchesName && matchesSpecialty
        }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(BackgroundLight)
    ) {
        // Section Title
        Text(
            text = "Our Doctors",
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            color = Gray900,
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)
        )

        // Filters Section
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White)
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            // Search by name
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Search doctors by name...") },
                leadingIcon = {
                    Icon(Icons.Default.Search, contentDescription = null)
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
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

            if (specialties.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                
                var expanded by remember { mutableStateOf(false) }
                Box(modifier = Modifier.fillMaxWidth()) {
                    ExposedDropdownMenuBox(
                        expanded = expanded,
                        onExpandedChange = { expanded = !expanded }
                    ) {
                        OutlinedTextField(
                            value = selectedSpecialty ?: "All Specialties",
                            onValueChange = {},
                            readOnly = true,
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor(),
                            trailingIcon = {
                                ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded)
                            },
                            placeholder = { Text("Select specialty...") },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = SkyBlue600,
                                unfocusedBorderColor = Gray300,
                                focusedContainerColor = Color.White,
                                unfocusedContainerColor = Color.White
                            ),
                            shape = RoundedCornerShape(12.dp)
                        )
                        ExposedDropdownMenu(
                            expanded = expanded,
                            onDismissRequest = { expanded = false }
                        ) {
                            DropdownMenuItem(
                                text = { Text("All Specialties") },
                                onClick = {
                                    selectedSpecialty = null
                                    expanded = false
                                }
                            )
                            specialties.forEach { specialty ->
                                DropdownMenuItem(
                                    text = { Text(specialty) },
                                    onClick = {
                                        selectedSpecialty = specialty
                                        expanded = false
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Doctors List
        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 48.dp),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = SkyBlue600)
            }
        } else if (filteredDoctors.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 48.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.PersonOff,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = Gray400
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = if (doctors.isEmpty()) "No doctors available" else "No doctors found",
                        fontSize = 16.sp,
                        color = Gray600
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxWidth(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(filteredDoctors) { hospitalDoctor ->
                    ProfessionalDoctorCard(
                        hospitalDoctor = hospitalDoctor,
                        isClickable = isBookingEnabled,
                        onClick = { 
                            val id = hospitalDoctor.doctor?.id ?: hospitalDoctor.doctorId
                            onDoctorClick(id) 
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun ProfessionalDoctorCard(
    hospitalDoctor: HospitalDoctorDto,
    isClickable: Boolean = true,
    onClick: () -> Unit
) {
    val doctor = hospitalDoctor.doctor
    val user = doctor?.user
    val firstName = user?.firstName ?: ""
    val lastName = user?.lastName ?: ""
    val doctorName = "$firstName $lastName".trim().takeIf { it.isNotBlank() } ?: "Dr. ${doctor?.id?.takeLast(8) ?: hospitalDoctor.doctorId.takeLast(8)}"

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (isClickable) Modifier.clickable { onClick() } else Modifier),
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Professional Doctor Portrait - Larger
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(
                        brush = Brush.linearGradient(
                            colors = listOf(SkyBlue100, SkyBlue200)
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (doctor?.imageUrl != null) {
                    AsyncImage(
                        model = ImageRequest.Builder(LocalContext.current)
                            .data(doctor.imageUrl)
                            .crossfade(true)
                            .build(),
                        contentDescription = "Doctor portrait",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    // Fallback with initials
                    Text(
                        text = "${firstName.firstOrNull() ?: 'D'}${lastName.firstOrNull() ?: 'R'}",
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold,
                        color = SkyBlue600
                    )
                }
                
                // Availability Badge
                doctor?.isAvailable?.let { isAvailable ->
                    Box(
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .size(16.dp)
                            .clip(CircleShape)
                            .background(if (isAvailable) SuccessGreen else Gray400)
                            .border(3.dp, Color.White, CircleShape)
                    )
                }
            }

            Spacer(modifier = Modifier.width(16.dp))

            // Doctor Info
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = "Dr. $doctorName",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Gray900
                )

                Spacer(modifier = Modifier.height(4.dp))

                doctor?.specialty?.let { specialty ->
                    Text(
                        text = specialty,
                        fontSize = 15.sp,
                        color = SkyBlue600,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Role Badge
                    Text(
                        text = hospitalDoctor.role,
                        fontSize = 12.sp,
                        color = Gray700,
                        modifier = Modifier
                            .background(Gray100, RoundedCornerShape(8.dp))
                            .padding(horizontal = 10.dp, vertical = 4.dp),
                        fontWeight = FontWeight.Medium
                    )

                    // Consultation Fee
                    hospitalDoctor.consultationFee?.let { fee ->
                        Text(
                            text = "$${fee / 100}",
                            fontSize = 13.sp,
                            color = SuccessGreen,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                doctor?.experience?.let { experience ->
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Work,
                            contentDescription = null,
                            modifier = Modifier.size(14.dp),
                            tint = Gray500
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "$experience years experience",
                            fontSize = 12.sp,
                            color = Gray600
                        )
                    }
                }
            }
            
            // Arrow Icon if clickable
            if (isClickable) {
                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = "View doctor",
                    tint = Gray400,
                    modifier = Modifier.size(24.dp)
                )
            }
        }
    }
}

