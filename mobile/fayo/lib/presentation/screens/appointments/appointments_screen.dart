import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../data/datasources/api_client.dart';
import '../../../data/models/appointment_models.dart';
import '../../../data/models/hospital_models.dart';
import '../../../presentation/providers/auth_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/constants/api_constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AppointmentsScreen extends ConsumerStatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  ConsumerState<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends ConsumerState<AppointmentsScreen> {
  final ApiClient _apiClient = ApiClient();
  List<AppointmentDto> _appointments = [];
  Map<String, DoctorDto?> _doctors = {};
  Map<String, HospitalDto?> _hospitals = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAppointments();
  }

  Future<void> _loadAppointments() async {
    setState(() => _isLoading = true);
    try {
      final user = ref.read(authProvider);
      if (user != null) {
        final appointments = await _apiClient.getAppointments(patientId: user.id);
        
        // Fetch doctor and hospital details for each appointment
        final Map<String, DoctorDto?> doctors = {};
        final Map<String, HospitalDto?> hospitals = {};
        
        for (final appointment in appointments) {
          if (appointment.doctorId != null && !doctors.containsKey(appointment.doctorId)) {
            try {
              final doctor = await _apiClient.getDoctorById(appointment.doctorId!);
              doctors[appointment.doctorId!] = doctor;
            } catch (e) {
              print('Error loading doctor ${appointment.doctorId}: $e');
              doctors[appointment.doctorId!] = null;
            }
          }
          
          if (appointment.hospitalId != null && !hospitals.containsKey(appointment.hospitalId)) {
            try {
              final hospital = await _apiClient.getHospitalById(appointment.hospitalId!);
              hospitals[appointment.hospitalId!] = hospital;
            } catch (e) {
              print('Error loading hospital ${appointment.hospitalId}: $e');
              hospitals[appointment.hospitalId!] = null;
            }
          }
        }
        
        setState(() {
          _appointments = appointments;
          _doctors = doctors;
          _hospitals = hospitals;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading appointments: $e')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return AppColors.successGreen;
      case 'PENDING':
        return AppColors.warningYellow;
      case 'CANCELLED':
        return AppColors.errorRed;
      case 'COMPLETED':
        return AppColors.blue500;
      default:
        return AppColors.gray500;
    }
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      final months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return '${months[date.month - 1]} ${date.day}, ${date.year}';
    } catch (e) {
      return dateStr;
    }
  }

  String _formatTime(String timeStr) {
    try {
      // Handle both "HH:mm" and "HH:mm:ss" formats
      final parts = timeStr.split(':');
      if (parts.length >= 2) {
        final hour = int.parse(parts[0]);
        final minute = parts[1];
        final period = hour >= 12 ? 'PM' : 'AM';
        final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
        return '$displayHour:$minute $period';
      }
      return timeStr;
    } catch (e) {
      return timeStr;
    }
  }

  String _formatFee(int fee) {
    // Fee is stored in cents, convert to dollars
    final dollars = fee / 100.0;
    return '\$${dollars.toStringAsFixed(2)}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.gray50,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'My Appointments',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: AppColors.gray900,
          ),
        ),
        iconTheme: const IconThemeData(color: AppColors.gray700),
      ),
      body: _isLoading
          ? _buildSkeletonLoading()
          : _appointments.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _loadAppointments,
                  color: AppColors.skyBlue600,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _appointments.length,
                    itemBuilder: (context, index) {
                      final appointment = _appointments[index];
                      final doctor = appointment.doctorId != null
                          ? _doctors[appointment.doctorId]
                          : null;
                      final hospital = appointment.hospitalId != null
                          ? _hospitals[appointment.hospitalId]
                          : null;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: _buildTicketCard(context, appointment, doctor, hospital),
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildSkeletonLoading() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 3,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: _buildTicketSkeleton(),
        );
      },
    );
  }

  Widget _buildTicketSkeleton() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header skeleton
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.skyBlue100,
                  AppColors.skyBlue50,
                ],
              ),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: AppColors.gray200,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 150,
                        height: 16,
                        decoration: BoxDecoration(
                          color: AppColors.gray200,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        width: 100,
                        height: 14,
                        decoration: BoxDecoration(
                          color: AppColors.gray200,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 80,
                  height: 24,
                  decoration: BoxDecoration(
                    color: AppColors.gray200,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ],
            ),
          ),
          // Dashed line
          CustomPaint(
            size: const Size(double.infinity, 1),
            painter: DashedLinePainter(),
          ),
          // Content skeleton
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.gray200,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 120,
                            height: 14,
                            decoration: BoxDecoration(
                              color: AppColors.gray200,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            width: 200,
                            height: 12,
                            decoration: BoxDecoration(
                              color: AppColors.gray200,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: 100,
                      height: 12,
                      decoration: BoxDecoration(
                        color: AppColors.gray200,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    Container(
                      width: 100,
                      height: 12,
                      decoration: BoxDecoration(
                        color: AppColors.gray200,
                        borderRadius: BorderRadius.circular(4),
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

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: AppColors.skyBlue50,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.calendar_today_outlined,
              size: 64,
              color: AppColors.skyBlue600,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'No Appointments Yet',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.gray900,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Book your first appointment to get started',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.gray600,
                ),
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () => context.push('/book-appointment'),
            icon: const Icon(Icons.add),
            label: const Text('Book Appointment'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.skyBlue600,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTicketCard(
    BuildContext context,
    AppointmentDto appointment,
    DoctorDto? doctor,
    HospitalDto? hospital,
  ) {
    final statusColor = _getStatusColor(appointment.status);
    
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header with doctor/hospital info
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.skyBlue100,
                  AppColors.skyBlue50,
                ],
              ),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
              ),
            ),
            child: Row(
              children: [
                // Doctor/Hospital logo
                _buildLogo(
                  doctor?.imageUrl ?? hospital?.logoUrl,
                  isDoctor: doctor != null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        doctor != null
                            ? doctor.displayName
                            : hospital?.name ?? 'Appointment',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.gray900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        doctor != null
                            ? doctor.specialty
                            : hospital?.type ?? '',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppColors.gray600,
                        ),
                      ),
                    ],
                  ),
                ),
                // Status badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: statusColor.withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                  child: Text(
                    appointment.status,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Dashed line separator
          CustomPaint(
            size: const Size(double.infinity, 1),
            painter: DashedLinePainter(),
          ),
          // Ticket content
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                // Hospital info (if exists)
                if (hospital != null && doctor != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Row(
                      children: [
                        _buildLogo(hospital.logoUrl, isDoctor: false, size: 40),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                hospital.name,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.gray900,
                                ),
                              ),
                              if (hospital.address != null)
                                Text(
                                  hospital.address!,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: AppColors.gray600,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                // Date and time
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildInfoItem(
                      icon: Icons.calendar_today,
                      label: 'Date',
                      value: _formatDate(appointment.appointmentDate),
                    ),
                    _buildInfoItem(
                      icon: Icons.access_time,
                      label: 'Time',
                      value: _formatTime(appointment.appointmentTime),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Appointment number and fee
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildInfoItem(
                      icon: Icons.confirmation_number,
                      label: 'Appointment #',
                      value: appointment.appointmentNumber?.toString() ?? 'N/A',
                    ),
                    _buildInfoItem(
                      icon: Icons.payments,
                      label: 'Fee',
                      value: _formatFee(appointment.consultationFee),
                    ),
                  ],
                ),
                // Payment status
                if (appointment.paymentStatus == 'PENDING')
                  Padding(
                    padding: const EdgeInsets.only(top: 16),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.warningYellow.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.warningYellow.withOpacity(0.3),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.payment,
                            size: 20,
                            color: AppColors.warningYellow,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Payment Pending',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppColors.warningYellow,
                              ),
                            ),
                          ),
                          TextButton(
                            onPressed: () {
                              // TODO: Navigate to payment screen
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Payment feature coming soon'),
                                ),
                              );
                            },
                            child: const Text('Pay Now'),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogo(String? imageUrl, {required bool isDoctor, double size = 60}) {
    final baseUrl = isDoctor
        ? ApiConstants.doctorBaseUrl.replaceFirst('/api/v1', '')
        : ApiConstants.hospitalBaseUrl.replaceFirst('/api/v1', '');
    
    String fullUrl = '';
    if (imageUrl != null && imageUrl.isNotEmpty) {
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        fullUrl = imageUrl;
      } else {
        final path = imageUrl.startsWith('/') ? imageUrl : '/$imageUrl';
        fullUrl = '$baseUrl$path';
      }
    }

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.gray100,
        border: Border.all(
          color: AppColors.gray200,
          width: 2,
        ),
      ),
      child: fullUrl.isNotEmpty
          ? ClipOval(
              child: CachedNetworkImage(
                imageUrl: fullUrl,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  color: AppColors.gray100,
                  child: Center(
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(AppColors.skyBlue600),
                    ),
                  ),
                ),
                errorWidget: (context, url, error) => Icon(
                  isDoctor ? Icons.person : Icons.local_hospital,
                  size: size * 0.5,
                  color: AppColors.gray400,
                ),
              ),
            )
          : Icon(
              isDoctor ? Icons.person : Icons.local_hospital,
              size: size * 0.5,
              color: AppColors.gray400,
            ),
    );
  }

  Widget _buildInfoItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                icon,
                size: 16,
                color: AppColors.gray500,
              ),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.gray500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.gray900,
            ),
          ),
        ],
      ),
    );
  }
}

// Custom painter for dashed line
class DashedLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.gray300
      ..strokeWidth = 1;

    const dashWidth = 5.0;
    const dashSpace = 3.0;
    double startX = 0;

    while (startX < size.width) {
      canvas.drawLine(
        Offset(startX, size.height / 2),
        Offset(startX + dashWidth, size.height / 2),
        paint,
      );
      startX += dashWidth + dashSpace;
    }
  }

  @override
  bool shouldRepaint(DashedLinePainter oldDelegate) => false;
}
