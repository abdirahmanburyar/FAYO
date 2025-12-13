import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../data/datasources/api_client.dart';
import '../../../data/models/appointment_models.dart';
import '../../../data/models/payment_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/constants/app_constants.dart';

class PaymentScreen extends StatefulWidget {
  final AppointmentDto appointment;

  const PaymentScreen({super.key, required this.appointment});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final ApiClient _apiClient = ApiClient();
  PaymentStatusResponse? _paymentStatus;
  bool _isLoading = false;
  bool _isProcessing = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Appointment Info Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Appointment Details',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 16),
                    _buildInfoRow('Appointment #', 
                        widget.appointment.appointmentNumber?.toString() ?? 'N/A'),
                    _buildInfoRow('Date', widget.appointment.appointmentDate),
                    _buildInfoRow('Time', widget.appointment.appointmentTime),
                    _buildInfoRow('Status', widget.appointment.status),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            // Payment Amount Card
            Card(
              color: AppColors.skyBlue50,
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Text(
                      'Total Amount',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${widget.appointment.consultationFee} ${AppConstants.defaultCurrency}',
                      style: Theme.of(context).textTheme.displaySmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.skyBlue600,
                          ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            // Payment Status
            if (widget.appointment.paymentStatus != 'PENDING')
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(
                        widget.appointment.paymentStatus == 'PAID'
                            ? Icons.check_circle
                            : Icons.error,
                        color: widget.appointment.paymentStatus == 'PAID'
                            ? AppColors.successGreen
                            : AppColors.errorRed,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Text(
                          'Payment Status: ${widget.appointment.paymentStatus}',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 24),
            // Payment Actions
            if (widget.appointment.paymentStatus == 'PENDING') ...[
              ElevatedButton.icon(
                onPressed: _isProcessing ? null : _initiatePayment,
                icon: _isProcessing
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.payment),
                label: Text(_isProcessing ? 'Processing...' : 'Pay Now'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () => _showPaymentInfo(),
                icon: const Icon(Icons.info_outline),
                label: const Text('Payment Instructions'),
              ),
            ] else ...[
              ElevatedButton(
                onPressed: () => context.pop(),
                child: const Text('Done'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.gray600,
                ),
          ),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
        ],
      ),
    );
  }

  Future<void> _initiatePayment() async {
    setState(() => _isProcessing = true);
    try {
      final request = InitiatePaymentRequest(
        appointmentId: widget.appointment.id,
        amount: widget.appointment.consultationFee,
      );
      final response = await _apiClient.initiatePayment(request);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response.message ?? 'Payment initiated successfully'),
            backgroundColor: AppColors.successGreen,
          ),
        );
        // Refresh payment status
        await _checkPaymentStatus(response.paymentId);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString().replaceFirst('Exception: ', '')}'),
            backgroundColor: AppColors.errorRed,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  Future<void> _checkPaymentStatus(String paymentId) async {
    try {
      final status = await _apiClient.getPaymentStatus(paymentId);
      setState(() => _paymentStatus = status);
    } catch (e) {
      print('Error checking payment status: $e');
    }
  }

  Future<void> _showPaymentInfo() async {
    try {
      final ussdInfo = await _apiClient.getUssdInfo();
      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Payment Instructions'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Account Number: ${ussdInfo.accountNumber}'),
                const SizedBox(height: 8),
                Text('USSD Code: ${ussdInfo.ussdCode}'),
                const SizedBox(height: 16),
                Text(ussdInfo.instructions),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Close'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading payment info: $e')),
        );
      }
    }
  }
}
