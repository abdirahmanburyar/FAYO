import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../data/datasources/api_client.dart';
import '../../../data/models/hospital_models.dart';

class DoctorDetailScreen extends StatefulWidget {
  final String doctorId;

  const DoctorDetailScreen({super.key, required this.doctorId});

  @override
  State<DoctorDetailScreen> createState() => _DoctorDetailScreenState();
}

class _DoctorDetailScreenState extends State<DoctorDetailScreen> {
  final ApiClient _apiClient = ApiClient();
  DoctorDto? _doctor;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDoctor();
  }

  Future<void> _loadDoctor() async {
    setState(() => _isLoading = true);
    try {
      final doctor = await _apiClient.getDoctorById(widget.doctorId);
      setState(() => _doctor = doctor);
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
        title: const Text('Doctor Details'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _doctor == null
              ? const Center(child: Text('Doctor not found'))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _doctor!.displayName,
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(_doctor!.specialty),
                      if (_doctor!.bio != null) ...[
                        const SizedBox(height: 16),
                        Text(
                          'About',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        Text(_doctor!.bio!),
                      ],
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () => context.push(
                          '/book-appointment?doctorId=${_doctor!.id}',
                        ),
                        child: const Text('Book Appointment'),
                      ),
                    ],
                  ),
                ),
    );
  }
}

