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
  int _currentPage = 0;

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
                        ? _buildEmptyState(context)
                        : Stack(
                            children: [
                              // Deck of cards - stacked design
                              Center(
                                child: SizedBox(
                                  width: MediaQuery.of(context).size.width - 32,
                                  height: MediaQuery.of(context).size.height * 0.65,
                                  child: Stack(
                                    alignment: Alignment.center,
                                    children: [
                                      // Show up to 3 cards stacked
                                      ...List.generate(
                                        _hospitals.length > 3 ? 3 : _hospitals.length,
                                        (stackIndex) {
                                          final cardIndex = _currentPage + stackIndex;
                                          if (cardIndex >= _hospitals.length) return const SizedBox.shrink();
                                          
                                          final hospital = _hospitals[cardIndex];
                                          final isTopCard = stackIndex == 0;
                                          
                                          return Positioned(
                                            top: stackIndex * 12.0,
                                            left: stackIndex * 2.0,
                                            right: stackIndex * 2.0,
                                            child: GestureDetector(
                                              onPanUpdate: isTopCard
                                                  ? (details) {
                                                      // Allow dragging top card
                                                    }
                                                  : null,
                                              onPanEnd: isTopCard
                                                  ? (details) {
                                                      // Swipe left to next
                                                      if (details.velocity.pixelsPerSecond.dx < -500) {
                                                        if (_currentPage < _hospitals.length - 1) {
                                                          setState(() {
                                                            _currentPage++;
                                                          });
                                                        }
                                                      }
                                                      // Swipe right to previous
                                                      if (details.velocity.pixelsPerSecond.dx > 500) {
                                                        if (_currentPage > 0) {
                                                          setState(() {
                                                            _currentPage--;
                                                          });
                                                        }
                                                      }
                                                    }
                                                  : null,
                                              child: Transform.scale(
                                                scale: 1.0 - (stackIndex * 0.03),
                                                child: Opacity(
                                                  opacity: 1.0 - (stackIndex * 0.15),
                                                  child: _buildHospitalCard(context, hospital, cardIndex),
                                                ),
                                              ),
                                            ),
                                          );
                                        },
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              // Page indicator at the bottom
                              Positioned(
                                bottom: 20,
                                left: 0,
                                right: 0,
                                child: _buildPageIndicator(),
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

  Widget _buildPageIndicator() {
    if (_hospitals.isEmpty) return const SizedBox.shrink();
    
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(
        _hospitals.length,
        (index) => Container(
          width: 8,
          height: 8,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: _currentPage == index
                ? AppColors.skyBlue600
                : AppColors.gray400.withOpacity(0.5),
          ),
        ),
      ),
    );
  }

  Widget _buildHospitalCard(BuildContext context, HospitalDto hospital, int index) {
    final imageUrl = _getHospitalImageUrl(hospital.logoUrl);
    final isTopCard = index == _currentPage;
    
    return InkWell(
      onTap: () => context.push('/hospital-details?id=${hospital.id}'),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isTopCard ? 0.25 : 0.15),
              blurRadius: isTopCard ? 20 : 10,
              offset: Offset(0, isTopCard ? 8 : 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hospital Image - Full Width Top
              Stack(
                children: [
                  Container(
                    width: double.infinity,
                    height: 200,
                    color: AppColors.gray100,
                    child: imageUrl.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: imageUrl,
                            fit: BoxFit.cover,
                            width: double.infinity,
                            height: double.infinity,
                            placeholder: (context, url) => Container(
                              width: double.infinity,
                              height: double.infinity,
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
                ],
              ),
              // Dark Info Panel - Bottom
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.gray800,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Hospital Name - Large, Bold, White
                    Text(
                      hospital.name,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            fontSize: 20,
                          ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 12),
                    // City Badge - Blue icon + Blue text
                    if (hospital.city != null)
                      Row(
                        children: [
                          Icon(
                            Icons.home,
                            size: 16,
                            color: AppColors.skyBlue400,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            hospital.city!.toUpperCase(),
                            style: TextStyle(
                              color: AppColors.skyBlue400,
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    // Address - Location icon + White text
                    if (hospital.address != null) ...[
                      const SizedBox(height: 8),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            Icons.location_on,
                            size: 16,
                            color: AppColors.gray400,
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              hospital.address!,
                              style: TextStyle(
                                color: AppColors.gray300,
                                fontSize: 13,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImagePlaceholder() {
    return Container(
      width: double.infinity,
      height: 200,
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
          size: 64,
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
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image skeleton
            _shimmerBox(width: double.infinity, height: 200, radius: 0),
            // Dark panel skeleton
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.gray800,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _shimmerBox(width: 200, height: 24),
                  const SizedBox(height: 12),
                  _shimmerBox(width: 100, height: 16),
                  const SizedBox(height: 8),
                  _shimmerBox(width: 180, height: 16),
                ],
              ),
            ),
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

