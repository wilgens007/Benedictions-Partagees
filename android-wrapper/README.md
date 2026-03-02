# Bénédictions Partagées — Android Wrapper (Capacitor)

This directory contains the Capacitor-based Android wrapper for the Bénédictions Partagées web app. It loads your hosted web application inside a native Android WebView and integrates Google Play Billing for premium subscriptions.

---

## Architecture Overview

```
[Android App (Capacitor WebView)]
       |
       |-- Loads https://benedictionspartagees.replit.app
       |-- Google Play Billing Library (native Kotlin)
       |-- BillingPlugin (Capacitor plugin bridge)
       |
       |-- After purchase:
       |     POST /api/billing/google/verify
       |     { productId, purchaseToken }
       |
[Backend (Node/Express)]
       |-- Verifies token with Google Play Developer API
       |-- Updates user.isPremium = true, premiumSource = "google"
```

---

## Step 1: Create the Capacitor Project

On your local development machine (not on Replit):

```bash
mkdir benedictions-android && cd benedictions-android
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Bénédictions Partagées" com.benedictionspartagees.bp
```

## Step 2: Configure Capacitor

Edit `capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.benedictionspartagees.bp',
  appName: 'Bénédictions Partagées',
  // Point to the hosted web app — no local web build needed
  server: {
    url: 'https://benedictionspartagees.replit.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
```

## Step 3: Add the Android Platform

```bash
# Create a minimal www directory (required by Capacitor)
mkdir -p www && echo "<html><body>Loading...</body></html>" > www/index.html

npx cap add android
```

## Step 4: Add Google Play Billing Library

Edit `android/app/build.gradle` and add the billing dependency:

```gradle
dependencies {
    // ... existing dependencies
    implementation 'com.android.billingclient:billing:7.1.1'
    implementation 'com.android.billingclient:billing-ktx:7.1.1'
}
```

Also ensure the `minSdkVersion` is at least 24:

```gradle
android {
    defaultConfig {
        minSdkVersion 24
        targetSdkVersion 34
        // ...
    }
}
```

## Step 5: Add the BillingPlugin

Copy the Kotlin plugin file from this repository:

```
android-wrapper/android/app/src/main/java/com/benedictionspartagees/bp/BillingPlugin.kt
```

Into your project at:

```
android/app/src/main/java/com/benedictionspartagees/bp/BillingPlugin.kt
```

Then register the plugin in your `MainActivity.java` (or `MainActivity.kt`):

```kotlin
// android/app/src/main/java/com/benedictionspartagees/bp/MainActivity.kt
package com.benedictionspartagees.bp

import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        registerPlugin(BillingPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
```

## Step 6: Web-Side Integration (Inside the App)

When the web app detects it's running inside Capacitor on Android, it shows "Subscribe via Google Play" instead of the Stripe checkout button. The platform detection is already built into the web app (`client/src/lib/platform.ts`).

To trigger a purchase from the web layer inside Capacitor:

```typescript
// This code runs in the WebView when the user taps "Subscribe via Google Play"
const { Capacitor } = window as any;

if (Capacitor) {
  const { BillingPlugin } = Capacitor.Plugins;

  // 1. Query available products
  const { products } = await BillingPlugin.getProducts({
    productIds: ['bp_premium_monthly', 'bp_premium_yearly'],
  });
  console.log('Available products:', products);

  // 2. Start purchase flow
  const result = await BillingPlugin.purchase({
    productId: 'bp_premium_monthly', // or the user's choice
  });

  if (result.pending) {
    // Payment is pending (e.g., cash payment)
    alert('Your purchase is being processed.');
    return;
  }

  // 3. Verify with backend
  const verifyRes = await fetch('/api/billing/google/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // sends auth cookie
    body: JSON.stringify({
      productId: result.productId,
      purchaseToken: result.purchaseToken,
    }),
  });

  const data = await verifyRes.json();
  if (data.success) {
    // User is now premium! Refresh the app state.
    window.location.reload();
  } else {
    alert('Purchase verification failed. Please try again.');
  }
}
```

## Step 7: Google Play Console Setup

### 7.1 Create the App

1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. App name: **Bénédictions Partagées**
4. Default language: French
5. App type: App
6. Free / Paid: Free (premium is an in-app subscription)

### 7.2 Create Subscription Products

1. Go to **Monetize > Products > Subscriptions**
2. Create subscription:
   - Product ID: `bp_premium_monthly`
   - Name: Premium Monthly
   - Base plan: $4.99/month (or your price)
3. Create another subscription:
   - Product ID: `bp_premium_yearly`
   - Name: Premium Yearly
   - Base plan: $49.99/year

