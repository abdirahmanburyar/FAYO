package com.fayo.healthcare.ui.screens.payment

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import com.fayo.healthcare.data.models.PaymentMethodType
import com.fayo.healthcare.data.models.UssdInfoResponse
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
    apiClient: ApiClient = koinInject()
) {
    var selectedPaymentMethod by remember { mutableStateOf<PaymentMethodType?>(null) }
    var paymentStatus by remember { mutableStateOf<String?>(null) }
    var paymentId by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var isProcessing by remember { mutableStateOf(false) }
    var ussdInfo by remember { mutableStateOf<UssdInfoResponse?>(null) }
    var showUssdInfo by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    // Format amount
    val amountFormatted = remember(appointment.consultationFee) {
        NumberFormat.getCurrencyInstance(Locale.US).format(appointment.consultationFee / 100.0)
    }

    // Load USSD info when Waafipay is selected
    LaunchedEffect(selectedPaymentMethod) {
        if (selectedPaymentMethod == PaymentMethodType.WAAFIPAY && ussdInfo == null) {
            scope.launch {
                apiClient.getUssdInfo()
                    .onSuccess { info ->
                        ussdInfo = info
                        showUssdInfo = true
                    }
                    .onFailure { e ->
                        error = "Failed to load payment information: ${e.message}"
                    }
            }
        }
    }

    // Initiate payment when user confirms
    fun initiatePayment() {
        if (selectedPaymentMethod == null) {
            error = "Please select a payment method"
            return
        }

        isLoading = true
        error = null
        isProcessing = true

        scope.launch {
            // For now, only Waafipay is implemented
            // Account 529988 will be used by default (no need to send it)
            val request = InitiatePaymentRequest(
                appointmentId = appointment.id,
                amount = appointment.consultationFee,
                currency = "USD",
                accountNumber = null, // Backend will use default 529988
                phoneNumber = null,
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
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.fillMaxWidth()
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
                        // Show USSD info if available
                        ussdInfo?.let { info ->
                            Spacer(modifier = Modifier.height(16.dp))
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(
                                    containerColor = InfoBlue.copy(alpha = 0.1f)
                                )
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(
                                        "USSD Code: ${info.ussdCode}",
                                        fontSize = 20.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = InfoBlue
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        "Account: ${info.accountNumber}",
                                        fontSize = 16.sp,
                                        color = Gray700
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        info.instructions,
                                        fontSize = 14.sp,
                                        color = Gray600,
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }
                        }
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
                showUssdInfo && selectedPaymentMethod == PaymentMethodType.WAAFIPAY -> {
                    // Show USSD info and payment button
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        ussdInfo?.let { info ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(
                                    containerColor = InfoBlue.copy(alpha = 0.1f)
                                )
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(24.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(
                                        Icons.Default.Phone,
                                        contentDescription = null,
                                        modifier = Modifier.size(48.dp),
                                        tint = InfoBlue
                                    )
                                    Spacer(modifier = Modifier.height(16.dp))
                                    Text(
                                        "USSD Code",
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Gray900
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        info.ussdCode,
                                        fontSize = 32.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = InfoBlue,
                                        fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                                    )
                                    Spacer(modifier = Modifier.height(16.dp))
                                    Text(
                                        "Account Number: ${info.accountNumber}",
                                        fontSize = 16.sp,
                                        color = Gray700
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        info.instructions,
                                        fontSize = 14.sp,
                                        color = Gray600,
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = { initiatePayment() },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(56.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = SkyBlue600
                            ),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(
                                "Confirm Payment",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
                else -> {
                    // Show payment method selection
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            "Select Payment Method",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = Gray900
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        // Waafipay option (available by default)
                        PaymentMethodCard(
                            title = "Waafipay",
                            description = "Pay using Waafipay mobile money",
                            icon = Icons.Default.AccountBalanceWallet,
                            isSelected = selectedPaymentMethod == PaymentMethodType.WAAFIPAY,
                            onClick = { selectedPaymentMethod = PaymentMethodType.WAAFIPAY }
                        )
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        // Tplush option (coming soon)
                        PaymentMethodCard(
                            title = "Tplush",
                            description = "Coming soon",
                            icon = Icons.Default.Payment,
                            isSelected = false,
                            onClick = { },
                            enabled = false
                        )
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        // eDahab option (coming soon)
                        PaymentMethodCard(
                            title = "eDahab",
                            description = "Coming soon",
                            icon = Icons.Default.CreditCard,
                            isSelected = false,
                            onClick = { },
                            enabled = false
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun PaymentMethodCard(
    title: String,
    description: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit,
    enabled: Boolean = true
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = enabled) { onClick() }
            .then(
                if (isSelected) {
                    Modifier.border(2.dp, SkyBlue600, RoundedCornerShape(12.dp))
                } else {
                    Modifier
                }
            ),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) SkyBlue50 else Color.White
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = if (isSelected) 4.dp else 2.dp
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                Icon(
                    icon,
                    contentDescription = null,
                    modifier = Modifier.size(32.dp),
                    tint = if (enabled) SkyBlue600 else Gray400
                )
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Text(
                        title,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (enabled) Gray900 else Gray400
                    )
                    Text(
                        description,
                        fontSize = 14.sp,
                        color = if (enabled) Gray600 else Gray400
                    )
                }
            }
            if (isSelected) {
                Icon(
                    Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = SkyBlue600,
                    modifier = Modifier.size(24.dp)
                )
            }
        }
    }
}
