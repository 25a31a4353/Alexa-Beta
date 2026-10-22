import {
  getOAuthTokens,
  saveOAuthTokens,
  createOAuthState,
  verifyAndConsumeOAuthState,
  markProviderIntegrationsConnected,
  deleteOAuthTokens
} from './tokenStore.mjs';

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';
const GOOGLE_CALENDAR_ENDPOINT = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const GMAIL_MESSAGES_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';
const GOOGLE_DRIVE_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';

export const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/drive.readonly'
];

/**
 * Returns configuration status for Google OAuth.
 */
export function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://alexa-beta.onrender.com';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${publicBaseUrl}/api/integrations/google/callback`;

  const isConfigured = Boolean(
    clientId &&
    clientSecret &&
    !clientId.includes('your_') &&
    !clientSecret.includes('your_')
  );

  return {
    clientId,
    clientSecret,
    redirectUri,
    isConfigured
  };
}

/**
 * Generate Google OAuth 2.0 Authorization URL with state.
 */
export function getGoogleAuthUrl(integrationId = 'google-calendar') {
  const config = getGoogleConfig();
  if (!config.isConfigured) {
    throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
  }

  const state = createOAuthState({ provider: 'google', integrationId });

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    state,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true'
  });

  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchange Authorization Code for Access & Refresh Tokens.
 */
export async function exchangeGoogleCode(code) {
  const config = getGoogleConfig();
  if (!config.isConfigured) {
    throw new Error('Google OAuth credentials not configured on server.');
  }

  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code'
  });

  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('[Google OAuth] Token exchange failed with HTTP', res.status);
    throw new Error(`Google token exchange failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  const accessToken = data.access_token;
  const refreshToken = data.refresh_token;
  const expiresIn = data.expires_in;

  // Retrieve user identity
  const userInfo = await getGoogleUserInfo(accessToken);

  // Securely persist encrypted tokens in SQLite
  saveOAuthTokens({
    provider: 'google',
    accountEmail: userInfo.email,
    accessToken,
    refreshToken,
    expiresInSeconds: expiresIn,
    scopes: data.scope || GOOGLE_SCOPES
  });

  // Mark all Google-based capabilities as CONNECTED in SQLite
  markProviderIntegrationsConnected('google', userInfo.email);

  return {
    email: userInfo.email,
    name: userInfo.name,
    picture: userInfo.picture
  };
}

/**
 * Retrieve user identity information from Google OAuth userinfo endpoint.
 */
export async function getGoogleUserInfo(accessToken) {
  const res = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error(`Google userinfo lookup failed: HTTP ${res.status}`);
  }

  return await res.json();
}

/**
 * Refresh an expired Google Access Token using the stored Refresh Token.
 */
export async function refreshGoogleToken(refreshToken) {
  const config = getGoogleConfig();
  if (!config.isConfigured) {
    throw new Error('Google OAuth credentials not configured.');
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });

  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!res.ok) {
    throw new Error(`Google refresh token failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in
  };
}

/**
 * Obtain a guaranteed valid Google access token, automatically refreshing if expired.
 */
export async function getValidGoogleToken() {
  const tokens = getOAuthTokens('google');
  if (!tokens) return null;

  if (tokens.isExpired) {
    if (!tokens.refreshToken) {
      console.warn('[Google OAuth] Access token expired and no refresh token available. Re-auth required.');
      return null;
    }

    try {
      const refreshed = await refreshGoogleToken(tokens.refreshToken);
      saveOAuthTokens({
        provider: 'google',
        accountEmail: tokens.accountEmail,
        accessToken: refreshed.accessToken,
        refreshToken: tokens.refreshToken,
        expiresInSeconds: refreshed.expiresIn,
        scopes: tokens.scopes
      });
      return refreshed.accessToken;
    } catch (err) {
      console.error('[Google OAuth] Token refresh failed:', err.message);
      return null;
    }
  }

  return tokens.accessToken;
}

/**
 * Health check verification for Google integration.
 */
