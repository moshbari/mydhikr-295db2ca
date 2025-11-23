# Mobile App Icons & Splash Screen Setup Guide

This guide explains how to configure professional app icons and splash screens for your Android and iOS builds.

## Prerequisites

After running `npx cap add android` and `npx cap add ios`, you'll have the following directories:
- `android/` - Android native project
- `ios/` - iOS native project

## 🎨 App Icon Setup

### Android Icons

Android requires icons in multiple sizes for different screen densities.

**Location:** `android/app/src/main/res/`

Create the following folders and add icons:

```
android/app/src/main/res/
├── mipmap-hdpi/
│   └── ic_launcher.png (72x72px)
│   └── ic_launcher_round.png (72x72px)
├── mipmap-mdpi/
│   └── ic_launcher.png (48x48px)
│   └── ic_launcher_round.png (48x48px)
├── mipmap-xhdpi/
│   └── ic_launcher.png (96x96px)
│   └── ic_launcher_round.png (96x96px)
├── mipmap-xxhdpi/
│   └── ic_launcher.png (144x144px)
│   └── ic_launcher_round.png (144x144px)
└── mipmap-xxxhdpi/
    └── ic_launcher.png (192x192px)
    └── ic_launcher_round.png (192x192px)
```

**Note:** 
- `ic_launcher.png` - Standard square icon with rounded corners
- `ic_launcher_round.png` - Circular icon (for devices that support circular icons)

### iOS Icons

iOS requires a single high-resolution icon that it will automatically resize.

**Location:** `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

**Required:** 
- Place a single **1024x1024px** PNG image named `icon.png` in this folder
- Make sure the icon has NO alpha channel (must be fully opaque)
- iOS will automatically generate all required sizes

**Alternative:** You can manually provide all sizes in the `Contents.json` file:
```json
{
  "images": [
    { "size": "20x20", "idiom": "iphone", "filename": "icon-20@2x.png", "scale": "2x" },
    { "size": "20x20", "idiom": "iphone", "filename": "icon-20@3x.png", "scale": "3x" },
    { "size": "29x29", "idiom": "iphone", "filename": "icon-29@2x.png", "scale": "2x" },
    { "size": "29x29", "idiom": "iphone", "filename": "icon-29@3x.png", "scale": "3x" },
    { "size": "40x40", "idiom": "iphone", "filename": "icon-40@2x.png", "scale": "2x" },
    { "size": "40x40", "idiom": "iphone", "filename": "icon-40@3x.png", "scale": "3x" },
    { "size": "60x60", "idiom": "iphone", "filename": "icon-60@2x.png", "scale": "2x" },
    { "size": "60x60", "idiom": "iphone", "filename": "icon-60@3x.png", "scale": "3x" },
    { "size": "1024x1024", "idiom": "ios-marketing", "filename": "icon-1024.png", "scale": "1x" }
  ]
}
```

## 🚀 Splash Screen Setup

### Android Splash Screen

**Location:** `android/app/src/main/res/`

Create a splash screen image and place it in drawable folders:

```
android/app/src/main/res/
├── drawable/
│   └── splash.png (recommended: 2732x2732px)
├── drawable-land-hdpi/
│   └── splash.png (800x480px)
├── drawable-land-mdpi/
│   └── splash.png (480x320px)
├── drawable-land-xhdpi/
│   └── splash.png (1280x720px)
├── drawable-land-xxhdpi/
│   └── splash.png (1600x960px)
└── drawable-land-xxxhdpi/
    └── splash.png (1920x1280px)
```

**Configure Splash Screen Colors:**

Edit `android/app/src/main/res/values/styles.xml`:

```xml
<resources>
    <style name="AppTheme.NoActionBarLaunch" parent="AppTheme.NoActionBar">
        <item name="android:background">@drawable/splash</item>
        <!-- OR use a solid color -->
        <!-- <item name="android:background">#FFFFFF</item> -->
    </style>
</resources>
```

### iOS Splash Screen

**Location:** `ios/App/App/Assets.xcassets/Splash.imageset/`

**Steps:**
1. Create folder `Splash.imageset` if it doesn't exist
2. Add splash images:
   - `splash.png` (2732x2732px) - Universal splash image
   - OR multiple sizes:
     - `splash@1x.png` (1024x1024px)
     - `splash@2x.png` (2048x2048px)
     - `splash@3x.png` (3072x3072px)

3. Create `Contents.json` in the same folder:
```json
{
  "images": [
    {
      "idiom": "universal",
      "filename": "splash.png",
      "scale": "1x"
    },
    {
      "idiom": "universal",
      "filename": "splash@2x.png",
      "scale": "2x"
    },
    {
      "idiom": "universal",
      "filename": "splash@3x.png",
      "scale": "3x"
    }
  ]
}
```

**Configure in `capacitor.config.ts`:**

```typescript
const config: CapacitorConfig = {
  appId: 'com.mydhikr.app',
  appName: 'mydhikr',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};
```

## 🛠️ Quick Icon Generator Tools

To generate all required icon sizes automatically:

1. **Capacitor Assets Plugin** (Recommended):
   ```bash
   npm install @capacitor/assets --save-dev
   ```
   
   Place a single 1024x1024px icon as `icon.png` and splash as `splash.png` in the project root, then run:
   ```bash
   npx capacitor-assets generate --iconBackgroundColor '#ffffff' --iconBackgroundColorDark '#000000' --splashBackgroundColor '#ffffff' --splashBackgroundColorDark '#000000'
   ```

2. **Online Tools:**
   - [App Icon Generator](https://appicon.co/)
   - [MakeAppIcon](https://makeappicon.com/)
   - [Icon Kitchen](https://icon.kitchen/)

## 📱 Testing Your Icons

After adding icons:

1. Run `npx cap sync` to update native projects
2. Build and run on device/emulator:
   ```bash
   npx cap run android
   # or
   npx cap run ios
   ```

3. Check the app launcher and splash screen

## ✅ Best Practices

1. **Icon Design:**
   - Use simple, recognizable designs
   - Avoid text or small details
   - Ensure good contrast
   - Test on both light and dark backgrounds

2. **Splash Screen:**
   - Keep it simple and fast-loading
   - Match your brand colors
   - Don't include too much information
   - Ensure good visibility on all screen sizes

3. **File Formats:**
   - Use PNG format with transparency where needed
   - For iOS icons, ensure NO transparency (fully opaque)
   - Optimize image sizes for faster loading

## 🎯 MyDhikr App Recommendations

For the MyDhikr app, consider:
- Icon: Islamic prayer beads (tasbih) or mosque silhouette in green/gold
- Splash: Simple logo with "My Dhikr" text on clean background
- Colors: Use Islamic-themed colors (green, gold, white)

---

**After setup, commit the icon and splash screen assets to your repository so they're included in all builds.**
