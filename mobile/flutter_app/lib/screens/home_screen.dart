import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/call_socket_service.dart';
import '../services/call_service.dart';
import 'call_screen.dart';
import 'call_sessions_screen.dart';
import 'login_screen.dart';
import 'edit_profile_screen.dart';
import 'hospitals_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  int _currentIndex = 0;
  bool _isDrawerOpen = false;
  
  late AnimationController _drawerAnimationController;
  late AnimationController _rotationController;
  late Animation<double> _drawerSlideAnimation;
  late Animation<double> _rotationAnimation;
  late Animation<double> _scaleAnimation;

  final List<Widget> _pages = [
    const DashboardPage(),
    const HospitalsScreen(),
    const AppointmentsPage(),
    const DoctorsPage(),
    const ProfilePage(),
  ];

  @override
  void initState() {
    super.initState();
    
    // Initialize call listener after first frame
    _initializeCallListener();

    // Drawer slide animation
    _drawerAnimationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    // Rotation animation for 3D effect
    _rotationController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );
    
    _drawerSlideAnimation = Tween<double>(
      begin: -1.0,
      end: 0.0,
    ).animate(CurvedAnimation(
      parent: _drawerAnimationController,
      curve: Curves.easeInOut,
    ));
    
    _rotationAnimation = Tween<double>(
      begin: 0.0,
      end: 0.1,
    ).animate(CurvedAnimation(
      parent: _rotationController,
      curve: Curves.easeInOut,
    ));
    
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.8,
    ).animate(CurvedAnimation(
      parent: _drawerAnimationController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _drawerAnimationController.dispose();
    _rotationController.dispose();
    super.dispose();
  }

  void _openDrawer() {
    setState(() {
      _isDrawerOpen = true;
    });
    _drawerAnimationController.forward();
    _rotationController.forward();
  }

  void _closeDrawer() {
    _drawerAnimationController.reverse();
    _rotationController.reverse().then((_) {
      if (mounted) {
        setState(() {
          _isDrawerOpen = false;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    print('🏠 [HOME SCREEN] Building HomeScreen...');
    return WillPopScope(
      onWillPop: () async {
        if (_isDrawerOpen) {
          _closeDrawer();
          return false;
        }
        _showExitDialog(context);
        return false;
      },
      child: Stack(
        children: [
          // Main content with 3D transformation
          AnimatedBuilder(
            animation: _drawerAnimationController,
            builder: (context, child) {
              return Transform(
                alignment: Alignment.centerRight,
                transform: Matrix4.identity()
                  ..setEntry(3, 2, 0.001) // Perspective
                  ..rotateY(_rotationAnimation.value)
                  ..scale(_scaleAnimation.value),
                child: Container(
                  decoration: BoxDecoration(
                    boxShadow: _isDrawerOpen
                        ? [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.3),
                              blurRadius: 20,
                              offset: const Offset(-5, 0),
                            ),
                          ]
                        : null,
                  ),
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          title: const Text(
            'FAYO Healthcare',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          backgroundColor: const Color(0xFF1E40AF),
          elevation: 0,
                      leading: IconButton(
                        icon: AnimatedIcon(
                          icon: AnimatedIcons.menu_close,
                          progress: _drawerAnimationController,
                          color: Colors.white,
                        ),
                        onPressed: _isDrawerOpen ? _closeDrawer : _openDrawer,
                      ),
          actions: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined, color: Colors.white),
              onPressed: () => _showComingSoon(context, 'Notifications'),
            ),
          ],
        ),
        body: _pages[_currentIndex],
        bottomNavigationBar: _buildBottomNavigationBar(),
                  ),
                ),
              );
            },
          ),
          
          // 3D Animated Drawer
          AnimatedBuilder(
            animation: _drawerAnimationController,
            builder: (context, child) {
              return Stack(
                children: [
                  // Click outside to close
                  if (_isDrawerOpen)
                    Positioned.fill(
                      child: GestureDetector(
                        onTap: _closeDrawer,
                        child: Container(
                          color: Colors.transparent,
                        ),
                      ),
                    ),
                  
                  // Drawer content
                  Transform(
                    alignment: Alignment.centerLeft,
                    transform: Matrix4.identity()
                      ..setEntry(3, 2, 0.001) // Perspective
                      ..translate(_drawerSlideAnimation.value * MediaQuery.of(context).size.width * 0.8)
                      ..rotateY(-_rotationAnimation.value * 0.3),
                    child: Container(
                      width: MediaQuery.of(context).size.width * 0.8,
                      height: MediaQuery.of(context).size.height,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF1E40AF), Color(0xFF3B82F6)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.3),
                            blurRadius: 20,
                            offset: const Offset(5, 0),
                          ),
                        ],
                      ),
                      child: _build3DDrawer(context),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _build3DDrawer(BuildContext context) {
    final authService = Provider.of<AuthService>(context, listen: false);
    final userName = _getUserName(authService);
    final phone = authService.phoneNumber ?? 'No phone number';

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E40AF), Color(0xFF3B82F6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 30,
            offset: const Offset(10, 0),
          ),
        ],
      ),
      child: Column(
        children: [
          // Modern Drawer Header
          Container(
            width: double.infinity,
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 12,
              left: 20,
              right: 20,
              bottom: 16,
            ),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF1E40AF), Color(0xFF3B82F6)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
                child: Column(
                  children: [
                // Close button
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    GestureDetector(
                      onTap: _closeDrawer,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(
                          Icons.close,
                        color: Colors.white,
                          size: 18,
                        ),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 12),
                
                // User Avatar
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: Center(
                    child: Text(
                      userName.isNotEmpty ? userName[0].toUpperCase() : 'U',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E40AF),
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(height: 12),
                
                // User Name
                    Text(
                      userName,
                      style: const TextStyle(
                        color: Colors.white,
                    fontSize: 18,
                        fontWeight: FontWeight.bold,
                    shadows: [],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                ),
                
                const SizedBox(height: 4),
                
                // Phone Number
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.phone_outlined,
                      color: Colors.white70,
                      size: 14,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      phone,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                        shadows: [],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ],
              ),
            ),
          
          // Menu Items
          Expanded(
            child: Container(
              color: const Color(0xFFF8FAFC),
              child: Column(
                children: [
                  // Main menu items
          Expanded(
            child: ListView(
                      padding: const EdgeInsets.symmetric(vertical: 16),
              children: [
                        _build3DDrawerItem(
                  icon: Icons.dashboard_outlined,
                  title: 'Dashboard',
                          isSelected: _currentIndex == 0,
                  onTap: () {
                            _closeDrawer();
                    setState(() => _currentIndex = 0);
                  },
                ),
                        _build3DDrawerItem(
                  icon: Icons.local_hospital_outlined,
                  title: 'Hospitals',
                          isSelected: _currentIndex == 1,
                  onTap: () {
                            _closeDrawer();
                    setState(() => _currentIndex = 1);
                  },
                ),
                        _build3DDrawerItem(
                  icon: Icons.calendar_today_outlined,
                  title: 'Appointments',
                          isSelected: _currentIndex == 2,
                  onTap: () {
                            _closeDrawer();
                    setState(() => _currentIndex = 2);
                  },
                ),
                        _build3DDrawerItem(
                  icon: Icons.people_outline,
                  title: 'Doctors',
                          isSelected: _currentIndex == 3,
                  onTap: () {
                            _closeDrawer();
                    setState(() => _currentIndex = 3);
                  },
                ),
                        _build3DDrawerItem(
                  icon: Icons.person_outline,
                  title: 'Profile',
                          isSelected: _currentIndex == 4,
                  onTap: () {
                            _closeDrawer();
                    setState(() => _currentIndex = 4);
                  },
                ),
                        _build3DDrawerItem(
                  icon: Icons.video_call_outlined,
                  title: 'Call Sessions',
                  onTap: () {
                            _closeDrawer();
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const CallSessionsScreen(),
                      ),
                    );
                  },
                ),
                        
                        const SizedBox(height: 20),
                        Container(
                          height: 1,
                          margin: const EdgeInsets.symmetric(horizontal: 20),
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.transparent,
                                Color(0xFFE5E7EB),
                                Colors.transparent,
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        
                        _build3DDrawerItem(
                  icon: Icons.help_outline,
                  title: 'Help & Support',
                  onTap: () => _showComingSoon(context, 'Help & Support'),
                ),
                        _build3DDrawerItem(
                  icon: Icons.settings_outlined,
                  title: 'Settings',
                  onTap: () => _showComingSoon(context, 'Settings'),
                ),
                      ],
                    ),
                  ),
                  
                  // Bottom section with logout
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Column(
                      children: [
                        // Divider
                        Container(
                          height: 1,
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.transparent,
                                Color(0xFFE5E7EB),
                                Colors.transparent,
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        
                        // Logout at bottom
                        _build3DDrawerItem(
                  icon: Icons.logout,
                  title: 'Logout',
                          isLogout: true,
                  onTap: () {
                            _closeDrawer();
                    _showLogoutDialog(context);
                  },
                ),
                        
                        const SizedBox(height: 8),
              ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }


  Widget _build3DDrawerItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    bool isLogout = false,
    bool isSelected = false,
  }) {
    Color iconColor = isLogout ? Colors.red : const Color(0xFF6B7280);
    Color textColor = isLogout ? Colors.red : const Color(0xFF374151);
    Color backgroundColor = Colors.transparent;
    
    if (isSelected) {
      iconColor = const Color(0xFF1E40AF);
      textColor = const Color(0xFF1E40AF);
      backgroundColor = const Color(0xFF1E40AF).withOpacity(0.1);
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: backgroundColor,
              borderRadius: BorderRadius.circular(16),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: iconColor.withOpacity(0.2),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ]
                  : null,
            ),
            child: Row(
              children: [
                // 3D Icon Container
                Transform(
                  alignment: Alignment.center,
                  transform: Matrix4.identity()
                    ..setEntry(3, 2, 0.001)
                    ..rotateX(isSelected ? 0.1 : 0.0),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: iconColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: iconColor.withOpacity(0.2),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Icon(
          icon,
                      color: iconColor,
          size: 20,
        ),
                  ),
                ),
                const SizedBox(width: 16),
                // Title with 3D effect
                Expanded(
                  child: Transform(
                    alignment: Alignment.centerLeft,
                    transform: Matrix4.identity()
                      ..setEntry(3, 2, 0.001)
                      ..rotateX(isSelected ? 0.05 : 0.0),
                    child: Text(
          title,
          style: TextStyle(
                        color: textColor,
                        fontWeight: isLogout ? FontWeight.w600 : (isSelected ? FontWeight.w600 : FontWeight.w500),
                        fontSize: 16,
                        shadows: const [],
                      ),
                    ),
                  ),
                ),
                // 3D Checkmark for selected items
                if (isSelected)
                  Transform(
                    alignment: Alignment.center,
                    transform: Matrix4.identity()
                      ..setEntry(3, 2, 0.001)
                      ..rotateX(0.1),
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E40AF),
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF1E40AF).withOpacity(0.3),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.check,
                        color: Colors.white,
                        size: 16,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }


  Widget _buildBottomNavigationBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: const Color(0xFF1E40AF),
        unselectedItemColor: const Color(0xFF9CA3AF),
        selectedFontSize: 12,
        unselectedFontSize: 12,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.local_hospital_outlined),
            activeIcon: Icon(Icons.local_hospital),
            label: 'Hospitals',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_today_outlined),
            activeIcon: Icon(Icons.calendar_today),
            label: 'Appointments',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people_outline),
            activeIcon: Icon(Icons.people),
            label: 'Doctors',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  void _showExitDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Exit App'),
          content: const Text('Are you sure you want to exit the app?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                SystemNavigator.pop();
              },
              child: const Text('Exit'),
            ),
          ],
        );
      },
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Logout'),
          content: const Text('Are you sure you want to logout?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () async {
                Navigator.of(context).pop();
                await Provider.of<AuthService>(context, listen: false).logout();
                if (mounted) {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (context) => const LoginScreen()),
                    (route) => false,
                  );
                }
              },
              child: const Text('Logout'),
            ),
          ],
        );
      },
    );
  }

  void _initializeCallListener() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authService = Provider.of<AuthService>(context, listen: false);
      if (authService.token != null) {
        // Connect to call socket service
        CallSocketService().connect(authService.token!).catchError((error) {
          print('❌ [HOME] Failed to connect call socket: $error');
        });

        // Listen for call invitations
        CallSocketService().inviteStream.listen((invite) async {
          if (!mounted) return;
          
          print('📞 [HOME] Received call invitation: ${invite.sessionId}');
          
          final shouldAccept = await _showIncomingCallDialog(context);
          if (!shouldAccept) {
            print('📞 [HOME] User declined the call');
            return;
          }

          print('📞 [HOME] User accepted the call, joining...');
          
          try {
            final credential = await CallService().joinCall(
              accessToken: authService.token!,
              sessionId: invite.sessionId,
              asHost: false,
            );
            
            if (!mounted) return;
            
            print('✅ [HOME] Call credential received, navigating to call screen');
            
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => CallScreen(credential: credential),
              ),
            );
          } catch (e) {
            print('❌ [HOME] Failed to join call: $e');
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Failed to join call: $e'),
                  backgroundColor: Colors.red,
                ),
              );
            }
          }
        });
      }
    });
  }

  Future<bool> _showIncomingCallDialog(BuildContext context) async {
    return await showDialog<bool>(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.videocam, color: Color(0xFF1E40AF)),
                SizedBox(width: 8),
                Text('Incoming Video Call'),
              ],
            ),
            content: const Text(
              'You have an incoming video call from an administrator.',
              style: TextStyle(fontSize: 16),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('Decline', style: TextStyle(color: Colors.red)),
              ),
              ElevatedButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E40AF),
                  foregroundColor: Colors.white,
                ),
                child: const Text('Accept'),
              ),
            ],
          ),
        ) ??
        false;
  }

  void _showComingSoon(BuildContext context, String feature) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$feature - Coming Soon!'),
        backgroundColor: const Color(0xFF1E40AF),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  String _getUserName(AuthService authService) {
    final firstName = authService.profileFirstName;
    final lastName = authService.profileLastName;

    if (firstName != null && firstName.isNotEmpty) {
      return '${_capitalize(firstName)} ${_capitalize(lastName ?? '')}'.trim();
    }

    return 'Welcome Back!';
  }

  String _capitalize(String value) {
    if (value.isEmpty) return value;
    return value[0].toUpperCase() + value.substring(1).toLowerCase();
  }
}