export async function checkGoogleHealth(service = 'calendar') {
  const config = getGoogleConfig();
  if (!config.isConfigured) {
    return {
      provider: 'google',
      status: 'CONFIGURATION_REQUIRED',
      accountEmail: null,
      lastVerifiedAt: null,
      capabilities: ['calendar', 'gmail', 'drive'],
      error: 'GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing from environment.'
    };
  }

  const accessToken = await getValidGoogleToken();
  if (!accessToken) {
    const existing = getOAuthTokens('google');
    return {
      provider: 'google',
      status: existing ? 'REAUTH_REQUIRED' : 'NOT_CONNECTED',
      accountEmail: existing?.accountEmail || null,
      lastVerifiedAt: null,
      capabilities: ['calendar', 'gmail', 'drive'],
      error: existing ? 'Token refresh failed. Re-authorization required.' : 'No active OAuth connection.'
    };
  }

  try {
    const userInfo = await getGoogleUserInfo(accessToken);
    return {
      provider: 'google',
      status: 'CONNECTED',
      accountEmail: userInfo.email,
      lastVerifiedAt: new Date().toISOString(),
      capabilities: ['calendar', 'gmail', 'drive'],
      error: null
    };
  } catch (err) {
    return {
      provider: 'google',
      status: 'DEGRADED',
      accountEmail: null,
      lastVerifiedAt: null,
      capabilities: ['calendar', 'gmail', 'drive'],
      error: err.message
    };
  }
}

// =========================================================================
// REAL GOOGLE API CLIENT OPERATIONS
// =========================================================================

/**
 * Fetch real Google Calendar events within an ISO 8601 time window.
 */
