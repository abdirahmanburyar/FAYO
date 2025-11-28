package com.fayo.healthcare.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
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
import androidx.compose.ui.window.Dialog
import com.fayo.healthcare.data.models.CallCredentialsDto
import com.fayo.healthcare.ui.screens.home.HomeViewModel
import com.fayo.healthcare.ui.screens.home.ActiveSession as HomeActiveSession
import com.fayo.healthcare.ui.theme.*
import kotlinx.coroutines.launch
import org.koin.androidx.compose.koinViewModel
import androidx.compose.material.icons.filled.VideoCall
import androidx.compose.material.icons.filled.Close

data class MenuItem(
    val title: String,
    val icon: ImageVector,
    val onClick: () -> Unit
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onNavigateToHospitals: () -> Unit,
    onNavigateToDoctors: () -> Unit,
    onNavigateToAppointments: () -> Unit,
    onNavigateToProfile: () -> Unit,
    onNavigateToCall: (CallCredentialsDto) -> Unit,
    viewModel: HomeViewModel = koinViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val callInvitation = uiState.callInvitation
    val activeSessions = uiState.activeSessions
    
    // Show call invitation dialog when invitation is received
    callInvitation?.let { invitation ->
        if (invitation.invitation.credentials != null) {
            CallInvitationDialog(
                invitation = invitation.invitation,
                onAccept = {
                    // Emit call.accepted event
                    viewModel.acceptCall(invitation.invitation)
                    viewModel.clearCallInvitation()
                    onNavigateToCall(invitation.invitation.credentials!!)
                },
                onDecline = {
                    viewModel.clearCallInvitation()
                }
            )
        }
    }
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    
    val menuItems = listOf(
        MenuItem("Home", Icons.Default.Home) { scope.launch { drawerState.close() } },
        MenuItem("Profile", Icons.Default.Person) { 
            scope.launch { drawerState.close() }
            onNavigateToProfile() 
        },
        MenuItem("Hospitals", Icons.Default.LocalHospital) {
            scope.launch { drawerState.close() }
            onNavigateToHospitals()
        },
        MenuItem("Doctors", Icons.Default.Person) {
            scope.launch { drawerState.close() }
            onNavigateToDoctors()
        },
        MenuItem("Appointments", Icons.Default.CalendarToday) {
            scope.launch { drawerState.close() }
            onNavigateToAppointments()
        }
    )

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                Spacer(modifier = Modifier.height(16.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    contentAlignment = Alignment.CenterStart
                ) {
                    Text(
                        text = "FAYO",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = SkyBlue800
                    )
                }
                HorizontalDivider()
                Spacer(modifier = Modifier.height(16.dp))
                
                menuItems.forEach { item ->
                    NavigationDrawerItem(
                        label = { Text(item.title) },
                        selected = false,
                        onClick = item.onClick,
                        icon = { Icon(item.icon, contentDescription = null) },
                        modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
                    )
                }
            }
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("FAYO") },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(Icons.Default.Menu, contentDescription = "Menu")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color.White,
                        titleContentColor = SkyBlue800
                    )
                )
            },
            containerColor = Color.White
        ) { padding ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                verticalArrangement = Arrangement.spacedBy(0.dp)
            ) {
                // Hero Section / Welcome Banner
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp),
                        shape = RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp),
                        colors = CardDefaults.cardColors(containerColor = SkyBlue600),
                        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(24.dp)
                        ) {
                            Column(
                                modifier = Modifier.align(Alignment.CenterStart)
                            ) {
                                Text(
                                    text = "Welcome to FAYO",
                                    color = Color.White,
                                    fontSize = 28.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Your trusted healthcare companion",
                                    color = Color.White.copy(alpha = 0.9f),
                                    fontSize = 15.sp
                                )
                            }
                        }
                    }
                }

                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                    Text(
                            text = "Quick Access",
                            fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                            color = Gray900
                    )

                        // Service Cards Grid
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        ServiceCard(
                            title = "Hospitals",
                            icon = Icons.Default.LocalHospital,
                            color = SkyBlue100,
                            iconColor = SkyBlue600,
                            onClick = onNavigateToHospitals,
                            modifier = Modifier.weight(1f)
                        )
                            ServiceCard(
                                title = "Doctors",
                                icon = Icons.Default.MedicalServices,
                                color = SuccessGreen.copy(alpha = 0.15f),
                                iconColor = SuccessGreen,
                                onClick = onNavigateToDoctors,
                                modifier = Modifier.weight(1f)
                            )
                        }
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            ServiceCard(
                                title = "Appointments",
                                icon = Icons.Default.CalendarToday,
                                color = WarningYellow.copy(alpha = 0.15f),
                                iconColor = WarningYellow,
                                onClick = onNavigateToAppointments,
                                modifier = Modifier.weight(1f)
                            )
                        ServiceCard(
                            title = "Profile",
                            icon = Icons.Default.Person,
                                color = Gray200,
                                iconColor = Gray700,
                            onClick = onNavigateToProfile,
                            modifier = Modifier.weight(1f)
                        )
                        }
                    }
                }
                
                // Active Sessions Section
                if (activeSessions.isNotEmpty()) {
                    item {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(20.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text(
                                text = "Active Video Calls",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = Gray900
                            )
                            
                            activeSessions.forEach { session ->
                                ActiveSessionCard(
                                    session = session,
                                    onRejoin = {
                                        scope.launch {
                                            try {
                                                val userId = viewModel.getUserId()
                                                if (userId != null) {
                                                    val result = viewModel.getParticipantCredentials(
                                                        session.appointmentId,
                                                        userId
                                                    )
                                                    result.onSuccess { credentials ->
                                                        viewModel.removeActiveSession(session.appointmentId)
                                                        onNavigateToCall(credentials)
                                                    }.onFailure { error ->
                                                        println("❌ [HomeScreen] Failed to get credentials: ${error.message}")
                                                    }
                                                }
                                            } catch (e: Exception) {
                                                println("❌ [HomeScreen] Error rejoining call: ${e.message}")
                                            }
                                        }
                                    },
                                    onDismiss = {
                                        viewModel.removeActiveSession(session.appointmentId)
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ServiceCard(
    title: String,
    icon: ImageVector,
    color: Color,
    iconColor: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier.height(140.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(color),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = iconColor,
                    modifier = Modifier.size(28.dp)
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = title,
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = Gray900
            )
        }
    }
}

@Composable
fun CallInvitationDialog(
    invitation: com.fayo.healthcare.data.models.CallInvitationDto,
    onAccept: () -> Unit,
    onDecline: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDecline,
        title = {
            Text(
                text = "Incoming Video Call",
                fontWeight = FontWeight.Bold,
                fontSize = 20.sp
            )
        },
        text = {
            Column(
                modifier = Modifier.padding(vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("You have an incoming video call for your appointment.")
                if (invitation.channelName.isNotBlank()) {
                    Text(
                        text = "Channel: ${invitation.channelName}",
                        fontSize = 14.sp,
                        color = Color.Gray
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onAccept,
                colors = ButtonDefaults.buttonColors(
                    containerColor = SuccessGreen
                )
            ) {
                Text("Accept")
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDecline,
                colors = ButtonDefaults.textButtonColors(
                    contentColor = Color.Red
                )
            ) {
                Text("Decline")
            }
        }
    )
}

@Composable
fun ActiveSessionCard(
    session: HomeActiveSession,
    onRejoin: () -> Unit,
    onDismiss: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = SkyBlue50),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(SkyBlue600),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.VideoCall,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                }
                Column {
                    Text(
                        text = "Active Video Call",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Gray900
                    )
                    Text(
                        text = "Channel: ${session.channelName.take(20)}...",
                        fontSize = 12.sp,
                        color = Gray600
                    )
                }
            }
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = onRejoin,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = SuccessGreen
                    ),
                    modifier = Modifier.height(40.dp)
                ) {
                    Text("Rejoin", fontSize = 14.sp)
                }
                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier.size(40.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Dismiss",
                        tint = Gray600,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}

