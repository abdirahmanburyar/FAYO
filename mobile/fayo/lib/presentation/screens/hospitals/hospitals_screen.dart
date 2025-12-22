import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/constants/api_constants.dart';
import '../../../data/datasources/api_client.dart';
import '../../../data/models/hospital_models.dart';

class HospitalsScreen extends StatefulWidget {
  const HospitalsScreen({super.key});

  @override
  State<HospitalsScreen> createState() => _HospitalsScreenState();
}

class _HospitalsScreenState extends State<HospitalsScreen> {
  final ApiClient _apiClient = ApiClient();
  final TextEditingController _searchController = TextEditingController();
  List<HospitalDto> _hospitals = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHospitals();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadHospitals({String? search}) async {
    setState(() => _isLoading = true);
    try {
      final hospitals = await _apiClient.getHospitals(search: search);
      setState(() => _hospitals = hospitals);
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
      // Extend behind status bar to keep header color consistent to the top
      extendBodyBehindAppBar: true,
      backgroundColor: AppColors.gray50,
      body: SafeArea(
        child: Column(
          children: [
            _buildStaticHeader(context),
            Expanded(
              child: RefreshIndicator(
                onRefresh: () => _loadHospitals(
                  search: _searchController.text.trim().isEmpty
                      ? null
                      : _searchController.text.trim(),
                ),
                child: _isLoading
                    ? ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: EdgeInsets.zero,
                        children: [
                          const SizedBox(height: 12),
                          _buildSkeletonList(),
                          const SizedBox(height: 16),
                        ],
                      )
                    : _hospitals.isEmpty
                        ? ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: EdgeInsets.zero,
                            children: [
                              _buildEmptyState(context),
                              const SizedBox(height: 16),
                            ],
                          )
                        : ListView.builder(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: const EdgeInsets.only(top: 12, bottom: 16),
                            itemCount: _hospitals.length,
                            itemBuilder: (context, index) {
                              final hospital = _hospitals[index];
                              return _buildHospitalCard(context, hospital);
                            },
                          ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStaticHeader(BuildContext context) {
    return ClipPath(
      clipper: _HeaderCurveClipper(),
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.skyBlue600,
              AppColors.skyBlue400,
            ],
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.18),
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        icon:
                            const Icon(Icons.arrow_back, color: Colors.white),
                        onPressed: () => Navigator.of(context).maybePop(),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Find care nearby',
                        style: Theme.of(context)
                            .textTheme
                            .headlineSmall
                            ?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                            ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const Icon(Icons.local_hospital,
                        color: Colors.white, size: 28),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Hospitals, clinics, specialties',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withOpacity(0.9),
                      ),
                ),
                const SizedBox(height: 16),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: Colors.transparent),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Row(
                    children: [
                      const Icon(Icons.search, color: AppColors.gray500),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          textInputAction: TextInputAction.search,
                          decoration: const InputDecoration(
                            hintText: 'Search hospitals, clinics, city...',
                            border: InputBorder.none,
                          ),
                          onSubmitted: (value) =>
                              _loadHospitals(search: value.trim()),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.filter_list,
                            color: AppColors.gray600),
                        onPressed: () => _loadHospitals(
                          search: _searchController.text.trim(),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12), // extra height below search bar
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      child: Column(
        children: [
          const Icon(
            Icons.local_hospital_outlined,
            size: 64,
            color: AppColors.gray400,
          ),
          const SizedBox(height: 12),
          Text(
            'No hospitals found',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.gray600,
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Try adjusting your search or check back later.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.gray500,
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildHospitalCard(BuildContext context, HospitalDto hospital) {
    final imageUrl = _getHospitalImageUrl(hospital.logoUrl);
    
    return InkWell(
      onTap: () => context.push('/hospital-details?id=${hospital.id}'),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hospital Image/Logo - Prefix (Left Side)
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(16),
                    bottomLeft: Radius.circular(16),
                  ),
                  child: Container(
                    width: 120,
                    height: 140,
                    color: AppColors.gray100,
                    child: imageUrl.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: imageUrl,
                            fit: BoxFit.cover,
                            width: 120,
                            height: 140,
                            placeholder: (context, url) => Container(
                              width: 120,
                              height: 140,
                              color: AppColors.gray100,
                              child: const Center(
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppColors.skyBlue600,
                                ),
                              ),
                            ),
                            errorWidget: (context, url, error) => _buildImagePlaceholder(),
                          )
                        : _buildImagePlaceholder(),
                  ),
                ),
                // Type Badge
                Positioned(
                  top: 8,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: hospital.type == 'HOSPITAL'
                          ? AppColors.skyBlue600
                          : Colors.green.shade600,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          hospital.type == 'HOSPITAL'
                              ? Icons.local_hospital
                              : Icons.medical_services,
                          color: Colors.white,
                          size: 12,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          hospital.type == 'HOSPITAL' ? 'Hospital' : 'Clinic',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                // Active Status Badge
                if (hospital.isActive)
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.check_circle,
                        color: Colors.white,
                        size: 14,
                      ),
                    ),
                  ),
              ],
            ),
            // Hospital Info Section - Right Side
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Hospital Name
                    Text(
                      hospital.name,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.gray900,
                            fontSize: 16,
                          ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    // Location Info
                    if (hospital.city != null || hospital.address != null)
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            Icons.location_on,
                            size: 16,
                            color: AppColors.gray600,
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              hospital.address != null && hospital.city != null
                                  ? '${hospital.address}, ${hospital.city}'
                                  : hospital.city ?? hospital.address ?? 'Location not available',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppColors.gray600,
                                    fontSize: 12,
                                  ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    // Specialties Section
                    if (hospital.specialties.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: hospital.specialties
                            .take(2)
                            .map((specialty) => Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.skyBlue50,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: AppColors.skyBlue200,
                                      width: 1,
                                    ),
                                  ),
                                  child: Text(
                                    specialty.name,
                                    style: const TextStyle(
                                      color: AppColors.skyBlue700,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ))
                            .toList(),
                      ),
                      if (hospital.specialties.length > 2)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            '+${hospital.specialties.length - 2} more',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppColors.skyBlue600,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 10,
                                ),
                          ),
                        ),
                    ],
                    const Spacer(),
                    // View Details Button
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.skyBlue600,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            'View Details',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(
                            Icons.arrow_forward,
                            color: Colors.white,
                            size: 14,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImagePlaceholder() {
    return Container(
      width: 120,
      height: 140,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.skyBlue100,
            AppColors.skyBlue200,
          ],
        ),
      ),
      child: const Center(
        child: Icon(
          Icons.local_hospital,
          size: 48,
          color: AppColors.skyBlue600,
        ),
      ),
    );
  }

  String _getHospitalImageUrl(String? logoUrl) {
    if (logoUrl == null || logoUrl.isEmpty) {
      return '';
    }
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
      return logoUrl;
    }
    final baseUrl = ApiConstants.apiBaseUrl.replaceFirst('/api/v1', '');
    final path = logoUrl.startsWith('/') ? logoUrl : '/$logoUrl';
    return '$baseUrl$path';
  }



  Widget _buildSkeletonList() {
    return Column(
      children: List.generate(
        10,
        (index) => Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: _skeletonCard(),
        ),
      ),
    );
  }
  Widget _skeletonCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image skeleton
          _shimmerBox(width: 120, height: 140, radius: 16),
          // Content skeleton
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _shimmerBox(width: 150, height: 18),
                  const SizedBox(height: 8),
                  _shimmerBox(width: 120, height: 14),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _shimmerBox(width: 60, height: 20, radius: 8),
                      const SizedBox(width: 6),
                      _shimmerBox(width: 50, height: 20, radius: 8),
                    ],
                  ),
                  const Spacer(),
                  const SizedBox(height: 8),
                  _shimmerBox(width: double.infinity, height: 32, radius: 10),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _shimmerBox(
      {required double width, required double height, double radius = 8}) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppColors.gray100,
        borderRadius: BorderRadius.circular(radius),
      ),
    );
  }
}

class _HeaderCurveClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    final path = Path();
    path.lineTo(0, size.height);
    path.quadraticBezierTo(
      size.width / 2,
      size.height - 50,
      size.width,
      size.height,
    );
    path.lineTo(size.width, 0);
    path.close();
    return path;
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}

