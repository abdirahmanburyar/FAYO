package com.fayo.healthcare.ui.screens.payment

import android.Manifest
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.fayo.healthcare.ui.theme.*
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.rememberMultiplePermissionsState
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import java.util.concurrent.Executors
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import androidx.compose.ui.platform.LocalContext
import android.os.Handler
import android.os.Looper

@OptIn(ExperimentalPermissionsApi::class, ExperimentalMaterial3Api::class)
@Composable
fun QrCodeScannerScreen(
    appointmentId: String,
    onScanComplete: (String) -> Unit,
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var hasPermission by remember { mutableStateOf(false) }
    var scannedCode by remember { mutableStateOf<String?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var cameraInitialized by remember { mutableStateOf(false) }
    
    val permissionsState = rememberMultiplePermissionsState(
        permissions = listOf(Manifest.permission.CAMERA)
    )

    // Check and request permissions
    LaunchedEffect(Unit) {
        if (permissionsState.allPermissionsGranted) {
            hasPermission = true
        } else {
            permissionsState.launchMultiplePermissionRequest()
        }
    }

    LaunchedEffect(permissionsState.allPermissionsGranted) {
        hasPermission = permissionsState.allPermissionsGranted
    }

    // Handle scanned code
    LaunchedEffect(scannedCode) {
        scannedCode?.let { code ->
            onScanComplete(code)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Scan QR Code") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = SkyBlue600
                )
            )
        },
        containerColor = Color.Black
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            if (!hasPermission) {
                // Permission not granted
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        Icons.Default.CameraAlt,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = Color.White
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        "Camera permission required",
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "Please grant camera permission to scan QR codes",
                        color = Color.White.copy(alpha = 0.7f),
                        fontSize = 14.sp
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    Button(
                        onClick = { permissionsState.launchMultiplePermissionRequest() },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = SkyBlue600
                        )
                    ) {
                        Text("Grant Permission")
                    }
                }
            } else {
                // Camera preview
                AndroidView(
                    factory = { ctx ->
                        PreviewView(ctx).apply {
                            scaleType = PreviewView.ScaleType.FILL_CENTER
                        }
                    },
                    modifier = Modifier.fillMaxSize(),
                    update = { previewView ->
                        if (!cameraInitialized) {
                            initializeCamera(
                                context = context,
                                previewView = previewView,
                                lifecycleOwner = lifecycleOwner,
                                onBarcodeDetected = { barcode ->
                                    // Update state on main thread
                                    scannedCode = barcode
                                },
                                onError = { errorMessage ->
                                    error = errorMessage
                                },
                                onInitialized = {
                                    cameraInitialized = true
                                }
                            )
                        }
                    }
                )

                // Scanning overlay
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(250.dp)
                                .background(
                                    Color.Transparent,
                                    shape = RoundedCornerShape(16.dp)
                                )
                                .border(
                                    2.dp,
                                    SkyBlue600,
                                    shape = RoundedCornerShape(16.dp)
                                )
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Text(
                            "Position QR code within the frame",
                            color = Color.White,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                // Error display
                error?.let { errorMessage ->
                    Card(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(16.dp)
                            .fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = ErrorRed
                        )
                    ) {
                        Text(
                            errorMessage,
                            modifier = Modifier.padding(16.dp),
                            color = Color.White
                        )
                    }
                }
            }
        }
    }
}

private fun initializeCamera(
    context: android.content.Context,
    previewView: PreviewView,
    lifecycleOwner: androidx.lifecycle.LifecycleOwner,
    onBarcodeDetected: (String) -> Unit,
    onError: (String) -> Unit,
    onInitialized: () -> Unit
) {
    val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
    val executor = Executors.newSingleThreadExecutor()
    val mainHandler = Handler(Looper.getMainLooper())
    val barcodeScanner = BarcodeScanning.getClient()

    cameraProviderFuture.addListener({
        try {
            val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()
            
            val preview = Preview.Builder()
                .build()
                .also {
                    // Set surface provider on main thread
                    mainHandler.post {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }
                }

            val imageAnalysis = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_YUV_420_888)
                .build()
                .also {
                    it.setAnalyzer(executor) { imageProxy ->
                        processImageProxy(
                            barcodeScanner = barcodeScanner,
                            imageProxy = imageProxy,
                            onBarcodeDetected = onBarcodeDetected
                        )
                    }
                }

            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

            // Unbind and bind on main thread
            mainHandler.post {
                try {
                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        cameraSelector,
                        preview,
                        imageAnalysis
                    )
                    onInitialized()
                } catch (e: Exception) {
                    onError("Camera binding error: ${e.message ?: "Unknown error"}")
                    e.printStackTrace()
                }
            }
        } catch (e: Exception) {
            mainHandler.post {
                onError("Camera error: ${e.message ?: "Unknown error"}")
            }
            e.printStackTrace()
        }
    }, executor)
}

private fun processImageProxy(
    barcodeScanner: com.google.mlkit.vision.barcode.BarcodeScanner,
    imageProxy: ImageProxy,
    onBarcodeDetected: (String) -> Unit
) {
    val mediaImage = imageProxy.image
    if (mediaImage != null) {
        val image = InputImage.fromMediaImage(
            mediaImage,
            imageProxy.imageInfo.rotationDegrees
        )
        
        barcodeScanner.process(image)
            .addOnSuccessListener { barcodes ->
                // ML Kit callbacks run on main thread, so this is safe
                for (barcode in barcodes) {
                    when (barcode.valueType) {
                        Barcode.TYPE_TEXT,
                        Barcode.TYPE_CONTACT_INFO,
                        Barcode.TYPE_EMAIL,
                        Barcode.TYPE_PHONE,
                        Barcode.TYPE_SMS,
                        Barcode.TYPE_WIFI,
                        Barcode.TYPE_URL -> {
                            barcode.rawValue?.let { value ->
                                // Validate format before calling callback
                                val isValidAccount = value.matches(Regex("^\\d{6}$"))
                                val isValidPhone = value.matches(Regex("^\\+252\\d{9}$"))
                                
                                if (isValidAccount || isValidPhone) {
                                    // Already on main thread from ML Kit callback
                                    onBarcodeDetected(value)
                                }
                            }
                        }
                        else -> {}
                    }
                }
            }
            .addOnFailureListener {
                // Ignore errors, continue scanning
            }
            .addOnCompleteListener {
                imageProxy.close()
            }
    } else {
        imageProxy.close()
    }
}
