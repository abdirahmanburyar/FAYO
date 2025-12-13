import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../data/datasources/api_client.dart';
import '../../../data/models/appointment_models.dart';
import '../../../presentation/providers/auth_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class BookAppointmentScreen extends ConsumerStatefulWidget {
  final String? doctorId;
  final String? hospitalId;

  const BookAppointmentScreen({
    super.key,
    this.doctorId,
    this.hospitalId,
  });

  @override
  ConsumerState<BookAppointmentScreen> createState() => _BookAppointmentScreenState();
}

class _BookAppointmentScreenState extends ConsumerState<BookAppointmentScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiClient _apiClient = ApiClient();
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  final _reasonController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) {
      setState(() => _selectedDate = date);
    }
  }

  Future<void> _selectTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (time != null) {
      setState(() => _selectedTime = time);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedDate == null || _selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select date and time')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final user = ref.read(authProvider);
      if (user == null) {
        context.go('/login');
        return;
      }

      final request = CreateAppointmentRequest(
        patientId: user.id,
        doctorId: widget.doctorId,
        hospitalId: widget.hospitalId,
        appointmentDate: DateFormat('yyyy-MM-dd').format(_selectedDate!),
        appointmentTime: _selectedTime!.format(context),
        reason: _reasonController.text.isEmpty ? null : _reasonController.text,
        createdBy: user.id,
      );

      await _apiClient.createAppointment(request);
      if (mounted) {
        context.go('/appointments');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Book Appointment'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ListTile(
                leading: const Icon(Icons.calendar_today),
                title: Text(_selectedDate == null
                    ? 'Select Date'
                    : DateFormat('yyyy-MM-dd').format(_selectedDate!)),
                onTap: _selectDate,
              ),
              ListTile(
                leading: const Icon(Icons.access_time),
                title: Text(_selectedTime == null
                    ? 'Select Time'
                    : _selectedTime!.format(context)),
                onTap: _selectTime,
              ),
              TextFormField(
                controller: _reasonController,
                decoration: const InputDecoration(
                  labelText: 'Reason (Optional)',
                  hintText: 'Enter reason for appointment',
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                child: _isLoading
                    ? const CircularProgressIndicator()
                    : const Text('Book Appointment'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

