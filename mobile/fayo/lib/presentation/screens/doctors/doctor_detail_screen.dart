import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../data/datasources/api_client.dart';
import '../../../data/models/hospital_models.dart';
import '../../../data/models/appointment_models.dart';
import '../../../presentation/providers/auth_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/constants/api_constants.dart';

class DoctorDetailScreen extends ConsumerStatefulWidget {
  final String doctorId;

  const DoctorDetailScreen({super.key, required this.doctorId});

  @override
  ConsumerState<DoctorDetailScreen> createState() => _DoctorDetailScreenState();
}

class _DoctorDetailScreenState extends ConsumerState<DoctorDetailScreen> {
  final ApiClient _apiClient = ApiClient();
  DoctorDto? _doctor;
  HospitalDto? _hospital;
  HospitalDoctorDto? _hospitalDoctor;
  bool _isLoading = true;
  bool _isFavorite = false;
  bool _isAboutExpanded = false;
  String? _selectedDate;
  String? _selectedTime;
  List<String> _availableTimeSlots = [];
  bool _isLoadingTimeSlots = false;

  @override
  void initState() {
    super.initState();
    _loadDoctor();
  }

  Future<void> _loadDoctor() async {
    setState(() => _isLoading = true);
    try {
      final doctor = await _apiClient.getDoctorById(widget.doctorId);
      
      // Log doctor data
      debugPrint('👨‍⚕️ ========== DOCTOR DETAIL DATA FROM API ==========');
      debugPrint('📋 Doctor ID: ${doctor.id}');
      debugPrint('📋 User ID: ${doctor.userId}');
      debugPrint('📋 Display Name: ${doctor.displayName}');
      debugPrint('📋 License Number: ${doctor.licenseNumber}');
      debugPrint('📋 Specialty: ${doctor.specialty}');
      debugPrint('📋 Experience: ${doctor.experience} years');
      debugPrint('📋 Is Verified: ${doctor.isVerified}');
      debugPrint('📋 Is Available: ${doctor.isAvailable}');
      debugPrint('📋 Consultation Fee (self-employed): ${doctor.consultationFee ?? "N/A"}');
      debugPrint('📋 Bio: ${doctor.bio ?? "N/A"}');
      debugPrint('📋 Image URL: ${doctor.imageUrl ?? "N/A"}');
      debugPrint('📋 Education: ${doctor.education ?? "N/A"}');
      debugPrint('📋 Certifications: ${doctor.certifications ?? "N/A"}');
      debugPrint('📋 Languages: ${doctor.languages ?? "N/A"}');
      debugPrint('📋 Awards: ${doctor.awards ?? "N/A"}');
      debugPrint('📋 Publications: ${doctor.publications ?? "N/A"}');
      debugPrint('📋 Memberships: ${doctor.memberships ?? "N/A"}');
      debugPrint('📋 Research Interests: ${doctor.researchInterests ?? "N/A"}');
      final user = doctor.user;
      if (user != null) {
        debugPrint('📋 User First Name: ${user.firstName}');
        debugPrint('📋 User Last Name: ${user.lastName}');
        debugPrint('📋 User Email: ${user.email}');
        debugPrint('📋 User Phone: ${user.phone ?? "N/A"}');
      } else {
        debugPrint('📋 User: N/A');
      }
      
      // Try to get hospital from doctor's hospitals list or search
      HospitalDto? hospital;
      HospitalDoctorDto? hospitalDoctor;
      try {
        // Get hospitals where this doctor works
        final hospitals = await _apiClient.getHospitals();
        debugPrint('🏥 Searching through ${hospitals.length} hospital(s)...');
        for (final h in hospitals) {
          final hospitalDoctors = await _apiClient.getHospitalDoctors(h.id);
          debugPrint('   Checking hospital: ${h.name} (${h.id})');
          debugPrint('   Found ${hospitalDoctors.length} doctor(s) in this hospital');
          final hd = hospitalDoctors.firstWhere(
            (hd) => hd.doctorId == doctor.id,
            orElse: () => hospitalDoctors.first,
          );
          if (hd.doctorId == doctor.id) {
            hospital = h;
            hospitalDoctor = hd;
            debugPrint('   ✅ Found doctor in hospital: ${h.name}');
            break;
          }
        }
        
        // Log hospital data
        if (hospital != null) {
          debugPrint('🏥 ========== HOSPITAL DATA ==========');
          debugPrint('📋 Hospital ID: ${hospital.id}');
          debugPrint('📋 Hospital Name: ${hospital.name}');
          debugPrint('📋 Type: ${hospital.type}');
          debugPrint('📋 Address: ${hospital.address ?? "N/A"}');
          debugPrint('📋 City: ${hospital.city ?? "N/A"}');
          debugPrint('📋 Booking Policy: ${hospital.bookingPolicy ?? "N/A"}');
          debugPrint('📋 Is Active: ${hospital.isActive}');
        } else {
          debugPrint('⚠️ No hospital found for this doctor');
        }
        
        // Log hospital-doctor relationship data
        if (hospitalDoctor != null) {
          debugPrint('🔗 ========== HOSPITAL-DOCTOR RELATIONSHIP DATA ==========');
          debugPrint('📋 Hospital Doctor ID: ${hospitalDoctor.id}');
          debugPrint('📋 Doctor ID: ${hospitalDoctor.doctorId}');
          debugPrint('📋 Hospital ID: ${hospitalDoctor.hospitalId}');
          debugPrint('📋 Role: ${hospitalDoctor.role}');
          debugPrint('📋 Shift: ${hospitalDoctor.shift ?? "N/A"}');
          debugPrint('📋 Start Time: ${hospitalDoctor.startTime ?? "N/A"}');
          debugPrint('📋 End Time: ${hospitalDoctor.endTime ?? "N/A"}');
          debugPrint('📋 Consultation Fee: ${hospitalDoctor.consultationFee ?? "N/A"}');
          debugPrint('📋 Status: ${hospitalDoctor.status}');
          debugPrint('📋 Joined At: ${hospitalDoctor.joinedAt}');
          debugPrint('📋 Left At: ${hospitalDoctor.leftAt ?? "N/A"}');
        } else {
          debugPrint('⚠️ No hospital-doctor relationship found');
        }
      } catch (e) {
        debugPrint('❌ Error loading hospital: $e');
      }
      
      debugPrint('👨‍⚕️ ============================================');
      
      setState(() {
        _doctor = doctor;
        _hospital = hospital;
        _hospitalDoctor = hospitalDoctor;
      });
    } catch (e) {
      debugPrint('❌ Error loading doctor: $e');
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

  Future<void> _bookAppointment(BuildContext context) async {
    debugPrint('📅 ========== APPOINTMENT BOOKING STARTED ==========');
    
    // Validation: Check if date and time are selected
    debugPrint('🔍 [Validation] Checking selected date and time...');
    debugPrint('   Selected Date: ${_selectedDate ?? "NULL"}');
    debugPrint('   Selected Time: ${_selectedTime ?? "NULL"}');
    
    if (_selectedDate == null || _selectedTime == null) {
      debugPrint('❌ [Validation] Date or time is missing');
      debugPrint('   Date: ${_selectedDate ?? "NULL"}');
      debugPrint('   Time: ${_selectedTime ?? "NULL"}');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select date and time')),
        );
      }
      return;
    }
    debugPrint('✅ [Validation] Date and time are selected');

    // Validation: Check if user is authenticated
    debugPrint('🔍 [Validation] Checking user authentication...');
    final user = ref.read(authProvider);
    if (user == null) {
      debugPrint('❌ [Validation] User is not authenticated');
      if (mounted) {
        context.go('/login');
      }
      return;
    }
    debugPrint('✅ [Validation] User is authenticated');
    debugPrint('   User ID: ${user.id}');
    debugPrint('   User Name: ${user.firstName} ${user.lastName}');

    try {
      // Parse the selected date and time
      debugPrint('📅 [Parsing] Parsing selected date and time...');
      debugPrint('   Raw Date String: $_selectedDate');
      debugPrint('   Raw Time String: $_selectedTime');
      
      final dateParts = _selectedDate!.split('-');
      debugPrint('   Date Parts: $dateParts');
      
      if (dateParts.length != 3) {
        debugPrint('❌ [Validation] Invalid date format. Expected YYYY-MM-DD, got: $_selectedDate');
        throw FormatException('Invalid date format: $_selectedDate');
      }
      
      final year = int.parse(dateParts[0]);
      final month = int.parse(dateParts[1]);
      final day = int.parse(dateParts[2]);
      debugPrint('   Parsed Date: Year=$year, Month=$month, Day=$day');
      
      final selectedDateTime = DateTime(year, month, day);
      debugPrint('   DateTime Object: $selectedDateTime');
      
      // Parse time (format: "09:00 AM" or "01:00 PM")
      final timeParts = _selectedTime!.split(' ');
      debugPrint('   Time Parts: $timeParts');
      
      if (timeParts.length != 2) {
        debugPrint('❌ [Validation] Invalid time format. Expected "HH:MM AM/PM", got: $_selectedTime');
        throw FormatException('Invalid time format: $_selectedTime');
      }
      
      final timeValue = timeParts[0].split(':');
      debugPrint('   Time Value Parts: $timeValue');
      
      if (timeValue.length != 2) {
        debugPrint('❌ [Validation] Invalid time format. Expected "HH:MM", got: ${timeParts[0]}');
        throw FormatException('Invalid time format: ${timeParts[0]}');
      }
      
      var hour = int.parse(timeValue[0]);
      final minute = int.parse(timeValue[1]);
      final period = timeParts[1].toUpperCase();
      debugPrint('   Initial Hour: $hour, Minute: $minute, Period: $period');
      
      if (period == 'PM' && hour != 12) {
        hour += 12;
      } else if (period == 'AM' && hour == 12) {
        hour = 0;
      }
      debugPrint('   Final Hour (24h): $hour');
      
      if (hour < 0 || hour > 23) {
        debugPrint('❌ [Validation] Invalid hour: $hour (must be 0-23)');
        throw FormatException('Invalid hour: $hour');
      }
      if (minute < 0 || minute > 59) {
        debugPrint('❌ [Validation] Invalid minute: $minute (must be 0-59)');
        throw FormatException('Invalid minute: $minute');
      }
      
      final appointmentTime = TimeOfDay(hour: hour, minute: minute);
      debugPrint('   TimeOfDay Object: $appointmentTime');
      
      final formattedDate = DateFormat('yyyy-MM-dd').format(selectedDateTime);
      // Format time in 24-hour format (HH:mm) for API
      final formattedTime = '${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}';
      debugPrint('   Formatted Date: $formattedDate');
      debugPrint('   Formatted Time (24h): $formattedTime');
      debugPrint('   Formatted Time (12h for display): ${appointmentTime.format(context)}');

      // Validation: Check if doctor exists
      debugPrint('🔍 [Validation] Checking doctor data...');
      if (_doctor == null) {
        debugPrint('❌ [Validation] Doctor is null');
        throw Exception('Doctor information is missing');
      }
      debugPrint('✅ [Validation] Doctor data is available');
      debugPrint('   Doctor ID: ${_doctor!.id}');
      debugPrint('   Doctor Name: ${_doctor!.displayName}');

      // Build request
      debugPrint('📦 [Request] Building appointment request...');
      final request = CreateAppointmentRequest(
        patientId: user.id,
        doctorId: _doctor!.id,
        hospitalId: _hospital?.id,
        appointmentDate: formattedDate,
        appointmentTime: formattedTime,
        reason: null,
        createdBy: user.id,
      );

      // Log request body
      debugPrint('📤 [Request] Request Body:');
      debugPrint('   patientId: ${request.patientId}');
      debugPrint('   doctorId: ${request.doctorId}');
      debugPrint('   hospitalId: ${request.hospitalId ?? "NULL"}');
      debugPrint('   appointmentDate: ${request.appointmentDate}');
      debugPrint('   appointmentTime: ${request.appointmentTime}');
      debugPrint('   reason: ${request.reason ?? "NULL"}');
      debugPrint('   createdBy: ${request.createdBy}');

      // Send request
      debugPrint('🌐 [API] Sending appointment creation request...');
      final response = await _apiClient.createAppointment(request);
      
      // Log response
      debugPrint('📥 [Response] Appointment created successfully!');
      debugPrint('   Response Type: ${response.runtimeType}');
      debugPrint('📋 [Response] Appointment Details:');
      debugPrint('   Appointment ID: ${response.id}');
      debugPrint('   Patient ID: ${response.patientId}');
      debugPrint('   Doctor ID: ${response.doctorId}');
      debugPrint('   Hospital ID: ${response.hospitalId ?? "NULL"}');
      debugPrint('   Appointment Date: ${response.appointmentDate}');
      debugPrint('   Appointment Time: ${response.appointmentTime}');
      debugPrint('   Status: ${response.status}');
      debugPrint('   Consultation Fee: ${response.consultationFee}');
      debugPrint('   Reason: ${response.reason ?? "NULL"}');
      debugPrint('   Created At: ${response.createdAt}');
      debugPrint('   Updated At: ${response.updatedAt}');
      debugPrint('   Full Response Object: $response');
      
      debugPrint('✅ [Success] Appointment booking completed successfully');
      debugPrint('📅 ============================================');
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Appointment booked successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        // Navigate to appointments screen
        context.go('/appointments');
      }
    } catch (e, stackTrace) {
      debugPrint('❌ [Error] Appointment booking failed');
      debugPrint('   Error Type: ${e.runtimeType}');
      debugPrint('   Error Message: $e');
      debugPrint('   Stack Trace: $stackTrace');
      debugPrint('📅 ============================================');
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error booking appointment: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
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
                onTap: () async {
                  final selectedDateStr = '${date.year}-${date.month}-${date.day}';
                  setState(() {
                    _selectedDate = selectedDateStr;
                    _selectedTime = null;
                    _availableTimeSlots = [];
                    _isLoadingTimeSlots = true;
                  });
                  
                  // Fetch available time slots for the selected date
                  if (_doctor != null) {
                    try {
                      final availableSlots = await _apiClient.getAvailableTimeSlots(
                        _doctor!.id,
                        selectedDateStr,
                      );
                      if (mounted) {
                        setState(() {
                          _availableTimeSlots = availableSlots;
                          _isLoadingTimeSlots = false;
                        });
                      }
                    } catch (e) {
                      debugPrint('Error fetching available time slots: $e');
                      if (mounted) {
                        setState(() {
                          _isLoadingTimeSlots = false;
                        });
                      }
                    }
                  }
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
            color: Colors.black.withValues(alpha: 0.05),
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
                    _hospitalDoctor?.consultationFee != null
                        ? '\$${_hospitalDoctor!.consultationFee!.toStringAsFixed(2)}'
                        : 'N/A',
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
              onPressed: _selectedDate != null && _selectedTime != null
                  ? () => _bookAppointment(context)
                  : () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Please select a date and time'),
                        ),
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
