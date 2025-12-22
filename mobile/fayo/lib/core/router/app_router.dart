import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'dart:async';
import '../../data/datasources/local_storage.dart';
import '../../presentation/screens/splash/splash_screen.dart';
import '../../presentation/screens/auth/login_screen.dart';
import '../../presentation/screens/auth/otp_verification_screen.dart';
import '../../presentation/screens/home/home_screen.dart';
import '../../presentation/screens/hospitals/hospitals_screen.dart';
import '../../presentation/screens/hospitals/hospital_details_screen.dart';
import '../../presentation/screens/doctors/doctors_screen.dart';
import '../../presentation/screens/doctors/doctor_detail_screen.dart';
import '../../presentation/screens/appointments/appointments_screen.dart';
import '../../presentation/screens/appointments/book_appointment_screen.dart';
import '../../presentation/screens/profile/profile_screen.dart';
import '../../presentation/screens/telemedicine/telemedicine_screen.dart';
import '../../presentation/screens/health_advices/health_advices_screen.dart';
import '../../presentation/screens/notifications/notifications_screen.dart';

class _AuthRefreshListenable extends ChangeNotifier {
  _AuthRefreshListenable(Stream<dynamic> stream) {
    _subscription = stream.listen((_) => notifyListeners());
  }

  late final StreamSubscription<dynamic> _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}

class AppRouter {
  static final _authStateController = StreamController<String?>.broadcast();

  static void refreshAuthState() {
    _authStateController.add(null);
  }

  static final GoRouter router = GoRouter(
    refreshListenable: _AuthRefreshListenable(_authStateController.stream),
    initialLocation: '/splash',
    routes: [
      GoRoute(
        path: '/splash',
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/otp-verification',
        name: 'otp-verification',
        builder: (context, state) {
          final phone = state.uri.queryParameters['phone'] ?? '';
          return OtpVerificationScreen(phone: phone);
        },
      ),
      GoRoute(
        path: '/home',
        name: 'home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/hospitals',
        name: 'hospitals',
        builder: (context, state) => const HospitalsScreen(),
      ),
      GoRoute(
        path: '/hospital-details',
        name: 'hospital-details',
        builder: (context, state) {
          final hospitalId = state.uri.queryParameters['id'] ?? '';
          return HospitalDetailsScreen(hospitalId: hospitalId);
        },
      ),
      GoRoute(
        path: '/hospitals/:hospitalId',
        name: 'hospital-details-by-id',
        builder: (context, state) {
          final hospitalId = state.pathParameters['hospitalId'] ?? '';
          return HospitalDetailsScreen(hospitalId: hospitalId);
        },
      ),
      GoRoute(
        path: '/doctors',
        name: 'doctors',
        builder: (context, state) => const DoctorsScreen(),
      ),
      GoRoute(
        path: '/doctor-details',
        name: 'doctor-details',
        builder: (context, state) {
          final doctorId = state.uri.queryParameters['id'] ?? '';
          return DoctorDetailScreen(doctorId: doctorId);
        },
      ),
      GoRoute(
        path: '/appointments',
        name: 'appointments',
        builder: (context, state) => const AppointmentsScreen(),
      ),
      GoRoute(
        path: '/book-appointment',
        name: 'book-appointment',
        builder: (context, state) {
          final doctorId = state.uri.queryParameters['doctorId'];
          final hospitalId = state.uri.queryParameters['hospitalId'];
          return BookAppointmentScreen(
            doctorId: doctorId,
            hospitalId: hospitalId,
          );
        },
      ),
      GoRoute(
        path: '/payment',
        name: 'payment',
        builder: (context, state) {
          // For now, return a placeholder - will be passed via navigation arguments
          return const Scaffold(
            body: Center(child: Text('Payment screen - needs appointment data')),
          );
        },
      ),
      GoRoute(
        path: '/call',
        name: 'call',
        builder: (context, state) {
          // For now, return a placeholder - will be passed via navigation arguments
          return const Scaffold(
            body: Center(child: Text('Call screen - needs credentials data')),
          );
        },
      ),
      GoRoute(
        path: '/profile',
        name: 'profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/telemedicine',
        name: 'telemedicine',
        builder: (context, state) => const TelemedicineScreen(),
      ),
      GoRoute(
        path: '/health-advices',
        name: 'health-advices',
        builder: (context, state) => const HealthAdvicesScreen(),
      ),
      GoRoute(
        path: '/notifications',
        name: 'notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
    ],
    redirect: (context, state) {
      final isLoggedIn = LocalStorage().isLoggedIn();
      final isLoginRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/otp-verification';
      final isSplashRoute = state.matchedLocation == '/splash';

      // If not logged in and not on login/splash routes, redirect to login
      if (!isLoggedIn && !isLoginRoute && !isSplashRoute) {
        return '/login';
      }

      // If logged in and on login route, redirect to home
      if (isLoggedIn && isLoginRoute) {
        return '/home';
      }

      return null;
    },
  );
}

