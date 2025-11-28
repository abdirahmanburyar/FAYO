# Image Assets for Doctors Screen

## Required Images

Place the following images in: `androidApp/src/main/res/drawable/`

1. **doctor_header.png** (or .jpg/.webp)
   - Used in the welcome header section (top right)
   - Recommended size: 280x280dp or larger
   - Shows a doctor illustration/image

2. **doctor.png** (or .jpg/.webp)
   - Used in doctor cards (right side, circular avatar)
   - Recommended size: 160x160dp or larger
   - Shows doctor profile photo/avatar

## How to Add Images

1. Copy your image files to: `androidApp/src/main/res/drawable/`
2. Name them exactly as: `doctor_header.png` and `doctor.png`
3. Rebuild the project

## Alternative Formats

You can also use:
- `.jpg` or `.jpeg` files
- `.webp` files (recommended for smaller file sizes)

Just make sure the names match:
- `doctor_header.jpg` or `doctor_header.webp`
- `doctor.jpg` or `doctor.webp`

## Note

If images are not found, the app will fall back to using icons.

