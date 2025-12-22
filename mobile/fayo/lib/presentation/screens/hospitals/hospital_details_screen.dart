import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/constants/api_constants.dart';
import '../../../data/datasources/api_client.dart';
import '../../../data/models/hospital_models.dart';

class HospitalDetailsScreen extends StatefulWidget {
  final String hospitalId;

  const HospitalDetailsScreen({super.key, required this.hospitalId});

  @override
  State<HospitalDetailsScreen> createState() => _HospitalDetailsScreenState();
}

class _HospitalDetailsScreenState extends State<HospitalDetailsScreen> {
  final ApiClient _apiClient = ApiClient();
  HospitalDto? _hospital;
  List<HospitalDoctorDto> _doctors = [];
  bool _isLoading = true;
  bool _isFavorite = false;

  @override
  void initState() {
    super.initState();
    _loadHospital();
  }

  Future<void> _loadHospital() async {
    setState(() => _isLoading = true);
    try {
      final hospital = await _apiClient.getHospitalById(widget.hospitalId);
      final doctors = await _apiClient.getHospitalDoctors(widget.hospitalId);
      
      // Log hospital data for debugging
      debugPrint('🏥 ========== HOSPITAL DATA FROM API ==========');
      debugPrint('📋 Hospital ID: ${hospital.id}');
      debugPrint('📋 Hospital Name: ${hospital.name}');
      debugPrint('📋 Type: ${hospital.type}');
      debugPrint('📋 Address: ${hospital.address ?? "N/A"}');
      debugPrint('📋 City: ${hospital.city ?? "N/A"}');
      debugPrint('📋 Phone: ${hospital.phone ?? "N/A"}');
      debugPrint('📋 Email: ${hospital.email ?? "N/A"}');
      debugPrint('📋 Website: ${hospital.website ?? "N/A"}');
      debugPrint('📋 Logo URL: ${hospital.logoUrl ?? "N/A"}');
      debugPrint('📋 Booking Policy: ${hospital.bookingPolicy ?? "N/A"}');
      debugPrint('📋 Description: ${hospital.description ?? "N/A"}');
      debugPrint('📋 Is Active: ${hospital.isActive}');
      debugPrint('📋 Created At: ${hospital.createdAt}');
      debugPrint('📋 Updated At: ${hospital.updatedAt}');
      debugPrint('📋 Specialties Count: ${hospital.specialties.length}');
      for (var i = 0; i < hospital.specialties.length; i++) {
        final specialty = hospital.specialties[i];
        debugPrint('   [${i + 1}] ${specialty.name} (ID: ${specialty.id}, Active: ${specialty.isActive})');
        if (specialty.description != null) {
          debugPrint('       Description: ${specialty.description}');
        }
      }
      debugPrint('📋 Services Count: ${hospital.services.length}');
      for (var i = 0; i < hospital.services.length; i++) {
        final service = hospital.services[i];
        debugPrint('   [${i + 1}] ${service.name} (ID: ${service.id}, Active: ${service.isActive})');
        if (service.description != null) {
          debugPrint('       Description: ${service.description}');
        }
      }
      debugPrint('👨‍⚕️ Doctors Count: ${doctors.length}');
      for (var i = 0; i < doctors.length; i++) {
        final doctor = doctors[i];
        debugPrint('   [${i + 1}] Doctor ID: ${doctor.doctorId}');
        if (doctor.doctor != null) {
          debugPrint('       Name: ${doctor.doctor!.displayName}');
          debugPrint('       Specialty: ${doctor.doctor!.specialty}');
          debugPrint('       Available: ${doctor.doctor!.isAvailable}');
        }
        debugPrint('       Role: ${doctor.role}');
        debugPrint('       Status: ${doctor.status}');
        if (doctor.consultationFee != null) {
          debugPrint('       Consultation Fee: ${doctor.consultationFee}');
        }
      }
      debugPrint('🏥 ============================================');
      
      setState(() {
        _hospital = hospital;
        _doctors = doctors;
      });
    } catch (e) {
      debugPrint('❌ Error loading hospital: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  String _getHospitalImageUrl() {
    if (_hospital?.logoUrl == null || _hospital!.logoUrl!.isEmpty) {
      return '';
    }
    if (_hospital!.logoUrl!.startsWith('http://') ||
        _hospital!.logoUrl!.startsWith('https://')) {
      return _hospital!.logoUrl!;
    }
    final baseUrl = ApiConstants.apiBaseUrl.replaceFirst('/api/v1', '');
    final path = _hospital!.logoUrl!.startsWith('/')
        ? _hospital!.logoUrl!
        : '/${_hospital!.logoUrl!}';
    return '$baseUrl$path';
  }

  bool _canBookDirectly() {
    if (_hospital?.bookingPolicy == null) return true; // Default to allowing
    return _hospital!.bookingPolicy!.toUpperCase() == 'DIRECT_DOCTOR';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(
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
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_hospital == null) {
      return Scaffold(
        appBar: AppBar(
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
        ),
        body: const Center(child: Text('Hospital not found')),
      );
    }

    final isDirectDoctor = _canBookDirectly();

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          _buildAppBar(context),
          _buildBanner(context),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHospitalInfo(context),
                  const SizedBox(height: 24),
                  _buildContactInfo(context),
                  const SizedBox(height: 32),
                  _buildDoctorsSection(context, isDirectDoctor),
                  const SizedBox(height: 100), // Space for bottom button
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: isDirectDoctor ? _buildBookButton(context) : null,
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

  Widget _buildBanner(BuildContext context) {
    final imageUrl = _getHospitalImageUrl();
    return SliverToBoxAdapter(
      child: Stack(
        children: [
          Container(
            height: 280,
            width: double.infinity,
            child: imageUrl.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: imageUrl,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => _buildBannerPlaceholder(),
                    placeholder: (_, __) => _buildBannerPlaceholder(),
                  )
                : _buildBannerPlaceholder(),
          ),
          // Gradient overlay for better text readability
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withOpacity(0.6),
                  ],
                ),
              ),
            ),
          ),
          // Hospital name overlay
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _hospital!.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      shadows: [
                        Shadow(
                          offset: Offset(0, 2),
                          blurRadius: 8,
                          color: Colors.black54,
                        ),
                      ],
                    ),
                  ),
                  if (_hospital!.type.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.skyBlue600,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _hospital!.type,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBannerPlaceholder() {
    return Container(
      height: 280,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.skyBlue600, AppColors.skyBlue400],
        ),
      ),
      child: Center(
        child: Icon(
          Icons.local_hospital,
          size: 80,
          color: Colors.white.withOpacity(0.5),
        ),
      ),
    );
  }

  Widget _buildHospitalInfo(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Location
        if (_hospital!.address != null || _hospital!.city != null) ...[
          Row(
            children: [
              Icon(Icons.location_on, size: 20, color: AppColors.skyBlue600),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '${_hospital!.address ?? ""}${_hospital!.address != null && _hospital!.city != null ? ", " : ""}${_hospital!.city ?? ""}',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.gray900,
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
        ],
        // Description
        if (_hospital!.description != null && _hospital!.description!.isNotEmpty && _hospital!.description != 'N/A') ...[
          Text(
            'About',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.gray900,
                ),
          ),
          const SizedBox(height: 12),
          Text(
            _hospital!.description!,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.gray700,
                  height: 1.6,
                ),
          ),
          const SizedBox(height: 24),
        ],
      ],
    );
  }

  Widget _buildContactInfo(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.skyBlue50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.skyBlue200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info_outline, color: AppColors.skyBlue600, size: 20),
              const SizedBox(width: 8),
              Text(
                'Contact Information',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.gray900,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_hospital!.phone != null && _hospital!.phone!.isNotEmpty) ...[
            _buildContactItem(
              context,
              icon: Icons.phone,
              label: 'Phone',
              value: _hospital!.phone!,
              onTap: () {
                launchUrl(Uri.parse('tel:${_hospital!.phone}'));
              },
            ),
            const SizedBox(height: 12),
          ],
          if (_hospital!.email != null && _hospital!.email!.isNotEmpty) ...[
            _buildContactItem(
              context,
              icon: Icons.email,
              label: 'Email',
              value: _hospital!.email!,
              onTap: () {
                launchUrl(Uri.parse('mailto:${_hospital!.email}'));
              },
            ),
            const SizedBox(height: 12),
          ],
          if (_hospital!.website != null && _hospital!.website!.isNotEmpty) ...[
            _buildContactItem(
              context,
              icon: Icons.language,
              label: 'Website',
              value: _hospital!.website!,
              onTap: () {
                launchUrl(Uri.parse(_hospital!.website!));
              },
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildContactItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 18, color: AppColors.skyBlue600),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.gray600,
                          fontSize: 11,
                        ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.gray900,
                          fontWeight: FontWeight.w500,
                        ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: AppColors.gray400, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildDoctorsSection(BuildContext context, bool isDirectDoctor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Our Doctors',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.gray900,
                  ),
            ),
            if (_doctors.isNotEmpty)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.skyBlue100,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${_doctors.length} ${_doctors.length == 1 ? 'doctor' : 'doctors'}',
                  style: TextStyle(
                    color: AppColors.skyBlue700,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),
        if (_doctors.isEmpty)
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.gray200),
            ),
            child: Column(
              children: [
                Icon(Icons.person_off, size: 48, color: AppColors.gray400),
                const SizedBox(height: 12),
                Text(
                  'No doctors available',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.gray600,
                      ),
                ),
              ],
            ),
          )
        else
          ..._doctors.map((doc) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: _buildDoctorCard(doc, context, isDirectDoctor),
              )),
      ],
    );
  }

  Widget _buildDoctorCard(
    HospitalDoctorDto doc,
    BuildContext context,
    bool isDirectDoctor,
  ) {
    final doctor = doc.doctor;
    final name = doctor?.displayName ?? 'Dr. Unknown';
    final specialty = doctor?.specialty ?? 'Specialist';
    final imageUrl = doctor?.imageUrl;
    final consultationFee = doc.consultationFee;
    final role = doc.role;
    final isAvailable = doctor?.isAvailable ?? false;

    String imageFullUrl = '';
    if (imageUrl != null && imageUrl.isNotEmpty) {
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        imageFullUrl = imageUrl;
      } else {
        final baseUrl = ApiConstants.apiBaseUrl.replaceFirst('/api/v1', '');
        final path = imageUrl.startsWith('/') ? imageUrl : '/$imageUrl';
        imageFullUrl = '$baseUrl$path';
      }
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isAvailable ? AppColors.skyBlue200 : AppColors.gray200,
          width: isAvailable ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Doctor Image
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: imageFullUrl.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: imageFullUrl,
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => _buildDoctorPlaceholder(),
                    placeholder: (_, __) => _buildDoctorPlaceholder(),
                  )
                : _buildDoctorPlaceholder(),
          ),
          const SizedBox(width: 16),
          // Doctor Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  name,
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleMedium
                                      ?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.gray900,
                                      ),
                                ),
                              ),
                              if (doctor?.isVerified ?? false)
                                Icon(
                                  Icons.verified,
                                  size: 18,
                                  color: AppColors.skyBlue600,
                                ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            specialty,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppColors.gray600,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                // Role Badge
                if (role.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.skyBlue100,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      role.replaceAll('_', ' '),
                      style: TextStyle(
                        color: AppColors.skyBlue700,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                const SizedBox(height: 8),
                // Consultation Fee (convert from cents to dollars)
                if (consultationFee != null)
                  Row(
                    children: [
                      Icon(Icons.attach_money, size: 16, color: AppColors.gray600),
                      const SizedBox(width: 4),
                      Text(
                        '\$${(consultationFee / 100).toStringAsFixed(2)} /consultation',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.gray700,
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    ],
                  ),
                // Book Button (only if direct doctor booking is allowed)
                if (isDirectDoctor) ...[
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        context.push(
                          '/doctor-details?id=${doc.doctorId}',
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.skyBlue600,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'View Profile',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDoctorPlaceholder() {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        color: AppColors.gray200,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(Icons.person, color: AppColors.gray400, size: 40),
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
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              if (_doctors.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('No doctors available for booking'),
                  ),
                );
                return;
              }
              // Navigate to book appointment with hospital ID
              context.push(
                '/book-appointment?hospitalId=${_hospital!.id}',
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.skyBlue600,
              padding: const EdgeInsets.symmetric(vertical: 16),
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
        ),
      ),
    );
  }
}
