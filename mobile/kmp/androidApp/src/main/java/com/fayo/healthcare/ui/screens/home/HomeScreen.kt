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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fayo.healthcare.data.models.CallCredentialsDto
import com.fayo.healthcare.ui.screens.home.HomeViewModel
import com.fayo.healthcare.ui.screens.home.ActiveSession as HomeActiveSession
import com.fayo.healthcare.ui.theme.*
import kotlinx.coroutines.launch
import org.koin.androidx.compose.koinViewModel
import androidx.compose.material.icons.filled.VideoCall
import androidx.compose.material.icons.filled.Close
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.draw.scale
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.layout.ContentScale
import androidx.compose.foundation.Image
import androidx.compose.ui.graphics.painter.Painter
import com.fayo.healthcare.R

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
        MenuItem("Hospitals", Icons.Default.LocalHospital) {
            scope.launch { drawerState.close() }
            onNavigateToHospitals()
        },
        MenuItem("Doctors", Icons.Default.PersonSearch) {
            scope.launch { drawerState.close() }
            onNavigateToDoctors()
        },
        MenuItem("Appointments", Icons.Default.CalendarToday) {
            scope.launch { drawerState.close() }
            onNavigateToAppointments()
        },
        MenuItem("Profile", Icons.Default.Person) { 
            scope.launch { drawerState.close() }
            onNavigateToProfile() 
        }
    )

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = Color.White,
                drawerContentColor = Gray900
            ) {
                // Redesigned Drawer Header
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                        .background(
                            brush = Brush.verticalGradient(
                                colors = listOf(SkyBlue600, SkyBlue800)
                            )
                        )
                ) {
                    Column(
                        modifier = Modifier
                            .align(Alignment.BottomStart)
                            .padding(24.dp)
                    ) {
                        Surface(
                            modifier = Modifier.size(64.dp),
                            shape = androidx.compose.foundation.shape.CircleShape,
                            color = Color.White,
                            shadowElevation = 4.dp
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.Person,
                                    contentDescription = null,
                                    tint = SkyBlue800,
                                    modifier = Modifier.size(32.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "Welcome",
                            color = Color.White.copy(alpha = 0.8f),
                            fontSize = 14.sp
                        )
                        Text(
                            text = "FAYO Healthcare",
                            color = Color.White,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                menuItems.forEach { item ->
                    NavigationDrawerItem(
                        label = { 
                            Text(
                                text = item.title,
                                fontWeight = FontWeight.Medium
                            ) 
                        },
                        selected = false,
                        onClick = item.onClick,
                        icon = { 
                            Icon(
                                item.icon, 
                                contentDescription = null,
                                tint = SkyBlue600
                            ) 
                        },
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = NavigationDrawerItemDefaults.colors(
                            unselectedContainerColor = Color.Transparent,
                            unselectedIconColor = SkyBlue600,
                            unselectedTextColor = Gray900
                        )
                    )
                }
            }
        }
    ) {
        Scaffold(
            containerColor = Gray50
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(bottom = padding.calculateBottomPadding())
            ) {
                // Blue Header Section with Curved Bottom
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp))
                        .background(
                            brush = Brush.verticalGradient(
                                colors = listOf(SkyBlue600, SkyBlue800)
                            )
                        )
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 32.dp) // Padding at bottom of header
                    ) {
                        // Custom Top Bar
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = padding.calculateTopPadding() + 16.dp, start = 16.dp, end = 16.dp, bottom = 16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            IconButton(onClick = { scope.launch { drawerState.open() } }) {
                                Icon(
                                    Icons.Default.Menu,
                                    contentDescription = "Menu",
                                    tint = Color.White
                                )
                            }
                            
                            Text(
                                text = "FAYO",
                                fontWeight = FontWeight.Bold,
                                fontSize = 24.sp,
                                color = Color.White
                            )
                            
                            Row {
                                IconButton(onClick = { /* TODO: Notifications */ }) {
                                    Icon(
                                        Icons.Default.Notifications,
                                        contentDescription = "Notifications",
                                        tint = Color.White
                                    )
                                }
                                IconButton(onClick = onNavigateToProfile) {
                                    Icon(
                                        Icons.Default.Person,
                                        contentDescription = "Profile",
                                        tint = Color.White
                                    )
                                }
                            }
                        }

                        // Special Offers Section (Inside Blue Header)
                        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                            Text(
                                text = "Special Offers",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                modifier = Modifier.padding(horizontal = 20.dp)
                            )
                            
                            androidx.compose.foundation.lazy.LazyRow(
                                horizontalArrangement = Arrangement.spacedBy(16.dp),
                                contentPadding = PaddingValues(horizontal = 20.dp)
                            ) {
                                items(3) { index ->
                                    AdBannerCard(index)
                                }
                            }
                        }
                    }
                }

                // Scrollable Content for the rest
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(24.dp),
                    contentPadding = PaddingValues(top = 24.dp, bottom = 24.dp)
                ) {
                    // Services Section
                    item {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 20.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Text(
                                text = "Services",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = Gray900
                            )

                            // Service Cards Grid
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                ServiceCard(
                                    title = "Find Hospitals",
                                    imagePainter = painterResource(id = R.drawable.hospital),
                                    onClick = onNavigateToHospitals,
                                    modifier = Modifier.weight(1f).height(160.dp)
                                )
                                ServiceCard(
                                    title = "My Appointments",
                                    imagePainter = painterResource(id = R.drawable.appointment),
                                    onClick = onNavigateToAppointments,
                                    modifier = Modifier.weight(1f).height(160.dp)
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
                                    .padding(horizontal = 20.dp),
                                verticalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Active Calls",
                                        fontSize = 20.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Gray900
                                    )
                                    Surface(
                                        shape = RoundedCornerShape(12.dp),
                                        color = ErrorRed.copy(alpha = 0.1f),
                                        modifier = Modifier.padding(start = 8.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .size(8.dp)
                                                    .clip(androidx.compose.foundation.shape.CircleShape)
                                                    .background(ErrorRed)
                                            )
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text(
                                                text = "LIVE",
                                                color = ErrorRed,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 12.sp
                                            )
                                        }
                                    }
                                }
                                
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
}

