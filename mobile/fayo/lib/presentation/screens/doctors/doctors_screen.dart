import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../data/datasources/api_client.dart';
import '../../../data/models/hospital_models.dart';

class DoctorsScreen extends StatefulWidget {
  const DoctorsScreen({super.key});

  @override
  State<DoctorsScreen> createState() => _DoctorsScreenState();
}

class _DoctorsScreenState extends State<DoctorsScreen> {
  final ApiClient _apiClient = ApiClient();
  final TextEditingController _searchController = TextEditingController();
  List<DoctorDto> _doctors = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDoctors();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadDoctors({String? search}) async {
    setState(() => _isLoading = true);
    try {
      final doctors = await _apiClient.getDoctors(search: search);
      setState(() => _doctors = doctors);
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
        title: const Text('Doctors'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                hintText: 'Search doctors...',
                prefixIcon: Icon(Icons.search),
              ),
              onSubmitted: (value) => _loadDoctors(search: value),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _doctors.isEmpty
                    ? const Center(child: Text('No doctors found'))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _doctors.length,
                        itemBuilder: (context, index) {
                          final doctor = _doctors[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: ListTile(
                              leading: const Icon(Icons.person),
                              title: Text(doctor.displayName),
                              subtitle: Text(doctor.specialty),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () => context.push(
                                '/doctor-details?id=${doctor.id}',
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

