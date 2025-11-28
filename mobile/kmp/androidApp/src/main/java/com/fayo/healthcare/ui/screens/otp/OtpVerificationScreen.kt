package com.fayo.healthcare.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fayo.healthcare.ui.theme.*
import org.koin.androidx.compose.koinViewModel

import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.border
import androidx.compose.foundation.Canvas
import androidx.compose.ui.text.style.TextAlign

@Composable
fun OtpVerificationScreen(
    phone: String,
    onNavigateToHome: () -> Unit,
    viewModel: OtpVerificationViewModel = koinViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var otp by remember { mutableStateOf("") }
    
    LaunchedEffect(uiState.isSuccess) {
        if (uiState.isSuccess) {
            onNavigateToHome()
        }
    }
    
    // Automatically verify when 6 digits are entered
    LaunchedEffect(otp) {
        if (otp.length == 6) {
            viewModel.verifyOtp(phone, otp)
        }
    }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
    ) {
        // Background blobs
        Canvas(modifier = Modifier.fillMaxSize()) {
             drawCircle(
                color = SkyBlue50,
                radius = size.width * 0.5f,
                center = androidx.compose.ui.geometry.Offset(size.width * 1.1f, size.height * 0.1f)
            )
        }
        
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(40.dp))
            
            // Header Icon
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(SkyBlue50),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.VerifiedUser,
                    contentDescription = null,
                    modifier = Modifier.size(40.dp),
                    tint = SkyBlue600
                )
            }
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Text(
                text = "Verification Code",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = Gray900
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Text(
                text = "We have sent the code verification to",
                fontSize = 16.sp,
                color = Gray600,
                textAlign = TextAlign.Center
            )
            
            Text(
                text = phone,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = Gray900
            )
            
            Spacer(modifier = Modifier.height(48.dp))
            
            // Segmented OTP Input
            BasicTextField(
                value = otp,
                onValueChange = { 
                    if (it.length <= 6 && it.all { char -> char.isDigit() }) {
                        otp = it
                    }
                },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                decorationBox = {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        repeat(6) { index ->
                            val char = when {
                                index >= otp.length -> ""
                                else -> otp[index].toString()
                            }
                            val isFocused = index == otp.length
                            
                            Box(
                                modifier = Modifier
                                    .width(48.dp)
                                    .height(56.dp)
                                    .border(
                                        width = if (isFocused) 2.dp else 1.dp,
                                        color = if (isFocused) SkyBlue600 else Gray300,
                                        shape = RoundedCornerShape(12.dp)
                                    )
                                    .background(
                                        color = if (isFocused) SkyBlue50.copy(alpha = 0.3f) else Color.White,
                                        shape = RoundedCornerShape(12.dp)
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = char,
                                    style = MaterialTheme.typography.headlineSmall,
                                    color = Gray900,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                }
            )
            
            Spacer(modifier = Modifier.height(40.dp))
            
            if (uiState.isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(32.dp),
                    color = SkyBlue600
                )
            }
            
            Spacer(modifier = Modifier.weight(1f))
            
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
                modifier = Modifier.padding(bottom = 32.dp)
            ) {
                Text(
                    text = "Didn't receive code? ",
                    color = Gray600
                )
                TextButton(
                    onClick = { /* Resend OTP */ },
                    contentPadding = PaddingValues(0.dp)
                ) {
                    Text(
                        text = "Resend Again",
                        color = SkyBlue600,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
            
            uiState.errorMessage?.let { error ->
                Text(
                    text = error,
                    color = ErrorRed,
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
            }
        }
    }
}

