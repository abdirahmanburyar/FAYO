# Image Setup Instructions for New Features

## Image Files Required

You need to add two image files to the Android app:

1. **talooyin.jpg** - For "Talooyin Caafimaad" (Health Advice)
2. **muuqaal.png** - For "Latalinta Muuqaalka ah" (Video Consultation)

## Where to Place the Images

Place both image files in the following directory:

```
mobile/kmp/androidApp/src/main/res/drawable/
```

### Full Path:
- `mobile/kmp/androidApp/src/main/res/drawable/talooyin.jpg`
- `mobile/kmp/androidApp/src/main/res/drawable/muuqaal.png`

## Steps to Add Images

1. **Copy the image files** to the drawable folder:
   ```bash
   # From project root
   cp talooyin.jpg mobile/kmp/androidApp/src/main/res/drawable/
   cp muuqaal.png mobile/kmp/androidApp/src/main/res/drawable/
   ```

2. **Rebuild the Android app** - The images will be automatically included in the build

3. **Verify** - The images should appear in Android Studio's drawable folder

## Image Requirements

- **Format**: JPG or PNG
- **Recommended size**: 400x300px or larger (will be scaled to fit)
- **Aspect ratio**: 4:3 or 16:9 works well
- **File naming**: 
  - Must be lowercase
  - No spaces or special characters (except underscore)
  - File extension must match (.jpg or .png)

## Current Drawable Folder Structure

The drawable folder currently contains:
- `appointment.jpg`
- `doctor_header.png`
- `doctor.png`
- `hospital.png`
- `logo.png`
- `splash.png`
- `ic_launcher_foreground.xml`

After adding your images, it should also have:
- `talooyin.jpg` ✨
- `muuqaal.png` ✨

## Notes

- Android automatically generates `R.drawable.talooyin` and `R.drawable.muuqaal` resource IDs
- The code is already updated to use these image resources
- If you need to change the filenames, update the references in `HomeScreen.kt`:
  - Line ~395: `R.drawable.talooyin`
  - Line ~400: `R.drawable.muuqaal`

