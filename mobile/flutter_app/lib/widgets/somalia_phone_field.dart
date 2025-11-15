import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class SomaliaPhoneField extends StatefulWidget {
  final TextEditingController controller;
  final String? Function(String?)? validator;
  final void Function(String)? onChanged;
  final String? labelText;
  final String? hintText;

  const SomaliaPhoneField({
    super.key,
    required this.controller,
    this.validator,
    this.onChanged,
    this.labelText,
    this.hintText,
  });

  @override
  State<SomaliaPhoneField> createState() => _SomaliaPhoneFieldState();
}

class _SomaliaPhoneFieldState extends State<SomaliaPhoneField> {
  final FocusNode _focusNode = FocusNode();
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() {
      setState(() {
        _isFocused = _focusNode.hasFocus;
      });
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  String _formatSomaliaNumber(String value) {
    // Remove all non-digits
    String digitsOnly = value.replaceAll(RegExp(r'[^\d]'), '');
    
    // Limit to 9 digits
    if (digitsOnly.length > 9) {
      digitsOnly = digitsOnly.substring(0, 9);
    }
    
    // Format as XXX XXX XXX
    if (digitsOnly.length <= 3) {
      return digitsOnly;
    } else if (digitsOnly.length <= 6) {
      return '${digitsOnly.substring(0, 3)} ${digitsOnly.substring(3)}';
    } else {
      return '${digitsOnly.substring(0, 3)} ${digitsOnly.substring(3, 6)} ${digitsOnly.substring(6)}';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _isFocused ? const Color(0xFF2196F3) : Colors.grey.shade300,
          width: _isFocused ? 2 : 1,
        ),
      ),
      child: Row(
        children: [
          // Somalia Flag and Country Code
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
            decoration: BoxDecoration(
              color: _isFocused ? const Color(0xFF2196F3).withOpacity(0.1) : Colors.grey.shade50,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                bottomLeft: Radius.circular(12),
              ),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Somalia Flag Emoji
                Text(
                  '🇸🇴',
                  style: TextStyle(fontSize: 20),
                ),
                SizedBox(width: 8),
                // Country Code
                Text(
                  '+252',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF2196F3),
                  ),
                ),
              ],
            ),
          ),
          // Phone Number Input
          Expanded(
            child: TextFormField(
              controller: widget.controller,
              focusNode: _focusNode,
              keyboardType: TextInputType.phone,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(9),
              ],
              decoration: InputDecoration(
                labelText: widget.labelText ?? 'Phone Number',
                hintText: widget.hintText ?? '123 456 789',
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                labelStyle: TextStyle(
                  color: _isFocused ? const Color(0xFF2196F3) : Colors.grey.shade600,
                ),
                hintStyle: TextStyle(
                  color: Colors.grey.shade400,
                ),
              ),
              onChanged: (value) {
                // Format the number as user types
                String formatted = _formatSomaliaNumber(value);
                if (formatted != value) {
                  widget.controller.value = TextEditingValue(
                    text: formatted,
                    selection: TextSelection.collapsed(offset: formatted.length),
                  );
                }
                // Pass only the digits (no spaces) to the callback
                String digitsOnly = formatted.replaceAll(' ', '');
                widget.onChanged?.call(digitsOnly);
              },
              validator: widget.validator,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
