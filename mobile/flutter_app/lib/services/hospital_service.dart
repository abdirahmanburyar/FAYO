import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/hospital.dart';

class HospitalService {
  static final HospitalService _instance = HospitalService._internal();
  factory HospitalService() => _instance;
  HospitalService._internal();

  // Hospital Service URL - Using gateway endpoint
  static const String _hospitalServiceUrl = 'http://31.97.58.62:3006/api/v1';

  Future<List<Hospital>> getHospitals() async {
    try {
      final response = await http.get(
        Uri.parse('$_hospitalServiceUrl/hospitals'),
        headers: {
          'Content-Type': 'application/json',
        },
      ).timeout(ApiConfig.connectTimeout);

      if (response.statusCode == 200) {
        final List<dynamic> jsonList = json.decode(response.body);
        return jsonList.map((json) => Hospital.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load hospitals: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching hospitals: $e');
      rethrow;
    }
  }

  Future<Hospital> getHospitalById(String id) async {
    try {
      final response = await http.get(
        Uri.parse('$_hospitalServiceUrl/hospitals/$id'),
        headers: {
          'Content-Type': 'application/json',
        },
      ).timeout(ApiConfig.connectTimeout);

      if (response.statusCode == 200) {
        return Hospital.fromJson(json.decode(response.body));
      } else {
        throw Exception('Failed to load hospital: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching hospital: $e');
      rethrow;
    }
  }

  Future<List<Hospital>> searchHospitals(String query) async {
    try {
      final response = await http.get(
        Uri.parse('$_hospitalServiceUrl/hospitals/search?q=${Uri.encodeComponent(query)}'),
        headers: {
          'Content-Type': 'application/json',
        },
      ).timeout(ApiConfig.connectTimeout);

      if (response.statusCode == 200) {
        final List<dynamic> jsonList = json.decode(response.body);
        return jsonList.map((json) => Hospital.fromJson(json)).toList();
      } else {
        throw Exception('Failed to search hospitals: ${response.statusCode}');
      }
    } catch (e) {
      print('Error searching hospitals: $e');
      rethrow;
    }
  }

  Future<List<Hospital>> getHospitalsByCity(String city) async {
    try {
      final response = await http.get(
        Uri.parse('$_hospitalServiceUrl/hospitals?city=${Uri.encodeComponent(city)}'),
        headers: {
          'Content-Type': 'application/json',
        },
      ).timeout(ApiConfig.connectTimeout);

      if (response.statusCode == 200) {
        final List<dynamic> jsonList = json.decode(response.body);
        return jsonList.map((json) => Hospital.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load hospitals by city: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching hospitals by city: $e');
      rethrow;
    }
  }

  Future<List<Hospital>> getHospitalsByType(String type) async {
    try {
      final response = await http.get(
        Uri.parse('$_hospitalServiceUrl/hospitals?type=${Uri.encodeComponent(type)}'),
        headers: {
          'Content-Type': 'application/json',
        },
      ).timeout(ApiConfig.connectTimeout);

      if (response.statusCode == 200) {
        final List<dynamic> jsonList = json.decode(response.body);
        return jsonList.map((json) => Hospital.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load hospitals by type: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching hospitals by type: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getHospitalStats() async {
    try {
      final response = await http.get(
        Uri.parse('$_hospitalServiceUrl/hospitals/stats'),
        headers: {
          'Content-Type': 'application/json',
        },
      ).timeout(ApiConfig.connectTimeout);

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load hospital stats: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching hospital stats: $e');
      rethrow;
    }
  }
}
