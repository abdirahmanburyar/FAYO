import 'dart:async';
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
  PageController? _adsPageController;
  Timer? _adsScrollTimer;

  @override
  void initState() {
    super.initState();
    _adsPageController = PageController();
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
        // Start auto-scrolling if we have ads (after widget is built)
        if (ads.isNotEmpty) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _resetAndStartAutoScroll();
          });
        }
      }
    } catch (e) {
      print('Error loading home data: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _resetAndStartAutoScroll() {
    if (_adsPageController == null || !_adsPageController!.hasClients) {
      // If controller is not ready, try again after a short delay
      Future.delayed(const Duration(milliseconds: 100), () {
        _resetAndStartAutoScroll();
      });
      return;
    }
    
    // Reset to first page
    _adsPageController!.jumpToPage(0);
    // Start auto-scrolling
    _startAdsAutoScroll();
  }

  void _startAdsAutoScroll() {
    _adsScrollTimer?.cancel();
    if (_ads.isEmpty || _adsPageController == null) return;
    
    _adsScrollTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      if (_adsPageController == null || !_adsPageController!.hasClients) {
        timer.cancel();
        return;
      }
      
      final currentPage = _adsPageController!.page?.round() ?? 0;
      final nextPage = (currentPage + 1) % _ads.length;
      
      _adsPageController!.animateToPage(
        nextPage,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    });
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
        _loadData(); // _loadData will handle restarting auto-scroll
      }
    });
  }

  @override
  void dispose() {
    _adsScrollTimer?.cancel();
    _adsPageController?.dispose();
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
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(AppColors.skyBlue600),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Loading your healthcare dashboard...',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.gray600,
                            ),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadData,
                  color: AppColors.skyBlue600,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Section 1: Ads
                        _buildAdsSection(context),
                        const SizedBox(height: 32),
                        // Section 2: Services
                        _buildServicesSection(context),
                        const SizedBox(height: 32),
                        // Section 3: Quick Actions
                        _buildBlankSection(context),
                        const SizedBox(height: 20),
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
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Featured Ads',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.gray900,
                      ),
                ),
                const SizedBox(height: 4),
                if (_ads.isNotEmpty)
                  Text(
                    '${_ads.length} active advertisement${_ads.length != 1 ? 's' : ''}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.gray600,
                        ),
                  ),
              ],
            ),
            if (_ads.isNotEmpty)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.skyBlue50,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: AppColors.skyBlue200,
                    width: 1,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.auto_awesome,
                      size: 14,
                      color: AppColors.skyBlue600,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Sponsored',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.skyBlue700,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),
        if (_ads.isEmpty)
          // Sample ad when no ads available
          _buildSampleAdCard(context)
        else
          Column(
            children: [
              SizedBox(
                height: 200,
                child: PageView.builder(
                  controller: _adsPageController,
                  itemCount: _ads.length,
                  itemBuilder: (context, index) {
                    final ad = _ads[index];
                    return _buildAdCard(context, ad);
                  },
                ),
              ),
              if (_ads.length > 1)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      _ads.length,
                      (index) => AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        height: 8,
                        width: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: (_adsPageController?.hasClients ?? false) &&
                                  (_adsPageController?.page?.round() ?? 0) == index
                              ? AppColors.skyBlue600
                              : AppColors.gray300,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
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
        child: ad.imageUrl.isNotEmpty
            ? CachedNetworkImage(
                imageUrl: ad.imageUrl.startsWith('http')
                    ? ad.imageUrl
                    : 'http://72.62.51.50:3007${ad.imageUrl}',
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
            : Container(
                color: AppColors.gray200,
                child: const Center(child: Icon(Icons.image)),
              ),
      ),
    );
  }

  Widget _buildServicesSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Our Services',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.gray900,
              ),
        ),
        const SizedBox(height: 8),
        Text(
          'Access healthcare services at your fingertips',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.gray600,
              ),
        ),
        const SizedBox(height: 20),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 1.1,
          children: [
            _buildServiceCard(
              context,
              'Hospitals',
              'Find nearby hospitals and medical facilities',
              'assets/images/hospital.png',
              AppColors.blue500,
              () => NavHelper.pushNewScreen(
                context,
                const HospitalsScreen(),
                withNavBar: true,
              ),
            ),
            _buildServiceCard(
              context,
              'Appointments',
              'Book and manage your appointments',
              'assets/images/appointment.png',
              AppColors.green500,
              () => context.push('/appointments'),
            ),
            _buildServiceCard(
              context,
              'Telemedicine',
              'Consult doctors remotely via video',
              'assets/images/telemedicine.png',
              AppColors.purple500,
              () => context.push('/telemedicine'),
            ),
            _buildServiceCard(
              context,
              'Health Advice',
              'Get expert health tips and guidance',
              'assets/images/advices.png',
              AppColors.orange500,
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
    String description,
    String? imagePath,
    Color accentColor,
    VoidCallback onTap,
  ) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: accentColor.withOpacity(0.15),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
            border: Border.all(
              color: accentColor.withOpacity(0.2),
              width: 1,
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Icon Container with colored background
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: accentColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: imagePath != null
                    ? Image.asset(
                        imagePath,
                        height: 48,
                        width: 48,
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) {
                          return Icon(
                            Icons.medical_services,
                            size: 48,
                            color: accentColor,
                          );
                        },
                      )
                    : Icon(
                        Icons.health_and_safety,
                        size: 48,
                        color: accentColor,
                      ),
              ),
              const SizedBox(height: 12),
              // Title
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.gray900,
                      ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(height: 4),
              // Description
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  description,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.gray600,
                        fontSize: 11,
                      ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBlankSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.gray900,
              ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppColors.skyBlue50,
                AppColors.blue50,
              ],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: AppColors.skyBlue200,
              width: 1,
            ),
          ),
          child: Column(
            children: [
              Icon(
                Icons.rocket_launch_outlined,
                size: 48,
                color: AppColors.skyBlue600,
              ),
              const SizedBox(height: 12),
              Text(
                'More Features Coming Soon',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.gray900,
                      fontWeight: FontWeight.bold,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'We\'re working on exciting new features to enhance your healthcare experience',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.gray600,
                    ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

