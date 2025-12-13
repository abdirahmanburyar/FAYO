import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_colors.dart';
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
                            padding: const EdgeInsets.only(bottom: 16),
                            itemCount: _hospitals.length,
                            itemBuilder: (context, index) {
                              final hospital = _hospitals[index];
                              return Padding(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 8),
                                child: _buildHospitalCard(context, hospital),
                              );
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
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 3,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildLogo(hospital.logoUrl),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    hospital.name,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      _infoPill(Icons.public, hospital.city ?? 'Unknown'),
                    ],
                  ),
                ],
              ),
            ),
            IconButton(
              onPressed: () =>
                  context.push('/hospital-details?id=${hospital.id}'),
              icon: const Icon(Icons.chevron_right, color: AppColors.gray500),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLogo(String? logoUrl) {
    if (logoUrl == null || logoUrl.isEmpty) {
      return _logoPlaceholder();
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: CachedNetworkImage(
        imageUrl: logoUrl,
        width: 80,
        height: 80,
        fit: BoxFit.cover,
        placeholder: (_, __) => _logoPlaceholder(),
        errorWidget: (_, __, ___) => _logoPlaceholder(),
      ),
    );
  }

  Widget _logoPlaceholder() {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        color: AppColors.gray100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Icon(Icons.local_hospital, color: AppColors.skyBlue600),
    );
  }

  Widget _infoPill(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.gray100,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.gray600),
          const SizedBox(width: 6),
          Text(
            text,
            style: const TextStyle(
              color: AppColors.gray700,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
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
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _shimmerBox(width: 80, height: 80, radius: 12),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _shimmerBox(width: 140, height: 16),
                  const SizedBox(height: 8),
                  _shimmerBox(width: 200, height: 14),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _shimmerBox(width: 70, height: 26, radius: 999),
                      const SizedBox(width: 8),
                      _shimmerBox(width: 60, height: 26, radius: 999),
                      const SizedBox(width: 8),
                      _shimmerBox(width: 50, height: 26, radius: 999),
                    ],
                  ),
                ],
              ),
            ),
            _shimmerBox(width: 20, height: 20, radius: 6),
          ],
        ),
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

