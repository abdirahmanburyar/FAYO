# KMP Android App - Logo and Splash Screen Setup

## ✅ Current Status

Your KMP (Kotlin Multiplatform) Android app is now configured to use:
- **Logo**: `logo.png` as the app icon
- **Splash Screen**: `splash.png` as the splash screen image

## 📁 Where Your Images Should Be

Both images should be placed in:
```
mobile/kmp/androidApp/src/main/res/drawable/
```

### Required Files:
1. **`logo.png`** - Your app logo (square format recommended, 512x512px or larger)
2. **`splash.png`** - Your splash screen image (any size, will be cropped to fit)

## ✅ What's Already Configured

### App Icon (Logo)
- ✅ Adaptive icon system updated to use `logo.png`
- ✅ Works for both square and round icon variants
- ✅ Background color set to SkyBlue600 (#0284C7)

### Splash Screen
- ✅ Splash screen code updated to automatically load `splash.png`
- ✅ Falls back to default design if image not found
- ✅ Includes fade animation

## 🎨 Image Requirements

### Logo (`logo.png`)
- **Format**: PNG (recommended) or JPG/WebP
- **Size**: 512x512px or larger (square format)
- **Aspect Ratio**: 1:1 (square) works best
- **Background**: Transparent or solid color
- **Note**: The adaptive icon system will automatically handle different device shapes

### Splash Screen (`splash.png`)
- **Format**: PNG (recommended) or JPG/WebP
- **Size**: Any size (will be scaled and cropped to fit screen)
- **Aspect Ratio**: Any (will use `ContentScale.Crop` to fill screen)
- **Recommendation**: 1080x1920px (portrait) or 1920x1080px (landscape) for best results

## 🚀 After Adding Images

1. **Place your images** in `mobile/kmp/androidApp/src/main/res/drawable/`
2. **Clean and rebuild** the project:
   ```bash
   cd mobile/kmp
   ./gradlew clean
   ./gradlew androidApp:assembleDebug
   ```
3. **Uninstall** the old app from your device/emulator
4. **Install** the newly built app to see the changes

## 🔍 Verification

After rebuilding:
- **App Icon**: Check your device's app drawer - you should see your logo
- **Splash Screen**: Launch the app - you should see your splash image

## 📝 Technical Details

### App Icon Configuration
- **File**: `mobile/kmp/androidApp/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`
- **Background**: Defined in `values/themes.xml` as `ic_launcher_background` (#0284C7)
- **Foreground**: References `@drawable/logo`

### Splash Screen Configuration
- **File**: `mobile/kmp/androidApp/src/main/java/com/fayo/healthcare/ui/screens/splash/SplashScreen.kt`
- **Logic**: Checks for `splash.png` in drawable resources
- **Fallback**: Shows default design with logo and text if image not found

## 🐛 Troubleshooting

### Logo not showing?
- Make sure `logo.png` is in `drawable/` folder (not `mipmap/`)
- Check file name is exactly `logo.png` (case-sensitive)
- Clean and rebuild the project

### Splash screen not showing?
- Make sure `splash.png` is in `drawable/` folder
- Check file name is exactly `splash.png` (case-sensitive)
- The app will fall back to default design if image not found

### Images look blurry?
- Use higher resolution images (512x512px+ for logo, 1080x1920px+ for splash)
- Ensure images are not compressed too much

