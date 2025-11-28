package com.fayo.healthcare

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.fayo.healthcare.ui.navigation.FayoNavigation
import com.fayo.healthcare.ui.theme.FayoHealthcareTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Set window background to white immediately to prevent white flash
        window.setBackgroundDrawableResource(android.R.color.white)
        setContent {
            FayoHealthcareTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color.White // Use white directly to match splash screen
                ) {
                    FayoNavigation()
                }
            }
        }
    }
}

