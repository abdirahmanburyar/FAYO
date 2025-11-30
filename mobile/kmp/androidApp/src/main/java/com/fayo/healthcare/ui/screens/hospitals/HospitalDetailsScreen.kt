package com.fayo.healthcare.ui.screens.hospitals

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
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
    var selectedTabIndex by remember { mutableStateOf(0) }
    val scope = rememberCoroutineScope()

    // Load hospital data
    LaunchedEffect(hospitalId) {
        scope.launch {
            isLoading = true
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
    }

    // Load doctors when Doctors tab is selected
    LaunchedEffect(selectedTabIndex, hospitalId) {
        if (selectedTabIndex == 1 && doctors.isEmpty() && !isLoadingDoctors) {
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
                                // Switch to Doctors tab
                                selectedTabIndex = 1
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
                    Column(
                        modifier = Modifier.fillMaxSize()
                    ) {
                        // Header Section
                        HospitalHeaderSection(hospital = hospitalData)

                        // Tabs
                        TabRow(
                            selectedTabIndex = selectedTabIndex,
                            containerColor = Color.White,
                            contentColor = SkyBlue600
                        ) {
                            Tab(
                                selected = selectedTabIndex == 0,
                                onClick = { selectedTabIndex = 0 },
                                text = { Text("Services", fontWeight = if (selectedTabIndex == 0) FontWeight.Bold else FontWeight.Normal) }
                            )
                            Tab(
                                selected = selectedTabIndex == 1,
                                onClick = { selectedTabIndex = 1 },
                                text = { Text("Doctors", fontWeight = if (selectedTabIndex == 1) FontWeight.Bold else FontWeight.Normal) }
                            )
                        }

                        // Tab Content
                        when (selectedTabIndex) {
                            0 -> ServicesTabContent()
                            1 -> DoctorsTabContent(
                                doctors = doctors,
                                isLoading = isLoadingDoctors,
                                isBookingEnabled = hospitalData.bookingPolicy == "DIRECT_DOCTOR",
                                onDoctorClick = { doctorId ->
                                    hospital?.let { 
                                        onNavigateToDoctorBooking(doctorId, it.id)
                                    }
                                }
                            )
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
        // Hospital Icon
        Box(
            modifier = Modifier
                .size(80.dp)
                .clip(RoundedCornerShape(16.dp))
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
                        imageVector = Icons.Default.LocalHospital,
                        contentDescription = null,
                        modifier = Modifier.size(50.dp),
                        tint = Color.White
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

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

@Composable
fun ServicesTabContent() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.Construction,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = Gray400
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Coming Soon",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = Gray600
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Services will be available soon",
                fontSize = 14.sp,
                color = Gray500
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorsTabContent(
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
            // Only filter out if doctor is completely null - allow display even without user data
            if (doctor == null) {
                println("⚠️ [Screen] Filtering out hospitalDoctor ${hospitalDoctor.id} - doctor is null")
                return@filter false
            }

            // If user data is missing, still show the doctor but with limited info
            val doctorName = "${doctor.user?.firstName ?: ""} ${doctor.user?.lastName ?: ""}".trim()
            val matchesName = searchQuery.isBlank() || 
                (if (doctorName.isNotBlank()) {
                    doctorName.contains(searchQuery, ignoreCase = true)
                } else {
                    // If no name, try matching by doctor ID or specialty
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
            .fillMaxSize()
            .background(BackgroundLight)
    ) {
        // Filters Section
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White)
                .padding(16.dp)
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

            Spacer(modifier = Modifier.height(12.dp))

            // Filter by specialty
            if (specialties.isNotEmpty()) {
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

        // Doctors List
        if (isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = SkyBlue600)
            }
        } else if (filteredDoctors.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
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
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(filteredDoctors) { hospitalDoctor ->
                    DoctorCard(
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
fun DoctorCard(
    hospitalDoctor: HospitalDoctorDto,
    isClickable: Boolean = true,
    onClick: () -> Unit
) {
    val doctor = hospitalDoctor.doctor
    val user = doctor?.user

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (isClickable) Modifier.clickable { onClick() } else Modifier),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Doctor Avatar
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(SkyBlue100),
                contentAlignment = Alignment.Center
            ) {
                if (doctor?.imageUrl != null) {
                    AsyncImage(
                        model = ImageRequest.Builder(LocalContext.current)
                            .data(doctor.imageUrl)
                            .crossfade(true)
                            .build(),
                        contentDescription = "Doctor avatar",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        modifier = Modifier.size(36.dp),
                        tint = SkyBlue600
                    )
                }
            }

            Spacer(modifier = Modifier.width(16.dp))

            // Doctor Info
            Column(
                modifier = Modifier.weight(1f)
            ) {
                // Doctor name - use user data if available, otherwise use doctor ID or specialty
                val doctorName = if (user != null) {
                    "${user.firstName} ${user.lastName}".trim().takeIf { it.isNotBlank() }
                } else null
                
                Text(
                    text = doctorName ?: doctor?.specialty ?: "Doctor ${doctor?.id?.takeLast(8) ?: hospitalDoctor.doctorId.takeLast(8)}",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Gray900
                )

                Spacer(modifier = Modifier.height(4.dp))

                doctor?.specialty?.let { specialty ->
                    Text(
                        text = specialty,
                        fontSize = 14.sp,
                        color = SkyBlue600,
                        fontWeight = FontWeight.Medium
                    )
                } ?: run {
                    // Show doctor ID if specialty is missing
                    Text(
                        text = "ID: ${hospitalDoctor.doctorId.takeLast(8)}",
                        fontSize = 14.sp,
                        color = Gray500
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = hospitalDoctor.role,
                        fontSize = 12.sp,
                        color = Gray600,
                        modifier = Modifier
                            .background(Gray100, RoundedCornerShape(8.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    )

                    hospitalDoctor.consultationFee?.let { fee ->
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "$${fee / 100}",
                            fontSize = 12.sp,
                            color = SuccessGreen,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                doctor?.experience?.let { experience ->
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "$experience years experience",
                        fontSize = 12.sp,
                        color = Gray500
                    )
                }
            }
        }
    }
}