// Dashboard Page
class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Welcome Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1E40AF), Color(0xFF3B82F6)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF1E40AF).withOpacity(0.3),
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome to FAYO',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Your health is our priority. Book appointments, get consultations, and manage your healthcare needs.',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Quick Actions
          const Text(
            'Quick Actions',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 16),
          
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 1.2,
            children: [
              _buildActionCard(
                context,
                'Book Appointment',
                Icons.calendar_today,
                const Color(0xFF10B981),
                () => _showComingSoon(context, 'Book Appointment'),
              ),
              _buildActionCard(
                context,
                'Find Doctors',
                Icons.search,
                const Color(0xFF8B5CF6),
                () => _showComingSoon(context, 'Find Doctors'),
              ),
              _buildActionCard(
                context,
                'My Appointments',
                Icons.event_note,
                const Color(0xFFF59E0B),
                () => _showComingSoon(context, 'My Appointments'),
              ),
              _buildActionCard(
                context,
                'Emergency',
                Icons.emergency,
                const Color(0xFFEF4444),
                () => _showComingSoon(context, 'Emergency'),
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          // Recent Activity
          const Text(
            'Recent Activity',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 16),
          
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Column(
              children: [
                ListTile(
                  leading: Icon(Icons.info_outline, color: Color(0xFF1E40AF)),
                  title: Text('No recent activity'),
                  subtitle: Text('Your appointments and consultations will appear here'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionCard(
    BuildContext context,
    String title,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(25),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1F2937),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  void _showComingSoon(BuildContext context, String feature) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$feature - Coming Soon!'),
        backgroundColor: const Color(0xFF1E40AF),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }
}

// Appointments Page
class AppointmentsPage extends StatelessWidget {
  const AppointmentsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.calendar_today_outlined,
            size: 64,
            color: Color(0xFF9CA3AF),
          ),
          SizedBox(height: 16),
          Text(
            'Appointments',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Your appointments will appear here',
            style: TextStyle(
              fontSize: 16,
              color: Color(0xFF6B7280),
            ),
          ),
        ],
      ),
    );
  }
}

