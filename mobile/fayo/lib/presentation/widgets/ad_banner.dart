import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../data/models/ads_models.dart';
import '../../core/theme/app_colors.dart';
import '../../data/datasources/api_client.dart';

class AdBanner extends StatefulWidget {
  final List<AdDto> ads;

  const AdBanner({super.key, required this.ads});

  @override
  State<AdBanner> createState() => _AdBannerState();
}

class _AdBannerState extends State<AdBanner> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;
  final ApiClient _apiClient = ApiClient();

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onAdTap(AdDto ad) async {
    try {
      await _apiClient.incrementAdClick(ad.id);
    } catch (e) {
      print('Error incrementing ad click: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.ads.isEmpty) return const SizedBox.shrink();

    return PageView.builder(
      controller: _pageController,
      itemCount: widget.ads.length,
      onPageChanged: (index) {
        setState(() => _currentIndex = index);
        // Track ad view
        _apiClient.incrementAdView(widget.ads[index].id);
      },
      itemBuilder: (context, index) {
        final ad = widget.ads[index];
        return GestureDetector(
          onTap: () => _onAdTap(ad),
          child: Card(
            margin: const EdgeInsets.symmetric(horizontal: 8),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: CachedNetworkImage(
                imageUrl: ad.image,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  color: AppColors.gray200,
                  child: const Center(child: CircularProgressIndicator()),
                ),
                errorWidget: (context, url, error) => Container(
                  color: AppColors.gray200,
                  child: const Icon(Icons.error),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

