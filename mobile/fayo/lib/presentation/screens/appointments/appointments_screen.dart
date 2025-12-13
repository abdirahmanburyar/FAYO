import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../data/datasources/api_client.dart';
import '../../../data/models/appointment_models.dart';
import '../../../presentation/providers/auth_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AppointmentsScreen extends ConsumerStatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  ConsumerState<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends ConsumerState<AppointmentsScreen> {
  final ApiClient _apiClient = ApiClient();
  List<AppointmentDto> _appointments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAppointments();
  }

  Future<void> _loadAppointments() async {
    setState(() => _isLoading = true);
    try {
      final user = ref.read(authProvider);
      if (user != null) {
        final appointments = await _apiClient.getAppointments(patientId: user.id);
        setState(() => _appointments = appointments);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Appointments'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/book-appointment'),
        child: const Icon(Icons.add),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _appointments.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.calendar_today, size: 64),
                      const SizedBox(height: 16),
                      const Text('No appointments yet'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => context.push('/book-appointment'),
                        child: const Text('Book Appointment'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadAppointments,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _appointments.length,
                    itemBuilder: (context, index) {
                      final appointment = _appointments[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          title: Text(
                            'Appointment #${appointment.appointmentNumber ?? 'N/A'}',
                          ),
                          subtitle: Text(
                            '${appointment.appointmentDate} at ${appointment.appointmentTime}',
                          ),
                          trailing: Chip(
                            label: Text(appointment.status),
                          ),
                          onTap: () {
                            if (appointment.paymentStatus == 'PENDING') {
                              // TODO: Navigate to payment screen with appointment
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Payment feature coming soon')),
                              );
                            }
                          },
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

