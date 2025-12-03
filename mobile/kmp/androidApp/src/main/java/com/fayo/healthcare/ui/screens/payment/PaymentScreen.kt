package com.fayo.healthcare.ui.screens.payment

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fayo.healthcare.data.api.ApiClient
import com.fayo.healthcare.data.models.AppointmentDto
import com.fayo.healthcare.data.models.InitiatePaymentRequest
import com.fayo.healthcare.data.models.PaymentStatusResponse
import com.fayo.healthcare.ui.theme.*
import kotlinx.coroutines.launch
import org.koin.compose.koinInject
import java.text.NumberFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentScreen(
    appointment: AppointmentDto,
    onNavigateBack: () -> Unit,
    onPaymentSuccess: () -> Unit,
    onNavigateToQrScanner: () -> Unit = {},
    scannedQrCodeFromNav: String? = null, // QR code passed from navigation
    apiClient: ApiClient = koinInject()
) {
    var scannedQrCode by remember(scannedQrCodeFromNav) { mutableStateOf<String?>(scannedQrCodeFromNav) }
    var paymentStatus by remember { mutableStateOf<String?>(null) }
    var paymentId by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var isProcessing by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    // Format amount
    val amountFormatted = remember(appointment.consultationFee) {
        NumberFormat.getCurrencyInstance(Locale.US).format(appointment.consultationFee / 100.0)
    }

    // Handle QR code scan
    LaunchedEffect(scannedQrCode) {
        scannedQrCode?.let { qrCode ->
            // Validate QR code format (6 digits or phone number)
            val isValidAccount = qrCode.matches(Regex("^\\d{6}$"))
            val isValidPhone = qrCode.matches(Regex("^\\+252\\d{9}$"))
            
            if (!isValidAccount && !isValidPhone) {
                error = "Invalid QR code format. Expected 6-digit account number or phone number (+252XXXXXXXXX)"
                scannedQrCode = null
                return@LaunchedEffect
            }

            // Initiate payment
            isLoading = true
            error = null
            isProcessing = true

            scope.launch {
                val request = InitiatePaymentRequest(
                    appointmentId = appointment.id,
                    amount = appointment.consultationFee,
                    currency = "USD",
                    accountNumber = if (isValidAccount) qrCode else null,
                    phoneNumber = if (isValidPhone) qrCode else null,
                    description = "Payment for appointment ${appointment.appointmentNumber}"
                )

                apiClient.initiatePayment(request)
                    .onSuccess { response ->
                        paymentId = response.paymentId
                        paymentStatus = response.status
                        isLoading = false
                        // Payment initiated, now polling will check status
                    }
                    .onFailure { e ->
                        error = e.message ?: "Failed to initiate payment"
                        isLoading = false
                        isProcessing = false
                    }
            }
        }
    }

    // Poll payment status if payment is initiated
    LaunchedEffect(paymentId) {
        paymentId?.let { pid ->
            while (isProcessing && paymentStatus != "COMPLETED" && paymentStatus != "FAILED") {
                kotlinx.coroutines.delay(5000) // Poll every 5 seconds
                
                scope.launch {
                    apiClient.getPaymentStatus(pid)
                        .onSuccess { status ->
                            paymentStatus = status.status
                            if (status.status == "PAID" || status.status == "COMPLETED") {
                                isProcessing = false
                                onPaymentSuccess()
                            } else if (status.status == "FAILED" || status.status == "CANCELLED") {
                                isProcessing = false
                                error = status.message ?: "Payment failed"
                            }
                        }
                        .onFailure {
                            // Continue polling on error
                        }
                }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Payment") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = SkyBlue600
                )
            )
        },
        containerColor = BackgroundLight
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // Payment Summary Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        Icons.Default.MedicalServices,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = SkyBlue600
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        "Appointment Payment",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Gray900
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "Appointment #${appointment.appointmentNumber ?: "N/A"}",
                        fontSize = 14.sp,
                        color = Gray600
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    HorizontalDivider()
                    Spacer(modifier = Modifier.height(24.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Amount",
                            fontSize = 16.sp,
                            color = Gray700
                        )
                        Text(
                            amountFormatted,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = SuccessGreen
                        )
                    }
                }
            }

            // Payment Status
            when {
                isLoading -> {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(48.dp),
                            color = SkyBlue600
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            "Processing payment...",
                            fontSize = 16.sp,
                            color = Gray700
                        )
                    }
                }
                paymentStatus == "PENDING" || isProcessing -> {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(48.dp),
                            color = WarningYellow
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            "Waiting for payment confirmation...",
                            fontSize = 16.sp,
                            color = Gray700,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "Please complete the payment via USSD or mobile wallet",
                            fontSize = 14.sp,
                            color = Gray600,
                            textAlign = TextAlign.Center
                        )
                    }
                }
                paymentStatus == "PAID" || paymentStatus == "COMPLETED" -> {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.CheckCircle,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = SuccessGreen
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            "Payment Successful!",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = SuccessGreen
                        )
                    }
                }
                error != null -> {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = ErrorRed.copy(alpha = 0.1f)
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Error,
                                contentDescription = null,
                                tint = ErrorRed,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                error ?: "Payment error",
                                color = ErrorRed,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
                else -> {
                    // Show scan button
                    Button(
                        onClick = { onNavigateToQrScanner() },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = SkyBlue600
                        ),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.QrCodeScanner, contentDescription = null)
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            "Scan QR Code to Pay",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