// Doctors Page
class DoctorsPage extends StatelessWidget {
  const DoctorsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.people_outline,
            size: 64,
            color: Color(0xFF9CA3AF),
          ),
          SizedBox(height: 16),
          Text(
            'Doctors',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Find and connect with doctors',
            style: TextStyle(
              fontSize: 16,
              color: Color(0xFF6B7280),
            ),
          ),
        ],
      ),
    );
  }
}

// Profile Page
class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  Map<String, dynamic>? userData;
  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      final result = await authService.getUserProfile();
      
      if (mounted) {
        setState(() {
          if (result['success']) {
            userData = result['data'];
            errorMessage = null;
          } else {
            errorMessage = result['message'];
          }
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          errorMessage = 'Failed to load profile: $e';
          isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF1E40AF)),
            ),
            SizedBox(height: 16),
            Text(
              'Loading profile...',
              style: TextStyle(
                fontSize: 16,
                color: Color(0xFF6B7280),
              ),
            ),
          ],
        ),
      );
    }

    if (errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Color(0xFFEF4444),
            ),
            const SizedBox(height: 16),
            const Text(
              'Error Loading Profile',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              errorMessage!,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF6B7280),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadUserProfile,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1E40AF),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadUserProfile,
      color: const Color(0xFF1E40AF),
      backgroundColor: Colors.white,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Professional Profile Header
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1E40AF), Color(0xFF3B82F6)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF1E40AF).withOpacity(0.25),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(32),
            child: Column(
              children: [
                  // Profile Avatar with Status
                  Stack(
                    children: [
                Container(
                        width: 100,
                        height: 100,
                  decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(50),
                    border: Border.all(
                            color: Colors.white,
                            width: 4,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Text(
                            '${(userData?['firstName'] ?? 'U')[0].toUpperCase()}${(userData?['lastName'] ?? 'U')[0].toUpperCase()}',
                            style: const TextStyle(
                              fontSize: 36,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1E40AF),
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: Colors.white,
                              width: 3,
                    ),
                  ),
                  child: const Icon(
                            Icons.check,
                    color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 24),
                  
                // User Name
                Text(
                  '${userData?['firstName'] ?? 'User'} ${userData?['lastName'] ?? 'User'}',
                  style: const TextStyle(
                      fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                      letterSpacing: 0.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  
                  const SizedBox(height: 8),
                  
                  // Email
                  if (userData?['email'] != null)
                    Text(
                      userData!['email'],
                      style: const TextStyle(
                        fontSize: 16,
                        color: Colors.white70,
                        fontWeight: FontWeight.w500,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  
                const SizedBox(height: 4),
                  
                // Phone Number
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.phone_outlined,
                        color: Colors.white70,
                        size: 16,
                      ),
                      const SizedBox(width: 8),
                Text(
                  userData?['phone'] ?? 'No phone number',
                  style: const TextStyle(
                    fontSize: 16,
                    color: Colors.white70,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 16),
                  
                // Role Badge
                Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: Colors.white.withOpacity(0.3),
                        width: 1,
                      ),
                  ),
                  child: Text(
                      (userData?['role'] ?? 'USER').toUpperCase(),
                    style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      color: Colors.white,
                        letterSpacing: 1.2,
                    ),
                  ),
                ),
              ],
              ),
            ),
          ),
          
          const SizedBox(height: 32),
          
          // Personal Information Section
          _buildInfoSection(
            title: 'Personal Information',
            icon: Icons.person_outline,
            children: [
              _buildInfoCard(
                icon: Icons.person_outline,
                label: 'First Name',
                value: userData?['firstName'] ?? 'N/A',
              ),
              _buildInfoCard(
                icon: Icons.person_outline,
                label: 'Last Name',
                value: userData?['lastName'] ?? 'N/A',
              ),
              if (userData?['email'] != null)
                _buildInfoCard(
                  icon: Icons.email_outlined,
                  label: 'Email',
                  value: userData!['email'],
                ),
              _buildInfoCard(
                icon: Icons.phone_outlined,
                label: 'Phone Number',
                value: userData?['phone'] ?? 'N/A',
              ),
              if (userData?['address'] != null)
                _buildInfoCard(
                  icon: Icons.location_on_outlined,
                  label: 'Address',
                  value: userData!['address'],
                ),
              if (userData?['dateOfBirth'] != null)
                _buildInfoCard(
                  icon: Icons.cake_outlined,
                  label: 'Date of Birth',
                  value: _formatDate(userData!['dateOfBirth']),
                ),
              if (userData?['gender'] != null)
                _buildInfoCard(
                  icon: Icons.wc_outlined,
                  label: 'Gender',
                  value: userData!['gender'],
                ),
              ],
            ),
          
          const SizedBox(height: 24),
          
          // Account Information Section
          _buildInfoSection(
            title: 'Account Information',
            icon: Icons.account_circle_outlined,
              children: [
              _buildInfoCard(
                icon: Icons.calendar_today_outlined,
                label: 'Member Since',
                value: _formatDate(userData?['createdAt']),
              ),
              _buildInfoCard(
                icon: Icons.update_outlined,
                label: 'Last Updated',
                value: _formatDate(userData?['updatedAt']),
              ),
            ],
          ),
          
          const SizedBox(height: 32),
          
          // Action Buttons
          Row(
            children: [
              Expanded(
                child: Container(
                  height: 56,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF10B981), Color(0xFF059669)],
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF10B981).withOpacity(0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                child: ElevatedButton.icon(
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const EditProfileScreen(),
                      ),
                    ),
                    icon: const Icon(Icons.edit_outlined, size: 20),
                    label: const Text(
                      'Edit Profile',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                    foregroundColor: Colors.white,
                      shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Container(
                  height: 56,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: const Color(0xFFE5E7EB),
                      width: 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                child: ElevatedButton.icon(
                  onPressed: () => _showComingSoon(context, 'Settings'),
                    icon: const Icon(Icons.settings_outlined, size: 20),
                    label: const Text(
                      'Settings',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      foregroundColor: const Color(0xFF6B7280),
                      shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
      ),
    );
  }

  Widget _buildInfoSection({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
            width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E40AF).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    icon,
                    color: const Color(0xFF1E40AF),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1F2937),
                    letterSpacing: 0.5,
            ),
          ),
        ],
            ),
            const SizedBox(height: 20),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required String label,
    required String value,
    bool isId = false,
    bool isRole = false,
  }) {
    Color iconColor = const Color(0xFF6B7280);
    Color valueColor = const Color(0xFF1F2937);
    
    if (isId) {
      iconColor = const Color(0xFF8B5CF6);
      valueColor = const Color(0xFF8B5CF6);
    } else if (isRole) {
      iconColor = const Color(0xFF10B981);
      valueColor = const Color(0xFF10B981);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFFE5E7EB),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              color: iconColor,
              size: 18,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
                Text(
              label,
              style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                color: Color(0xFF6B7280),
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
              value,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: valueColor,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(dynamic date) {
    if (date == null) return 'N/A';
    try {
      final DateTime dateTime = DateTime.parse(date.toString());
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    } catch (e) {
      return 'N/A';
    }
  }

  void _showComingSoon(BuildContext context, String feature) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$feature - Coming Soon!'),
        backgroundColor: const Color(0xFF1E40AF),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }
}
