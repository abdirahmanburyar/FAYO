package com.fayo.healthcare.data.api

import com.fayo.healthcare.data.models.*
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.plugins.websocket.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.websocket.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.channels.Channel
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers

class ApiClient(
    private val userBaseUrl: String,
    private val hospitalBaseUrl: String,
    private val appointmentBaseUrl: String,
    private val doctorBaseUrl: String,
    private val tokenStorage: TokenStorage
) {
    private val client = createHttpClient()
    private val json = Json { 
        ignoreUnknownKeys = true
        encodeDefaults = true  // Ensure default values are encoded
    }

    private fun HttpRequestBuilder.addAuthHeader() {
        tokenStorage.getToken()?.let {
            header(HttpHeaders.Authorization, "Bearer $it")
        }
    }

    // Real-time Hospital Updates
    fun observeHospitalUpdates(): Flow<HospitalUpdateEvent> = flow {
        val wsUrl = hospitalBaseUrl.replace("http", "ws").replace("https", "wss") + "/ws"
        println("🔌 [WebSocket] Connecting to: $wsUrl")
        
        while (true) {
            try {
                client.webSocket(wsUrl) {
                    println("✅ [WebSocket] Connected successfully")
                    
                    // Send join message
                    try {
                        send(Frame.Text("""{"type": "join_hospital_updates"}"""))
                        println("📤 [WebSocket] Sent join message")
                    } catch (e: Exception) {
                        println("❌ [WebSocket] Error sending join message: ${e.message}")
                    }
                    
                    // Keep-alive ping loop
                    launch {
                        while (true) {
                            delay(30000) // 30 seconds
                            try {
                                send(Frame.Text("""{"type": "ping"}"""))
                                println("📤 [WebSocket] Sent ping")
                            } catch (e: Exception) {
                                println("❌ [WebSocket] Error sending ping: ${e.message}")
                                break
                            }
                        }
                    }
                    
                    for (frame in incoming) {
                        if (frame is Frame.Text) {
                            val text = frame.readText()
                            println("📥 [WebSocket] Received: $text")
                            try {
                                val message = json.decodeFromString<WebSocketMessage>(text)
                                println("✅ [WebSocket] Parsed message type: ${message.type}")
                                when (message.type) {
                                    "hospital.created" -> {
                                        message.hospital?.let { 
                                            println("🏥 [WebSocket] Hospital created: ${it.id}")
                                            emit(HospitalUpdateEvent.Created(it)) 
                                        }
                                    }
                                    "hospital.updated" -> {
                                        message.hospital?.let { 
                                            println("🏥 [WebSocket] Hospital updated: ${it.id}")
                                            emit(HospitalUpdateEvent.Updated(it)) 
                                        }
                                    }
                                    "hospital.deleted" -> {
                                        message.hospitalId?.let { 
                                            println("🏥 [WebSocket] Hospital deleted: $it")
                                            emit(HospitalUpdateEvent.Deleted(it)) 
                                        }
                                    }
                                    else -> {
                                        println("⚠️ [WebSocket] Unknown message type: ${message.type}")
                                    }
                                }
                            } catch (e: Exception) {
                                println("❌ [WebSocket] Error parsing message: ${e.message}")
                                e.printStackTrace()
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                println("❌ [WebSocket] Connection error: ${e.message}")
                e.printStackTrace()
                delay(5000) // Wait 5 seconds before reconnecting
                println("🔄 [WebSocket] Attempting to reconnect...")
            }
        }
    }

    // Real-time Call Invitations (for patients) - Using Socket.IO
    fun observeCallInvitations(patientId: String): Flow<CallInvitationEvent> = flow {
        // Socket.IO URL - backend uses custom path /api/v1/ws/appointments
        // Socket.IO Java client needs the base URL + path
        // Remove /api/v1 from appointmentBaseUrl to get base URL, then add the Socket.IO path
        val baseUrl = appointmentBaseUrl.replace("/api/v1", "")
        val socketIOUrl = "$baseUrl/api/v1/ws/appointments"
        println("📞 [CallSocketIO] Connecting to Socket.IO: $socketIOUrl")
        println("📞 [CallSocketIO] Base URL: $baseUrl")
        println("📞 [CallSocketIO] Patient ID: $patientId")
        
        // Channel to bridge Socket.IO callbacks (not in coroutine) to Flow (needs coroutine)
        val eventChannel = Channel<CallInvitationEvent>(Channel.UNLIMITED)
        
        while (true) {
            var socketIOClient: SocketIOClient? = null
            try {
                socketIOClient = SocketIOClient(socketIOUrl)
                socketIOClient.connect() // Connect to Socket.IO server
                println("✅ [CallSocketIO] Connected successfully")
                
                // Wait for connection
                delay(1000)
                
                // Send join messages
                try {
                    // Join appointment updates room
                    socketIOClient.emit("join_appointment_updates")
                    println("📤 [CallSocketIO] Sent join_appointment_updates")
                    
                    // Join patient-specific room
                    socketIOClient.emit("join_patient_room", mapOf("patientId" to patientId))
                    println("📤 [CallSocketIO] Sent join_patient_room for patient: $patientId")
                } catch (e: Exception) {
                    println("❌ [CallSocketIO] Error sending join message: ${e.message}")
                }
                
                // Listen for events - use channel to bridge to flow
                socketIOClient.on("call.invitation") { args ->
                    try {
                        if (args.isNotEmpty()) {
                            val data = args[0]
                            // Socket.IO sends data - handle both string and object formats
                            val messageJson = when (data) {
                                is String -> data
                                else -> {
                                    // Convert object to JSON string
                                    try {
                                        val jsonString = data.toString()
                                        if (jsonString.startsWith("{") && jsonString.endsWith("}")) {
                                            jsonString
                                        } else {
                                            val map = data as? Map<*, *> ?: emptyMap<Any, Any>()
                                            buildString {
                                                append("{")
                                                map.entries.joinTo(this, ",") { (key, value) ->
                                                    val keyStr = "\"$key\""
                                                    val valueStr = when (value) {
                                                        is String -> "\"$value\""
                                                        is Number -> value.toString()
                                                        is Boolean -> value.toString()
                                                        is Map<*, *> -> value.toString() // Nested objects
                                                        null -> "null"
                                                        else -> "\"$value\""
                                                    }
                                                    "$keyStr:$valueStr"
                                                }
                                                append("}")
                                            }
                                        }
                                    } catch (e: Exception) {
                                        println("⚠️ [CallSocketIO] Error converting data to JSON: ${e.message}")
                                        data.toString()
                                    }
                                }
                            }
                            println("📥 [CallSocketIO] Received call.invitation: $messageJson")
                            
                            val message = try {
                                // First try normal deserialization
                                json.decodeFromString<CallInvitationMessage>(messageJson)
                            } catch (e: Exception) {
                                // If that fails, try to fix uid type issue
                                try {
                                    val parsed = json.parseToJsonElement(messageJson)
                                    val rootObj = parsed.jsonObject
                                    
                                    // Fix credentials.uid if it's a number
                                    val fixedRoot = rootObj["credentials"]?.jsonObject?.let { creds ->
                                        creds["uid"]?.let { uidValue ->
                                            if (uidValue is JsonPrimitive && !uidValue.isString) {
                                                // Convert number to string
                                                val uidString = try {
                                                    // Try to parse as Long first, then Int
                                                    uidValue.content.toLongOrNull()?.toString() 
                                                        ?: uidValue.content.toIntOrNull()?.toString() 
                                                        ?: "0"
                                                } catch (e: Exception) {
                                                    "0"
                                                }
                                                val fixedCreds = buildJsonObject {
                                                    creds.forEach { (key, value) ->
                                                        if (key == "uid") {
                                                            put(key, JsonPrimitive(uidString))
                                                        } else {
                                                            put(key, value)
                                                        }
                                                    }
                                                }
                                                buildJsonObject {
                                                    rootObj.forEach { (key, value) ->
                                                        if (key == "credentials") {
                                                            put(key, fixedCreds)
                                                        } else {
                                                            put(key, value)
                                                        }
                                                    }
                                                }
                                            } else {
                                                null
                                            }
                                        }
                                    }
                                    
                                    val finalJson = fixedRoot ?: rootObj
                                    json.decodeFromString<CallInvitationMessage>(finalJson.toString())
                                } catch (e2: Exception) {
                                    println("❌ [CallSocketIO] Failed to parse call.invitation even after fixing: ${e2.message}")
                                    e2.printStackTrace()
                                    throw e2
                                }
                            }
                            message.appointmentId?.let { appointmentId ->
                                message.patientId?.let { messagePatientId ->
                                    if (messagePatientId == patientId) {
                                        val participantCredentials = message.credentials?.getParticipantCredentials()
                                        val channelName = message.channelName 
                                            ?: message.callSession?.channelName 
                                            ?: participantCredentials?.channelName 
                                            ?: ""
                                        
                                        val finalCredentials = participantCredentials?.copy(
                                            channelName = channelName
                                        ) ?: message.credentials?.let { wrapper ->
                                            CallCredentialsDto(
                                                appId = wrapper.appId ?: "",
                                                token = wrapper.token ?: "",
                                                channelName = channelName,
                                                uid = wrapper.uid ?: "0",
                                                role = wrapper.role ?: "AUDIENCE",
                                                expiresAt = wrapper.expiresAt,
                                                expiresIn = wrapper.expiresIn
                                            )
                                        }
                                        
                                        val invitation = CallInvitationDto(
                                            appointmentId = appointmentId,
                                            patientId = messagePatientId,
                                            channelName = channelName,
                                            callSession = message.callSession,
                                            credentials = finalCredentials,
                                            timestamp = message.timestamp
                                        )
                                        println("📞 [CallSocketIO] Call invitation received for appointment: $appointmentId")
                                        // Send to channel instead of emit directly
                                        eventChannel.trySend(CallInvitationEvent.InvitationReceived(invitation))
                                    }
                                }
                            }
                        }
                    } catch (e: Exception) {
                        println("❌ [CallSocketIO] Error parsing call.invitation: ${e.message}")
                        e.printStackTrace()
                    }
                }
                
                socketIOClient.on("call.ended") { args ->
                    try {
                        if (args.isNotEmpty()) {
                            val data = args[0]
                            val messageJson = when (data) {
                                is String -> data
                                else -> {
                                    // Convert object to JSON string
                                    try {
                                        val jsonString = data.toString()
                                        if (jsonString.startsWith("{") && jsonString.endsWith("}")) {
                                            jsonString
                                        } else {
                                            val map = data as? Map<*, *> ?: emptyMap<Any, Any>()
                                            buildString {
                                                append("{")
                                                map.entries.joinTo(this, ",") { (key, value) ->
                                                    val keyStr = "\"$key\""
                                                    val valueStr = when (value) {
                                                        is String -> "\"$value\""
                                                        is Number -> value.toString()
                                                        is Boolean -> value.toString()
                                                        is Map<*, *> -> value.toString()
                                                        null -> "null"
                                                        else -> "\"$value\""
                                                    }
                                                    "$keyStr:$valueStr"
                                                }
                                                append("}")
                                            }
                                        }
                                    } catch (e: Exception) {
                                        data.toString()
                                    }
                                }
                            }
                            val message = json.decodeFromString<CallInvitationMessage>(messageJson)
                            message.callSession?.let { session ->
                                message.appointmentId?.let { appointmentId ->
                                    println("📞 [CallSocketIO] Call ended: ${session.id}")
                                    eventChannel.trySend(CallInvitationEvent.CallEnded(session.id, appointmentId))
                                }
                            }
                        }
                    } catch (e: Exception) {
                        println("❌ [CallSocketIO] Error parsing call.ended: ${e.message}")
                    }
                }
                
                socketIOClient.on("connected") {
                    println("✅ [CallSocketIO] Received connected confirmation")
                }
                
                socketIOClient.on("joined_appointment_updates") {
                    println("✅ [CallSocketIO] Joined appointment updates room")
                }
                
                socketIOClient.on("joined_patient_room") {
                    println("✅ [CallSocketIO] Joined patient room")
                }
                
                socketIOClient.on("pong") {
                    println("✅ [CallSocketIO] Received pong")
                }
                
                // Emit events from channel to flow
                while (socketIOClient.isConnected()) {
                    // Try to receive from channel (non-blocking)
                    eventChannel.tryReceive().getOrNull()?.let { event ->
                        emit(event)
                    }
                    delay(100) // Small delay to avoid busy waiting
                }
                
            } catch (e: Exception) {
                val errorMessage = e.message ?: "Unknown error"
                println("❌ [CallSocketIO] Connection error: $errorMessage")
                println("❌ [CallSocketIO] Error type: ${e::class.simpleName}")
                e.printStackTrace()
                socketIOClient?.disconnect()
                delay(5000) // Wait 5 seconds before reconnecting
                println("🔄 [CallSocketIO] Attempting to reconnect in 5 seconds...")
            } finally {
                socketIOClient?.disconnect()
            }
        }
    }

    // Send call.accepted event via HTTP endpoint
    suspend fun sendCallAccepted(appointmentId: String, channelName: String, patientId: String): Result<Unit> {
        return try {
            val url = "$appointmentBaseUrl/calls/$appointmentId/accept"
            println("📞 [API] POST $url - Sending call.accepted for appointment: $appointmentId")
            
            val response = client.post(url) {
                contentType(ContentType.Application.Json)
                addAuthHeader()
                setBody(
                    mapOf(
                        "patientId" to patientId,
                        "channelName" to channelName
                    )
                )
            }
            
            val statusCode = response.status.value
            println("📥 [API] Response status: $statusCode")
            
            if (statusCode in 200..299) {
                println("✅ [API] Call accepted event sent successfully")
                Result.success(Unit)
            } else {
                val errorText = response.bodyAsText()
                println("❌ [API] Error response: $errorText")
                Result.failure(Exception("HTTP $statusCode: $errorText"))
            }
        } catch (e: Exception) {
            println("❌ [API] Error sending call.accepted: ${e.message}")
            e.printStackTrace()
            Result.failure(e)
        }
    }

    // Auth APIs
    suspend fun sendOtp(phone: String): Result<SendOtpResponse> {
        return try {
            val url = "$userBaseUrl/otp/generate"
            println("📡 [API] POST $url")
            println("📡 [API] Request body: phone=$phone")
            
            val response = client.post(url) {
                contentType(ContentType.Application.Json)
                setBody(SendOtpRequest(phone))
            }
            
            val statusCode = response.status.value
            println("📥 [API] Response status: $statusCode")
            
            if (statusCode in 200..299) {
                try {
                    val result = response.body<SendOtpResponse>()
                    println("✅ [API] OTP sent successfully: ${result.message}")
                    Result.success(result)
                } catch (parseError: Exception) {
                    println("⚠️ [API] Failed to parse response, using default: ${parseError.message}")
                    // Fallback: try to read as text to see what we got
                    val responseText = response.bodyAsText()
                    println("📄 [API] Raw response: $responseText")
                    Result.success(SendOtpResponse(message = "OTP sent successfully"))
                }
            } else {
                val errorText = response.bodyAsText()
                println("❌ [API] Error response: $errorText")
                Result.failure(Exception("HTTP $statusCode: $errorText"))
            }
        } catch (e: Exception) {
            println("❌ [API] Error sending OTP: ${e.message}")
            println("❌ [API] Error type: ${e::class.simpleName}")
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun verifyOtp(phone: String, otp: String): Result<VerifyOtpResponse> {
        return try {
            val url = "$userBaseUrl/auth/login/otp"
            println("📡 [API] POST $url")
            
            val response = client.post(url) {
                contentType(ContentType.Application.Json)
                setBody(mapOf("phone" to phone, "code" to otp))
            }
            
            val statusCode = response.status.value
            println("📥 [API] Response status: $statusCode")
            
            if (statusCode in 200..299) {
                val result = response.body<VerifyOtpResponse>()
                println("✅ [API] OTP verified successfully")
                Result.success(result)
            } else {
                val errorText = response.bodyAsText()
                println("❌ [API] Error response: $errorText")
                Result.failure(Exception("HTTP $statusCode: $errorText"))
            }
        } catch (e: Exception) {
            println("❌ [API] Error verifying OTP: ${e.message}")
            e.printStackTrace()
            Result.failure(e)
        }
    }

    // Hospital APIs
    suspend fun getHospitals(page: Int = 1, limit: Int = 5, search: String? = null): Result<List<HospitalDto>> {
        return try {
            val url = "$hospitalBaseUrl/hospitals"
            println("📡 [API] GET $url (page=$page, limit=$limit, search=$search)")
            
            val response = client.get(url) {
                addAuthHeader()
                parameter("page", page)
                parameter("limit", limit)
                if (!search.isNullOrBlank()) {
                    parameter("search", search)
                }
            }
            
            val statusCode = response.status.value
            println("📥 [API] Response status: $statusCode")
            
            if (statusCode in 200..299) {
                val hospitals = response.body<List<HospitalDto>>()
                println("✅ [API] Fetched ${hospitals.size} hospitals")
                Result.success(hospitals)
            } else {
                val errorText = response.bodyAsText()
                println("❌ [API] Error response: $errorText")
                Result.failure(Exception("HTTP $statusCode: $errorText"))
            }
        } catch (e: Exception) {
            println("❌ [API] Error fetching hospitals: ${e.message}")
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun getHospitalById(id: String): Result<HospitalDto> {
        return try {
            val url = "$hospitalBaseUrl/hospitals/$id"
            println("📡 [API] GET $url")
            
            val response = client.get(url) {
                addAuthHeader()
            }
            
            val statusCode = response.status.value
            println("📥 [API] Response status: $statusCode")
            
            if (statusCode in 200..299) {
                val hospital = response.body<HospitalDto>()
                println("✅ [API] Fetched hospital: ${hospital.id}")
                Result.success(hospital)
            } else {
                val errorText = response.bodyAsText()
                println("❌ [API] Error response: $errorText")
                Result.failure(Exception("HTTP $statusCode: $errorText"))
            }
        } catch (e: Exception) {
            println("❌ [API] Error fetching hospital: ${e.message}")
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun getHospitalDoctors(hospitalId: String): Result<List<HospitalDoctorDto>> {
        return try {
            val url = "$hospitalBaseUrl/hospitals/$hospitalId/doctors"
            println("📡 [API] GET $url")
            
            val response = client.get(url) {
                addAuthHeader()
            }
            
            val statusCode = response.status.value
            println("📥 [API] Response status: $statusCode")
            
            if (statusCode in 200..299) {
                val doctors = response.body<List<HospitalDoctorDto>>()
                println("✅ [API] Fetched ${doctors.size} doctors for hospital $hospitalId")
                Result.success(doctors)
            } else {
                val errorText = response.bodyAsText()
                println("❌ [API] Error response: $errorText")
                Result.failure(Exception("HTTP $statusCode: $errorText"))
            }
        } catch (e: Exception) {
            println("❌ [API] Error fetching hospital doctors: ${e.message}")
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun getDoctors(page: Int = 1, limit: Int = 10, search: String? = null): Result<List<DoctorDto>> {
        return try {
            val url = "$doctorBaseUrl/api/v1/doctors"
            println("📡 [API] GET $url (page=$page, limit=$limit, search=$search)")
            
            val response = client.get(url) {
                addAuthHeader()
                parameter("page", page)
                parameter("limit", limit)
                search?.let { parameter("search", it) }
            }
            
            val statusCode = response.status.value
            println("📥 [API] Response status: $statusCode")
            
            if (statusCode in 200..299) {
                val doctors = response.body<List<DoctorDto>>()
                println("✅ [API] Fetched ${doctors.size} doctors")
                Result.success(doctors)
            } else {
                val errorText = response.bodyAsText()
                println("❌ [API] Error response: $errorText")
                Result.failure(Exception("HTTP $statusCode: $errorText"))
            }
        } catch (e: Exception) {
            println("❌ [API] Error fetching doctors: ${e.message}")
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun getDoctorById(doctorId: String): Result<DoctorDto> {
        return try {
            val url = "$doctorBaseUrl/api/v1/doctors/$doctorId"
            println("📡 [API] GET $url")
            
            val response = client.get(url) {
                addAuthHeader()
            }
            
            val statusCode = response.status.value
            println("📥 [API] Response status: $statusCode")
            
            if (statusCode in 200..299) {
                val doctor = response.body<DoctorDto>()
                println("✅ [API] Fetched doctor: ${doctor.id}")
                Result.success(doctor)
            } else {
                val errorText = response.bodyAsText()
                println("❌ [API] Error response: $errorText")
                Result.failure(Exception("HTTP $statusCode: $errorText"))
            }
        } catch (e: Exception) {
            println("❌ [API] Error fetching doctor: ${e.message}")
            e.printStackTrace()
            Result.failure(e)
        }
    }

    // Appointment APIs
    suspend fun getAppointments(
        doctorId: String? = null,
        patientId: String? = null,
        startDate: String? = null,
        endDate: String? = null
    ): Result<List<AppointmentDto>> {
        return try {
            val url = buildString {
                append("$appointmentBaseUrl/appointments")
                val params = mutableListOf<String>()
                doctorId?.let { params.add("doctorId=$it") }
                patientId?.let { params.add("patientId=$it") }
                startDate?.let { params.add("startDate=$it") }
                endDate?.let { params.add("endDate=$it") }
                if (params.isNotEmpty()) {
                    append("?")
                    append(params.joinToString("&"))
                }
            }
            println("📡 [API] GET $url")
            
            val response = client.get(url) {
                addAuthHeader()
            }
            
            val statusCode = response.status.value
            println("📥 [API] Response status: $statusCode")
            
            if (statusCode in 200..299) {
                val appointments = response.body<List<AppointmentDto>>()
                println("✅ [API] Fetched ${appointments.size} appointments")
                Result.success(appointments)
            } else {
                val errorText = response.bodyAsText()
                println("❌ [API] Error response: $errorText")
                Result.failure(Exception("HTTP $statusCode: $errorText"))
            }
        } catch (e: Exception) {
            println("❌ [API] Error fetching appointments: ${e.message}")
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun createAppointment(request: CreateAppointmentRequest): Result<AppointmentDto> {
        return try {
            val url = "$appointmentBaseUrl/appointments"
            println("📡 [API] POST $url")
            // Debug: Print the request to verify createdBy is included
            println("📤 [API] Request: patientId=${request.patientId}, doctorId=${request.doctorId}, createdBy=${request.createdBy}")
            
            val response = client.post(url) {
                contentType(ContentType.Application.Json)
                addAuthHeader()
                setBody(request)
            }
            
            val statusCode = response.status.value
            println("📥 [API] Response status: $statusCode")
            
            if (statusCode in 200..299) {
                val appointment = response.body<AppointmentDto>()
                println("✅ [API] Created appointment: ${appointment.id}")
                Result.success(appointment)
            } else {
                val errorText = response.bodyAsText()
                println("❌ [API] Error response: $errorText")
                
                // Try to parse error response to extract custom message
                val errorMessage = try {
                    if (errorText.isNotBlank()) {
                        val errorJson = json.decodeFromString<Map<String, Any>>(errorText)
                        // Extract message from error response
                        (errorJson["message"] as? String) ?: errorText
                    } else {
                        "Failed to create appointment"
                    }
                } catch (e: Exception) {
                    // If parsing fails, use the raw error text or a default message
                    if (statusCode == 409) {
                        "This time slot is already booked. Please choose a different time."
                    } else {
                        errorText.ifBlank { "Failed to create appointment" }
                    }
                }
                
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            println("❌ [API] Error creating appointment: ${e.message}")
            e.printStackTrace()
            Result.failure(e)
        }
    }

    // Get participant credentials for rejoining a call
    suspend fun getParticipantCredentials(appointmentId: String, userId: String): Result<CallCredentialsDto> {
        return try {
            val url = "$appointmentBaseUrl/calls/participant/$appointmentId"
            println("📡 [API] GET $url?userId=$userId")
            
            val response = client.get(url) {
                addAuthHeader()
                parameter("userId", userId)
            }
            
            val statusCode = response.status.value
            println("📥 [API] Response status: $statusCode")
            
            if (statusCode in 200..299) {
                val responseText = response.bodyAsText()
                println("📥 [API] Response body: $responseText")
                
                try {
                    val responseBody = json.decodeFromString<Map<String, Any>>(responseText)
                    @Suppress("UNCHECKED_CAST")
                    val credentialData = responseBody["credential"] as? Map<String, Any>
                    
                    if (credentialData != null) {
                        val credentials = CallCredentialsDto(
                            appId = (credentialData["appId"] as? String) ?: "",
                            token = (credentialData["token"] as? String) ?: "",
                            channelName = (credentialData["channelName"] as? String) ?: "",
                            uid = (credentialData["uid"]?.toString()) ?: "0",
                            role = (credentialData["role"] as? String) ?: "AUDIENCE"
                        )
                        println("✅ [API] Got participant credentials for appointment: $appointmentId")
                        Result.success(credentials)
                    } else {
                        Result.failure(Exception("Invalid response format: credential not found"))
                    }
                } catch (e: Exception) {
                    println("❌ [API] Error parsing response: ${e.message}")
                    Result.failure(Exception("Failed to parse response: ${e.message}"))
                }
            } else {
                val errorText = response.bodyAsText()
                println("❌ [API] Error response: $errorText")
                Result.failure(Exception("HTTP $statusCode: $errorText"))
            }
        } catch (e: Exception) {
            println("❌ [API] Error getting participant credentials: ${e.message}")
            e.printStackTrace()
            Result.failure(e)
        }
    }
}

interface TokenStorage {
    fun getToken(): String?
    fun saveToken(token: String)
    fun clearToken()
}


