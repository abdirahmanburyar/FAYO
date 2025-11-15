import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../models/hospital.dart';
import '../services/hospital_service.dart' as hospital_api;
import '../services/realtime_service.dart';
import '../widgets/hospital_search_bar.dart';

class HospitalsScreen extends StatefulWidget {
  const HospitalsScreen({super.key});

  @override
  State<HospitalsScreen> createState() => _HospitalsScreenState();
}

class _HospitalsScreenState extends State<HospitalsScreen> {
  final hospital_api.HospitalService _hospitalService = hospital_api.HospitalService();
  final RealtimeService _realtimeService = RealtimeService();
  
  List<Hospital> _hospitals = [];
  List<Hospital> _filteredHospitals = [];
  bool _isLoading = true;
  String _searchQuery = '';
  String _selectedCity = 'All';
  String _selectedType = 'All';

  final List<String> _cities = [
    'All',
    'Mogadishu',
    'Hargeisa',
    'Kismayo',
    'Garowe',
    'Bosaso',
    'Galkayo',
    'Baidoa',
    'Beledweyne',
    'Jowhar',
    'Burao',
    'Berbera',
    'Laas Caanood',
    'Qardho',
    'Caynabo',
    'Buuhoodle',
  ];

  final List<String> _types = ['All', 'Hospital', 'Clinic'];

  @override
  void initState() {
    super.initState();
    _initializeRealtime();
    _loadHospitals();
  }

  Future<void> _initializeRealtime() async {
    await _realtimeService.init();

    // Listen to hospital updates
    _realtimeService.hospitalStream.listen((hospital) {
      setState(() {
        final existingIndex = _hospitals.indexWhere((h) => h.id == hospital.id);
        if (existingIndex != -1) {
          _hospitals[existingIndex] = hospital;
        } else {
          _hospitals.insert(0, hospital);
        }
        _applyFilters();
      });
    });

    // Listen to hospital deletions
    _realtimeService.eventStream.listen((event) {
      if (event.type == RealtimeEventType.hospitalDeleted) {
        setState(() {
          final hospitalId = event.data['hospitalId'] as String?;
          if (hospitalId != null) {
            _hospitals.removeWhere((h) => h.id == hospitalId);
            _applyFilters();
          }
        });
      }
    });
  }

