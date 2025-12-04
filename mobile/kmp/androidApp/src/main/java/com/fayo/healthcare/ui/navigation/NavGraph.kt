package com.fayo.healthcare.ui.navigation

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.runtime.*
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import androidx.navigation.NavType
import com.fayo.healthcare.ui.screens.*
import com.fayo.healthcare.ui.screens.hospitals.HospitalsScreen
import com.fayo.healthcare.ui.screens.hospitals.HospitalDetailsScreen
import com.fayo.healthcare.ui.screens.doctors.DoctorsScreen
import com.fayo.healthcare.ui.screens.doctors.DoctorDetailScreen
import com.fayo.healthcare.ui.screens.appointments.BookAppointmentScreen
import com.fayo.healthcare.ui.screens.call.CallScreen
import com.fayo.healthcare.data.models.CallCredentialsDto
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import java.net.URLEncoder
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Login : Screen("login")
    object OtpVerification : Screen("otp_verification")
    object Home : Screen("home")
    object Hospitals : Screen("hospitals")
    object HospitalDetails : Screen("hospital_details")
    object Doctors : Screen("doctors")
    object DoctorDetails : Screen("doctor_details")
    object BookAppointment : Screen("book_appointment")
    object Appointments : Screen("appointments")
    object Profile : Screen("profile")
    object Payment : Screen("payment")
    data class Call(val credentials: CallCredentialsDto) : Screen("call")
}

