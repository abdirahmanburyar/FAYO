# Android Logo and Splash Screen Setup

## Where to Save Your Images

You have two Android apps in this project. Follow the instructions below for each app you want to update.

---

## For Flutter App (`mobile/flutter_app/android/`)

### Logo (`logo.png`)
You need to create multiple sizes of your logo for different screen densities. Save them as:

- **`mobile/flutter_app/android/app/src/main/res/mipmap-mdpi/ic_launcher.png`** (48x48px)
- **`mobile/flutter_app/android/app/src/main/res/mipmap-hdpi/ic_launcher.png`** (72x72px)
- **`mobile/flutter_app/android/app/src/main/res/mipmap-xhdpi/ic_launcher.png`** (96x96px)
- **`mobile/flutter_app/android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png`** (144x144px)
- **`mobile/flutter_app/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`** (192x192px)

**Note:** Use your `logo.png` as the source and resize it to these dimensions. You can use:
- Android Studio's Image Asset Studio (Right-click `res` → New → Image Asset)
- Online tools like https://www.appicon.co/ or https://icon.kitchen/
- Image editing software

### Splash Screen (`splash.png`)
Save your splash screen image as:

- **`mobile/flutter_app/android/app/src/main/res/drawable/splash.png`**

✅ **Already configured!** The splash screen XML files have been updated to automatically use this image.

---

## For KMP App (`mobile/kmp/androidApp/`)

### Logo (`logo.png`)
Save your logo as:

- **`mobile/kmp/androidApp/src/main/res/drawable/logo.png`**

**Note:** The KMP app uses adaptive icons. To fully replace the icon, you may need to:
1. Use Android Studio's Image Asset Studio to generate adaptive icon resources
2. Or manually create/update the adaptive icon XML files in `mipmap-anydpi-v26/`

For now, placing `logo.png` in the drawable folder makes it available for use in the app.

### Splash Screen (`splash.png`)
Save your splash screen image as:

- **`mobile/kmp/androidApp/src/main/res/drawable/splash.png`**

✅ **Already configured!** The splash screen code has been updated to automatically use this image. If the image is not found, it will fall back to the default design.

---

## Quick Setup Checklist

### Flutter App:
- [ ] Resize `logo.png` to 5 different sizes and save as `ic_launcher.png` in each mipmap folder
- [ ] Copy `splash.png` to `mobile/flutter_app/android/app/src/main/res/drawable/splash.png`
- [ ] Rebuild the Flutter app

### KMP App:
- [ ] Copy `logo.png` to `mobile/kmp/androidApp/src/main/res/drawable/logo.png`
- [ ] Copy `splash.png` to `mobile/kmp/androidApp/src/main/res/drawable/splash.png`
- [ ] Rebuild the KMP app

---

## Image Requirements

- **Format:** PNG (recommended) or JPG/WebP
- **Logo:** Square format works best (1:1 aspect ratio)
- **Splash:** Can be any aspect ratio; will be centered and cropped to fit screen

## After Adding Images

1. **Clean and rebuild** your Android project
2. **Uninstall** the old app from your device/emulator (if installed)
3. **Install** the newly built app to see the changes

---

## Troubleshooting

- **Images not showing?** Make sure file names match exactly (case-sensitive)
- **Logo looks blurry?** Ensure you've created all density versions
- **Splash not appearing?** Check that the file is in the correct `drawable` folder

