package com.fayo.healthcare.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = SkyBlue600,
    onPrimary = Color.White,
    primaryContainer = SkyBlue100,
    onPrimaryContainer = SkyBlue900,
    secondary = Blue600,
    onSecondary = Color.White,
    tertiary = SkyBlue400,
    onTertiary = SkyBlue900,
    error = ErrorRed,
    onError = Color.White,
    background = BackgroundLight,
    onBackground = Gray900,
    surface = SurfaceLight,
    onSurface = Gray900,
    surfaceVariant = Gray100,
    onSurfaceVariant = Gray700
)

private val DarkColorScheme = darkColorScheme(
    primary = SkyBlue400,
    onPrimary = SkyBlue900,
    primaryContainer = SkyBlue800,
    onPrimaryContainer = SkyBlue100,
    secondary = Blue500,
    onSecondary = Color.White,
    tertiary = SkyBlue300,
    onTertiary = SkyBlue900,
    error = ErrorRed,
    onError = Color.White,
    background = BackgroundDark,
    onBackground = Gray100,
    surface = SurfaceDark,
    onSurface = Gray100,
    surfaceVariant = Gray800,
    onSurfaceVariant = Gray300
)

@Composable
fun FayoHealthcareTheme(
    darkTheme: Boolean = false, // Force light theme by default
    dynamicColor: Boolean = false, // Disable dynamic color to use our custom colors
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}

