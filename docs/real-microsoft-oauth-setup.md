# Microsoft Entra ID OAuth 2.0 Integration Setup Guide for Alexa+

This guide details how to configure genuine Microsoft Entra ID (Azure AD) OAuth 2.0 credentials for **Microsoft Outlook Mail** and **Microsoft 365 Calendar** in the Alexa+ Agentic Orchestration Platform on Render.

---

## Architecture Overview

Alexa+ interfaces with Microsoft Graph API (`https://graph.microsoft.com/v1.0`) using the OAuth 2.0 Authorization Code flow with the `/common` endpoint, supporting both Microsoft 365 work/school accounts and personal Microsoft accounts (`@outlook.com`, `@live.com`, `@hotmail.com`).

```
Browser (User clicks "Connect Microsoft")
  │
  ▼
GET /api/integrations/microsoft/authorize (Generates cryptographic state, returns Entra OAuth URL)
  │
  ▼
login.microsoftonline.com/common/oauth2/v2.0/authorize (User grants delegated permissions)
  │
  ▼
GET /api/integrations/microsoft/callback (Exchanges code, encrypts tokens with AES-256-GCM)
  │
  ▼
Clean browser redirect to /#/integrations?oauth=success&provider=microsoft
```

Tokens are encrypted at rest with **AES-256-GCM** using `OAUTH_TOKEN_ENCRYPTION_KEY`. Neither the client secret nor tokens are ever exposed to the client.

---

## 1. Register Application in Microsoft Entra Admin Center

1. Navigate to the [Microsoft Entra admin center](https://entra.microsoft.com/) or Azure Portal ([portal.azure.com](https://portal.azure.com/)).
2. Under **Identity**, navigate to **Applications > App registrations**.
3. Click **+ New registration**.
4. Configure application parameters:
   - **Name**: `Alexa+ Agentic Assistant`
   - **Supported account types**: Select **Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)**.
     *(This maps to the `/common` endpoint configured in `src/integrations/microsoft.mjs`)*
   - **Redirect URI**:
     - Platform: **Web**
     - URI: `https://alexa-beta.onrender.com/api/integrations/microsoft/callback`
5. Click **Register**.

---

## 2. Configure Authentication Redirects

1. Under the app's menu, select **Authentication**.
2. Verify or add the Web Redirect URIs:
   - Production: `https://alexa-beta.onrender.com/api/integrations/microsoft/callback`
   - Local development: `http://localhost:3000/api/integrations/microsoft/callback`
3. Under **Implicit grant and hybrid flows**, ensure both Access tokens and ID tokens checkboxes are **unchecked** (Alexa+ uses the secure Authorization Code flow with backend token exchange).
4. Click **Save**.

---

## 3. Configure Microsoft Graph API Permissions

1. In the app menu, select **API permissions**.
2. Click **+ Add a permission > Microsoft Graph > Delegated permissions**.
3. Select and add the following delegated permissions:
   - `User.Read` (Sign in and read user profile & email address)
   - `Mail.Read` (Read user email messages from Outlook)
   - `Calendars.Read` (Read user calendars and events from Microsoft 365)
   - `offline_access` (Maintain access to data you have given it permission to see; enables refresh tokens)
4. Click **Add permissions**.

> [!NOTE]
> All requested scopes are strictly read-only (`Mail.Read`, `Calendars.Read`). Alexa+ will not delete, send, modify, or create items in your Microsoft mailbox or calendar.

---

## 4. Generate Client Secret

1. In the app menu, select **Certificates & secrets**.
2. Click **+ New client secret**.
3. Description: `Alexa+ Render Production Secret`.
4. Expires: Select your preferred duration (e.g., 180 days / 6 months).
5. Click **Add**.
6. **Immediately copy the Secret Value** (the column labeled `Value`, not `Secret ID`).

> [!CAUTION]
> **This Value is displayed only once.** Never commit client secrets to version control.

---

## 5. Configure Render Environment Variables

Open your Render Dashboard at [dashboard.render.com](https://dashboard.render.com/):
1. Select your `alexa-beta` Web Service.
2. Navigate to **Environment**.
3. Add the following variables:

| Variable Name | Value | Description |
|---|---|---|
| `MICROSOFT_CLIENT_ID` | `<Application (client) ID>` | Found on the App Overview page |
| `MICROSOFT_CLIENT_SECRET` | `<Secret Value>` | Generated in Certificates & secrets |
| `MICROSOFT_REDIRECT_URI` | `https://alexa-beta.onrender.com/api/integrations/microsoft/callback` | Callback URL |
| `OAUTH_TOKEN_ENCRYPTION_KEY` | 32-byte hex key | Must match across providers for AES-256-GCM |

4. Click **Save Changes**.

---

## 6. Verify Connected Status

Once deployed:
1. Navigate to `https://alexa-beta.onrender.com/#/integrations`.
2. Locate **Microsoft Outlook** or **Microsoft 365 Calendar**.
3. Click **Connect Microsoft**.
4. Log in with your Microsoft account (work, school, or personal) and accept permissions.
5. The callback validates state, persists encrypted tokens, and redirects to `/#/integrations`.
6. Microsoft Outlook and Microsoft 365 Calendar will update from `AVAILABLE` to `CONNECTED` displaying your authenticated account email.
7. Real MCP tools (`outlook_search`, `outlook_get_message`, `outlook_calendar_get_events`) are now unlocked and available dynamically in `tools/list`.