@Composable
fun AdBannerCard(index: Int) {
    val colors = listOf(
        listOf(Color(0xFF4F46E5), Color(0xFF818CF8)), // Indigo
        listOf(Color(0xFF059669), Color(0xFF34D399)), // Emerald
        listOf(Color(0xFFD97706), Color(0xFFFBBF24))  // Amber
    )
    
    val titles = listOf(
        "Comprehensive\nHealth Checkup",
        "Consult Top\nSpecialists",
        "24/7 Emergency\nSupport"
    )
    
    val subTitles = listOf(
        "Get 20% off today",
        "Book now",
        "Always here for you"
    )

    Card(
        modifier = Modifier
            .width(280.dp)
            .height(150.dp),
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = Brush.linearGradient(
                        colors = colors[index % colors.size],
                        start = Offset(0f, 0f),
                        end = Offset(500f, 500f)
                    )
                )
                .padding(20.dp)
        ) {
            Column(
                modifier = Modifier.align(Alignment.CenterStart)
            ) {
                Text(
                    text = titles[index % titles.size],
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    lineHeight = 24.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Surface(
                    color = Color.White.copy(alpha = 0.2f),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = subTitles[index % subTitles.size],
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
            
            // Decorative circle
            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .offset(x = 20.dp, y = 20.dp)
                    .size(100.dp)
                    .alpha(0.1f)
                    .background(Color.White, shape = androidx.compose.foundation.shape.CircleShape)
            )
        }
    }
}

@Composable
fun ServiceCard(
    title: String,
    imagePainter: Painter,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    var isPressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.95f else 1f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessLow
        ), label = ""
    )
    
    LaunchedEffect(isPressed) {
        if (isPressed) {
            kotlinx.coroutines.delay(150)
            isPressed = false
        }
    }
    
    Card(
        onClick = {
            isPressed = true
            onClick()
        },
        modifier = modifier
            .scale(scale),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Box(
            modifier = Modifier.fillMaxSize()
        ) {
            // Background Image
            Image(
                painter = imagePainter,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
            
            // Gradient Overlay for Text Readability
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        brush = Brush.verticalGradient(
                            colors = listOf(
                                Color.Transparent,
                                Color.Black.copy(alpha = 0.7f)
                            ),
                            startY = 0.0f,
                            endY = Float.POSITIVE_INFINITY
                        )
                    )
            )
            
            // Content
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Bottom
            ) {
                Text(
                    text = title,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    textAlign = TextAlign.Center
                )
            }
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
        shape = RoundedCornerShape(28.dp),
        containerColor = Color.White,
        title = {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                Surface(
                    modifier = Modifier.size(80.dp),
                    shape = RoundedCornerShape(20.dp),
                    color = SkyBlue100,
                    shadowElevation = 8.dp
                ) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.VideoCall,
                            contentDescription = null,
                            tint = SkyBlue600,
                            modifier = Modifier.size(40.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Incoming Video Call",
                    fontWeight = FontWeight.Bold,
                    fontSize = 22.sp,
                    color = Gray900,
                    textAlign = TextAlign.Center
                )
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "You have an incoming video call for your appointment.",
                    fontSize = 15.sp,
                    color = Gray700,
                    textAlign = TextAlign.Center,
                    lineHeight = 22.sp
                )
                if (invitation.channelName.isNotBlank()) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Gray100,
                        modifier = Modifier.padding(top = 8.dp)
                    ) {
                        Text(
                            text = "Channel: ${invitation.channelName}",
                            fontSize = 13.sp,
                            color = Gray600,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onAccept,
                colors = ButtonDefaults.buttonColors(
                    containerColor = SuccessGreen
                ),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                contentPadding = PaddingValues(0.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.VideoCall,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    "Accept Call",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDecline,
                colors = ButtonDefaults.textButtonColors(
                    contentColor = ErrorRed
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    "Decline",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        },
        modifier = Modifier.padding(24.dp)
    )
}

@Composable
fun ActiveSessionCard(
    session: HomeActiveSession,
    onRejoin: () -> Unit,
    onDismiss: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(
                elevation = 6.dp,
                shape = RoundedCornerShape(20.dp),
                spotColor = SkyBlue600.copy(alpha = 0.2f)
            ),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        border = androidx.compose.foundation.BorderStroke(
            width = 1.dp,
            color = SkyBlue200
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = Brush.horizontalGradient(
                        colors = listOf(
                            SkyBlue50,
                            Color.White
                        )
                    )
                )
                .padding(18.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    modifier = Modifier.size(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    color = SkyBlue600,
                    shadowElevation = 4.dp
                ) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.VideoCall,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                }
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = "Active Video Call",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = Gray900
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = session.channelName.take(30) + if (session.channelName.length > 30) "..." else "",
                        fontSize = 13.sp,
                        color = Gray600,
                        maxLines = 1
                    )
                }
            }
            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Button(
                    onClick = onRejoin,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = SuccessGreen
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.height(44.dp),
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.VideoCall,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                        tint = Color.White
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        "Rejoin",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(12.dp))
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Dismiss",
                        tint = Gray600,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
        }
    }
}