@Composable
fun FayoNavigation(navController: NavHostController = androidx.navigation.compose.rememberNavController()) {
    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route
    ) {
        composable(
            route = Screen.Splash.route,
            exitTransition = {
                // Fade out when leaving splash
                fadeOut(animationSpec = tween(600))
            }
        ) {
            SplashScreen(
                onNavigateToLogin = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                },
                onNavigateToHome = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                }
            )
        }
        
        composable(
            route = Screen.Login.route,
            enterTransition = {
                // Fade in when coming from splash
                fadeIn(animationSpec = tween(600))
            },
            popEnterTransition = {
                // Slide in from left when popping back
                slideInHorizontally(
                    initialOffsetX = { -it },
                    animationSpec = tween(400)
                ) + fadeIn(animationSpec = tween(400))
            },
            popExitTransition = {
                // Slide out to right when popping back
                slideOutHorizontally(
                    targetOffsetX = { it },
                    animationSpec = tween(400)
                ) + fadeOut(animationSpec = tween(400))
            }
        ) {
            LoginScreen(
                onNavigateToOtp = { phone ->
                    navController.navigate("${Screen.OtpVerification.route}/$phone")
                }
            )
        }
        
        composable("${Screen.OtpVerification.route}/{phone}") { backStackEntry ->
            val phone = backStackEntry.arguments?.getString("phone") ?: ""
            OtpVerificationScreen(
                phone = phone,
                onNavigateToHome = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }
        
        composable(
            route = Screen.Home.route,
            enterTransition = {
                // Fade in when coming from splash
                fadeIn(animationSpec = tween(600))
            },
            popEnterTransition = {
                // Slide in from left when popping back
                slideInHorizontally(
                    initialOffsetX = { -it },
                    animationSpec = tween(400)
                ) + fadeIn(animationSpec = tween(400))
            },
            popExitTransition = {
                // Slide out to right when popping back
                slideOutHorizontally(
                    targetOffsetX = { it },
                    animationSpec = tween(400)
                ) + fadeOut(animationSpec = tween(400))
            }
        ) {
            HomeScreen(
                onNavigateToHospitals = {
                    navController.navigate(Screen.Hospitals.route)
                },
                onNavigateToDoctors = {
                    navController.navigate(Screen.Doctors.route)
                },
                onNavigateToAppointments = {
                    navController.navigate(Screen.Appointments.route)
                },
                onNavigateToProfile = {
                    navController.navigate(Screen.Profile.route)
                },
                onNavigateToCall = { credentials ->
                    // Pass credentials as JSON string in route (URL encoded)
                    val json = Json { ignoreUnknownKeys = true }
                    val credentialsJson = json.encodeToString(credentials)
                    val encodedCredentials = URLEncoder.encode(credentialsJson, StandardCharsets.UTF_8.toString())
                    navController.navigate("call/$encodedCredentials")
                }
            )
        }
        
        composable(Screen.Hospitals.route) {
            HospitalsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToDetails = { hospitalId ->
                    navController.navigate("${Screen.HospitalDetails.route}/$hospitalId")
                }
            )
        }
        
        composable("${Screen.HospitalDetails.route}/{hospitalId}") { backStackEntry ->
            val hospitalId = backStackEntry.arguments?.getString("hospitalId") ?: ""
            com.fayo.healthcare.ui.screens.hospitals.HospitalDetailsScreen(
                hospitalId = hospitalId,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToBooking = { hospital ->
                    // If direct doctor booking, we might want to just scroll to doctors tab or show message
                    // But here we will navigate to booking screen with hospitalId
                    // The booking screen will handle the logic if it supports hospital-only booking
                    navController.navigate("${Screen.BookAppointment.route}?hospitalId=${hospital.id}")
                },
                onNavigateToDoctorBooking = { doctorId, selectedHospitalId ->
                    navController.navigate("${Screen.BookAppointment.route}?doctorId=$doctorId&hospitalId=$selectedHospitalId")
                }
            )
        }
        
        composable(Screen.Doctors.route) {
            DoctorsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToDetails = { doctorId ->
                    navController.navigate("${Screen.DoctorDetails.route}/$doctorId")
                }
            )
        }
        
        composable("${Screen.DoctorDetails.route}/{doctorId}") { backStackEntry ->
            val doctorId = backStackEntry.arguments?.getString("doctorId") ?: ""
            DoctorDetailScreen(
                doctorId = doctorId,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToBooking = { doctor ->
                    // Pass doctor ID
                    navController.navigate("${Screen.BookAppointment.route}?doctorId=${doctor.id}")
                }
            )
        }
        
        composable(
            route = "${Screen.BookAppointment.route}?doctorId={doctorId}&hospitalId={hospitalId}",
            arguments = listOf(
                navArgument("doctorId") { type = NavType.StringType; nullable = true; defaultValue = null },
                navArgument("hospitalId") { type = NavType.StringType; nullable = true; defaultValue = null }
            )
        ) { backStackEntry ->
            val doctorId = backStackEntry.arguments?.getString("doctorId")
            val hospitalId = backStackEntry.arguments?.getString("hospitalId")
            
            BookAppointmentScreen(
                doctorId = doctorId,
                hospitalId = hospitalId,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onBookingSuccess = {
                    // Navigate to appointments screen and clear the booking flow from back stack
                    navController.navigate(Screen.Appointments.route) {
                        // Pop back to Home (keep Home in stack) and remove booking screens
                        popUpTo(Screen.Home.route) { inclusive = false }
                    }
                }
            )
        }
        
        composable(Screen.Appointments.route) {
            AppointmentsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToPayment = { appointment ->
                    // Pass appointment as JSON string in route
                    val json = Json { ignoreUnknownKeys = true }
                    val appointmentJson = json.encodeToString(appointment)
                    val encodedAppointment = URLEncoder.encode(appointmentJson, StandardCharsets.UTF_8.toString())
                    navController.navigate("${Screen.Payment.route}/$encodedAppointment")
                }
            )
        }
        
        composable("${Screen.Payment.route}/{appointmentJson}") { backStackEntry ->
            val encodedAppointment = backStackEntry.arguments?.getString("appointmentJson") ?: ""
            val appointmentJson = try {
                URLDecoder.decode(encodedAppointment, StandardCharsets.UTF_8.toString())
            } catch (e: Exception) {
                ""
            }
            
            val appointment = try {
                val json = Json { ignoreUnknownKeys = true }
                json.decodeFromString<com.fayo.healthcare.data.models.AppointmentDto>(appointmentJson)
            } catch (e: Exception) {
                null
            }
            
            if (appointment != null) {
                com.fayo.healthcare.ui.screens.payment.PaymentScreen(
                    appointment = appointment,
                    onNavigateBack = {
                        navController.popBackStack()
                    },
                    onPaymentSuccess = {
                        // Navigate back to appointments and refresh
                        navController.popBackStack()
                    }
                )
            } else {
                // Error state
                androidx.compose.material3.Text("Error: Failed to load appointment")
            }
        }
        
        composable(Screen.Profile.route) {
            ProfileScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                }
            )
        }
        
        // Call screen - credentials passed as JSON string in route
        composable("call/{credentialsJson}") { backStackEntry ->
            val encodedCredentials = backStackEntry.arguments?.getString("credentialsJson") ?: ""
            
            // Decode and parse credentials from JSON
            val credentialsJson = try {
                URLDecoder.decode(encodedCredentials, StandardCharsets.UTF_8.toString())
            } catch (e: Exception) {
                ""
            }
            
            val credentials = try {
                val json = Json { ignoreUnknownKeys = true }
                json.decodeFromString<CallCredentialsDto>(credentialsJson)
            } catch (e: Exception) {
                null
            }
            
            if (credentials != null) {
                CallScreen(
                    credentials = credentials,
                    onEndCall = {
                        navController.popBackStack()
                    }
                )
            } else {
                // Fallback: show error or navigate back
                androidx.compose.material3.Text("Error: Failed to load call credentials")
            }
        }
    }
}

