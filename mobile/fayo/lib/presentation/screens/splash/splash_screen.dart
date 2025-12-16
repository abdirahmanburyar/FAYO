import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../data/datasources/local_storage.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _rippleController;

  @override
  void initState() {
    super.initState();

    // Ripple effect controller
    _rippleController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );

    // Start ripple animation
    _rippleController.repeat();

    _checkAuthAndNavigate();
  }

  Future<void> _checkAuthAndNavigate() async {
    await Future.delayed(const Duration(seconds: 3));
    if (!mounted) return;

    final isLoggedIn = LocalStorage().isLoggedIn();
    if (isLoggedIn) {
      context.go('/home');
    } else {
      context.go('/login');
    }
  }

  @override
  void dispose() {
    _rippleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Ripple effect background
          AnimatedBuilder(
            animation: _rippleController,
            builder: (context, child) {
              return CustomPaint(
                painter: RipplePainter(
                  animation: _rippleController,
                ),
                size: Size(
                  MediaQuery.of(context).size.width,
                  MediaQuery.of(context).size.height,
                ),
              );
            },
          ),
          // Logo centered
          Center(
            child: Image.asset(
              'assets/logo/logo.png',
              width: 120,
              height: 120,
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) {
                return const Icon(
                  Icons.medical_services,
                  size: 60,
                  color: Colors.blue,
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// Custom ripple painter for the animated ripple effect
class RipplePainter extends CustomPainter {
  final Animation<double> animation;

  RipplePainter({required this.animation});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    
    // Draw three concentric ripple circles (outermost to innermost)
    final rippleRadii = [180.0, 140.0, 100.0];
    final rippleOpacities = [0.15, 0.25, 0.35];
    final rippleColors = [
      const Color(0xFFE3F2FD), // Lightest blue
      const Color(0xFFBBDEFB), // Medium light blue
      const Color(0xFF90CAF9), // Light blue
    ];
    
    // Draw ripple circles
    for (int i = 0; i < 3; i++) {
      final progress = (animation.value + i * 0.3) % 1.0;
      final currentRadius = rippleRadii[i] * (0.8 + progress * 0.2);
      final opacity = rippleOpacities[i] * (1.0 - progress * 0.3);
      
      final paint = Paint()
        ..color = rippleColors[i].withOpacity(opacity)
        ..style = PaintingStyle.fill;
      
      canvas.drawCircle(center, currentRadius, paint);
    }
  }

  @override
  bool shouldRepaint(RipplePainter oldDelegate) => true;
}

