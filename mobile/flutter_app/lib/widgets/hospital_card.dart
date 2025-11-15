import 'package:flutter/material.dart';
import '../models/hospital.dart';

class HospitalCard extends StatelessWidget {
  final Hospital hospital;
  final VoidCallback? onTap;

  const HospitalCard({
    super.key,
    required this.hospital,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
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
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  // Icon
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: hospital.type == 'HOSPITAL' 
                          ? Colors.blue[50] 
                          : Colors.green[50],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      hospital.type == 'HOSPITAL' 
                          ? Icons.local_hospital 
                          : Icons.medical_services,
                      color: hospital.type == 'HOSPITAL' 
                          ? Colors.blue[600] 
                          : Colors.green[600],
                      size: 24,
                    ),
                  ),
                  
                  const SizedBox(width: 12),
                  
                  // Title and Type
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          hospital.name,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          hospital.displayType,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Status Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: hospital.isActive ? Colors.green[50] : Colors.red[50],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      hospital.isActive ? 'Active' : 'Inactive',
                      style: TextStyle(
                        color: hospital.isActive ? Colors.green[700] : Colors.red[700],
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 12),
              
              // Location
              Row(
                children: [
                  Icon(
                    Icons.location_on,
                    size: 16,
                    color: Colors.grey[600],
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      hospital.shortAddress,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[700],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      hospital.city,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 8),
              
              // Contact Info (if available)
              if (hospital.hasContactInfo) ...[
                Row(
                  children: [
                    Icon(
                      Icons.contact_phone,
                      size: 16,
                      color: Colors.grey[600],
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        _getContactInfoText(),
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[700],
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
              ],
              
              // Specialties (if available)
              if (hospital.specialties != null && hospital.specialties!.isNotEmpty) ...[
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: hospital.specialties!
                      .take(3)
                      .map((specialty) => Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.blue[50],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              specialty.specialtyName,
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.blue[700],
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ))
                      .toList(),
                ),
                if (hospital.specialties!.length > 3) ...[
                  const SizedBox(height: 4),
                  Text(
                    '+${hospital.specialties!.length - 3} more',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ],
              
              const SizedBox(height: 12),
              
              // Footer
              Row(
                children: [
                  Icon(
                    Icons.access_time,
                    size: 14,
                    color: Colors.grey[500],
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Updated ${_getTimeAgo(hospital.updatedAt)}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[500],
                    ),
                  ),
                  const Spacer(),
                  Icon(
                    Icons.arrow_forward_ios,
                    size: 14,
                    color: Colors.grey[400],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getContactInfoText() {
    final List<String> contacts = [];
    if (hospital.phone != null) contacts.add('Phone');
    if (hospital.email != null) contacts.add('Email');
    if (hospital.website != null) contacts.add('Website');
    
    if (contacts.isEmpty) return 'No contact info';
    if (contacts.length == 1) return contacts.first;
    if (contacts.length == 2) return '${contacts[0]} & ${contacts[1]}';
    return '${contacts[0]}, ${contacts[1]} & ${contacts[2]}';
  }

  String _getTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}
