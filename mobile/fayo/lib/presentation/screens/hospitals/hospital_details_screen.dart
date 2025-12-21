import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
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

class _HospitalDetailsScreenState extends State<HospitalDetailsScreen>
    with SingleTickerProviderStateMixin {
  final ApiClient _apiClient = ApiClient();
  HospitalDto? _hospital;
  List<HospitalDoctorDto> _doctors = [];
  bool _isLoading = true;
  late TabController _tabController;
  int _selectedTabIndex = 0;
  bool _isFavorite = false;
  bool _isAboutExpanded = false;

  // Mock data for features not in API yet
  final double _rating = 4.8;
  final int _reviewCount = 1204;
  final String _distance = "1.2 miles away";
  final String _hours = "Open 24 Hours";
  final bool _isAccredited = true;
  final String _accreditation = "JCI Accredited";
  final Map<int, int> _ratingDistribution = {
    5: 850,
    4: 250,
    3: 80,
    2: 20,
    1: 4,
  };

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      setState(() => _selectedTabIndex = _tabController.index);
    });
    _loadHospital();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadHospital() async {
    setState(() => _isLoading = true);
    try {
      final hospital = await _apiClient.getHospitalById(widget.hospitalId);
      final doctors = await _apiClient.getHospitalDoctors(widget.hospitalId);
      setState(() {
        _hospital = hospital;
        _doctors = doctors;
      });
    } catch (e) {
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

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_hospital == null) {
      return Scaffold(
        appBar: AppBar(title: Text('Hospital Not Found')),
        body: Center(child: Text('Hospital not found')),
      );
    }

    final bookingPolicy =
        _hospital?.bookingPolicy?.toUpperCase() ?? 'DIRECT_DOCTOR';
    final isDirectDoctor = bookingPolicy == 'DIRECT_DOCTOR';

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
                  const SizedBox(height: 20),
                  _buildQuickActions(context),
                  const SizedBox(height: 24),
                  _buildTabs(context),
                  const SizedBox(height: 20),
                  _buildTabContent(context, isDirectDoctor),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBookButton(context, isDirectDoctor),
    );
  }

  Widget _buildAppBar(BuildContext context) {
    return SliverAppBar(
      pinned: true,
      backgroundColor: Colors.white,
      elevation: 0,
      leading: IconButton(
        icon: Icon(Icons.arrow_back, color: AppColors.gray800),
        onPressed: () => Navigator.of(context).pop(),
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
            height: 250,
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
          Positioned(
            bottom: 20,
            left: 20,
            child: _isAccredited
                ? Container(
                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.skyBlue600,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.check_circle, color: Colors.white, size: 16),
                        SizedBox(width: 6),
                        Text(
                          _accreditation,
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  )
                : SizedBox.shrink(),
          ),
          Positioned(
            bottom: 20,
            left: 0,
            right: 0,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                _hospital!.name,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  shadows: [
                    Shadow(
                      offset: Offset(0, 2),
                      blurRadius: 4,
                      color: Colors.black.withOpacity(0.3),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBannerPlaceholder() {
    return Container(
      height: 250,
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
        Row(
          children: [
            Icon(Icons.location_on, size: 16, color: AppColors.gray600),
            SizedBox(width: 4),
            Text(
              '$_distance • ${_hospital!.city ?? "Unknown"}',
              style: TextStyle(
                color: AppColors.gray600,
                fontSize: 14,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Container(
              padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.green500.withOpacity(0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                _hours,
                style: TextStyle(
                  color: AppColors.green500,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            SizedBox(width: 12),
            Row(
              children: [
                Icon(Icons.star, color: Colors.amber, size: 18),
                SizedBox(width: 4),
                Text(
                  '$_rating',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                SizedBox(width: 4),
                Text(
                  '($_reviewCount reviews)',
                  style: TextStyle(
                    color: AppColors.gray600,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        _actionButton(
          icon: Icons.directions,
          label: 'Directions',
          onTap: () {
            // Open maps with hospital address
            final address = Uri.encodeComponent(
                '${_hospital!.address}, ${_hospital!.city}');
            launchUrl(Uri.parse('https://www.google.com/maps/search/?api=1&query=$address'));
          },
        ),
        _actionButton(
          icon: Icons.language,
          label: 'Website',
          onTap: () {
            if (_hospital?.website != null && _hospital!.website!.isNotEmpty) {
              launchUrl(Uri.parse(_hospital!.website!));
            }
          },
        ),
        _actionButton(
          icon: Icons.share,
          label: 'Share',
          onTap: () {
            // Share functionality
          },
        ),
      ],
    );
  }

  Widget _actionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        child: Column(
          children: [
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.skyBlue100,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: AppColors.skyBlue600, size: 24),
            ),
            SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: AppColors.gray700,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabs(BuildContext context) {
    return TabBar(
      controller: _tabController,
      indicatorColor: AppColors.skyBlue600,
      labelColor: AppColors.skyBlue600,
      unselectedLabelColor: AppColors.gray600,
      tabs: [
        Tab(text: 'Overview'),
        Tab(text: 'Doctors'),
        Tab(text: 'Reviews'),
      ],
    );
  }

  Widget _buildTabContent(BuildContext context, bool isDirectDoctor) {
    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.6,
      child: TabBarView(
        controller: _tabController,
        children: [
          _buildOverviewTab(context),
          _buildDoctorsTab(context, isDirectDoctor),
          _buildReviewsTab(context),
        ],
      ),
    );
  }

  Widget _buildOverviewTab(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildAboutSection(context),
          const SizedBox(height: 24),
          _buildDepartmentsSection(context),
          const SizedBox(height: 24),
          _buildTopDoctorsSection(context),
          const SizedBox(height: 24),
          _buildLocationSection(context),
        ],
      ),
    );
  }

  Widget _buildAboutSection(BuildContext context) {
    final description = _hospital?.description ??
        'St. Mary\'s General Hospital is a leading medical facility renowned for its cardiac and neurological departments. With over 50 years of service, we provide compassionate care and trusted specialists.';
    final isLong = description.length > 150;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'About',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppColors.gray800,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          _isAboutExpanded || !isLong
              ? description
              : '${description.substring(0, 150)}...',
          style: TextStyle(
            fontSize: 14,
            color: AppColors.gray700,
            height: 1.5,
          ),
        ),
        if (isLong)
          TextButton(
            onPressed: () {
              setState(() => _isAboutExpanded = !_isAboutExpanded);
            },
            child: Text(
              _isAboutExpanded ? 'Read less' : 'Read more',
              style: TextStyle(color: AppColors.skyBlue600),
            ),
          ),
      ],
    );
  }

  Widget _buildDepartmentsSection(BuildContext context) {
    final departments = _hospital?.specialties ?? [];
    final departmentIcons = {
      'Cardiology': Icons.favorite,
      'Neurology': Icons.psychology,
      'Pediatrics': Icons.child_care,
      'Dental': Icons.medical_services,
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Departments',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.gray800,
              ),
            ),
            TextButton(
              onPressed: () {},
              child: Text(
                'View all',
                style: TextStyle(color: AppColors.skyBlue600),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: departments.take(4).map((dept) {
            final icon = departmentIcons[dept.name] ?? Icons.medical_services;
            return _departmentChip(icon, dept.name);
          }).toList(),
        ),
      ],
    );
  }

  Widget _departmentChip(IconData icon, String name) {
    return Container(
      width: 80,
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: AppColors.skyBlue100,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppColors.skyBlue600, size: 28),
          ),
          const SizedBox(height: 8),
          Text(
            name,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              color: AppColors.gray700,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildTopDoctorsSection(BuildContext context) {
    if (_doctors.isEmpty) {
      return SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Top Doctors',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.gray800,
              ),
            ),
            TextButton(
              onPressed: () {
                _tabController.animateTo(1);
              },
              child: Text(
                'View all',
                style: TextStyle(color: AppColors.skyBlue600),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 120,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: _doctors.take(5).length,
            itemBuilder: (context, index) {
              final doc = _doctors[index];
              return _doctorCard(doc, context);
            },
          ),
        ),
      ],
    );
  }

  Widget _doctorCard(HospitalDoctorDto doc, BuildContext context) {
    final doctor = doc.doctor;
    final name = doctor?.displayName ?? 'Dr. Unknown';
    final specialty = doctor?.specialty ?? 'Specialist';
    final imageUrl = doctor?.imageUrl;
    final rating = 4.7 + (doc.doctorId.hashCode % 3) * 0.1; // Mock rating
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
      width: 280,
      margin: EdgeInsets.only(right: 12),
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: imageFullUrl.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: imageFullUrl,
                    width: 60,
                    height: 60,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => _doctorPlaceholder(),
                    placeholder: (_, __) => _doctorPlaceholder(),
                  )
                : _doctorPlaceholder(),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  name,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                SizedBox(height: 4),
                Text(
                  specialty,
                  style: TextStyle(
                    color: AppColors.gray600,
                    fontSize: 12,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.star, color: Colors.amber, size: 14),
                    SizedBox(width: 4),
                    Text(
                      rating.toStringAsFixed(1),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _doctorPlaceholder() {
    return Container(
      width: 60,
      height: 60,
      color: AppColors.gray100,
      child: Icon(Icons.person, color: AppColors.gray400),
    );
  }

  Widget _buildLocationSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Location',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppColors.gray800,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          height: 150,
          decoration: BoxDecoration(
            color: AppColors.gray200,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Stack(
            children: [
              Center(
                child: Icon(
                  Icons.map,
                  size: 48,
                  color: AppColors.gray400,
                ),
              ),
              Positioned(
                bottom: 12,
                right: 12,
                child: ElevatedButton.icon(
                  onPressed: () {
                    final address = Uri.encodeComponent(
                        '${_hospital!.address}, ${_hospital!.city}');
                    launchUrl(Uri.parse(
                        'https://www.google.com/maps/search/?api=1&query=$address'));
                  },
                  icon: Icon(Icons.map, size: 18),
                  label: Text('Open in Maps'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.gray800,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '${_hospital!.address ?? ""}, ${_hospital!.city ?? ""}',
          style: TextStyle(
            fontSize: 14,
            color: AppColors.gray700,
          ),
        ),
      ],
    );
  }

  Widget _buildDoctorsTab(BuildContext context, bool isDirectDoctor) {
    if (_doctors.isEmpty) {
      return Center(
        child: Text(
          'No doctors available',
          style: TextStyle(color: AppColors.gray600),
        ),
      );
    }

    return ListView.builder(
      itemCount: _doctors.length,
      itemBuilder: (context, index) {
        final doc = _doctors[index];
        return _buildDoctorListItem(doc, context, isDirectDoctor);
      },
    );
  }

  Widget _buildDoctorListItem(
      HospitalDoctorDto doc, BuildContext context, bool isDirectDoctor) {
    final doctor = doc.doctor;
    final name = doctor?.displayName ?? 'Dr. Unknown';
    final specialty = doctor?.specialty ?? 'Specialist';
    final imageUrl = doctor?.imageUrl;
    final rating = 4.7 + (doc.doctorId.hashCode % 3) * 0.1;
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
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: imageFullUrl.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: imageFullUrl,
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => _doctorPlaceholder(),
                    placeholder: (_, __) => _doctorPlaceholder(),
                  )
                : _doctorPlaceholder(),
          ),
          SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  specialty,
                  style: TextStyle(
                    color: AppColors.gray600,
                    fontSize: 14,
                  ),
                ),
                SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.star, color: Colors.amber, size: 16),
                    SizedBox(width: 4),
                    Text(
                      rating.toStringAsFixed(1),
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                if (isDirectDoctor) ...[
                  SizedBox(height: 8),
                  ElevatedButton(
                    onPressed: () {
                      context.push(
                          '/book-appointment?hospitalId=${_hospital!.id}&doctorId=${doc.doctorId}');
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.skyBlue600,
                      padding: EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                    ),
                    child: Text('Book Appointment'),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewsTab(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$_rating',
                    style: TextStyle(
                      fontSize: 48,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Row(
                    children: List.generate(5, (index) {
                      return Icon(
                        index < _rating.floor()
                            ? Icons.star
                            : Icons.star_border,
                        color: Colors.amber,
                        size: 24,
                      );
                    }),
                  ),
                  SizedBox(height: 4),
                  Text(
                    '$_reviewCount reviews',
                    style: TextStyle(
                      color: AppColors.gray600,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
              SizedBox(
                width: 150,
                child: Column(
                  children: _ratingDistribution.entries.map((entry) {
                    final stars = entry.key;
                    final count = entry.value;
                    final percentage = (count / _reviewCount) * 100;
                    return Padding(
                      padding: EdgeInsets.only(bottom: 4),
                      child: Row(
                        children: [
                          Text('$stars', style: TextStyle(fontSize: 12)),
                          SizedBox(width: 8),
                          Expanded(
                            child: LinearProgressIndicator(
                              value: percentage / 100,
                              backgroundColor: AppColors.gray200,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                  AppColors.skyBlue600),
                            ),
                          ),
                          SizedBox(width: 8),
                          Text(
                            '$count',
                            style: TextStyle(fontSize: 12),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
          SizedBox(height: 24),
          Text(
            'Recent Reviews',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 12),
          // Mock review items
          ...List.generate(3, (index) => _buildReviewItem(context)),
        ],
      ),
    );
  }

  Widget _buildReviewItem(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(bottom: 16),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                child: Icon(Icons.person),
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Patient Name',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    Row(
                      children: [
                        ...List.generate(5, (i) => Icon(
                              i < 4 ? Icons.star : Icons.star_border,
                              color: Colors.amber,
                              size: 14,
                            )),
                        SizedBox(width: 8),
                        Text(
                          '2 days ago',
                          style: TextStyle(
                            color: AppColors.gray600,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: 12),
          Text(
            'Great service and professional staff. The doctors were very helpful and the facilities are clean and modern.',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.gray700,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBookButton(BuildContext context, bool isDirectDoctor) {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              if (isDirectDoctor && _doctors.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                      content: Text('Please select a doctor from the Doctors tab')),
                );
                _tabController.animateTo(1);
                return;
              }
              context.push(
                '/book-appointment?hospitalId=${_hospital!.id}${isDirectDoctor && _doctors.isNotEmpty ? '&doctorId=${_doctors.first.doctorId}' : ''}',
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.skyBlue600,
              padding: EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
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
