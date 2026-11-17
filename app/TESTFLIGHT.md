# Getting aux onto TestFlight

The first upload takes about an hour, most of it in App Store Connect. After that, each new build takes about ten minutes.

## What you need

- A Mac with Xcode 16 or later, from the Mac App Store.
- An Apple Developer Program membership that shows **Active** at developer.apple.com/account.
- Node 20 or later on the Mac (`brew install node`).

## Once: create the app in App Store Connect

1. Go to appstoreconnect.apple.com, then **Apps**, then **+**, then **New App**.
2. Fill in:
   - Platform: iOS.
   - Name: the store name. "aux" alone is probably taken, so have a backup ready, such as "aux: build a mixtape". Testers see the icon and the name under it on the home screen; that short name is `appName` in `capacitor.config.js`, which stays "aux".
   - Primary language: English (U.S.).
   - Bundle ID: **app.aux.sync**. If it isn't in the list yet, do step 4 below first. Xcode registers it the first time you choose your team, then it shows up here.
   - SKU: anything, for example `aux-ios`.
3. Under **App Information**, set the category to Lifestyle (Social Networking also fits).
4. Under **App Privacy**, set the privacy policy URL to https://amanda3947-carlito.github.io/synctest/sync/privacy.html. Then answer the data questions. The policy page lists what we collect: phone number, name, photos, birthday, gender, and the details on your profile. All of it is used for app functionality and none of it for tracking.

## Each build

```sh
git pull
cd app
npm install          # first time, or when package.json changes
npm run testflight   # bumps the build number, copies ../sync into the app, opens Xcode
```

In Xcode:

1. In the left sidebar, click **App** (the blue project icon), then the **App** target, then **Signing & Capabilities**.
2. Tick **Automatically manage signing** and choose your **Team**. You only need to do this once. It registers app.aux.sync for you.
3. In the device picker at the top, choose **Any iOS Device (arm64)**.
4. Choose **Product**, then **Archive**. The Organizer window opens when it's done.
5. Click **Distribute App**, then **TestFlight & App Store** (on older Xcode: App Store Connect, then Upload), and accept the defaults.
6. When asked about encryption: the app only uses standard HTTPS, and `ITSAppUsesNonExemptEncryption` is already set to false in Info.plist, so there is nothing to declare.

The build appears in App Store Connect under **TestFlight** after 5–20 minutes of processing.

## Testers

- **Internal testers** (up to 100 people added to your App Store Connect team under Users and Access): no review needed. Make a group under TestFlight, then Internal Testing, and add the build. They get an email and install the app through the TestFlight app.
- **External testers** (anyone with an email or a public link): the first build goes through Beta App Review, which usually takes a day. It needs a beta description, a feedback email, and a **sign-in for the reviewer**. Give them the demo account: +1 555 000 0010, code 123456.

## Which version of the app is inside

- `npm run testflight` **bundles** the web app from `../sync` into the build. What testers run is fixed to the commit you built from. To ship changes, pull, run `npm run testflight` again, and archive. The build number goes up by itself.
- `npm run live` is for your own phone or the simulator. The shell loads the GitHub Pages site, so every push shows up without rebuilding. Don't upload a live build: Apple reviews what's in the app, and a live build could change after review.

## Before outside testers can sign up

- **Real text messages.** Sign-in currently works only for the test numbers set up in Supabase, such as the demo number. Anyone else needs a real SMS provider. Create a Twilio account, set up a Verify service, then enter its Account SID, Auth Token and Verify Service SID in Supabase under Authentication, then Sign In / Providers, then Phone. Expect about $0.05 per code.
- **Contact email.** `sync/privacy.html` and `sync/support.html` have a highlighted `[contact email]` placeholder. Fill it in before external testing. App Store Connect asks for a support URL; use https://amanda3947-carlito.github.io/synctest/sync/support.html.