export async function getGoogleCalendarEvents({ startDate, endDate, query } = {}) {
  const accessToken = await getValidGoogleToken();
  if (!accessToken) {
    throw new Error('Google Calendar is not authenticated. Active OAuth connection required.');
  }

  const timeMin = startDate || new Date().toISOString();
  const timeMax = endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '20'
  });

  if (query && query.trim()) {
    params.set('q', query.trim());
  }

  const res = await fetch(`${GOOGLE_CALENDAR_ENDPOINT}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error(`Google Calendar API call failed with HTTP ${res.status}`);
  }

  const data = await res.json();
  const items = data.items || [];

  // Normalize according to Section 7 contract
  const normalizedEvents = items.map(item => {
    const startStr = item.start?.dateTime || item.start?.date || '';
    const endStr = item.end?.dateTime || item.end?.date || '';
    const attendees = (item.attendees || []).map(a => a.displayName || a.email);

    let platform = 'In-Person / Other';
    if (item.conferenceData || item.hangoutLink) {
      platform = 'Google Meet';
    } else if (item.location && item.location.toLowerCase().includes('zoom')) {
      platform = 'Zoom';
    } else if (item.location && item.location.toLowerCase().includes('teams')) {
      platform = 'Microsoft Teams';
    }

    return {
      eventId: item.id,
      title: item.summary || '(Untitled Event)',
      startTime: startStr,
      endTime: endStr,
      timezone: item.start?.timeZone || data.timeZone || 'UTC',
      platform,
      location: item.location || null,
      attendees,
      organizer: item.organizer?.displayName || item.organizer?.email || null,
      description: item.description || null,
      source: 'Google Calendar — Live OAuth',
      provider: 'google'
    };
  });

  return {
    totalEvents: normalizedEvents.length,
    timeRange: { startDate: timeMin, endDate: timeMax },
    queryFilter: query || null,
    source: 'Google Calendar — Live OAuth',
    events: normalizedEvents
  };
}

/**
 * Search relevant Gmail messages.
 */
export async function searchGmail({ query, maxResults = 5 } = {}) {
  const accessToken = await getValidGoogleToken();
  if (!accessToken) {
    throw new Error('Gmail is not authenticated. Active OAuth connection required.');
  }

  const params = new URLSearchParams({
    maxResults: String(Math.min(maxResults, 10)),
    q: query || ''
  });

  const listRes = await fetch(`${GMAIL_MESSAGES_ENDPOINT}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!listRes.ok) {
    throw new Error(`Gmail API list failed with HTTP ${listRes.status}`);
  }

  const listData = await listRes.json();
  const messagesList = listData.messages || [];

  const normalizedEmails = [];

  // Fetch metadata for up to 5 matching messages
  for (const item of messagesList.slice(0, 5)) {
    try {
      const msgRes = await fetch(`${GMAIL_MESSAGES_ENDPOINT}/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (msgRes.ok) {
        const msg = await msgRes.json();
        const headers = msg.payload?.headers || [];
        const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
        const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
        const to = headers.find(h => h.name.toLowerCase() === 'to')?.value || '';
        const dateStr = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';

        normalizedEmails.push({
          messageId: msg.id,
          threadId: msg.threadId,
          subject,
          sender: from,
          recipients: to ? [to] : [],
          timestamp: dateStr || new Date(parseInt(msg.internalDate, 10)).toISOString(),
          snippet: msg.snippet || '',
          labels: msg.labelIds || [],
          source: 'Gmail — Live OAuth',
          provider: 'google'
        });
      }
    } catch {}
  }

  return {
    totalFound: listData.resultSizeEstimate || normalizedEmails.length,
    query: query || null,
    source: 'Gmail — Live OAuth',
    emails: normalizedEmails
  };
}

/**
 * Retrieve a specific Gmail message metadata and sanitized snippet.
 */
export async function getGmailMessage(messageId) {
  const accessToken = await getValidGoogleToken();
  if (!accessToken) {
    throw new Error('Gmail is not authenticated.');
  }

  const res = await fetch(`${GMAIL_MESSAGES_ENDPOINT}/${encodeURIComponent(messageId)}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Gmail message ${messageId}: HTTP ${res.status}`);
  }

  const msg = await res.json();
  const headers = msg.payload?.headers || [];
  const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
  const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
  const to = headers.find(h => h.name.toLowerCase() === 'to')?.value || '';

  return {
    messageId: msg.id,
    threadId: msg.threadId,
    subject,
    sender: from,
    recipients: to ? [to] : [],
    snippet: msg.snippet || '',
    labels: msg.labelIds || [],
    source: 'Gmail — Live OAuth',
    provider: 'google'
  };
}

/**
 * Search Google Drive files.
 */
export async function searchGoogleDrive({ query, pageSize = 5 } = {}) {
  const accessToken = await getValidGoogleToken();
  if (!accessToken) {
    throw new Error('Google Drive is not authenticated. Active OAuth connection required.');
  }

  let q = "trashed = false";
  if (query && query.trim()) {
    q += ` and (name contains '${query.replace(/'/g, "\\'")}' or fullText contains '${query.replace(/'/g, "\\'")}')`;
  }

  const params = new URLSearchParams({
    q,
    pageSize: String(Math.min(pageSize, 10)),
    fields: 'files(id, name, mimeType, modifiedTime, webViewLink, owners, description)'
  });

  const res = await fetch(`${GOOGLE_DRIVE_ENDPOINT}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error(`Google Drive API search failed with HTTP ${res.status}`);
  }

  const data = await res.json();
  const files = data.files || [];

  const normalizedFiles = files.map(f => ({
    fileId: f.id,
    name: f.name,
    mimeType: f.mimeType,
    modifiedTime: f.modifiedTime,
    webUrl: f.webViewLink || null,
    owners: (f.owners || []).map(o => o.displayName || o.emailAddress),
    snippet: f.description || `Drive document: ${f.name}`,
    source: 'Google Drive — Live OAuth',
    provider: 'google'
  }));

  return {
    totalFound: normalizedFiles.length,
    query: query || null,
    source: 'Google Drive — Live OAuth',
    files: normalizedFiles
  };
}

/**
 * Retrieve a specific Google Drive file metadata.
 */
export async function getGoogleDriveFile(fileId) {
  const accessToken = await getValidGoogleToken();
  if (!accessToken) {
    throw new Error('Google Drive is not authenticated.');
  }

  const res = await fetch(`${GOOGLE_DRIVE_ENDPOINT}/${encodeURIComponent(fileId)}?fields=id,name,mimeType,modifiedTime,webViewLink,owners,description,size`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Drive file ${fileId}: HTTP ${res.status}`);
  }

  const f = await res.json();

  // Retrieve actual document text body from Google Drive API
  let documentContent = null;
  try {
    if (f.mimeType === 'application/vnd.google-apps.document') {
      const exportRes = await fetch(`${GOOGLE_DRIVE_ENDPOINT}/${encodeURIComponent(fileId)}/export?mimeType=text/plain`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (exportRes.ok) {
        documentContent = await exportRes.text();
      }
    } else if (f.mimeType === 'application/vnd.google-apps.spreadsheet') {
      const exportRes = await fetch(`${GOOGLE_DRIVE_ENDPOINT}/${encodeURIComponent(fileId)}/export?mimeType=text/csv`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (exportRes.ok) {
        documentContent = await exportRes.text();
      }
    } else if (f.mimeType?.startsWith('text/') || f.name?.endsWith('.txt') || f.name?.endsWith('.md') || f.name?.endsWith('.json')) {
      const mediaRes = await fetch(`${GOOGLE_DRIVE_ENDPOINT}/${encodeURIComponent(fileId)}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (mediaRes.ok) {
        documentContent = await mediaRes.text();
      }
    }
  } catch (contentErr) {
    console.warn(`[Google Drive] Content export warning for file ${fileId}:`, contentErr.message);
  }

  return {
    fileId: f.id,
    name: f.name,
    mimeType: f.mimeType,
    modifiedTime: f.modifiedTime,
    webUrl: f.webViewLink || null,
    owners: (f.owners || []).map(o => o.displayName || o.emailAddress),
    snippet: f.description || `Drive document: ${f.name}`,
    content: documentContent,
    source: 'Google Drive — Live OAuth',
    provider: 'google'
  };
}
