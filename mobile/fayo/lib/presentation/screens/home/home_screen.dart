import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/datasources/api_client.dart';
import '../../../data/models/ads_models.dart';
import '../../../data/models/appointment_models.dart';
import '../../../data/services/call_websocket_service.dart';
import '../../../data/services/ads_websocket_service.dart';
import '../../../presentation/providers/auth_provider.dart';
import '../../widgets/call_invitation_dialog.dart';
import '../../../core/navigation/nav_helper.dart';
import '../hospitals/hospitals_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final ApiClient _apiClient = ApiClient();
  final CallWebSocketService _callService = CallWebSocketService();
  final AdsWebSocketService _adsService = AdsWebSocketService();
  
  List<AdDto> _ads = [];
  CallInvitationDto? _callInvitation;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
    _setupWebSockets();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final user = ref.read(authProvider);
      if (user != null) {
        // Load active ads
        final ads = await _apiClient.getActiveAds();
        setState(() {
          _ads = ads;
        });
      }
    } catch (e) {
      print('Error loading home data: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _setupWebSockets() {
    final user = ref.read(authProvider);
    if (user == null) return;

    // Setup call invitation listener
    _callService.connect(user.id).listen((event) {
      if (event.type == CallInvitationEventType.invitationReceived) {
        setState(() {
          _callInvitation = event.invitation;
        });
      }
    });

    // Setup ads updates
    _adsService.connect().listen((event) {
      if (event.type == 'ad.created' || event.type == 'ad.updated') {
        _loadData(); // Reload ads
      }
    });
  }

  @override
  void dispose() {
    _callService.disconnect();
    _adsService.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Scaffold(
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0,
            toolbarHeight: 80,
            automaticallyImplyLeading: false,
            titleSpacing: 0,
            title: Align(
              alignment: Alignment.centerLeft,
              child: Image.asset(
                'assets/images/header.png',
                height: 150,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) {
                  print('Error loading header image: $error');
                  return const Icon(Icons.image_not_supported);
                },
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                color: AppColors.gray700,
                onPressed: () {
                  // TODO: Implement notifications
                },
              ),
            ],
          ),
          body: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _loadData,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Section 1: Ads
                        _buildAdsSection(context),
                        const SizedBox(height: 32),
                        // Section 2: Services
                        _buildServicesSection(context),
                        const SizedBox(height: 32),
                        // Section 3: Blank (for later)
                        _buildBlankSection(context),
                      ],
                    ),
                  ),
                ),
        ),
        // Show call invitation dialog overlay
        if (_callInvitation != null)
          Positioned.fill(
            child: Container(
              color: Colors.black54,
              child: Center(
                child: CallInvitationDialog(
                  invitation: _callInvitation!,
                  onAccept: () async {
                    if (_callInvitation?.credentials != null) {
                      // TODO: Navigate to call screen with credentials
                      // For now, show a message
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Call feature coming soon')),
                      );
                    }
                    setState(() => _callInvitation = null);
                  },
                  onDecline: () {
                    setState(() => _callInvitation = null);
                  },
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildAdsSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Advertisements',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 16),
        if (_ads.isEmpty)
          // Sample ad when no ads available
          _buildSampleAdCard(context)
        else
          SizedBox(
            height: 200,
            child: PageView.builder(
              itemCount: _ads.length,
              itemBuilder: (context, index) {
                final ad = _ads[index];
                return _buildAdCard(context, ad);
              },
            ),
          ),
      ],
    );
  }

  Widget _buildSampleAdCard(BuildContext context) {
    return Container(
      height: 200,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.skyBlue400,
            AppColors.blue500,
          ],
        ),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.campaign,
              size: 64,
              color: Colors.white.withValues(alpha: 0.9),
            ),
            const SizedBox(height: 16),
            Text(
              'Be First',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your advertisement could be here',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withOpacity(0.8),
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAdCard(BuildContext context, AdDto ad) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          children: [
            // Ad Image
            if (ad.image.isNotEmpty)
              CachedNetworkImage(
                imageUrl: ad.image.startsWith('http')
                    ? ad.image
                    : 'http://72.62.51.50:3007${ad.image}',
                width: double.infinity,
                height: 200,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  color: AppColors.gray200,
                  child: const Center(child: CircularProgressIndicator()),
                ),
                errorWidget: (context, url, error) => Container(
                  color: AppColors.gray200,
                  child: const Icon(Icons.error),
                ),
              )
            else
              Container(
                color: AppColors.gray200,
                child: const Center(child: Icon(Icons.image)),
              ),
            // Gradient overlay
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                height: 80,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withOpacity(0.7),
                    ],
                  ),
                ),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      ad.company,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
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

  Widget _buildServicesSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Services',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 4,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.0,
          children: [
            _buildServiceCard(
              context,
              'Hospital',
              'assets/images/hospital.png',
              () => NavHelper.pushNewScreen(
                context,
                const HospitalsScreen(),
                withNavBar: true,
              ),
            ),
            _buildServiceCard(
              context,
              'Appointment',
              'assets/images/appointment.png',
              () => context.push('/appointments'),
            ),
            _buildServiceCard(
              context,
              'Telemedicine',
              'assets/images/telemedicine.png',
              () => context.push('/telemedicine'),
            ),
            _buildServiceCard(
              context,
              'Health Advices',
              'assets/images/advices.png',
              () => context.push('/health-advices'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildServiceCard(
    BuildContext context,
    String title,
    String? imagePath,
    VoidCallback onTap,
  ) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: Colors.white,
          ),
          child: Center(
            child: imagePath != null
                ? SizedBox(
                    height: 80,
                    width: 80,
                    child: Image.asset(
                      imagePath,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) {
                        return Icon(
                          Icons.medical_services,
                          size: 80,
                          color: AppColors.skyBlue600,
                        );
                      },
                    ),
                  )
                : Icon(
                    Icons.health_and_safety,
                    size: 80,
                    color: AppColors.skyBlue600,
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildBlankSection(BuildContext context) {
    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: AppColors.gray50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.gray200,
          width: 1,
        ),
      ),
      child: Center(
        child: Text(
          'Coming Soon',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AppColors.gray400,
              ),
        ),
      ),
    );
  }
}

