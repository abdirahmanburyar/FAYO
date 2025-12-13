import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class HealthAdvicesScreen extends StatelessWidget {
  const HealthAdvicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Health Advices'),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.gray700),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.health_and_safety,
              size: 120,
              color: AppColors.skyBlue600,
            ),
            const SizedBox(height: 24),
            Text(
              'Coming Soon',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.gray700,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Health advices feature will be available soon',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.gray500,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

