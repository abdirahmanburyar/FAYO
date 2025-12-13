import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
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
  DateTime _selectedDate = DateTime.now();
  String? _selectedDoctorId;
  String? _selectedSlot;
  final List<String> _slots = const ['9:00', '10:30', '12:00', '14:00', '16:00'];
  final Map<String, Set<String>> _takenSlots = {}; // Map<doctorId+dateKey, slots>
  bool _isLoadingSlots = false;

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
      setState(() {
        _hospital = hospital;
        _doctors = doctors;
      });
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
    final bookingPolicy = _hospital?.bookingPolicy?.toUpperCase() ?? 'DIRECT_DOCTOR';
    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: AppColors.gray50,
      body: SafeArea(
        child: _isLoading
            ? _buildSkeleton()
            : _hospital == null
                ? _buildEmpty(context)
                : CustomScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    slivers: [
                      _buildHeader(context, _hospital!),
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _infoPills(context, _hospital!),
                              const SizedBox(height: 16),
                              _bookRow(context, _hospital!, bookingPolicy),
                              const SizedBox(height: 20),
                              _aboutSection(context, _hospital!),
                              const SizedBox(height: 20),
                              _servicesSection(context, _hospital!),
                              const SizedBox(height: 20),
                              _doctorsSection(context, bookingPolicy),
                              const SizedBox(height: 20),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, HospitalDto hospital) {
    return SliverAppBar(
      pinned: false,
      floating: false,
      automaticallyImplyLeading: false,
      backgroundColor: Colors.transparent,
      elevation: 0,
      expandedHeight: 260,
      flexibleSpace: FlexibleSpaceBar(
        background: ClipPath(
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
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 22),
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
                            hospital.name,
                            style: Theme.of(context)
                                .textTheme
                                .headlineSmall
                                ?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const Icon(Icons.local_hospital,
                            color: Colors.white, size: 28),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _chip(hospital.type.isNotEmpty ? hospital.type : 'Hospital'),
                        if ((hospital.city ?? '').isNotEmpty) ...[
                          const SizedBox(width: 8),
                          _chip(hospital.city!),
                        ],
                      ],
                    ),
                    const SizedBox(height: 14),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _logo(hospital.logoUrl),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                hospital.address ?? 'Address not available',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.copyWith(
                                      color: Colors.white.withOpacity(0.95),
                                      fontWeight: FontWeight.w600,
                                    ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 6),
                              Text(
                                hospital.description ??
                                    'Compassionate care and trusted specialists.',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(
                                      color: Colors.white.withOpacity(0.9),
                                    ),
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _infoPills(BuildContext context, HospitalDto hospital) {
    final pills = <Widget>[];
    if ((hospital.city ?? '').isNotEmpty) {
      pills.add(_pill(Icons.location_city, hospital.city!));
    }
    if ((hospital.email ?? '').isNotEmpty) {
      pills.add(_pill(Icons.email_outlined, hospital.email!));
    }
    if ((hospital.website ?? '').isNotEmpty) {
      pills.add(_pill(Icons.public, hospital.website!));
    }
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: pills,
    );
  }

  Widget _bookRow(
      BuildContext context, HospitalDto hospital, String bookingPolicy) {
    final isDirectHospital = bookingPolicy != 'DIRECT_DOCTOR';
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: isDirectHospital
                ? () => context.push(
                      '/book-appointment?hospitalId=${hospital.id}',
                    )
                : (_doctors.isEmpty
                    ? null
                    : () {
                        // direct doctor policy; prompt to select below
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                              content:
                                  Text('Select a doctor below to book')),
                        );
                      }),
            icon: Icon(
              isDirectHospital ? Icons.calendar_today : Icons.person_add,
              size: 18,
            ),
            label: Text(isDirectHospital
                ? 'Book with hospital'
                : 'Select a doctor below'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ),
        const SizedBox(width: 12),
        OutlinedButton.icon(
          onPressed: () {
            final phone = hospital.phone ?? '';
            if (phone.isEmpty) return;
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Call: $phone')),
            );
          },
          icon: const Icon(Icons.call, size: 18),
          label: const Text('Call'),
        ),
      ],
    );
  }

  Widget _aboutSection(BuildContext context, HospitalDto hospital) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'About',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: AppColors.gray800,
              ),
        ),
        const SizedBox(height: 8),
        Text(
          hospital.description ??
              'Providing quality healthcare with experienced specialists and modern facilities.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.gray700,
              ),
        ),
      ],
    );
  }

  Widget _servicesSection(BuildContext context, HospitalDto hospital) {
    final services = hospital.services;
    if (services.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Services',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: AppColors.gray800,
              ),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: services
              .take(12)
              .map(
                (s) => Chip(
                  label: Text(
                    s.name,
                    style: const TextStyle(color: AppColors.gray700),
                  ),
                  backgroundColor: AppColors.gray100,
                  visualDensity: VisualDensity.compact,
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              )
              .toList(),
        ),
      ],
    );
  }

  Widget _doctorsSection(BuildContext context, String bookingPolicy) {
    if (_doctors.isEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Doctors',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.gray800,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Doctor list coming soon.',
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: AppColors.gray600),
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Doctors',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.gray800,
                  ),
            ),
            TextButton.icon(
              onPressed: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _selectedDate,
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (picked != null) {
                  setState(() {
                    _selectedDate = picked;
                    _selectedSlot = null;
                  });
                }
              },
              icon: const Icon(Icons.calendar_today, size: 16),
              label: Text(
                DateFormat('MMM d, yyyy').format(_selectedDate),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 260,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _doctors.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final doc = _doctors[index];
              final isSelected = _selectedDoctorId == doc.doctorId;
              final dateKey = DateFormat('yyyy-MM-dd').format(_selectedDate);
              final taken = _takenSlots['${doc.doctorId}-$dateKey'] ?? const {};
              return _doctorCard(
                context,
                doc,
                bookingPolicy,
                isSelected,
                taken,
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _doctorCard(
      BuildContext context,
      HospitalDoctorDto doc,
      String bookingPolicy,
      bool isSelected,
      Set<String> takenSlots) {
    final name = doc.doctor?.displayName ?? 'Doctor';
    final specialty = doc.doctor?.specialty ?? 'Specialty';
    final imageUrl = doc.doctor?.imageUrl;
    final fee = doc.consultationFee ?? doc.doctor?.consultationFee;
    final feeText = fee != null ? '\$${fee.toString()}' : '—';

    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedDoctorId = doc.doctorId;
          _selectedSlot = null;
        });
        _loadTakenSlots(doc.doctorId);
      },
      child: Container(
        width: 180,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
          border: isSelected
              ? Border.all(color: AppColors.skyBlue600, width: 1.5)
              : null,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: Stack(
            children: [
              // Full-cover doctor image
              Positioned.fill(
                child: _doctorImage(imageUrl, height: double.infinity),
              ),
              Positioned.fill(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _badge('4.7'),
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              shape: BoxShape.circle,
                            ),
                            padding: const EdgeInsets.all(6),
                            child: const Icon(Icons.bookmark_border,
                                color: Colors.white, size: 18),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.92),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.gray900,
                                ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            specialty,
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(
                                  color: AppColors.gray600,
                                ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Text(
                                '$feeText ',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.skyBlue600,
                                    ),
                              ),
                              Text(
                                'per session',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(
                                      color: AppColors.gray600,
                                    ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          if (_isLoadingSlots && isSelected)
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 6),
                              child: SizedBox(
                                height: 24,
                                width: 24,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              ),
                            )
                          else
                            SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(
                                children: _slots
                                    .map(
                                      (t) => Container(
                                        margin: const EdgeInsets.only(right: 6),
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 8, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: takenSlots.contains(t)
                                              ? AppColors.gray200
                                              : (_selectedSlot == t &&
                                                      isSelected)
                                                  ? AppColors.skyBlue100
                                                  : AppColors.gray100,
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                      child: InkWell(
                                        onTap: takenSlots.contains(t)
                                            ? null
                                            : () {
                                                setState(() {
                                                  _selectedDoctorId =
                                                      doc.doctorId;
                                                  _selectedSlot = t;
                                                });
                                              },
                                        child: Text(
                                          t,
                                          style: TextStyle(
                                            color: takenSlots.contains(t)
                                                ? AppColors.gray500
                                                : AppColors.gray700,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ),
                                      ),
                                    )
                                    .toList(),
                              ),
                            ),
                          const SizedBox(height: 8),
                          if (bookingPolicy == 'DIRECT_DOCTOR')
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: (_selectedSlot != null &&
                                        _selectedDoctorId == doc.doctorId)
                                    ? () => context.push(
                                          '/book-appointment?hospitalId=${_hospital?.id ?? ''}&doctorId=${doc.doctorId}&time=${_selectedSlot!}&date=${DateFormat('yyyy-MM-dd').format(_selectedDate)}',
                                        )
                                    : null,
                                style: ElevatedButton.styleFrom(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 10),
                                ),
                                child: const Text('Book'),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _doctorImage(String? url, {double height = 150}) {
    return SizedBox(
      height: height == double.infinity ? null : height,
      width: double.infinity,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Container(
          color: AppColors.gray100,
          child: url == null || url.isEmpty
              ? const Icon(Icons.person, size: 48, color: AppColors.skyBlue600)
              : CachedNetworkImage(
                  imageUrl: url,
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) =>
                      const Icon(Icons.person, size: 48, color: AppColors.skyBlue600),
                  placeholder: (_, __) =>
                      const Icon(Icons.person, size: 48, color: AppColors.skyBlue600),
                ),
        ),
      ),
    );
  }

  Widget _badge(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.22),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.star, size: 14, color: Colors.white),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String text) {
    return Chip(
      label: Text(
        text,
        style: const TextStyle(color: Colors.white),
      ),
      backgroundColor: Colors.white.withOpacity(0.16),
      side: BorderSide.none,
      visualDensity: VisualDensity.compact,
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }

  Widget _pill(IconData icon, String text) {
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

  Widget _logo(String? url) {
    if (url == null || url.isEmpty) return _logoPlaceholder();
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: CachedNetworkImage(
        imageUrl: url,
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

  Widget _buildSkeleton() {
    return Column(
      children: [
        _skeletonHeader(),
        Expanded(
          child: ListView.builder(
            itemCount: 4,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            itemBuilder: (_, __) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _skeletonCard(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _skeletonHeader() {
    return Container(
      height: 220,
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
      padding: const EdgeInsets.fromLTRB(16, 32, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _shimmerBox(width: 40, height: 40, radius: 20),
          const SizedBox(height: 12),
          _shimmerBox(width: 160, height: 18),
          const SizedBox(height: 8),
          _shimmerBox(width: 220, height: 14),
        ],
      ),
    );
  }

  Widget _skeletonCard() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _shimmerBox(width: 60, height: 60, radius: 10),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _shimmerBox(width: 140, height: 14),
                const SizedBox(height: 8),
                _shimmerBox(width: 200, height: 12),
                const SizedBox(height: 12),
                _shimmerBox(width: 100, height: 24, radius: 999),
              ],
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

  Widget _buildEmpty(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.local_hospital_outlined,
                size: 64, color: AppColors.gray400),
            const SizedBox(height: 12),
            Text(
              'Hospital not found',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.gray600,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _loadTakenSlots(String doctorId) async {
    setState(() => _isLoadingSlots = true);
    try {
      final dateKey = DateFormat('yyyy-MM-dd').format(_selectedDate);
      final appts = await _apiClient.getAppointments(
        doctorId: doctorId,
        hospitalId: _hospital?.id,
        startDate: dateKey,
        endDate: dateKey,
      );
      final slots = appts
          .map((a) => a.appointmentTime ?? '')
          .where((t) => t.isNotEmpty)
          .toSet();
      setState(() {
        _takenSlots['$doctorId-$dateKey'] = slots;
      });
    } catch (_) {
      // swallow; keep previous taken slots if any
    } finally {
      if (mounted) {
        setState(() => _isLoadingSlots = false);
      }
    }
  }
}

class _HeaderCurveClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    final path = Path();
    path.lineTo(0, size.height - 30);
    path.quadraticBezierTo(
      size.width / 2,
      size.height + 30,
      size.width,
      size.height - 30,
    );
    path.lineTo(size.width, 0);
    path.close();
    return path;
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}

