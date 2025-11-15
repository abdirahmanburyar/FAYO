import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _dateOfBirthController = TextEditingController();
  
  String? _selectedGender;
  bool _isLoading = false;
  bool _isLoadingProfile = true;

  final List<String> _genderOptions = ['MALE', 'FEMALE', 'OTHER'];

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    final authService = Provider.of<AuthService>(context, listen: false);
    final result = await authService.getUserProfile();
    
    if (result['success'] && mounted) {
      final data = result['data'];
      setState(() {
        _firstNameController.text = data['firstName'] ?? '';
        _lastNameController.text = data['lastName'] ?? '';
        _emailController.text = data['email'] ?? '';
        _phoneController.text = data['phone'] ?? '';
        _addressController.text = data['address'] ?? '';
        _dateOfBirthController.text = data['dateOfBirth'] ?? '';
        
        // Ensure gender value exists in the options list
        final genderValue = data['gender'] ?? '';
        print('🔍 [EDIT_PROFILE] Received gender from API: "$genderValue"');
        print('🔍 [EDIT_PROFILE] Available options: $_genderOptions');
        _selectedGender = _genderOptions.contains(genderValue) ? genderValue : null;
        print('🔍 [EDIT_PROFILE] Selected gender: $_selectedGender');
        
        _isLoadingProfile = false;
      });
    } else {
      setState(() {
        _isLoadingProfile = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load profile: ${result['message']}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _updateProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    final authService = Provider.of<AuthService>(context, listen: false);
    
    final profileData = {
      if (_firstNameController.text.isNotEmpty) 'firstName': _firstNameController.text,
      if (_lastNameController.text.isNotEmpty) 'lastName': _lastNameController.text,
      if (_emailController.text.isNotEmpty) 'email': _emailController.text,
      if (_phoneController.text.isNotEmpty) 'phone': _phoneController.text,
      if (_addressController.text.isNotEmpty) 'address': _addressController.text,
      if (_dateOfBirthController.text.isNotEmpty) 'dateOfBirth': _convertDateFormat(_dateOfBirthController.text),
      if (_selectedGender != null && _selectedGender!.isNotEmpty) 'gender': _selectedGender,
    };

    final result = await authService.updateUserProfile(profileData);

    setState(() {
      _isLoading = false;
    });

    if (mounted) {
      if (result['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile updated successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update profile: ${result['message']}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  String _convertDateFormat(String dateString) {
    try {
      // Handle different date formats
      if (dateString.contains('/')) {
        // Convert from YYYY/MM/DD to YYYY-MM-DD
        final parts = dateString.split('/');
        if (parts.length == 3) {
          final year = parts[0].padLeft(4, '0');
          final month = parts[1].padLeft(2, '0');
          final day = parts[2].padLeft(2, '0');
          return '$year-$month-$day';
        }
      }
      return dateString; // Return as-is if already in correct format
    } catch (e) {
      print('❌ [EDIT_PROFILE] Date conversion error: $e');
      return dateString; // Return original if conversion fails
    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _dateOfBirthController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Profile'),
        backgroundColor: const Color(0xFF1E40AF),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoadingProfile
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Profile Picture Section
                    Center(
                      child: Stack(
                        children: [
                          CircleAvatar(
                            radius: 50,
                            backgroundColor: const Color(0xFF1E40AF),
                            child: Text(
                              '${_firstNameController.text.isNotEmpty ? _firstNameController.text[0].toUpperCase() : 'U'}${_lastNameController.text.isNotEmpty ? _lastNameController.text[0].toUpperCase() : 'U'}',
                              style: const TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              decoration: const BoxDecoration(
                                color: Color(0xFF1E40AF),
                                shape: BoxShape.circle,
                              ),
                              child: IconButton(
                                icon: const Icon(Icons.camera_alt, color: Colors.white, size: 20),
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Profile picture update - Coming Soon!'),
                                      backgroundColor: Color(0xFF1E40AF),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 32),
                    
                    // Form Fields
                    _buildTextField(
                      controller: _firstNameController,
                      label: 'First Name',
                      icon: Icons.person_outline,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your first name';
                        }
                        return null;
                      },
                    ),
                    
                    const SizedBox(height: 16),
                    
                    _buildTextField(
                      controller: _lastNameController,
                      label: 'Last Name',
                      icon: Icons.person_outline,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your last name';
                        }
                        return null;
                      },
                    ),
                    
                    const SizedBox(height: 16),
                    
                    _buildTextField(
                      controller: _emailController,
                      label: 'Email',
                      icon: Icons.email_outlined,
                      keyboardType: TextInputType.emailAddress,
                      validator: (value) {
                        if (value != null && value.isNotEmpty) {
                          if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                            return 'Please enter a valid email';
                          }
                        }
                        return null;
                      },
                    ),
                    
                    const SizedBox(height: 16),
                    
                    _buildTextField(
                      controller: _phoneController,
                      label: 'Phone Number',
                      icon: Icons.phone_outlined,
                      keyboardType: TextInputType.phone,
                    ),
                    
                    const SizedBox(height: 16),
                    
                    _buildTextField(
                      controller: _addressController,
                      label: 'Address',
                      icon: Icons.location_on_outlined,
                      maxLines: 2,
                    ),
                    
                    const SizedBox(height: 16),
                    
                    _buildTextField(
                      controller: _dateOfBirthController,
                      label: 'Date of Birth (YYYY-MM-DD)',
                      icon: Icons.calendar_today_outlined,
                      keyboardType: TextInputType.datetime,
                    ),
                    
                    const SizedBox(height: 16),
                    
                    // Gender Dropdown
                    DropdownButtonFormField<String>(
                      initialValue: _selectedGender,
                      decoration: InputDecoration(
                        labelText: 'Gender',
                        prefixIcon: const Icon(Icons.person_outline),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        filled: true,
                        fillColor: Colors.grey[50],
                      ),
                      items: _genderOptions.map((String gender) {
                        return DropdownMenuItem<String>(
                          value: gender,
                          child: Text(gender),
                        );
                      }).toList(),
                      onChanged: (String? newValue) {
                        setState(() {
                          _selectedGender = newValue;
                        });
                      },
                      validator: (value) {
                        // Gender is optional, so no validation required
                        return null;
                      },
                    ),
                    
                    const SizedBox(height: 32),
                    
                    // Update Button
                    ElevatedButton(
                      onPressed: _isLoading ? null : _updateProfile,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1E40AF),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Text(
                              'Update Profile',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        filled: true,
        fillColor: Colors.grey[50],
      ),
    );
  }
}