  Future<void> _loadHospitals() async {
    try {
      setState(() {
        _isLoading = true;
      });
      
      final hospitals = await _hospitalService.getHospitals();
      print('Loaded ${hospitals.length} hospitals');
      setState(() {
        _hospitals = hospitals;
        _applyFilters();
      });
    } catch (e) {
      print('Error loading hospitals: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredHospitals = _hospitals.where((hospital) {
        // Only show active hospitals
        if (!hospital.isActive) return false;
        
        final matchesSearch = hospital.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            hospital.address.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            hospital.city.toLowerCase().contains(_searchQuery.toLowerCase());

        final matchesCity = _selectedCity == 'All' || hospital.city == _selectedCity;
        final matchesType = _selectedType == 'All' || hospital.type == _selectedType;

        return matchesSearch && matchesCity && matchesType;
      }).toList();

      // Sort by creation date, newest first
      _filteredHospitals.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      
      print('Filtered hospitals: ${_filteredHospitals.length} out of ${_hospitals.length} total');
    });
  }

  Future<void> _onRefresh() async {
    await _loadHospitals();
  }

  @override
  void dispose() {
    _realtimeService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      body: Column(
        children: [
          // Search and Filters Section
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: Column(
              children: [
                // Search Bar
                HospitalSearchBar(
                  onSearchChanged: (query) {
                    setState(() {
                      _searchQuery = query;
                      _applyFilters();
                    });
                  },
                  onCityChanged: (city) {
                    setState(() {
                      _selectedCity = city;
                      _applyFilters();
                    });
                  },
                  onTypeChanged: (type) {
                    setState(() {
                      _selectedType = type;
                      _applyFilters();
                    });
                  },
                  cities: _cities,
                  types: _types,
                  selectedCity: _selectedCity,
                  selectedType: _selectedType,
                ),
              ],
            ),
          ),

          // Hospital List with Pull-to-Refresh
          Expanded(
            child: RefreshIndicator(
              onRefresh: _onRefresh,
              child: _isLoading
                  ? _buildShimmerList()
                  : _filteredHospitals.isEmpty
                      ? _buildEmptyState()
                      : _buildHospitalList(),
            ),
          ),
        ],
      ),
    );
  }


  Widget _buildShimmerList() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: ListView.builder(
        itemCount: 8,
        itemBuilder: (context, index) {
          return Shimmer.fromColors(
            baseColor: Colors.grey[300]!,
            highlightColor: Colors.grey[100]!,
            child: Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              height: 80,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search_off,
            size: 80,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'No hospitals found',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Try adjusting your search or filters',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHospitalList() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: ListView.builder(
        itemCount: _filteredHospitals.length,
        itemBuilder: (context, index) {
          final hospital = _filteredHospitals[index];
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            child: _buildHospitalCard(hospital),
          );
        },
      ),
    );
  }

  Widget _buildHospitalCard(Hospital hospital) {
    return GestureDetector(
      onTap: () => _navigateToHospitalProfile(hospital),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
              spreadRadius: 0,
            ),
          ],
        ),
        child: Row(
          children: [
            // Hospital Icon
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: hospital.type == 'HOSPITAL' 
                    ? const Color(0xFF3B82F6).withOpacity(0.1)
                    : const Color(0xFF10B981).withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                hospital.type == 'HOSPITAL' 
                    ? Icons.local_hospital
                    : Icons.health_and_safety,
                color: hospital.type == 'HOSPITAL' 
                    ? const Color(0xFF3B82F6)
                    : const Color(0xFF10B981),
                size: 20,
              ),
            ),
            
            const SizedBox(width: 12),
            
            // Hospital Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Name and Type
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          hospital.name,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1F2937),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: hospital.type == 'HOSPITAL' 
                              ? const Color(0xFF3B82F6).withOpacity(0.1)
                              : const Color(0xFF10B981).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          hospital.type,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: hospital.type == 'HOSPITAL' 
                                ? const Color(0xFF3B82F6)
                                : const Color(0xFF10B981),
                          ),
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 4),
                  
                  // Location
                  Row(
                    children: [
                      Icon(
                        Icons.location_on,
                        size: 14,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${hospital.city} • ${hospital.address.length > 30 ? '${hospital.address.substring(0, 30)}...' : hospital.address}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey[600],
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 6),
                  
                  // Contact and Stats
                  Row(
                    children: [
                      // Phone
                      if (hospital.phone?.isNotEmpty == true) ...[
                        Icon(Icons.phone, size: 12, color: Colors.grey[500]),
                        const SizedBox(width: 4),
                        Text(
                          hospital.phone!,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey[500],
                          ),
                        ),
                        const SizedBox(width: 12),
                      ],
                      
                      // Services Count
                      Icon(Icons.medical_services, size: 12, color: Colors.grey[500]),
                      const SizedBox(width: 4),
                      Text(
                        '${hospital.services?.length ?? 0} services',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: Colors.grey[500],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            // Arrow Icon
            Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: Colors.grey[400],
            ),
          ],
        ),
      ),
    );
  }

  void _navigateToHospitalProfile(Hospital hospital) {
    Navigator.push(
      context,
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => HospitalProfileScreen(hospital: hospital),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          const begin = Offset(1.0, 0.0);
          const end = Offset.zero;
          const curve = Curves.easeInOutCubic;

          var tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
          var offsetAnimation = animation.drive(tween);

          return SlideTransition(
            position: offsetAnimation,
            child: child,
          );
        },
        transitionDuration: const Duration(milliseconds: 300),
      ),
    );
  }
}

