package com.fayo.healthcare.data.models

import kotlinx.serialization.Serializable

@Serializable
data class QrCodeResponse(
    val qrCode: String,
    val qrCodeType: String, // "ACCOUNT" or "PHONE"
    val appointmentId: String,
    val message: String? = null
)

@Serializable
data class InitiatePaymentRequest(
    val appointmentId: String,
    val amount: Int, // Amount in cents
    val currency: String = "USD",
    val accountNumber: String? = null, // 6-digit account number
    val phoneNumber: String? = null, // Phone number in format +252XXXXXXXXX
    val description: String? = null
)

@Serializable
data class InitiatePaymentResponse(
    val paymentId: String,
    val appointmentId: String,
    val transactionId: String? = null,
    val referenceId: String? = null,
    val status: String,
    val message: String? = null
)

@Serializable
data class PaymentStatusResponse(
    val paymentId: String,
    val appointmentId: String,
    val status: String,
    val transactionId: String? = null,
    val referenceId: String? = null,
    val amount: Int,
    val currency: String,
    val message: String? = null
)

@Serializable
data class PaymentStatusUpdate(
    val type: String, // "payment.initiated", "payment.completed", "payment.failed"
    val payment: PaymentStatusData? = null,
    val status: String? = null,
    val error: String? = null,
    val timestamp: String? = null
)

@Serializable
data class PaymentStatusData(
    val id: String,
    val appointmentId: String,
    val transactionId: String? = null,
    val amount: Int,
    val status: String
)

