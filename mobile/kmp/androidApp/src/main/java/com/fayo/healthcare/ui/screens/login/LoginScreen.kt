package com.fayo.healthcare.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Phone
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

@Composable
fun LoginScreen(
    onNavigateToOtp: (String) -> Unit,
    viewModel: LoginViewModel = koinViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var phoneNumber by remember { mutableStateOf("") }
    
    LaunchedEffect(uiState.isSuccess) {
        if (uiState.isSuccess) {
            // Prepend country code if not present (assuming input is just local number)
            val formattedPhone = if (phoneNumber.startsWith("+")) phoneNumber else "+252$phoneNumber"
            onNavigateToOtp(formattedPhone)
        }
    }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
    ) {
        // White background layer to prevent flash during navigation
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.White)
        )
        // Gradient overlay
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            SkyBlue50,
                            SkyBlue100,
                            Color.White
                        )
                    )
                )
        )
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Logo and Title
            Icon(
                imageVector = Icons.Default.Phone,
                contentDescription = null,
                modifier = Modifier.size(80.dp),
                tint = SkyBlue600
            )
            Spacer(modifier = Modifier.height(32.dp))
            Text(
                text = "Welcome to FAYO",
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold,
                color = SkyBlue800
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Your trusted healthcare companion",
                fontSize = 16.sp,
                color = Gray600
            )
            Spacer(modifier = Modifier.height(48.dp))
            
            // Phone Input Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp)),
                colors = CardDefaults.cardColors(
                    containerColor = Color.White
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp)
                ) {
                    Text(
                        text = "Enter Phone Number",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Gray900
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "We'll send you a verification code",
                        fontSize = 14.sp,
                        color = Gray600
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    OutlinedTextField(
                        value = phoneNumber,
                        onValueChange = { input ->
                            // Only allow numeric input
                            if (input.all { it.isDigit() }) {
                                phoneNumber = input
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Phone Number") },
                        placeholder = { Text("90 123 4567") },
                        prefix = { Text("+252 ") },
                        leadingIcon = {
                            Icon(Icons.Default.Phone, contentDescription = null)
                        },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = SkyBlue600,
                            unfocusedBorderColor = Gray300,
                            focusedLabelColor = SkyBlue600
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    Button(
                        onClick = {
                            if (phoneNumber.isNotBlank()) {
                                // Prepend country code if not present (assuming input is just local number)
                                val formattedPhone = if (phoneNumber.startsWith("+")) phoneNumber else "+252$phoneNumber"
                                viewModel.sendOtp(formattedPhone)
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = SkyBlue600
                        ),
                        shape = RoundedCornerShape(12.dp),
                        enabled = !uiState.isLoading && phoneNumber.isNotBlank()
                    ) {
                        if (uiState.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp),
                                color = Color.White
                            )
                        } else {
                            Text(
                                text = "Send OTP",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                    
                    uiState.errorMessage?.let { error ->
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = error,
                            color = ErrorRed,
                            fontSize = 14.sp,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }
    }
}

