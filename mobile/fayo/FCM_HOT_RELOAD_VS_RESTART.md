# FCM Setup: Hot Reload vs Full Restart

## ❌ Hot Reload (R) Won't Work

**Why**: Firebase initialization happens in `main()` function before the app runs. Hot reload doesn't re-execute `main()`.

## ✅ Full Restart Required

After making FCM changes, you need to **fully restart** the app:

### Option 1: Stop and Restart
```bash
# Stop the current app (Ctrl+C or Cmd+C)
# Then restart:
flutter run
```

### Option 2: Hot Restart (Shift+R or Shift+F5)
- Press **Shift + R** (or **Shift + F5**)
- This does a "hot restart" - faster than full restart
- Re-executes `main()` function
- ✅ Works for Firebase initialization

### Option 3: Full Rebuild (If Native Changes)
If you modified:
- `android/app/build.gradle.kts`
- `android/build.gradle.kts`
- `ios/Runner/Info.plist`
- Added `google-services.json` or `GoogleService-Info.plist`

Then you need a **full rebuild**:
```bash
flutter clean
flutter pub get
flutter run
```

## When to Use What

| Change Type | Action Needed |
|-------------|---------------|
| Dart code changes (UI, logic) | Hot Reload (R) |
| Firebase initialization changes | Hot Restart (Shift+R) |
| Native config changes (gradle, plist) | Full Rebuild (flutter clean && flutter run) |
| Added Firebase config files | Full Rebuild |

## For Your Current Setup

Since you've:
- ✅ Modified `main.dart` (Firebase init)
- ✅ Modified `android/build.gradle.kts`
- ✅ Modified `android/app/build.gradle.kts`
- ✅ Modified `ios/Runner/Info.plist`
- ✅ Added `google-services.json`

You need a **full rebuild**:

```bash
cd mobile/fayo
flutter clean
flutter pub get

# For iOS (if on macOS)
cd ios
pod install
cd ..

# Run
flutter run
```

## Quick Test

After restart, check logs for:
```
✅ Firebase initialized
✅ FCM background handler registered
```

If you see these, Firebase is working! 🎉

