# Google OAuth 2.0 Integration Setup Guide for Alexa+

This guide details how to configure genuine Google OAuth 2.0 credentials for **Google Calendar**, **Gmail**, and **Google Drive** in the Alexa+ Agentic Orchestration Platform on Render.

---

## Architecture Overview

Alexa+ implements an authorization code flow with offline access (refresh tokens). All stored access and refresh tokens are encrypted at rest using authenticated **AES-256-GCM** before persistence in SQLite.

```
Browser (User clicks "Connect Google")
  │
  ▼
GET /api/integrations/google/authorize (Generates cryptographic state, returns Google OAuth URL)
  │
  ▼
accounts.google.com/o/oauth2/v2/auth (User grants read-only consent)
  │
  ▼
GET /api/integrations/google/callback (Exchanges code, encrypts tokens, verifies health)
  │
  ▼
Clean browser redirect to /#/integrations?oauth=success&provider=google
```

The browser **never** touches or receives Google client secrets, authorization codes, access tokens, or refresh tokens.

---

## 1. Create Google Cloud Project

1. Log in to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown at the top and select **New Project**.
3. Name the project `Alexa-Plus-Hackathon` (or your preferred name) and click **Create**.
4. Ensure the newly created project is selected in the project picker.

---

## 2. Enable Required Google APIs

In the Google Cloud Console, navigate to **APIs & Services > Library** and enable the following three APIs:

1. **Google Calendar API** (`calendar-json.googleapis.com`)
   - Allows reading calendar events to prepare for upcoming meetings.
2. **Gmail API** (`gmail.googleapis.com`)
   - Allows searching relevant email threads and preparation materials.
3. **Google Drive API** (`drive.googleapis.com`)
   - Allows locating and analyzing documents, specifications, and slide decks.

---

## 3. Configure OAuth Consent Screen

1. In the left navigation, open **APIs & Services > OAuth consent screen**.
2. Select **External** user type and click **Create**.
3. Fill in the required App Information:
   - **App name**: `Alexa+ Agentic Assistant`
   - **User support email**: Your Google email address
   - **Developer contact information**: Your Google email address
4. Click **Save and Continue**.

### Add Scopes
Click **Add or Remove Scopes** and select:
- `.../auth/userinfo.email` (`openid`, `email`, `profile`)
- `https://www.googleapis.com/auth/calendar.readonly` (Read-only Calendar access)
- `https://www.googleapis.com/auth/gmail.readonly` (Read-only Gmail access)
- `https://www.googleapis.com/auth/drive.readonly` (Read-only Drive metadata/files)

> [!NOTE]
> Read-only permissions are used exclusively. Alexa+ hackathon workflows inspect and summarize materials without modifying your live Google account data.

### Add Test Users (Critical for Hackathon Testing)
Because the app is in "Testing" mode:
1. Under **Test users**, click **+ Add Users**.
2. Enter your Google email address (and any evaluation accounts).
3. Click **Save and Continue**.
4. Only configured test users can complete the OAuth flow while the app status is "Testing".

> [!IMPORTANT]
> **Gmail and Drive Restricted Scopes Notice**: `gmail.readonly` and `drive.readonly` are classified by Google as restricted/sensitive scopes. In production, Google requires OAuth verification and CASA security assessment. For hackathon demonstrations and testing, keeping the app in "Testing" status with designated test users completely bypasses verification requirements.

---

## 4. Create Web Application OAuth Client

1. In the left navigation, click **APIs & Services > Credentials**.
2. Click **+ Create Credentials > OAuth client ID**.
3. Select **Application type**: **Web application**.
4. Name: `Alexa+ Web Client`.
5. **Authorized JavaScript origins**:
   - `https://alexa-beta.onrender.com`
   - `http://localhost:3000` (for local development)
   - `http://localhost:5173` (for local dev UI)
6. **Authorized redirect URIs**:
   - `https://alexa-beta.onrender.com/api/integrations/google/callback`
   - `http://localhost:3000/api/integrations/google/callback`
7. Click **Create**.
8. A modal will display your **Client ID** and **Client Secret**.

> [!CAUTION]
> **NEVER commit `client_secret.json` or client secrets to git.** Keep them strictly in your environment variables.

---

## 5. Configure Render Environment Variables

Open your Render Dashboard at [dashboard.render.com](https://dashboard.render.com/):
1. Select your `alexa-beta` Web Service.
2. Navigate to **Environment**.
3. Add the following variables:

| Variable Name | Value |
|---|---|
| `PUBLIC_BASE_URL` | `https://alexa-beta.onrender.com` |
| `GOOGLE_CLIENT_ID` | `<your-client-id>.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `<your-client-secret>` |
| `GOOGLE_REDIRECT_URI` | `https://alexa-beta.onrender.com/api/integrations/google/callback` |
| `OAUTH_TOKEN_ENCRYPTION_KEY` | 32-byte hex string (e.g. `node -e "console.log(crypto.randomBytes(32).toString('hex'))"`) |

4. Click **Save Changes**. Render will automatically trigger a rolling redeployment.

---

## 6. Verify Connected Status

Once deployed:
1. Navigate to `https://alexa-beta.onrender.com/#/integrations`.
2. Locate **Google Calendar**, **Gmail**, or **Google Drive**.
3. Click **Connect Google**.
4. Complete Google's authorization consent screen.
5. You are redirected cleanly back to `/#/integrations`.
6. Google Calendar, Gmail, and Google Drive will transition from `AVAILABLE` to `CONNECTED` with your authenticated account email displayed.
7. Run the hero mission:
   *"Prepare me for my important meeting tomorrow. Check my calendar, find the relevant emails, locate the documents I need, identify what I haven't prepared, and give me a preparation checklist."*
8. Mission Workspace telemetry will cite real live evidence from `Google Calendar — Live OAuth`, `Gmail — Live OAuth`, and `Google Drive — Live OAuth`.
