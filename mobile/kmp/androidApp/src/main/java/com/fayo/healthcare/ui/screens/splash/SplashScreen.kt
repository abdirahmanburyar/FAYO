package com.fayo.healthcare.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocalHospital
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fayo.healthcare.data.storage.AndroidTokenStorage
import com.fayo.healthcare.ui.theme.*
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(
    onNavigateToLogin: () -> Unit,
    onNavigateToHome: () -> Unit,
    tokenStorage: AndroidTokenStorage = org.koin.compose.koinInject()
) {
    LaunchedEffect(key1 = true) {
        delay(5000) // 5 seconds splash screen duration
        // Check if user is authenticated
        val isAuthenticated = tokenStorage.getToken() != null
        if (isAuthenticated) {
            onNavigateToHome()
        } else {
            onNavigateToLogin()
        }
    }
    
    Splash()
}

@Composable
fun Splash() {
    val context = LocalContext.current
    val splashImageResId = context.resources.getIdentifier("splash", "drawable", context.packageName)
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White),
        contentAlignment = Alignment.Center
    ) {
        // Show splash.png if available, otherwise show default design
        if (splashImageResId != 0) {
            // Use custom splash image with white background
            Image(
                painter = painterResource(id = splashImageResId),
                contentDescription = "Splash Screen",
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Fit // Changed to Fit to show white background if image doesn't fill screen
            )
        } else {
            // Default design with background blobs
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawCircle(
                color = SkyBlue50,
                radius = size.width * 0.8f,
                center = androidx.compose.ui.geometry.Offset(size.width * 0.9f, size.height * 0.1f)
            )
            drawCircle(
                color = SkyBlue100,
                radius = size.width * 0.6f,
                center = androidx.compose.ui.geometry.Offset(size.width * 0.1f, size.height * 0.9f)
            )
        }

            // Only show logo and text if using default design (not custom splash image)
            if (splashImageResId == 0) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Logo with ring
            Box(
                contentAlignment = Alignment.Center,
                        modifier = Modifier.size(160.dp)
            ) {
                // Outer ring
                CircularProgressIndicator(
                    progress = { 1f },
                    modifier = Modifier.fillMaxSize(),
                    color = SkyBlue100,
                    strokeWidth = 4.dp,
                    trackColor = Color.Transparent,
                )
                
                Icon(
                    imageVector = Icons.Default.LocalHospital,
                    contentDescription = "FAYO Logo",
                    modifier = Modifier.size(80.dp),
                    tint = SkyBlue600
                )
            }
            
            Spacer(modifier = Modifier.height(40.dp))
            
            Text(
                text = "FAYO",
                fontSize = 48.sp,
                fontWeight = FontWeight.ExtraBold,
                color = SkyBlue800,
                letterSpacing = 4.sp
            )
        }
        
        // Bottom text
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 48.dp),
            contentAlignment = Alignment.BottomCenter
        ) {
            Text(
                text = "Your Health, Our Priority",
                fontSize = 14.sp,
                        color = Gray600
            )
                }
            }
        }
    }
}

