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
   - Name: try **aux** first. If App Store Connect says it's taken, use **get aux**. "Pass the AUX" is already on the store, so that one is out. The name under the icon on the home screen stays "aux" either way; that short name is `appName` in `capacitor.config.js`.
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

## Testers: friends and family

Apple has two kinds of TestFlight tester, and the names are misleading:

- **Internal** testers must be members of your App Store Connect team (Users and Access, up to 100). Each friend gets an invite into your developer account. Builds reach them with no review. Use this for yourself and anyone working on aux with you.
- **External** testers are anyone you invite by email or with a **public link**. This is the right fit for friends and family. The first build of each version goes through Beta App Review, which usually takes a day. Later builds of the same version usually go through without another review. The link only works for people you give it to, and you can cap how many people can join.

To set up the external group: go to TestFlight, then the **+** next to External Testing. Name the group "Friends & family", add the build, and fill in the beta description and the feedback email (getaux.nyc@gmail.com). Under **Sign-In Information**, give the reviewer the demo account: +1 555 000 0010, code 123456. Once the build is approved, turn on **Public Link**, set a tester limit (say 50), and send the link around.

## Which version of the app is inside

- `npm run testflight` **bundles** the web app from `../sync` into the build. What testers run is fixed to the commit you built from. To ship changes, pull, run `npm run testflight` again, and archive. The build number goes up by itself.
- `npm run live` is for your own phone or the simulator. The shell loads the GitHub Pages site, so every push shows up without rebuilding. Don't upload a live build: Apple reviews what's in the app, and a live build could change after review.

## Testing in the Simulator

- **The keyboard.** The Simulator types with your Mac's keyboard by default, so the iPhone keyboard never appears. Turn that off once, in the Simulator's menu bar: **I/O**, then **Keyboard**, then untick **Connect Hardware Keyboard** (⇧⌘K). The iPhone keyboard then appears for every text field, the way it does on a phone. ⌘K shows or hides it at any time.
- **After a pull that changes native code** (a new plugin in `app/package.json`), rebuild the app: `cd app && npm install && npm run ios`, then press Run in Xcode. Changes to `sync/` alone show up on the next app launch without a rebuild, because the app loads the live site.

## Before outside testers can sign up

- **Real text messages.** Supabase is connected to Twilio, but through plain Twilio Messaging. US carriers block that unless the number has been through A2P 10DLC registration, which takes weeks. Twilio **Verify** needs no registration, so switch Supabase to it:
  1. In console.twilio.com, check for a **Trial** banner. A trial account can only text numbers you've verified, so upgrade by adding a card ($20 minimum).
  2. Go to **Verify**, then **Services**, then **Create new**. Name it "aux" (the text reads "Your aux verification code is: 123456") and turn on SMS. Copy the **Service SID**; it starts with VA.
  3. In Supabase, go to **Authentication**, then **Sign In / Providers**, then **Phone**. Change SMS provider from Twilio to **Twilio Verify**. Enter the Account SID and Auth Token (from the Twilio console home page) and the Verify Service SID, then save. Leave the test numbers in place; the demo number keeps working with 123456.
  Each code costs about $0.05.
- **Support URL.** App Store Connect asks for one; use https://amanda3947-carlito.github.io/synctest/sync/support.html.
