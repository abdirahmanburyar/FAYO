import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:intl_phone_number_input_v2/intl_phone_number_input.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/datasources/api_client.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  String? _phoneNumber;
  PhoneNumber _phoneNumberObj = PhoneNumber(isoCode: 'SO'); // Somalia
  bool _isLoading = false;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    if (!_formKey.currentState!.validate()) return;
    
    // Validate phone number has exactly 9 digits
    final digitsOnly = _phoneNumberObj.parseNumber().replaceAll(RegExp(r'[^0-9]'), '');
    if (digitsOnly.length != 9) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Phone number must be exactly 9 digits'),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }
    
    if (_phoneNumber == null || _phoneNumber!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a valid phone number'),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final apiClient = ApiClient();
      // Format phone number with country code (e.g., +252901234567)
      final phone = _phoneNumber!;
      final response = await apiClient.sendOtp(phone);

      if (mounted) {
        if (response.success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(response.message),
              backgroundColor: AppColors.successGreen,
            ),
          );
          // Ensure phone number has + sign
          final phoneWithPlus = phone.startsWith('+') ? phone : '+$phone';
          print('📱 [Login] Navigating to OTP with phone: $phoneWithPlus');
          context.push('/otp-verification?phone=${Uri.encodeComponent(phoneWithPlus)}');
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: AppColors.errorRed,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.skyBlue600,
              AppColors.skyBlue400,
              AppColors.blue500,
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Logo/Icon
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.medical_services,
                        size: 50,
                        color: AppColors.skyBlue600,
                      ),
                    ),
                    const SizedBox(height: 32),
                    // Title
                    Text(
                      'Welcome to FAYO',
                      style: Theme.of(context).textTheme.displaySmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Enter your phone number to continue',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: Colors.white.withValues(alpha: 0.9),
                          ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 48),
                    // Phone Input Card
                    Card(
                      elevation: 8,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              'Phone Number',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                            const SizedBox(height: 16),
                            InternationalPhoneNumberInput(
                              onInputChanged: (PhoneNumber number) {
                                _phoneNumberObj = number;
                                // Ensure phone number includes + sign
                                _phoneNumber = number.phoneNumber?.startsWith('+') == true 
                                    ? number.phoneNumber 
                                    : '+${number.phoneNumber}';
                                // Debug logging
                                print('📱 [Login] Phone changed:');
                                print('   - Complete number: ${number.phoneNumber}');
                                print('   - Stored number: $_phoneNumber');
                                print('   - Number only: ${number.parseNumber()}');
                                print('   - Number length: ${number.parseNumber().length}');
                                print('   - Country code: ${number.dialCode}');
                                final digitsOnly = number.parseNumber().replaceAll(RegExp(r'[^0-9]'), '');
                                print('   - Digits only length: ${digitsOnly.length}');
                                
                                // Warn if less than 9 digits
                                if (digitsOnly.length < 9) {
                                  print('⚠️ [Login] WARNING: Phone number has only ${digitsOnly.length} digits, need 9!');
                                }
                              },
                              onInputValidated: (bool value) {
                                print('🔍 [Login] Input validated: $value');
                              },
                              selectorConfig: const SelectorConfig(
                                selectorType: PhoneInputSelectorType.DROPDOWN,
                                useEmoji: true,
                              ),
                              ignoreBlank: false,
                              autoValidateMode: AutovalidateMode.disabled,
                              initialValue: _phoneNumberObj,
                              textFieldController: _phoneController,
                              formatInput: false, // Disable formatting to have better control
                              keyboardType: const TextInputType.numberWithOptions(signed: true, decimal: true),
                              inputBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              inputDecoration: InputDecoration(
                                hintText: '907794538',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 16,
                                ),
                              ),
                              onSaved: (PhoneNumber number) {
                                _phoneNumber = number.phoneNumber;
                              },
                            ),
                            const SizedBox(height: 24),
                            ElevatedButton(
                              onPressed: _isLoading ? null : _sendOtp,
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                              ),
                              child: _isLoading
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        valueColor:
                                            AlwaysStoppedAnimation<Color>(
                                          Colors.white,
                                        ),
                                      ),
                                    )
                                  : const Text('Send OTP'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
