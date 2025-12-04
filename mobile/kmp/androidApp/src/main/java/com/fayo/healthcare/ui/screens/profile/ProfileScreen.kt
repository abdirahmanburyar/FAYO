package com.fayo.healthcare.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.automirrored.filled.Help
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import com.fayo.healthcare.ui.theme.*
import org.koin.androidx.compose.koinViewModel
import java.text.SimpleDateFormat
import java.util.*
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.DatePickerDefaults

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onNavigateBack: () -> Unit,
    onLogout: () -> Unit,
    viewModel: ProfileViewModel = koinViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var isEditing by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        if (uiState.profile == null && !uiState.isLoading) {
            viewModel.loadProfile()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        "My Profile",
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
                actions = {
                    if (uiState.profile != null && !isEditing) {
                        IconButton(onClick = { isEditing = true }) {
                            Icon(
                                Icons.Default.Edit,
                                contentDescription = "Edit Profile",
                                tint = Color.White
                            )
                        }
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
                ProfileSkeleton()
            }
            uiState.error != null -> {
                ErrorState(
                    error = uiState.error ?: "Failed to load profile",
                    onRetry = { viewModel.loadProfile() },
                    onDismiss = { viewModel.clearError() }
                )
            }
            uiState.profile != null -> {
                ProfileContent(
                    profile = uiState.profile!!,
                    modifier = Modifier.padding(padding),
                    isEditing = isEditing,
                    isUpdating = uiState.isUpdating,
                    onEditClick = { isEditing = true },
                    onCancelEdit = { isEditing = false },
                    onSave = { firstName, lastName, phone, email, address, dateOfBirth, gender ->
                        viewModel.updateProfile(
                            firstName = firstName,
                            lastName = lastName,
                            phone = phone,
                            email = email,
                            address = address,
                            dateOfBirth = dateOfBirth,
                            gender = gender
                        )
                        isEditing = false
                    },
                    onLogout = {
                        viewModel.logout()
                        onLogout()
                    },
                    onNavigateBack = onNavigateBack
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileContent(
    profile: com.fayo.healthcare.data.models.UserProfileDto,
    modifier: Modifier = Modifier,
    isEditing: Boolean,
    isUpdating: Boolean,
    onEditClick: () -> Unit,
    onCancelEdit: () -> Unit,
    onSave: (String?, String?, String?, String?, String?, String?, String?) -> Unit,
    onLogout: () -> Unit,
    onNavigateBack: () -> Unit
) {
    var firstName by remember { mutableStateOf(profile.firstName ?: "") }
    var lastName by remember { mutableStateOf(profile.lastName ?: "") }
    var phone by remember { mutableStateOf(profile.phone) }
    var email by remember { mutableStateOf(profile.email ?: "") }
    var address by remember { mutableStateOf(profile.address ?: "") }
    var dateOfBirth by remember { mutableStateOf(profile.dateOfBirth ?: "") }
    var gender by remember { mutableStateOf(profile.gender ?: "") }
    var genderExpanded by remember { mutableStateOf(false) }
    var showDatePicker by remember { mutableStateOf(false) }
    
    // Date picker state
    val datePickerState = rememberDatePickerState(
        initialSelectedDateMillis = dateOfBirth.takeIf { it.isNotBlank() }?.let { dateStr ->
            try {
                val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                dateFormat.parse(dateStr)?.time
            } catch (e: Exception) {
                null
            }
        }
    )

    // Reset values when editing mode changes
    LaunchedEffect(isEditing) {
        if (!isEditing) {
            firstName = profile.firstName ?: ""
            lastName = profile.lastName ?: ""
            phone = profile.phone
            email = profile.email ?: ""
            address = profile.address ?: ""
            dateOfBirth = profile.dateOfBirth ?: ""
            gender = profile.gender ?: ""
        }
    }

    // Update values when profile changes
    LaunchedEffect(profile) {
        if (!isEditing) {
            firstName = profile.firstName ?: ""
            lastName = profile.lastName ?: ""
            phone = profile.phone
            email = profile.email ?: ""
            address = profile.address ?: ""
            dateOfBirth = profile.dateOfBirth ?: ""
            gender = profile.gender ?: ""
        }
    }
    
    // Handle date picker selection
    LaunchedEffect(datePickerState.selectedDateMillis) {
        datePickerState.selectedDateMillis?.let { millis ->
            val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            dateOfBirth = dateFormat.format(Date(millis))
        }
    }

        Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
    ) {
        // Content Section
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 16.dp)
        ) {
                    // Profile Details Card
                    Card(
                        modifier = Modifier
                            .fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = Color.White
                        ),
                        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            verticalArrangement = Arrangement.spacedBy(20.dp)
                        ) {
                            // Section Header
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
            Text(
                                    text = "Personal Information",
                                    fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Gray900
            )
                            }
                    
                            HorizontalDivider(color = Gray200)
                            
                            // First Name
                            if (isEditing) {
                                OutlinedTextField(
                            value = firstName,
                            onValueChange = { firstName = it },
                            label = { Text("First Name") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            leadingIcon = {
                                Icon(Icons.Default.Person, contentDescription = null, tint = SkyBlue600)
                            },
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = SkyBlue600,
                                unfocusedBorderColor = Gray300
                            )
                        )
                    } else {
                        ProfileInfoRow(
                            icon = Icons.Default.Person,
                            label = "First Name",
                            value = profile.firstName ?: "Not set",
                            iconTint = SkyBlue600
                        )
                    }
                    
                            HorizontalDivider(color = Gray200)
                            
                            // Last Name
                            if (isEditing) {
                                OutlinedTextField(
                            value = lastName,
                            onValueChange = { lastName = it },
                            label = { Text("Last Name") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            leadingIcon = {
                                Icon(Icons.Default.Person, contentDescription = null, tint = SkyBlue600)
                            },
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = SkyBlue600,
                                unfocusedBorderColor = Gray300
                            )
                        )
                    } else {
                        ProfileInfoRow(
                            icon = Icons.Default.Person,
                            label = "Last Name",
                            value = profile.lastName ?: "Not set",
                            iconTint = SkyBlue600
                        )
                    }
                    
                            HorizontalDivider(color = Gray200)
                            
                            // Phone
                            if (isEditing) {
                                OutlinedTextField(
                            value = phone,
                            onValueChange = {},
                            readOnly = true,
                            enabled = false,
                            label = { Text("Phone") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                            leadingIcon = {
                                Icon(Icons.Default.Phone, contentDescription = null, tint = Gray400)
                            },
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Gray300,
                                unfocusedBorderColor = Gray300,
                                disabledBorderColor = Gray300,
                                disabledTextColor = Gray600,
                                disabledLabelColor = Gray500,
                                disabledContainerColor = Gray50
                            )
                        )
                    } else {
                        ProfileInfoRow(
                            icon = Icons.Default.Phone,
                            label = "Phone",
                            value = profile.phone,
                            iconTint = SkyBlue600
                        )
                    }
                    
                            HorizontalDivider(color = Gray200)
                            
                            // Email
                            if (isEditing) {
                                OutlinedTextField(
                                    value = email,
                                    onValueChange = { email = it },
                                    label = { Text("Email") },
                                    modifier = Modifier.fillMaxWidth(),
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                                    leadingIcon = {
                                        Icon(Icons.Default.Email, contentDescription = null, tint = SkyBlue600)
                                    },
                                    shape = RoundedCornerShape(12.dp),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = SkyBlue600,
                                        unfocusedBorderColor = Gray300
                                    )
                                )
                    } else {
                        ProfileInfoRow(
                            icon = Icons.Default.Email,
                            label = "Email",
                            value = profile.email ?: "Not set",
                            iconTint = SkyBlue600
                        )
                    }
                    
                            HorizontalDivider(color = Gray200)
                            
                            // Gender
                            if (isEditing) {
                                Box(modifier = Modifier.fillMaxWidth()) {
                            ExposedDropdownMenuBox(
                                expanded = genderExpanded,
                                onExpandedChange = { genderExpanded = !genderExpanded }
                            ) {
                                OutlinedTextField(
                                    value = gender.ifEmpty { "Select Gender" },
                                    onValueChange = {},
                                    readOnly = true,
                                    label = { Text("Gender") },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .menuAnchor(),
                                    leadingIcon = {
                                        Icon(Icons.Default.PersonOutline, contentDescription = null, tint = SkyBlue600)
                                    },
                                    trailingIcon = {
                                        ExposedDropdownMenuDefaults.TrailingIcon(expanded = genderExpanded)
                                    },
                                    shape = RoundedCornerShape(12.dp),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = SkyBlue600,
                                        unfocusedBorderColor = Gray300
                                    )
                                )
                                ExposedDropdownMenu(
                                    expanded = genderExpanded,
                                    onDismissRequest = { genderExpanded = false }
                                ) {
                                    listOf("MALE", "FEMALE").forEach { option ->
                                        DropdownMenuItem(
                                            text = { Text(option) },
                                            onClick = {
                                                gender = option
                                                genderExpanded = false
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    } else {
                        ProfileInfoRow(
                            icon = Icons.Default.PersonOutline,
                            label = "Gender",
                            value = profile.gender ?: "Not set",
                            iconTint = SkyBlue600
                        )
                    }
                    
                            HorizontalDivider(color = Gray200)
                            
                            // Date of Birth
                            if (isEditing) {
                                Box(modifier = Modifier.fillMaxWidth()) {
                                    OutlinedTextField(
                                        value = dateOfBirth.ifEmpty { "Select Date" },
                                        onValueChange = {},
                                        readOnly = true,
                                        enabled = false,
                                        label = { Text("Date of Birth") },
                                        modifier = Modifier.fillMaxWidth(),
                                        leadingIcon = {
                                            Icon(Icons.Default.CalendarToday, contentDescription = null, tint = SkyBlue600)
                                        },
                                        trailingIcon = {
                                            Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = SkyBlue600)
                                        },
                                        shape = RoundedCornerShape(12.dp),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = SkyBlue600,
                                            unfocusedBorderColor = Gray300,
                                            disabledBorderColor = Gray300,
                                            disabledTextColor = Gray900,
                                            disabledLabelColor = Gray700,
                                            disabledContainerColor = Color.White
                                        )
                                    )
                                    Box(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .clickable { showDatePicker = true }
                                    )
                                }
                                
                                // Date Picker Dialog
                                if (showDatePicker) {
                                    DatePickerDialog(
                                        onDismissRequest = { showDatePicker = false },
                                        confirmButton = {
                                            TextButton(
                                                onClick = {
                                                    datePickerState.selectedDateMillis?.let { millis ->
                                                        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                                                        dateOfBirth = dateFormat.format(Date(millis))
                                                    }
                                                    showDatePicker = false
                                                }
                                            ) {
                                                Text("OK")
                                            }
                                        },
                                        dismissButton = {
                                            TextButton(onClick = { showDatePicker = false }) {
                                                Text("Cancel")
                                            }
                                        }
                                    ) {
                                        DatePicker(
                                            state = datePickerState,
                                            colors = DatePickerDefaults.colors(
                                                selectedDayContainerColor = SkyBlue600,
                                                todayDateBorderColor = SkyBlue600
                                            )
                                        )
                                    }
                                }
                    } else {
                        ProfileInfoRow(
                            icon = Icons.Default.CalendarToday,
                            label = "Date of Birth",
                            value = profile.dateOfBirth?.let { formatDate(it) } ?: "Not set",
                            iconTint = SkyBlue600
                        )
                    }
                    
                            HorizontalDivider(color = Gray200)
                            
                            // Address
                            if (isEditing) {
                                OutlinedTextField(
                                    value = address,
                                    onValueChange = { address = it },
                                    label = { Text("Address") },
                                    modifier = Modifier.fillMaxWidth(),
                                    singleLine = true,
                                    leadingIcon = {
                                        Icon(Icons.Default.LocationOn, contentDescription = null, tint = SkyBlue600)
                                    },
                                    shape = RoundedCornerShape(12.dp),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = SkyBlue600,
                                        unfocusedBorderColor = Gray300
                                    )
                                )
                    } else {
                        ProfileInfoRow(
                            icon = Icons.Default.LocationOn,
                            label = "Address",
                            value = profile.address ?: "Not set",
                            iconTint = SkyBlue600
                        )
                    }
                    
                            // Save/Cancel Buttons when editing
                            if (isEditing) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                            OutlinedButton(
                                onClick = onCancelEdit,
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Cancel")
                            }
                            Button(
                                onClick = {
                                    onSave(
                                        firstName.takeIf { it.isNotBlank() },
                                        lastName.takeIf { it.isNotBlank() },
                                        phone.takeIf { it.isNotBlank() },
                                        email.takeIf { it.isNotBlank() },
                                        address.takeIf { it.isNotBlank() },
                                        dateOfBirth.takeIf { it.isNotBlank() },
                                        gender.takeIf { it.isNotBlank() && gender != "Select Gender" }
                                    )
                                },
                                modifier = Modifier.weight(1f),
                                enabled = !isUpdating,
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = SkyBlue600
                                )
                            ) {
                                if (isUpdating) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(16.dp),
                                        color = Color.White,
                                        strokeWidth = 2.dp
                                    )
                                } else {
                                    Text("Save Changes")
                                }
                            }
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Quick Actions Card (only show when not editing)
            if (!isEditing) {
                Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = Color.White
                            ),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Text(
                                    text = "Quick Actions",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Gray900
                                )
                                
                                ProfileActionItem(
                                    icon = Icons.Default.Settings,
                                    title = "Settings",
                                    subtitle = "App preferences and notifications",
                                    onClick = { /* Settings */ },
                                    iconTint = Gray600
                                )
                                
                                ProfileActionItem(
                                    icon = Icons.AutoMirrored.Filled.Help,
                                    title = "Help & Support",
                                    subtitle = "Get help and contact support",
                                    onClick = { /* Help */ },
                                    iconTint = Gray600
                                )
                                
                                ProfileActionItem(
                                    icon = Icons.Default.Info,
                                    title = "About",
                                    subtitle = "App version and information",
                                    onClick = { /* About */ },
                                    iconTint = Gray600
                                )
                            }
                        }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Logout Button
                Button(
                    onClick = onLogout,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = ErrorRed
                    ),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = "Logout",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
}

