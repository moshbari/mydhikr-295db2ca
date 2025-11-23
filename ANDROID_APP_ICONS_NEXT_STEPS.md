# Android App Icons - Next Steps

## Current Status

✅ **Adaptive Icon XML files created:**
- `ic_launcher_background.xml` - Islamic green gradient background
- `ic_launcher_foreground.xml` - Prayer beads (Tasbih) design
- `ic_launcher.xml` and `ic_launcher_round.xml` - Adaptive icon configuration

## Required: Generate PNG Icon Files

While we have the adaptive icon XML files, Android also requires PNG fallback icons for:
- Older devices that don't support adaptive icons
- Certain contexts (notifications, shortcuts, etc.)
- Better compatibility across all Android versions

### Option 1: Use Android Studio Image Asset Studio (Recommended)

1. Open your project in Android Studio
2. Right-click on `android/app/src/main/res`
3. Select **New → Image Asset**
4. Choose **Launcher Icons (Adaptive and Legacy)**
5. For the foreground layer:
   - Select "Image" as Source Asset Type
   - Create or import a 512x512px PNG of the prayer beads design
   - Or use "Clip Art" and customize
6. For the background layer:
   - Select "Color" and use: `#2E7D32` (Islamic green)
7. Click "Next" and "Finish"

This will automatically generate all required PNG files in:
- `mipmap-hdpi/` (72x72px)
- `mipmap-mdpi/` (48x48px)
- `mipmap-xhdpi/` (96x96px)
- `mipmap-xxhdpi/` (144x144px)
- `mipmap-xxxhdpi/` (192x192px)

### Option 2: Use Online Icon Generator

1. Use a service like:
   - https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
   - https://easyappicon.com/
   - https://appicon.co/

2. Upload a 512x512px icon design
3. Download the generated files
4. Place them in the appropriate `mipmap-*` directories

### Option 3: Manual Creation

Create PNG files at these sizes and place in respective directories:

```
android/app/src/main/res/
  ├── mipmap-mdpi/
  │   └── ic_launcher.png (48x48px)
  ├── mipmap-hdpi/
  │   └── ic_launcher.png (72x72px)
  ├── mipmap-xhdpi/
  │   └── ic_launcher.png (96x96px)
  ├── mipmap-xxhdpi/
  │   └── ic_launcher.png (144x144px)
  └── mipmap-xxxhdpi/
      └── ic_launcher.png (192x192px)
```

## Design Guidelines

Your icon should feature:
- **Main Element:** Prayer beads (Tasbih) in white/gold
- **Background:** Islamic green (#2E7D32)
- **Shape:** Works well in circle, square, rounded square, and squircle
- **Safe Zone:** Keep important elements within the center 72x72dp area
- **Colors:** White (#FFFFFF) for beads, Gold (#FFD700) for accent

## After Generating Icons

1. Run `npx cap sync android` to sync the changes
2. Rebuild your app
3. Test on different devices/Android versions
4. Verify the icon appears correctly on home screen, app drawer, and settings

## iOS Icons

For iOS, you'll need to create icons in the `ios/App/App/Assets.xcassets/AppIcon.appiconset/` directory. iOS requires a simpler approach:

1. Create a 1024x1024px PNG icon
2. Use Xcode's Asset Catalog to generate all required sizes
3. Or use an online generator and place files in the AppIcon.appiconset folder

See `MOBILE_APP_ICONS_SETUP.md` for complete iOS instructions.
