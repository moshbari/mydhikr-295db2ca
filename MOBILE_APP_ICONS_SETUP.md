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

### Android Adaptive Icons (API 26+)

Adaptive icons provide better Material Design integration with foreground and background layers.

**Location:** `android/app/src/main/res/`

**Step 1:** Create vector drawable files for foreground and background:

Create `android/app/src/main/res/drawable/ic_launcher_foreground.xml`:
```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <!-- Foreground icon content (centered in 72dp safe zone) -->
    <group
        android:translateX="18"
        android:translateY="18"
        android:scaleX="0.67"
        android:scaleY="0.67">
        <!-- Your icon design here -->
        <!-- Example: Prayer beads icon -->
        <path
            android:fillColor="#FFFFFF"
            android:pathData="M36,10c-8.3,0-15,6.7-15,15c0,5.5,3,10.3,7.4,12.9L21,50.5L28.5,58L41.1,45.4c3.3-3.3,3.3-8.7,0-12L36,28.5c2.8-1.2,4.8-4,4.8-7.2C40.8,16.7,38.8,10,36,10z"/>
    </group>
</vector>
```

Create `android/app/src/main/res/drawable/ic_launcher_background.xml`:
```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <!-- Background solid color or gradient -->
    <path
        android:fillColor="#2E7D32"
        android:pathData="M0,0h108v108h-108z"/>
    <!-- Optional: Add gradient or pattern -->
</vector>
```

**Step 2:** Create the adaptive icon XML:

Create `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
```

Create `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
```

**Alternative:** Use PNG images instead of vector drawables:

If you prefer PNG images, create these folders and add images:
```
android/app/src/main/res/
├── drawable/
│   ├── ic_launcher_foreground.png (432x432px)
│   └── ic_launcher_background.png (432x432px)
├── drawable-mdpi/
│   ├── ic_launcher_foreground.png (108x108px)
│   └── ic_launcher_background.png (108x108px)
├── drawable-hdpi/
│   ├── ic_launcher_foreground.png (162x162px)
│   └── ic_launcher_background.png (162x162px)
├── drawable-xhdpi/
│   ├── ic_launcher_foreground.png (216x216px)
│   └── ic_launcher_background.png (216x216px)
├── drawable-xxhdpi/
│   ├── ic_launcher_foreground.png (324x324px)
│   └── ic_launcher_background.png (324x324px)
└── drawable-xxxhdpi/
    ├── ic_launcher_foreground.png (432x432px)
    └── ic_launcher_background.png (432x432px)
```

**Important Design Guidelines:**
- Total canvas: 108x108dp
- Safe zone (visible area): 66x66dp centered
- Foreground should fit within 72x72dp centered zone
- Background fills entire 108x108dp canvas
- Use transparency in foreground for icon shape
- Background can be solid color, gradient, or pattern

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
