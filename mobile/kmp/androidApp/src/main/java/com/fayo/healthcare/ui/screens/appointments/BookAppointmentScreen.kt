package com.fayo.healthcare.ui.screens.appointments

import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fayo.healthcare.data.api.ApiClient
import com.fayo.healthcare.data.models.AppointmentDto
import com.fayo.healthcare.data.models.CreateAppointmentRequest
import com.fayo.healthcare.data.models.DoctorDto
import com.fayo.healthcare.data.models.HospitalDto
import com.fayo.healthcare.data.storage.AndroidTokenStorage
import com.fayo.healthcare.ui.theme.*
import org.koin.compose.koinInject
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BookAppointmentScreen(
    doctorId: String? = null,
    hospitalId: String? = null,
    onNavigateBack: () -> Unit,
    onBookingSuccess: () -> Unit,
    apiClient: ApiClient = koinInject(),
    tokenStorage: AndroidTokenStorage = koinInject()
) {
    var doctor by remember { mutableStateOf<DoctorDto?>(null) }
    var hospital by remember { mutableStateOf<HospitalDto?>(null) }
    var isLoadingData by remember { mutableStateOf(true) }
    var selectedDate by remember { mutableStateOf<Date?>(null) }
    var selectedTime by remember { mutableStateOf<String>("") }
    var consultationType by remember { mutableStateOf("IN_PERSON") }
    var reason by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    
    // Booked appointments
    var bookedAppointments by remember { mutableStateOf<List<AppointmentDto>>(emptyList()) }
    var isLoadingAppointments by remember { mutableStateOf(false) }
    
    val scope = rememberCoroutineScope()
    
    // Get patient ID from user ID stored in token storage
    val patientId = remember { 
        tokenStorage.getUserId() ?: ""
    }
    
    // Get phone number for createdBy field - use mutableState to allow updates
    var userPhone by remember { mutableStateOf(tokenStorage.getPhoneNumber() ?: "") }
    
    val dateFormatter = remember { SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()) }
    
    // Refresh phone number when screen loads (in case it was saved after initial load)
    LaunchedEffect(Unit) {
        val savedPhone = tokenStorage.getPhoneNumber()
        if (savedPhone != null && savedPhone.isNotBlank()) {
            userPhone = savedPhone
            println("📱 [BookAppointment] Loaded phone number from storage: $savedPhone")
        } else {
            println("⚠️ [BookAppointment] Phone number not found in storage")
        }
    }
    
    // Load doctor or hospital data
    LaunchedEffect(doctorId, hospitalId) {
        scope.launch {
            isLoadingData = true
            
            if (doctorId != null) {
                apiClient.getDoctorById(doctorId)
                    .onSuccess {
                        doctor = it
                        // If we have hospitalId but booking via doctor, we might want to fetch hospital too
                        // but usually doctor info is enough for header
                    }
                    .onFailure {
                        error = "Failed to load doctor information"
                    }
            } else if (hospitalId != null) {
                apiClient.getHospitalById(hospitalId)
                    .onSuccess {
                        hospital = it
                    }
                    .onFailure {
                        error = "Failed to load hospital information"
                    }
            }
            
            isLoadingData = false
        }
    }
    
    // Load booked appointments
    // Reload when doctorId, hospitalId or selectedDate changes
    LaunchedEffect(doctorId, hospitalId, selectedDate) {
        scope.launch {
            isLoadingAppointments = true
            // Get appointments for this doctor/hospital, and if date is selected, filter by date range
            val startDate = selectedDate?.let { dateFormatter.format(it) }
            val endDate = selectedDate?.let { dateFormatter.format(it) }
            
            apiClient.getAppointments(
                doctorId = doctorId,
                hospitalId = if (doctorId == null) hospitalId else null, // Only use hospitalId if doctor is not selected
                startDate = startDate,
                endDate = endDate
            )
                .onSuccess { appointments ->
                    // Filter only confirmed/pending appointments (exclude cancelled/completed)
                    bookedAppointments = appointments.filter { 
                        (it.status == "CONFIRMED" || it.status == "PENDING")
                    }
                    isLoadingAppointments = false
                    Log.d("BookAppointment", "Loaded ${bookedAppointments.size} booked appointments")
                }
                .onFailure {
                    Log.e("BookAppointment", "Error loading appointments: ${it.message}", it)
                    isLoadingAppointments = false
                }
        }
    }
    
    // Check if a time slot is booked
    fun isTimeSlotBooked(date: Date, time: String): Boolean {
        val dateStr = dateFormatter.format(date)
        return bookedAppointments.any { 
            it.appointmentDate == dateStr && 
            it.appointmentTime == time &&
            (it.status == "CONFIRMED" || it.status == "PENDING")
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        "Book Appointment",
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
        if (isLoadingData) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = SkyBlue600)
            }
        } else if (doctor == null && hospital == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.ErrorOutline,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = ErrorRed
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = error ?: "Information not found",
                        color = ErrorRed,
                        fontSize = 16.sp
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = onNavigateBack,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = SkyBlue600
                        )
                    ) {
                        Text("Go Back")
                    }
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
            ) {
                // Header Card
                if (doctor != null) {
                    DoctorHeaderCard(doctor = doctor!!)
                } else if (hospital != null) {
                    HospitalHeaderCard(hospital = hospital!!)
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Date Selection Section
                Text(
                    text = "Choose Your Slot",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Gray900,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Calendar-style Date Picker
                DatePickerSection(
                    selectedDate = selectedDate,
                    onDateSelected = { date ->
                        selectedDate = date
                        selectedTime = "" // Reset time when date changes
                    },
                    bookedAppointments = bookedAppointments,
                    dateFormatter = dateFormatter
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Time Slot Selection
                if (selectedDate != null) {
                    TimeSlotSection(
                        selectedTime = selectedTime,
                        onTimeSelected = { time ->
                            selectedTime = time
                        },
                        isTimeSlotBooked = { time -> isTimeSlotBooked(selectedDate!!, time) }
                    )
                } else {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Gray100)
                    ) {
                        Text(
                            text = "Please select a date first",
                            modifier = Modifier.padding(24.dp),
                            textAlign = TextAlign.Center,
                            color = Gray600,
                            fontSize = 14.sp
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Consultation Type
                Text(
                    text = "Consultation Type",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Gray900,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    ConsultationTypeChip(
                        label = "In Person",
                        selected = consultationType == "IN_PERSON",
                        onClick = { consultationType = "IN_PERSON" },
                        modifier = Modifier.weight(1f)
                    )
                    ConsultationTypeChip(
                        label = "Video",
                        selected = consultationType == "VIDEO",
                        onClick = { consultationType = "VIDEO" },
                        modifier = Modifier.weight(1f)
                    )
                    ConsultationTypeChip(
                        label = "Phone",
                        selected = consultationType == "PHONE",
                        onClick = { consultationType = "PHONE" },
                        modifier = Modifier.weight(1f)
                    )
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Reason
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    label = { Text("Reason for Visit") },
                    placeholder = { Text("e.g., General checkup, Follow-up") },
                    leadingIcon = {
                        Icon(Icons.Default.Info, contentDescription = null)
                    },
                    maxLines = 2,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = SkyBlue600,
                        unfocusedBorderColor = Gray300
                    )
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Description
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    label = { Text("Additional Notes (Optional)") },
                    placeholder = { Text("Any additional information...") },
                    leadingIcon = {
                        Icon(Icons.Default.Description, contentDescription = null)
                    },
                    maxLines = 4,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = SkyBlue600,
                        unfocusedBorderColor = Gray300
                    )
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Error Message
                error?.let {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = ErrorRed.copy(alpha = 0.1f))
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.ErrorOutline,
                                contentDescription = null,
                                tint = ErrorRed,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = it,
                                color = ErrorRed,
                                fontSize = 14.sp
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }
                
                // Book Button
                Button(
                    onClick = {
                        if (selectedDate == null || selectedTime.isBlank()) {
                            error = "Please select date and time"
                            return@Button
                        }
                        
                        // Check if the selected time slot is already booked
                        if (isTimeSlotBooked(selectedDate!!, selectedTime)) {
                            error = "This time slot is already booked. Please select another time."
                            return@Button
                        }
                        
                        if (patientId.isBlank()) {
                            error = "Please login to book an appointment"
                            return@Button
                        }
                        
                        // Refresh phone number before booking (in case it was just saved)
                        val currentPhone = tokenStorage.getPhoneNumber() ?: ""
                        if (currentPhone.isBlank()) {
                            error = "Phone number not found. Please logout and login again."
                            return@Button
                        }
                        val phoneToUse = currentPhone
                        
                        scope.launch {
                            isLoading = true
                            error = null
                            
                            val appointmentDate = dateFormatter.format(selectedDate!!)
                            val request = CreateAppointmentRequest(
                                patientId = patientId,
                                doctorId = doctorId,
                                hospitalId = hospitalId,
                                specialtyId = null,
                                appointmentDate = appointmentDate,
                                appointmentTime = selectedTime,
                                duration = 30,
                                consultationType = consultationType,
                                reason = reason.takeIf { it.isNotBlank() },
                                description = description.takeIf { it.isNotBlank() },
                                createdBy = phoneToUse  // Use user's phone number as createdBy
                            )
                            
                            apiClient.createAppointment(request)
                                .onSuccess {
                                    Log.d("BookAppointment", "Appointment created successfully: ${it.id}")
                                    isLoading = false
                                    onBookingSuccess()
                                }
                                .onFailure {
                                    Log.e("BookAppointment", "Error creating appointment: ${it.message}", it)
                                    error = it.message ?: "Failed to book appointment"
                                    isLoading = false
                                }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                        .height(56.dp),
                    enabled = !isLoading && selectedDate != null && selectedTime.isNotBlank(),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = SkyBlue600,
                        disabledContainerColor = Gray300
                    ),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 4.dp)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = Color.White,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Icon(
                            Icons.Default.CalendarToday,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Book Appointment",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

@Composable
fun DoctorHeaderCard(doctor: DoctorDto) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Doctor Icon
            Box(
                modifier = Modifier
                    .size(70.dp)
                    .background(SkyBlue100, RoundedCornerShape(16.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    modifier = Modifier.size(40.dp),
                    tint = SkyBlue600
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                val doctorName = doctor.user?.let { 
                    "Dr. ${it.firstName} ${it.lastName}".trim()
                } ?: "Dr. ${doctor.id.takeLast(8)}"
                Text(
                    text = doctorName,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Gray900
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${doctor.specialty.takeIf { it.isNotBlank() } ?: "General Practice"} Specialist",
                    fontSize = 14.sp,
                    color = SkyBlue700,
                    fontWeight = FontWeight.Medium
                )
                doctor.consultationFee?.let { fee ->
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Fee: $${fee / 100}",
                        fontSize = 13.sp,
                        color = Gray600
                    )
                }
            }
            Icon(
                Icons.Default.MedicalServices,
                contentDescription = null,
                modifier = Modifier.size(32.dp),
                tint = SkyBlue600.copy(alpha = 0.3f)
            )
        }
    }
}

@Composable
fun DatePickerSection(
    selectedDate: Date?,
    onDateSelected: (Date) -> Unit,
    bookedAppointments: List<AppointmentDto>,
    dateFormatter: SimpleDateFormat
) {
    // Generate next 7 days
    val dates = remember {
        (0..6).map { offset ->
            val cal = Calendar.getInstance()
            cal.add(Calendar.DAY_OF_MONTH, offset)
            cal.time
        }
    }
    
    val dayNames = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
    val dayFormatter = SimpleDateFormat("EEEE", Locale.getDefault())
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
    ) {
        // Days of week header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            dates.forEach { date ->
                val dayName = dayFormatter.format(date)
                val shortDay = dayNames.firstOrNull { dayName.startsWith(it, ignoreCase = true) } ?: dayName.take(3)
                Text(
                    text = shortDay,
                    fontSize = 12.sp,
                    color = Gray600,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.Center
                )
            }
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Date buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            dates.forEach { date ->
                val dateStr = dateFormatter.format(date)
                val dayOfMonth = Calendar.getInstance().apply { time = date }.get(Calendar.DAY_OF_MONTH)
                val isSelected = selectedDate?.let { dateFormatter.format(it) == dateStr } ?: false
                val hasBookings = bookedAppointments.any { it.appointmentDate == dateStr }
                
                DateButton(
                    day = dayOfMonth.toString(),
                    isSelected = isSelected,
                    hasBookings = hasBookings,
                    onClick = { onDateSelected(date) },
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
fun DateButton(
    day: String,
    isSelected: Boolean,
    hasBookings: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .padding(horizontal = 4.dp)
            .height(60.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(
                color = when {
                    isSelected -> SkyBlue600
                    hasBookings -> WarningYellow.copy(alpha = 0.15f) // Light yellow/orange for dates with bookings
                    else -> Color.White
                }
            )
            .border(
                width = if (hasBookings && !isSelected) 2.dp else if (isSelected) 0.dp else 1.dp,
                color = when {
                    isSelected -> SkyBlue600
                    hasBookings -> WarningYellow // Orange/yellow border for dates with bookings
                    else -> Gray300
                },
                shape = RoundedCornerShape(12.dp)
            )
            .clickable(enabled = !hasBookings) { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = day,
                fontSize = 16.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = when {
                    isSelected -> Color.White
                    hasBookings -> WarningYellow.copy(alpha = 0.9f)
                    else -> Gray900
                }
            )
            if (hasBookings && !isSelected) {
                Spacer(modifier = Modifier.height(2.dp))
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = "Has bookings",
                    modifier = Modifier.size(10.dp),
                    tint = WarningYellow
                )
            }
        }
    }
}

@Composable
fun TimeSlotSection(
    selectedTime: String,
    onTimeSelected: (String) -> Unit,
    isTimeSlotBooked: (String) -> Boolean
) {
    // Time slots organized by period
    val morningSlots = listOf("09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00")
    val afternoonSlots = listOf("14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00")
    val eveningSlots = listOf("18:00", "18:30", "19:00", "19:30", "20:00", "20:30")
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
    ) {
        // Morning Slots
        TimeSlotGroup(
            title = "Morning",
            slots = morningSlots,
            selectedTime = selectedTime,
            onTimeSelected = onTimeSelected,
            isTimeSlotBooked = isTimeSlotBooked
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Afternoon Slots
        TimeSlotGroup(
            title = "Afternoon",
            slots = afternoonSlots,
            selectedTime = selectedTime,
            onTimeSelected = onTimeSelected,
            isTimeSlotBooked = isTimeSlotBooked
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Evening Slots
        TimeSlotGroup(
            title = "Evening",
            slots = eveningSlots,
            selectedTime = selectedTime,
            onTimeSelected = onTimeSelected,
            isTimeSlotBooked = isTimeSlotBooked
        )
    }
}

@Composable
fun TimeSlotGroup(
    title: String,
    slots: List<String>,
    selectedTime: String,
    onTimeSelected: (String) -> Unit,
    isTimeSlotBooked: (String) -> Boolean
) {
    Column {
        Text(
            text = title,
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            color = Gray900,
            modifier = Modifier.padding(bottom = 12.dp)
        )
        // Use a simple Row with wrapping
        slots.chunked(3).forEach { rowSlots ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                rowSlots.forEach { time ->
                    val isBooked = isTimeSlotBooked(time)
                    val isSelected = selectedTime == time
                    val displayTime = formatTimeForDisplay(time)
                    
                    // Don't render booked slots - filter them out
                    if (!isBooked) {
                        TimeSlotButton(
                            time = displayTime,
                            isSelected = isSelected,
                            isBooked = false,
                            onClick = { 
                                onTimeSelected(time)
                            },
                            modifier = Modifier.weight(1f)
                        )
                    } else {
                        // Render empty space for booked slots
                        Spacer(modifier = Modifier.weight(1f))
                    }
                }
                // Fill remaining space if row has less than 3 items
                repeat(3 - rowSlots.size) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
fun TimeSlotButton(
    time: String,
    isSelected: Boolean,
    isBooked: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .width(100.dp)
            .height(48.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(
                color = when {
                    isSelected -> SkyBlue600
                    isBooked -> WarningYellow.copy(alpha = 0.15f) // Light yellow/orange background for booked
                    else -> Color.White
                }
            )
            .border(
                width = if (isBooked && !isSelected) 2.dp else 1.dp,
                color = when {
                    isSelected -> SkyBlue600
                    isBooked -> WarningYellow // Orange/yellow border for booked slots
                    else -> Gray300
                },
                shape = RoundedCornerShape(12.dp)
            )
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
            modifier = Modifier.padding(horizontal = 4.dp)
        ) {
            Text(
                text = time,
                fontSize = 14.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = when {
                    isSelected -> Color.White
                    isBooked -> WarningYellow.copy(alpha = 0.9f) // Slightly darker text for booked
                    else -> Gray900
                }
            )
            if (isBooked && !isSelected) {
                Spacer(modifier = Modifier.width(2.dp))
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = "Booked",
                    modifier = Modifier.size(12.dp),
                    tint = WarningYellow
                )
            }
        }
    }
}

fun formatTimeForDisplay(time24: String): String {
    return try {
        val parts = time24.split(":")
        val hour = parts[0].toInt()
        val minute = parts[1]
        val period = if (hour < 12) "AM" else "PM"
        val displayHour = when {
            hour == 0 -> 12
            hour > 12 -> hour - 12
            else -> hour
        }
        "$displayHour.$minute $period"
    } catch (e: Exception) {
        time24
    }
}

@Composable
fun ConsultationTypeChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label, fontSize = 13.sp) },
        modifier = modifier,
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = SkyBlue600,
            selectedLabelColor = Color.White,
            containerColor = Gray100,
            labelColor = Gray700
        )
    )
}
