import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/splash_screen.dart';
import 'screens/home_screen.dart';
import 'services/auth_service.dart';
import 'services/call_socket_service.dart';

void main() {
  runApp(const FayoApp());
}

class FayoApp extends StatelessWidget {
  const FayoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
      ],
      child: Consumer<AuthService>(
        builder: (context, authService, child) {
          // Initialize call socket when user is authenticated
          if (authService.isAuthenticated && authService.token != null) {
            CallSocketService().connect(authService.token!);
          }
          return MaterialApp(
            title: 'FAYO Healthcare',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              primarySwatch: Colors.blue,
              primaryColor: const Color(0xFF1E40AF),
              colorScheme: ColorScheme.fromSeed(
                seedColor: const Color(0xFF1E40AF),
                brightness: Brightness.light,
              ),
              useMaterial3: true,
            ),
            home: authService.isAuthenticated 
                ? const HomeScreen() 
                : const SplashScreen(),
          );
        },
      ),
    );
  }
}