### 7.3 Internal Testing Track

1. Go to **Testing > Internal testing**
2. Create a new release
3. Upload your APK/AAB (see Build section below)
4. Add testers:
   - Create a testing email list
   - Add your own email and testers' emails
5. Copy the opt-in link and share with testers

### 7.4 License Testers

1. Go to **Settings > License testing**
2. Add the email addresses of your test accounts
3. Set license response to "RESPOND_NORMALLY"
4. These testers can make test purchases without being charged

## Step 8: Service Account Setup (for Server-Side Verification)

### 8.1 Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select or create a project
3. Go to **IAM & Admin > Service Accounts**
4. Click "Create Service Account"
   - Name: `play-billing-verifier`
   - Role: no role needed at the GCP level
5. Click on the created service account
6. Go to **Keys** tab
7. Click **Add Key > Create new key > JSON**
8. Download the JSON key file

### 8.2 Enable the Android Publisher API

1. In Google Cloud Console, go to **APIs & Services > Library**
2. Search for "Google Play Android Developer API"
3. Click **Enable**

### 8.3 Grant Access in Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Go to **Settings > API access**
3. Link your Google Cloud project
4. Find your service account and click **Manage Play Console permissions**
5. Grant these permissions:
   - **Financial data, orders, and cancellation survey responses** → View
   - **App information and download statistics** → View
6. Under **App permissions**, add your app
7. Click **Invite user** and **Save**

### 8.4 Store the Key in Replit

1. Open the JSON key file
2. Copy the entire contents
3. In Replit, set the environment variable:
   - Key: `GOOGLE_SERVICE_ACCOUNT_KEY`
   - Value: (paste the entire JSON)
4. Also set:
   - Key: `GOOGLE_PLAY_PACKAGE_NAME`
   - Value: `com.benedictionspartagees.bp`

## Step 9: Build and Test

### Build the APK/AAB

```bash
# Sync Capacitor with the Android project
npx cap sync android

# Open in Android Studio
npx cap open android

# In Android Studio:
# Build > Generate Signed Bundle / APK
# Choose Android App Bundle (AAB) for Play Store
# Or APK for direct testing
```

### Test Locally

```bash
# Run on connected device or emulator
npx cap run android
```

---

## Testing Checklist

### Web (Stripe) — No Regression

- [ ] Visit `/pricing` on web browser — Stripe "Subscribe Now" button is visible
- [ ] Complete a test Stripe subscription — user becomes premium
- [ ] Visit `/dashboard` — shows "Premium Active" with "Stripe" source badge
- [ ] "Manage Subscription" button opens Stripe portal

### API Endpoints

- [ ] `GET /api/me` — returns user profile with `isPremium`, `premiumSource`, `premiumExpiresAt`
- [ ] `POST /api/billing/google/verify` without auth — returns 401
- [ ] `POST /api/billing/google/verify` without body — returns 400
- [ ] `POST /api/billing/google/verify` with invalid token — returns 403/422

### Android App

- [ ] App loads the hosted web app in WebView
- [ ] `/pricing` page shows "Subscribe via Google Play" message (not Stripe button)
- [ ] Tapping subscribe triggers Google Play purchase flow
- [ ] After purchase, `purchaseToken` is sent to `/api/billing/google/verify`
- [ ] Backend verifies token and marks user as premium
- [ ] `/dashboard` shows "Premium Active" with "Google Play" source badge and expiry date
- [ ] "Manage your subscription in the Google Play Store app" message is shown

### Internal Testing

- [ ] Upload AAB to internal testing track
- [ ] Testers opt in via the shared link
- [ ] Test purchase completes without real charge
- [ ] Premium features unlock correctly after purchase
- [ ] Verify token verification works end-to-end

---

## Troubleshooting

### "Product not found" during purchase
- Ensure the product IDs in Play Console match exactly what you pass to `BillingPlugin.purchase()`
- Products can take several hours to become available after creation
- Your app must have been uploaded to at least the internal testing track

### "Failed to authenticate with Google Play" on backend
- Check that `GOOGLE_SERVICE_ACCOUNT_KEY` env var contains valid JSON
- Ensure the Android Publisher API is enabled in Google Cloud
- Verify the service account has been granted access in Play Console
- Note: It can take up to 24 hours for Play Console permissions to propagate

### Purchase succeeds but verification fails
- Ensure `GOOGLE_PLAY_PACKAGE_NAME` matches your app's package name exactly
- Check that the service account has financial data permissions
- Look at the server logs for detailed error messages from the Google API
