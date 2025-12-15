import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../../core/constants/app_constants.dart';
import '../models/auth_models.dart';
import '../models/hospital_models.dart';
import '../models/appointment_models.dart';
import '../models/payment_models.dart';
import '../models/ads_models.dart';
import 'local_storage.dart';

class ApiClient {
  final Dio _dio;
  final LocalStorage _storage;

  ApiClient({LocalStorage? storage})
      : _storage = storage ?? LocalStorage(),
        _dio = Dio(BaseOptions(
          connectTimeout: const Duration(milliseconds: AppConstants.connectionTimeout),
          receiveTimeout: const Duration(milliseconds: AppConstants.receiveTimeout),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        )) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = _storage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) {
        if (error.response?.statusCode == 401) {
          // Handle token refresh or logout
          _storage.clearAll();
        }
        return handler.next(error);
      },
    ));
  }

  // Auth APIs
  Future<SendOtpResponse> sendOtp(String phone) async {
    try {
      final response = await _dio.post(
        ApiConstants.sendOtpEndpoint,
        data: SendOtpRequest(phone: phone).toJson(),
      );
      return SendOtpResponse.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<VerifyOtpResponse> verifyOtp(String phone, String otp) async {
    try {
      final response = await _dio.post(
        ApiConstants.verifyOtpEndpoint,
        data: VerifyOtpRequest(phone: phone, otp: otp).toJson(),
      );
      final verifyResponse = VerifyOtpResponse.fromJson(response.data);
      // Save tokens and user
      await _storage.saveToken(verifyResponse.accessToken);
      await _storage.saveRefreshToken(verifyResponse.refreshToken);
      await _storage.saveUser(verifyResponse.user);
      return verifyResponse;
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<UserProfileDto> getUserProfile() async {
    try {
      final response = await _dio.get(ApiConstants.userProfileEndpoint);
      return UserProfileDto.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<UserProfileDto> updateUserProfile(UpdateProfileRequest request) async {
    try {
      final response = await _dio.patch(
        ApiConstants.userProfileEndpoint,
        data: request.toJson(),
      );
      return UserProfileDto.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Hospital APIs
  Future<List<HospitalDto>> getHospitals({
    int page = 1,
    int limit = 5,
    String? search,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }
      final response = await _dio.get(
        ApiConstants.hospitalsEndpoint,
        queryParameters: queryParams,
      );
      final List<dynamic> data = response.data is List
          ? response.data
          : (response.data['hospitals'] ?? []);
      return data.map((json) => HospitalDto.fromJson(json)).toList();
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<HospitalDto> getHospitalById(String id) async {
    try {
      final response = await _dio.get(ApiConstants.hospitalByIdEndpoint(id));
      return HospitalDto.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<HospitalDoctorDto>> getHospitalDoctors(String hospitalId) async {
    try {
      final response = await _dio.get(
        ApiConstants.hospitalDoctorsEndpoint(hospitalId),
      );
      final List<dynamic> data = response.data;
      return data.map((json) => HospitalDoctorDto.fromJson(json)).toList();
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Doctor APIs
  Future<List<DoctorDto>> getDoctors({
    int page = 1,
    int limit = 10,
    String? search,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }
      final response = await _dio.get(
        ApiConstants.doctorsEndpoint,
        queryParameters: queryParams,
      );
      final List<dynamic> data = response.data;
      return data.map((json) => DoctorDto.fromJson(json)).toList();
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<DoctorDto> getDoctorById(String id) async {
    try {
      final response = await _dio.get(ApiConstants.doctorByIdEndpoint(id));
      return DoctorDto.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Appointment APIs
  Future<List<AppointmentDto>> getAppointments({
    String? doctorId,
    String? patientId,
    String? hospitalId,
    String? startDate,
    String? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (doctorId != null) queryParams['doctorId'] = doctorId;
      if (patientId != null) queryParams['patientId'] = patientId;
      if (hospitalId != null) queryParams['hospitalId'] = hospitalId;
      if (startDate != null) queryParams['startDate'] = startDate;
      if (endDate != null) queryParams['endDate'] = endDate;

      final response = await _dio.get(
        ApiConstants.appointmentsEndpoint,
        queryParameters: queryParams.isEmpty ? null : queryParams,
      );
      final List<dynamic> data = response.data;
      return data.map((json) => AppointmentDto.fromJson(json)).toList();
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<AppointmentDto> createAppointment(CreateAppointmentRequest request) async {
    try {
      final response = await _dio.post(
        ApiConstants.appointmentsEndpoint,
        data: request.toJson(),
      );
      return AppointmentDto.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> sendCallAccepted(String appointmentId, String channelName, String patientId) async {
    try {
      await _dio.post(
        ApiConstants.callAcceptEndpoint(appointmentId),
        data: {
          'patientId': patientId,
          'channelName': channelName,
        },
      );
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<CallCredentialsDto> getParticipantCredentials(String appointmentId, String userId) async {
    try {
      final response = await _dio.get(
        ApiConstants.participantCredentialsEndpoint(appointmentId),
        queryParameters: {'userId': userId},
      );
      final credentialData = response.data['credential'] as Map<String, dynamic>;
      return CallCredentialsDto.fromJson(credentialData);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Payment APIs
  Future<QrCodeResponse> getPaymentQrCode(String appointmentId) async {
    try {
      final response = await _dio.get(ApiConstants.qrCodeEndpoint(appointmentId));
      return QrCodeResponse.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<InitiatePaymentResponse> initiatePayment(InitiatePaymentRequest request) async {
    try {
      final response = await _dio.post(
        ApiConstants.initiatePaymentEndpoint,
        data: request.toJson(),
      );
      return InitiatePaymentResponse.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<PaymentStatusResponse> getPaymentStatus(String paymentId) async {
    try {
      final response = await _dio.get(ApiConstants.paymentStatusEndpoint(paymentId));
      return PaymentStatusResponse.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<UssdInfoResponse> getUssdInfo() async {
    try {
      final response = await _dio.get(ApiConstants.ussdInfoEndpoint);
      return UssdInfoResponse.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Ads APIs
  Future<List<AdDto>> getActiveAds({int page = 1, int limit = 50}) async {
    try {
      final response = await _dio.get(
        ApiConstants.activeAdsEndpoint,
        queryParameters: {'page': page, 'limit': limit},
      );
      // Backend returns { data: [...], pagination: {...} }
      final responseData = response.data;
      if (responseData is Map<String, dynamic>) {
        final List<dynamic> data = responseData['data'] ?? [];
        return data.map((json) => AdDto.fromJson(json)).toList();
      } else if (responseData is List) {
        // Fallback for direct list response
        return responseData.map((json) => AdDto.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> incrementAdView(String adId) async {
    try {
      await _dio.post(ApiConstants.adViewEndpoint(adId));
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> incrementAdClick(String adId) async {
    try {
      await _dio.post(ApiConstants.adClickEndpoint(adId));
    } catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(dynamic error) {
    if (error is DioException) {
      final message = error.response?.data?['message'] ?? 
                     error.message ?? 
                     'An error occurred';
      return Exception(message);
    }
    return Exception(error.toString());
  }
}

