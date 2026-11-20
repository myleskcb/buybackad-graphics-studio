# Sign in with Apple and Google: what the owner sets up

The code is in place (DESIGN-LAW 164, OPEN-ITEMS §BR). Each button appears on webuy.ad only once
its ID is in the Netlify project's environment, so nothing shows until these steps are done. Each
takes about ten minutes. You do them yourself: they need your Google and Apple sign-ins.

## Google (website)

1. Open https://console.cloud.google.com and create a project called **WeBuy.AD** (or pick yours).
2. **APIs & Services → OAuth consent screen**: choose **External**, app name **WeBuy.AD**, your
   support email, authorized domain **webuy.ad**. Keep the default scopes (email, profile,
   openid). Press **Publish app**. These scopes need no Google review.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - application type **Web application**, name **WeBuy.AD website**;
   - **Authorized JavaScript origins**: `https://webuy.ad` and `https://www.webuy.ad`
     (add `https://buybackad-finished-copy.netlify.app` too if you test there);
   - no redirect URIs are needed.
4. Copy the **Client ID**. It ends in `.apps.googleusercontent.com`.
5. In **Netlify → buybackad-finished-copy → Site configuration → Environment variables**, add
   `GOOGLE_CLIENT_ID` with that value, then redeploy.

## Apple (website)

This needs the Apple Developer Program, which the iPhone app needs anyway.

1. Open https://developer.apple.com/account/resources/identifiers.
2. Open the app's App ID, **ad.webuy.app**, tick **Sign In with Apple** (as a primary App ID),
   and save.
3. Press **+**, choose **Services IDs**, description **WeBuy.AD website**, identifier
   **ad.webuy.signin**, and register it.
4. Open it, tick **Sign In with Apple**, press **Configure**:
   - Primary App ID: **ad.webuy.app**;
   - Domains and subdomains: `webuy.ad`, `www.webuy.ad`;
   - Return URLs: `https://webuy.ad/` (the site uses Apple's popup, but Apple still asks for one).
   Save, continue and register.
5. If Apple asks you to verify the domain with a file, send it over: it goes at
   `https://webuy.ad/.well-known/apple-developer-domain-association.txt`.
6. In Netlify's environment variables, add `APPLE_CLIENT_ID` = `ad.webuy.signin`, then redeploy.

## Check it

Open https://webuy.ad, press **Sign in**: **Continue with Apple** and **Continue with Google**
sit above the email form. Try each:

- Apple's **Hide My Email** opens the account under Apple's relay address; sharing your email
  opens it under that.
- If an account with the same email already exists, Apple or Google signs in to that account.

## Good to know

- An account opened with Apple or Google has no password. If someone tries the email form with
  it, they're told to use the button.
- Apple shares the name only on the first sign-in, and it is kept then.
- **The iPhone app** shows neither button yet. Google refuses sign-in inside an app's web view,
  and the App Store requires Sign in with Apple wherever Google sign-in is offered. The app needs
  Apple's own native sign-in (`AuthenticationServices`), which sends its token to the same
  `/api/auth/apple`. When that is built, add `APPLE_BUNDLE_ID` = `ad.webuy.app` to Netlify too.
- **The privacy policy** now names Apple alongside Google (what is kept, which script loads, the
  providers' table). Read it over before this goes live.
