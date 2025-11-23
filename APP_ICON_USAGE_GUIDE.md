# App Icon Usage Guide

## Generated Icon

A professional 512x512px app icon has been generated and saved to:
`src/assets/app-icon-512.png`

This icon features:
- ✅ Islamic prayer beads (Tasbih) in a circular arrangement
- ✅ Islamic green background (#2E7D32)
- ✅ White and gold beads with decorative elements
- ✅ Optimized for both light and dark backgrounds
- ✅ Clean, professional, modern design

## How to Use This Icon

### Option 1: Android Studio Image Asset Studio (Recommended)

1. **Export the project to GitHub** and clone it locally
2. Open the project in **Android Studio**
3. Right-click on `android/app/src/main/res`
4. Select **New → Image Asset**
5. Choose **Launcher Icons (Adaptive and Legacy)**
6. For the **Foreground Layer**:
   - Select "Image" as Source Asset Type
   - Browse and select `src/assets/app-icon-512.png`
   - Adjust padding if needed (recommend: 10-20%)
7. For the **Background Layer**:
   - Select "Color" 
   - Use: `#2E7D32` (Islamic green)
8. Preview the icon in different shapes (circle, rounded square, square)
9. Click **Next** and **Finish**

This will automatically generate:
- Adaptive icon XML files (already created)
- All required PNG sizes for Android in `mipmap-*` directories
- Round and legacy icon variants

### Option 2: Online Icon Generator

Use the generated 512x512px icon with these tools:

#### For Android:
- **Android Asset Studio**: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
  1. Upload `src/assets/app-icon-512.png`
  2. Adjust padding (10-20%)
  3. Download the generated files
  4. Extract and place in `android/app/src/main/res/` directories

#### For Both Android & iOS:
- **AppIcon.co**: https://appicon.co/
- **EasyAppIcon**: https://easyappicon.com/
- **MakeAppIcon**: https://makeappicon.com/

Steps:
1. Upload the 512x512px icon
2. Generate icons for both platforms
3. Download and extract the files
4. Place Android files in `android/app/src/main/res/mipmap-*`
5. Place iOS files in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### Option 3: Manual Resizing

If you prefer manual control, resize the icon to these specific sizes:

#### Android PNG Icons:
```
android/app/src/main/res/
  ├── mipmap-mdpi/ic_launcher.png (48x48px)
  ├── mipmap-hdpi/ic_launcher.png (72x72px)
  ├── mipmap-xhdpi/ic_launcher.png (96x96px)
  ├── mipmap-xxhdpi/ic_launcher.png (144x144px)
  └── mipmap-xxxhdpi/ic_launcher.png (192x192px)
```

#### iOS Icon (Xcode will generate other sizes):
```
ios/App/App/Assets.xcassets/AppIcon.appiconset/
  └── 1024x1024.png
```

Tools for resizing:
- **ImageMagick** (command line)
- **Photoshop** (File → Export → Export As)
- **GIMP** (free alternative to Photoshop)
- **Figma** (online design tool)

## Next Steps

1. **Generate icon files** using one of the methods above
2. **Sync Capacitor**: Run `npx cap sync android` and `npx cap sync ios`
3. **Build and test**: 
   - Android: `npx cap run android`
   - iOS: `npx cap run ios` (requires Mac with Xcode)
4. **Verify** the icon appears correctly on:
   - Home screen
   - App drawer
   - Settings/System apps list
   - Notifications
   - Recent apps

## Design Notes

The generated icon:
- Uses the same Islamic green (#2E7D32) from your app's design system
- Features white/gold prayer beads for excellent contrast
- Includes decorative corner elements for visual interest
- Works well when cropped to different shapes (circle, square, rounded)
- Maintains clarity at all sizes from 48px to 192px

## iOS Additional Requirement

For iOS, you'll also need to:
1. Create a 1024x1024px version of the icon (scale up the 512px version)
2. Place it in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
3. Update the `Contents.json` file in that directory

Or use Xcode's built-in icon generator:
1. Open the project in Xcode
2. Navigate to Assets.xcassets → AppIcon
3. Drag the 1024x1024px icon into the AppIcon slot
4. Xcode will generate all required sizes automatically

## Troubleshooting

**Icon not showing after build:**
- Make sure you ran `npx cap sync` after adding icons
- Clean and rebuild the project
- Check that files are in the correct directories
- Verify file names match exactly (ic_launcher.png)

**Icon looks stretched or cropped:**
- Add more padding when using Image Asset Studio (15-20%)
- Ensure the main design elements are in the center 72x72dp safe zone
- Test on multiple device shapes in the preview

**Colors look different:**
- Make sure you're using PNG format (not JPG)
- Verify color profile is sRGB
- Check that background color in adaptive icon matches (#2E7D32)
