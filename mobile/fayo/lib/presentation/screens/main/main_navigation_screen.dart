import 'package:flutter/material.dart';
import 'package:persistent_bottom_nav_bar/persistent_bottom_nav_bar.dart';
import '../../../core/theme/app_colors.dart';
import '../home/home_screen.dart';
import '../profile/profile_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  late final PersistentTabController _controller;

  @override
  void initState() {
    super.initState();
    _controller = PersistentTabController(initialIndex: 0);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  List<Widget> _screens() => const [
        HomeScreen(),
        ProfileScreen(),
      ];

  List<PersistentBottomNavBarItem> _items() => [
        PersistentBottomNavBarItem(
          icon: const Icon(Icons.home),
          title: "",
          activeColorPrimary: AppColors.skyBlue600,
          inactiveColorPrimary: AppColors.gray400,
        ),
        PersistentBottomNavBarItem(
          icon: const Icon(Icons.person_outline),
          title: "",
          activeColorPrimary: AppColors.skyBlue600,
          inactiveColorPrimary: AppColors.gray400,
        ),
      ];

  @override
  Widget build(BuildContext context) {
    return PersistentTabView(
      context,
      controller: _controller,
      screens: _screens(),
      items: _items(),
      backgroundColor: AppColors.eggBeige,
      confineToSafeArea: true,
      handleAndroidBackButtonPress: true,
      resizeToAvoidBottomInset: true,
      stateManagement: true,
      hideNavigationBarWhenKeyboardAppears: true,
      decoration: const NavBarDecoration(
        colorBehindNavBar: AppColors.eggBeige,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      navBarStyle: NavBarStyle.style6, // supports 2 items and shows background
    );
  }
}
