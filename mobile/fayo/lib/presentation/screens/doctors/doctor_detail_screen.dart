import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../data/datasources/api_client.dart';
import '../../../data/models/hospital_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/constants/api_constants.dart';

class DoctorDetailScreen extends StatefulWidget {
  final String doctorId;

  const DoctorDetailScreen({super.key, required this.doctorId});

  @override
  State<DoctorDetailScreen> createState() => _DoctorDetailScreenState();
}

class _DoctorDetailScreenState extends State<DoctorDetailScreen> {
  final ApiClient _apiClient = ApiClient();
  DoctorDto? _doctor;
  HospitalDto? _hospital;
  bool _isLoading = true;
  bool _isFavorite = false;
  bool _isAboutExpanded = false;
  String? _selectedDate;
  String? _selectedTime;

  @override
  void initState() {
    super.initState();
    _loadDoctor();
  }

  Future<void> _loadDoctor() async {
    setState(() => _isLoading = true);
    try {
      final doctor = await _apiClient.getDoctorById(widget.doctorId);
      
      // Try to get hospital from doctor's hospitals list or search
      HospitalDto? hospital;
      try {
        // Get hospitals where this doctor works
        final hospitals = await _apiClient.getHospitals();
        for (final h in hospitals) {
          final hospitalDoctors = await _apiClient.getHospitalDoctors(h.id);
          if (hospitalDoctors.any((hd) => hd.doctorId == doctor.id)) {
            hospital = h;
            break;
          }
        }
      } catch (e) {
        debugPrint('Error loading hospital: $e');
      }
      
      setState(() {
        _doctor = doctor;
        _hospital = hospital;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  String _getDoctorImageUrl() {
    final imageUrl = _doctor?.imageUrl;
    if (imageUrl == null || imageUrl.isEmpty) {
      return '';
    }
    
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    final baseUrl = ApiConstants.apiBaseUrl.replaceFirst('/api/v1', '');
    final path = imageUrl.startsWith('/') ? imageUrl : '/$imageUrl';
    return '$baseUrl$path';
  }

  bool _canBookDirectly() {
    // Check if hospital policy allows direct doctor selection
    if (_hospital?.bookingPolicy == null) return true; // Default to allowing
    return _hospital!.bookingPolicy!.toUpperCase() == 'DIRECT_DOCTOR';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _doctor == null
              ? const Center(child: Text('Doctor not found'))
              : CustomScrollView(
                  slivers: [
                    _buildAppBar(context),
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildDoctorProfile(context),
                            const SizedBox(height: 24),
                            _buildStatsCards(context),
                            const SizedBox(height: 24),
                            _buildAboutSection(context),
                            const SizedBox(height: 24),
                            _buildSchedulesSection(context),
                            const SizedBox(height: 24),
                            _buildReviewsSection(context),
                            const SizedBox(height: 100), // Space for bottom button
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
      bottomNavigationBar: _canBookDirectly() ? _buildBookButton(context) : null,
    );
  }

  Widget _buildAppBar(BuildContext context) {
    return SliverAppBar(
      pinned: true,
      backgroundColor: Colors.white,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: AppColors.gray800),
        onPressed: () {
          if (context.canPop()) {
            context.pop();
          } else {
            context.go('/home');
          }
        },
      ),
      actions: [
        IconButton(
          icon: Icon(
            _isFavorite ? Icons.favorite : Icons.favorite_border,
            color: _isFavorite ? Colors.red : AppColors.gray800,
          ),
          onPressed: () {
            setState(() => _isFavorite = !_isFavorite);
          },
        ),
      ],
    );
  }

  Widget _buildDoctorProfile(BuildContext context) {
    final imageUrl = _getDoctorImageUrl();
    final name = _doctor!.displayName;
    final specialty = _doctor!.specialty;
    final hospitalName = _hospital?.name ?? '';

    return Column(
      children: [
        // Profile Image
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.skyBlue200, width: 3),
          ),
          child: ClipOval(
            child: imageUrl.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: imageUrl,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      color: AppColors.gray200,
                      child: const Center(child: CircularProgressIndicator()),
                    ),
                    errorWidget: (context, url, error) => Container(
                      color: AppColors.gray200,
                      child: const Icon(Icons.person, size: 60, color: AppColors.gray400),
                    ),
                  )
                : Container(
                    color: AppColors.gray200,
                    child: const Icon(Icons.person, size: 60, color: AppColors.gray400),
                  ),
          ),
        ),
        const SizedBox(height: 16),
        // Name with verification badge
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              name,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.gray900,
                  ),
            ),
            const SizedBox(width: 8),
            Icon(Icons.verified, color: AppColors.skyBlue600, size: 20),
          ],
        ),
        const SizedBox(height: 8),
        // Specialty
        Text(
          specialty,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AppColors.gray600,
              ),
        ),
        if (hospitalName.isNotEmpty) ...[
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.location_on, size: 16, color: AppColors.gray600),
              const SizedBox(width: 4),
              Text(
                hospitalName,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.gray600,
                    ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildStatsCards(BuildContext context) {
    // Mock stats - replace with actual data when available
    final patients = '2k+';
    final experience = '12 Yr';
    final rating = '4.9';

    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            context,
            icon: Icons.people,
            value: patients,
            label: 'Patients',
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            context,
            icon: Icons.medical_services,
            value: experience,
            label: 'Experience',
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            context,
            icon: Icons.star,
            value: rating,
            label: 'Rating',
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(BuildContext context, {required IconData icon, required String value, required String label}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Column(
        children: [
          Icon(icon, color: AppColors.skyBlue600, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.gray900,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.gray600,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildAboutSection(BuildContext context) {
    final bio = _doctor!.bio ?? 'No information available about this doctor.';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'About Doctor',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.gray900,
              ),
        ),
        const SizedBox(height: 12),
        Text(
          _isAboutExpanded ? bio : (bio.length > 150 ? '${bio.substring(0, 150)}...' : bio),
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.gray700,
                height: 1.5,
              ),
        ),
        if (bio.length > 150)
          TextButton(
            onPressed: () {
              setState(() => _isAboutExpanded = !_isAboutExpanded);
            },
            child: Text(_isAboutExpanded ? 'Read less' : 'Read more'),
          ),
      ],
    );
  }

  Widget _buildSchedulesSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Schedules',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.gray900,
                  ),
            ),
            // Month selector (simplified)
            TextButton(
              onPressed: () {
                // TODO: Implement month selector
              },
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'August 2024',
                    style: TextStyle(color: AppColors.gray700),
                  ),
                  const SizedBox(width: 4),
                  Icon(Icons.arrow_drop_down, color: AppColors.gray700),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        // Date selector (horizontal scrollable)
        SizedBox(
          height: 60,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: 7,
            itemBuilder: (context, index) {
              final date = DateTime.now().add(Duration(days: index));
              final dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][date.weekday - 1];
              final dayNumber = date.day;
              final isSelected = _selectedDate == '${date.year}-${date.month}-${date.day}';
              
              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedDate = '${date.year}-${date.month}-${date.day}';
                    _selectedTime = null;
                  });
                },
                child: Container(
                  width: 60,
                  margin: const EdgeInsets.only(right: 8),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.skyBlue600 : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected ? AppColors.skyBlue600 : AppColors.gray200,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        dayName,
                        style: TextStyle(
                          fontSize: 12,
                          color: isSelected ? Colors.white : AppColors.gray600,
                        ),
                      ),
                      Text(
                        dayNumber.toString(),
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: isSelected ? Colors.white : AppColors.gray900,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
        // Time slots
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            '09:00 AM',
            '10:00 AM',
            '11:00 AM',
            '01:00 PM',
            '02:30 PM',
            '04:00 PM',
          ].map((time) {
            final isSelected = _selectedTime == time;
            final isDisabled = time == '04:00 PM'; // Mock disabled slot
            
            return GestureDetector(
              onTap: isDisabled ? null : () {
                setState(() => _selectedTime = time);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: isDisabled
                      ? AppColors.gray100
                      : (isSelected ? AppColors.skyBlue600 : Colors.white),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isDisabled
                        ? AppColors.gray200
                        : (isSelected ? AppColors.skyBlue600 : AppColors.gray200),
                  ),
                ),
                child: Text(
                  time,
                  style: TextStyle(
                    color: isDisabled
                        ? AppColors.gray400
                        : (isSelected ? Colors.white : AppColors.gray700),
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildReviewsSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Reviews',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.gray900,
                  ),
            ),
            TextButton(
              onPressed: () {
                // TODO: Navigate to all reviews
              },
              child: const Text('See all'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        // Sample review
        _buildReviewCard(context),
      ],
    );
  }

  Widget _buildReviewCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: AppColors.gray200,
            child: const Icon(Icons.person, color: AppColors.gray600),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'Sarah Johnson',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(width: 8),
                    ...List.generate(5, (index) => const Icon(Icons.star, size: 16, color: Colors.amber)),
                    const Spacer(),
                    Text(
                      '2 days ago',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.gray500,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Dr. Chen was incredibly professional and patient. She explained everything clearly and made me feel at ease throughout the consultation.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.gray700,
                        height: 1.5,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBookButton(BuildContext context) {
    if (!_canBookDirectly()) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'TOTAL PRICE',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.gray600,
                        ),
                  ),
                  Text(
                    '\$80 /visit',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppColors.gray900,
                        ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            ElevatedButton(
              onPressed: () {
                context.push(
                  '/book-appointment?doctorId=${_doctor!.id}${_hospital != null ? '&hospitalId=${_hospital!.id}' : ''}',
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.skyBlue600,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'Book Appointment',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
