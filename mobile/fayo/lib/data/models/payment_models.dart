class QrCodeResponse {
  final String qrCode;
  final String qrCodeType;
  final String appointmentId;
  final String? message;

  QrCodeResponse({
    required this.qrCode,
    required this.qrCodeType,
    required this.appointmentId,
    this.message,
  });

  factory QrCodeResponse.fromJson(Map<String, dynamic> json) {
    return QrCodeResponse(
      qrCode: json['qrCode'] ?? '',
      qrCodeType: json['qrCodeType'] ?? 'ACCOUNT',
      appointmentId: json['appointmentId'] ?? '',
      message: json['message'],
    );
  }
}

class InitiatePaymentRequest {
  final String appointmentId;
  final int amount;
  final String currency;
  final String? accountNumber;
  final String? phoneNumber;
  final String? description;

  InitiatePaymentRequest({
    required this.appointmentId,
    required this.amount,
    this.currency = "USD",
    this.accountNumber,
    this.phoneNumber,
    this.description,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'appointmentId': appointmentId,
      'amount': amount,
      'currency': currency,
    };
    if (accountNumber != null) map['accountNumber'] = accountNumber;
    if (phoneNumber != null) map['phoneNumber'] = phoneNumber;
    if (description != null) map['description'] = description;
    return map;
  }
}

class InitiatePaymentResponse {
  final String paymentId;
  final String appointmentId;
  final String? transactionId;
  final String? referenceId;
  final String status;
  final String? message;

  InitiatePaymentResponse({
    required this.paymentId,
    required this.appointmentId,
    this.transactionId,
    this.referenceId,
    required this.status,
    this.message,
  });

  factory InitiatePaymentResponse.fromJson(Map<String, dynamic> json) {
    return InitiatePaymentResponse(
      paymentId: json['paymentId'] ?? '',
      appointmentId: json['appointmentId'] ?? '',
      transactionId: json['transactionId'],
      referenceId: json['referenceId'],
      status: json['status'] ?? '',
      message: json['message'],
    );
  }
}

class PaymentStatusResponse {
  final String paymentId;
  final String appointmentId;
  final String status;
  final String? transactionId;
  final String? referenceId;
  final int amount;
  final String currency;
  final String? message;

  PaymentStatusResponse({
    required this.paymentId,
    required this.appointmentId,
    required this.status,
    this.transactionId,
    this.referenceId,
    required this.amount,
    required this.currency,
    this.message,
  });

  factory PaymentStatusResponse.fromJson(Map<String, dynamic> json) {
    return PaymentStatusResponse(
      paymentId: json['paymentId'] ?? '',
      appointmentId: json['appointmentId'] ?? '',
      status: json['status'] ?? '',
      transactionId: json['transactionId'],
      referenceId: json['referenceId'],
      amount: json['amount'] ?? 0,
      currency: json['currency'] ?? 'USD',
      message: json['message'],
    );
  }
}

class PaymentStatusUpdate {
  final String type;
  final PaymentStatusData? payment;
  final String? status;
  final String? error;
  final String? timestamp;

  PaymentStatusUpdate({
    required this.type,
    this.payment,
    this.status,
    this.error,
    this.timestamp,
  });

  factory PaymentStatusUpdate.fromJson(Map<String, dynamic> json) {
    return PaymentStatusUpdate(
      type: json['type'] ?? '',
      payment: json['payment'] != null
          ? PaymentStatusData.fromJson(json['payment'])
          : null,
      status: json['status'],
      error: json['error'],
      timestamp: json['timestamp'],
    );
  }
}

class PaymentStatusData {
  final String id;
  final String appointmentId;
  final String? transactionId;
  final int amount;
  final String status;

  PaymentStatusData({
    required this.id,
    required this.appointmentId,
    this.transactionId,
    required this.amount,
    required this.status,
  });

  factory PaymentStatusData.fromJson(Map<String, dynamic> json) {
    return PaymentStatusData(
      id: json['id'] ?? '',
      appointmentId: json['appointmentId'] ?? '',
      transactionId: json['transactionId'],
      amount: json['amount'] ?? 0,
      status: json['status'] ?? '',
    );
  }
}

enum PaymentMethodType {
  waafipay,
  tplush,
  edahab,
}

class UssdInfoResponse {
  final String accountNumber;
  final String ussdCode;
  final String instructions;
  final String message;

  UssdInfoResponse({
    required this.accountNumber,
    required this.ussdCode,
    required this.instructions,
    required this.message,
  });

  factory UssdInfoResponse.fromJson(Map<String, dynamic> json) {
    return UssdInfoResponse(
      accountNumber: json['accountNumber'] ?? '',
      ussdCode: json['ussdCode'] ?? '',
      instructions: json['instructions'] ?? '',
      message: json['message'] ?? '',
    );
  }
}

