import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/constants/api_constants.dart';
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

  // Refresh only ads without showing loading skeleton
  Future<void> _refreshAdsOnly() async {
    try {
      final user = ref.read(authProvider);
      if (user != null) {
        // Load active ads without setting loading state
        final ads = await _apiClient.getActiveAds();
        setState(() {
          _ads = ads;
        });
        // Restart auto-scrolling if we have ads (after widget is built)
        if (ads.isNotEmpty) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _resetAndStartAutoScroll();
          });
        } else {
          // Stop auto-scrolling if no ads
          _adsScrollTimer?.cancel();
        }
      }
    } catch (e) {
      print('Error refreshing ads: $e');
    }
  }

  void _showLogoutConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Confirm Logout'),
          content: const Text('Are you sure you want to logout?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop(); // Close dialog
              },
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () async {
                Navigator.of(context).pop(); // Close dialog
                await ref.read(authProvider.notifier).clearUser();
                if (context.mounted) {
                  context.go('/login');
                }
              },
              style: TextButton.styleFrom(
                foregroundColor: Colors.red,
              ),
              child: const Text('Logout'),
            ),
          ],
        );
      },
    );
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

    // Setup ads updates - update only ads list without reloading entire screen
    _adsService.connect().listen((event) {
      if (!mounted) return;
      
      switch (event.type) {
        case 'ad.created':
          // New ad created - refresh ads list to get active ads only
          if (event.ad != null && event.ad!.status == AdStatus.published) {
            _refreshAdsOnly();
          }
          break;
          
        case 'ad.updated':
          // Ad updated - update in place if it exists, or refresh if status changed
          if (event.ad != null) {
            final updatedAd = event.ad!;
            setState(() {
              final index = _ads.indexWhere((a) => a.id == updatedAd.id);
              if (index != -1) {
                // Update existing ad
                if (updatedAd.status == AdStatus.published) {
                  _ads[index] = updatedAd;
                } else {
                  // Remove if status changed to inactive
                  _ads.removeAt(index);
                  if (_ads.isEmpty) {
                    _adsScrollTimer?.cancel();
                  }
                }
              } else if (updatedAd.status == AdStatus.published) {
                // New published ad - refresh to get it
                _refreshAdsOnly();
              }
            });
            // Restart auto-scroll if needed
            if (_ads.isNotEmpty) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                _resetAndStartAutoScroll();
              });
            }
          }
          break;
          
        case 'ad.deleted':
          // Ad deleted - remove from list
          if (event.adId != null) {
            setState(() {
              _ads.removeWhere((a) => a.id == event.adId);
              if (_ads.isEmpty) {
                _adsScrollTimer?.cancel();
              }
            });
            // Restart auto-scroll if still have ads
            if (_ads.isNotEmpty) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                _resetAndStartAutoScroll();
              });
            }
          }
          break;
          
        case 'ad.clicked':
          // Ad clicked - just update click/view counts in place
          if (event.ad != null) {
            setState(() {
              final index = _ads.indexWhere((a) => a.id == event.ad!.id);
              if (index != -1) {
                _ads[index] = event.ad!;
              }
            });
          }
          break;
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
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert, color: Color(0xFF6B7280)),
                onSelected: (value) {
                  switch (value) {
                    case 'settings':
                      // TODO: Navigate to settings
                      break;
                    case 'help':
                      // TODO: Navigate to help
                      break;
                    case 'about':
                      // TODO: Navigate to about
                      break;
                    case 'logout':
                      _showLogoutConfirmation(context);
                      break;
                  }
                },
                itemBuilder: (BuildContext context) => [
                  const PopupMenuItem<String>(
                    value: 'settings',
                    child: Row(
                      children: [
                        Icon(Icons.settings, size: 20),
                        SizedBox(width: 12),
                        Text('Settings'),
                      ],
                    ),
                  ),
                  const PopupMenuItem<String>(
                    value: 'help',
                    child: Row(
                      children: [
                        Icon(Icons.help_outline, size: 20),
                        SizedBox(width: 12),
                        Text('Help & Support'),
                      ],
                    ),
                  ),
                  const PopupMenuItem<String>(
                    value: 'about',
                    child: Row(
                      children: [
                        Icon(Icons.info_outline, size: 20),
                        SizedBox(width: 12),
                        Text('About'),
                      ],
                    ),
                  ),
                  const PopupMenuDivider(),
                  const PopupMenuItem<String>(
                    value: 'logout',
                    child: Row(
                      children: [
                        Icon(Icons.logout, size: 20, color: Colors.red),
                        SizedBox(width: 12),
                        Text('Logout', style: TextStyle(color: Colors.red)),
                      ],
                    ),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.person_outline),
                color: AppColors.gray700,
                onPressed: () {
                  context.push('/profile');
                },
              ),
            ],
          ),
          body: _isLoading
              ? _buildSkeletonLoading()
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
    // Build the full image URL
    String imageUrl = '';
    if (ad.imageUrl.isNotEmpty) {
      if (ad.imageUrl.startsWith('http://') || ad.imageUrl.startsWith('https://')) {
        // Already a full URL - use as is
        imageUrl = ad.imageUrl;
      } else {
        // Relative path - construct full URL
        // Images are served from /uploads/ads/ on the unified API service (port 3001)
        final baseUrl = ApiConstants.apiBaseUrl.replaceFirst('/api/v1', '');
        String path = ad.imageUrl;
        
        // Normalize the path
        if (!path.startsWith('/')) {
          path = '/$path';
        }
        
        // If path doesn't start with /uploads/, prepend /uploads/ads/
        if (!path.startsWith('/uploads/')) {
          path = '/uploads/ads$path';
        } else if (path.startsWith('/uploads/') && !path.startsWith('/uploads/ads/')) {
          // If it's /uploads/ but not /uploads/ads/, replace /uploads/ with /uploads/ads/
          path = path.replaceFirst('/uploads/', '/uploads/ads/');
        }
        
        imageUrl = '$baseUrl$path';
      }
      
      // Debug: print the constructed URL (remove in production)
      print('Ad image URL: $imageUrl (original: ${ad.imageUrl})');
    }

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: imageUrl.isNotEmpty
            ? CachedNetworkImage(
                imageUrl: imageUrl,
                width: double.infinity,
                height: 200,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  color: AppColors.gray200,
                  child: const Center(child: CircularProgressIndicator()),
                ),
                errorWidget: (context, url, error) {
                  print('Error loading ad image: $url, error: $error');
                  return Container(
                    color: AppColors.gray200,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: AppColors.gray400),
                        const SizedBox(height: 8),
                        Text(
                          'Failed to load image',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.gray500,
                              ),
                        ),
                      ],
                    ),
                  );
                },
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

  Widget _buildSkeletonLoading() {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Ads Section Skeleton
          _buildAdsSkeleton(),
          const SizedBox(height: 32),
          // Services Section Skeleton
          _buildServicesSkeleton(),
          const SizedBox(height: 32),
          // Quick Actions Section Skeleton
          _buildQuickActionsSkeleton(),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildAdsSkeleton() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title skeleton
        Container(
          width: 140,
          height: 24,
          decoration: BoxDecoration(
            color: AppColors.gray200,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(height: 4),
        // Subtitle skeleton
        Container(
          width: 200,
          height: 16,
          decoration: BoxDecoration(
            color: AppColors.gray100,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(height: 16),
        // Ads carousel skeleton
        Container(
          height: 180,
          decoration: BoxDecoration(
            color: AppColors.gray100,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ],
    );
  }

  Widget _buildServicesSkeleton() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title skeleton
        Container(
          width: 120,
          height: 24,
          decoration: BoxDecoration(
            color: AppColors.gray200,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(height: 8),
        // Subtitle skeleton
        Container(
          width: 280,
          height: 16,
          decoration: BoxDecoration(
            color: AppColors.gray100,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(height: 20),
        // Services grid skeleton
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          children: List.generate(4, (index) {
            return Container(
              decoration: BoxDecoration(
                color: AppColors.gray100,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Icon skeleton
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.gray200,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Text skeleton
                    Container(
                      width: 60,
                      height: 14,
                      decoration: BoxDecoration(
                        color: AppColors.gray200,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ),
      ],
    );
  }

  Widget _buildQuickActionsSkeleton() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title skeleton
        Container(
          width: 120,
          height: 24,
          decoration: BoxDecoration(
            color: AppColors.gray200,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(height: 16),
        // Quick actions container skeleton
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppColors.gray100,
                AppColors.gray200,
              ],
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: List.generate(3, (index) {
                  return Column(
                    children: [
                      // Icon skeleton
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.gray300,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(height: 8),
                      // Text skeleton
                      Container(
                        width: 60,
                        height: 12,
                        decoration: BoxDecoration(
                          color: AppColors.gray300,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ],
                  );
                }),
              ),
            ],
          ),
        ),
      ],
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