// Hospital Profile Screen
class HospitalProfileScreen extends StatefulWidget {
  final Hospital hospital;

  const HospitalProfileScreen({super.key, required this.hospital});

  @override
  State<HospitalProfileScreen> createState() => _HospitalProfileScreenState();
}

class _HospitalProfileScreenState extends State<HospitalProfileScreen> with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late AnimationController _slideController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
  }

  void _initializeAnimations() {
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _slideController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeInOut,
    ));

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _slideController,
      curve: Curves.easeOutCubic,
    ));

    _fadeController.forward();
    _slideController.forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _slideController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          // Hospital Header
          SliverAppBar(
            expandedHeight: 120.0,
            floating: false,
            pinned: true,
            backgroundColor: widget.hospital.type == 'HOSPITAL' 
                ? const Color(0xFF3B82F6)
                : const Color(0xFF10B981),
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                widget.hospital.name,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: widget.hospital.type == 'HOSPITAL' 
                        ? [const Color(0xFF3B82F6), const Color(0xFF1E40AF)]
                        : [const Color(0xFF10B981), const Color(0xFF059669)],
                  ),
                ),
                child: Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        widget.hospital.type == 'HOSPITAL' 
                            ? Icons.local_hospital
                            : Icons.health_and_safety,
                        color: Colors.white,
                        size: 32,
                      ),
                      const SizedBox(width: 12),
                      Text(
                        widget.hospital.type,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Hospital Details
          SliverToBoxAdapter(
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: SlideTransition(
                position: _slideAnimation,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Basic Info Card
                      _buildInfoCard(),
                      const SizedBox(height: 16),
                      
                      // Services Card
                      _buildServicesCard(),
                      const SizedBox(height: 16),
                      
                      // Contact Card
                      _buildContactCard(),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.info_outline,
                color: widget.hospital.type == 'HOSPITAL' 
                    ? const Color(0xFF3B82F6)
                    : const Color(0xFF10B981),
                size: 20,
              ),
              const SizedBox(width: 8),
              const Text(
                'Information',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildCompactInfoRow('Type', widget.hospital.type),
          _buildCompactInfoRow('City', widget.hospital.city),
          _buildCompactInfoRow('Address', widget.hospital.address),
          _buildCompactInfoRow('Status', widget.hospital.isActive ? 'Active' : 'Inactive'),
        ],
      ),
    );
  }

  Widget _buildServicesCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.medical_services, color: Color(0xFF3B82F6), size: 20),
              const SizedBox(width: 8),
              const Text(
                'Services',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              Text(
                '${widget.hospital.services?.length ?? 0}',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (widget.hospital.services?.isEmpty ?? true)
            const Text(
              'No services available',
              style: TextStyle(color: Colors.grey, fontSize: 14),
            )
          else
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: widget.hospital.services!.map((service) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF3B82F6).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    service.serviceName,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF3B82F6),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                );
              }).toList(),
            ),
        ],
      ),
    );
  }

  Widget _buildContactCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.contact_phone, color: Color(0xFFF59E0B), size: 20),
              SizedBox(width: 8),
              Text(
                'Contact',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (widget.hospital.phone?.isNotEmpty == true)
            _buildCompactContactRow(Icons.phone, widget.hospital.phone!),
          if (widget.hospital.email?.isNotEmpty == true)
            _buildCompactContactRow(Icons.email, widget.hospital.email!),
          if (widget.hospital.website?.isNotEmpty == true)
            _buildCompactContactRow(Icons.web, widget.hospital.website!),
        ],
      ),
    );
  }

  Widget _buildCompactInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 60,
            child: Text(
              '$label:',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: Colors.grey[600],
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF1F2937),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompactContactRow(IconData icon, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey[600]),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF1F2937),
              ),
            ),
          ),
        ],
      ),
    );
  }
}