@Composable
fun ProfileInfoRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String,
    iconTint: Color
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(24.dp),
            tint = iconTint
        )
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                fontSize = 12.sp,
                color = Gray600,
                fontWeight = FontWeight.Medium
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                fontSize = 16.sp,
                color = Gray900,
                fontWeight = FontWeight.Normal
            )
        }
    }
}

@Composable
fun ProfileActionItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
    iconTint: Color
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = Gray50
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(iconTint.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(24.dp),
                    tint = iconTint
            )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Gray900
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = subtitle,
                    fontSize = 12.sp,
                    color = Gray600
                )
            }
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                modifier = Modifier.size(20.dp),
                tint = Gray400
            )
        }
    }
}

@Composable
fun ProfileSkeleton() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Header Skeleton
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .clip(RoundedCornerShape(bottomStart = 20.dp, bottomEnd = 20.dp))
                .shimmerEffect()
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Avatar Skeleton
        Box(
            modifier = Modifier
                .size(120.dp)
                .offset(y = (-160).dp)
                .clip(CircleShape)
                .shimmerEffect()
        )
        
        // Card Skeleton
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .offset(y = (-40).dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(
                containerColor = Color.White
            )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                repeat(6) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(24.dp)
                                .clip(CircleShape)
                                .shimmerEffect()
                        )
                        Spacer(modifier = Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
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
                                    .width(150.dp)
                                    .height(16.dp)
                                    .clip(RoundedCornerShape(4.dp))
                                    .shimmerEffect()
                            )
                        }
                    }
                    if (it < 5) {
                        HorizontalDivider(color = Gray200)
                    }
                }
            }
        }
    }
}

@Composable
fun ErrorState(
    error: String,
    onRetry: () -> Unit,
    onDismiss: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.Error,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = ErrorRed
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = error,
            fontSize = 16.sp,
            color = ErrorRed,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onRetry) {
            Text("Retry")
        }
        Spacer(modifier = Modifier.height(8.dp))
        TextButton(onClick = onDismiss) {
            Text("Dismiss")
        }
    }
}

fun formatDate(dateString: String): String {
    return try {
        val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        val outputFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
        val date = inputFormat.parse(dateString) ?: SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(dateString)
        date?.let { outputFormat.format(it) } ?: dateString
    } catch (e: Exception) {
        try {
            val simpleFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val date = simpleFormat.parse(dateString)
            val outputFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
            date?.let { outputFormat.format(it) } ?: dateString
        } catch (e2: Exception) {
            dateString
        }
    }
}
