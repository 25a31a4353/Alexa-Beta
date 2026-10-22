import {
  getOAuthTokens,
  saveOAuthTokens,
  createOAuthState,
  verifyAndConsumeOAuthState,
  markProviderIntegrationsConnected,
  deleteOAuthTokens
} from './tokenStore.mjs';

const MS_AUTH_ENDPOINT = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MS_TOKEN_ENDPOINT = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const MS_GRAPH_ME_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';
const MS_GRAPH_CALENDAR_ENDPOINT = 'https://graph.microsoft.com/v1.0/me/calendarView';
const MS_GRAPH_MESSAGES_ENDPOINT = 'https://graph.microsoft.com/v1.0/me/messages';

export const MS_SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'User.Read',
  'Mail.Read',
  'Calendars.Read'
];

/**
 * Returns configuration status for Microsoft OAuth.
 */
export function getMicrosoftConfig() {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://alexa-beta.onrender.com';
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI || `${publicBaseUrl}/api/integrations/microsoft/callback`;

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
 * Generate Microsoft OAuth 2.0 Authorization URL with state.
 */
export function getMicrosoftAuthUrl(integrationId = 'outlook') {
  const config = getMicrosoftConfig();
  if (!config.isConfigured) {
    throw new Error('Microsoft OAuth credentials not configured. Please set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET.');
  }

  const state = createOAuthState({ provider: 'microsoft', integrationId });

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: MS_SCOPES.join(' '),
    state,
    response_mode: 'query',
    prompt: 'consent'
  });

  return `${MS_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchange Authorization Code for Access & Refresh Tokens.
 */
export async function exchangeMicrosoftCode(code) {
  const config = getMicrosoftConfig();
  if (!config.isConfigured) {
    throw new Error('Microsoft OAuth credentials not configured on server.');
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
    scope: MS_SCOPES.join(' ')
  });

  const res = await fetch(MS_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!res.ok) {
    console.error('[Microsoft OAuth] Token exchange failed with HTTP', res.status);
    throw new Error(`Microsoft token exchange failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  const accessToken = data.access_token;
  const refreshToken = data.refresh_token;
  const expiresIn = data.expires_in;

  // Retrieve user identity via Microsoft Graph /me
  const userInfo = await getMicrosoftUserInfo(accessToken);
  const email = userInfo.mail || userInfo.userPrincipalName || 'user@outlook.com';

  // Securely persist encrypted tokens in SQLite
  saveOAuthTokens({
    provider: 'microsoft',
    accountEmail: email,
    accessToken,
    refreshToken,
    expiresInSeconds: expiresIn,
    scopes: data.scope ? data.scope.split(' ') : MS_SCOPES
  });

  // Mark all Microsoft capabilities as CONNECTED in SQLite
  markProviderIntegrationsConnected('microsoft', email);

  return {
    email,
    displayName: userInfo.displayName
  };
}

/**
 * Retrieve user identity information from Microsoft Graph /me.
 */
export async function getMicrosoftUserInfo(accessToken) {
  const res = await fetch(MS_GRAPH_ME_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error(`Microsoft Graph /me lookup failed: HTTP ${res.status}`);
  }

  return await res.json();
}

/**
 * Refresh an expired Microsoft Access Token using the stored Refresh Token.
 */
export async function refreshMicrosoftToken(refreshToken) {
  const config = getMicrosoftConfig();
  if (!config.isConfigured) {
    throw new Error('Microsoft OAuth credentials not configured.');
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: MS_SCOPES.join(' ')
  });

  const res = await fetch(MS_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!res.ok) {
    throw new Error(`Microsoft refresh token failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in
  };
}

/**
 * Obtain a guaranteed valid Microsoft access token, automatically refreshing if expired.
 */
export async function getValidMicrosoftToken() {
  const tokens = getOAuthTokens('microsoft');
  if (!tokens) return null;

  if (tokens.isExpired) {
    if (!tokens.refreshToken) {
      console.warn('[Microsoft OAuth] Access token expired and no refresh token available.');
      return null;
    }

    try {
      const refreshed = await refreshMicrosoftToken(tokens.refreshToken);
      saveOAuthTokens({
        provider: 'microsoft',
        accountEmail: tokens.accountEmail,
        accessToken: refreshed.accessToken,
        refreshToken: tokens.refreshToken,
        expiresInSeconds: refreshed.expiresIn,
        scopes: tokens.scopes
      });
      return refreshed.accessToken;
    } catch (err) {
      console.error('[Microsoft OAuth] Token refresh failed:', err.message);
      return null;
    }
  }

  return tokens.accessToken;
}

/**
 * Health check verification for Microsoft integration.
 */
export async function checkMicrosoftHealth() {
  const config = getMicrosoftConfig();
  if (!config.isConfigured) {
    return {
      provider: 'microsoft',
      status: 'CONFIGURATION_REQUIRED',
      accountEmail: null,
      lastVerifiedAt: null,
      capabilities: ['outlook', 'microsoft-calendar'],
      error: 'MICROSOFT_CLIENT_ID or MICROSOFT_CLIENT_SECRET is missing from environment.'
    };
  }

  const accessToken = await getValidMicrosoftToken();
  if (!accessToken) {
    const existing = getOAuthTokens('microsoft');
    return {
      provider: 'microsoft',
      status: existing ? 'REAUTH_REQUIRED' : 'NOT_CONNECTED',
      accountEmail: existing?.accountEmail || null,
      lastVerifiedAt: null,
      capabilities: ['outlook', 'microsoft-calendar'],
      error: existing ? 'Token refresh failed. Re-authorization required.' : 'No active OAuth connection.'
    };
  }

  try {
    const userInfo = await getMicrosoftUserInfo(accessToken);
    const email = userInfo.mail || userInfo.userPrincipalName;
    return {
      provider: 'microsoft',
      status: 'CONNECTED',
      accountEmail: email,
      lastVerifiedAt: new Date().toISOString(),
      capabilities: ['outlook', 'microsoft-calendar'],
      error: null
    };
  } catch (err) {
    return {
      provider: 'microsoft',
      status: 'DEGRADED',
      accountEmail: null,
      lastVerifiedAt: null,
      capabilities: ['outlook', 'microsoft-calendar'],
      error: err.message
    };
  }
}

// =========================================================================
// REAL MICROSOFT GRAPH API OPERATIONS
// =========================================================================

/**
 * Fetch authenticated Microsoft 365 calendar events.
 */
export async function getMicrosoftCalendarEvents({ startDate, endDate, query } = {}) {
  const accessToken = await getValidMicrosoftToken();
  if (!accessToken) {
    throw new Error('Microsoft 365 Calendar is not authenticated. Active OAuth connection required.');
  }

  const startDateTime = startDate || new Date().toISOString();
  const endDateTime = endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    startDateTime,
    endDateTime,
    $top: '20',
    $orderby: 'start/dateTime ASC'
  });

  if (query && query.trim()) {
    params.set('$filter', `contains(subject, '${query.replace(/'/g, "''")}')`);
  }

  const res = await fetch(`${MS_GRAPH_CALENDAR_ENDPOINT}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'outlook.timezone="UTC"'
    }
  });

  if (!res.ok) {
    throw new Error(`Microsoft Calendar API call failed with HTTP ${res.status}`);
  }

  const data = await res.json();
  const items = data.value || [];

  const normalizedEvents = items.map(item => {
    const attendees = (item.attendees || []).map(a => a.emailAddress?.name || a.emailAddress?.address);
    let platform = 'In-Person / Other';
    if (item.isOnlineMeeting) {
      platform = item.onlineMeetingProvider === 'teamsForBusiness' ? 'Microsoft Teams' : 'Online Meeting';
    }

    return {
      eventId: item.id,
      title: item.subject || '(Untitled Event)',
      startTime: item.start?.dateTime ? `${item.start.dateTime}Z` : '',
      endTime: item.end?.dateTime ? `${item.end.dateTime}Z` : '',
      timezone: item.start?.timeZone || 'UTC',
      platform,
      location: item.location?.displayName || null,
      attendees,
      organizer: item.organizer?.emailAddress?.name || item.organizer?.emailAddress?.address || null,
      description: item.bodyPreview || null,
      source: 'Microsoft 365 — Live OAuth',
      provider: 'microsoft'
    };
  });

  return {
    totalEvents: normalizedEvents.length,
    timeRange: { startDate: startDateTime, endDate: endDateTime },
    queryFilter: query || null,
    source: 'Microsoft 365 — Live OAuth',
    events: normalizedEvents
  };
}

/**
 * Fetch authenticated Outlook email messages.
 */
export async function getOutlookMessages({ query, maxResults = 5 } = {}) {
  const accessToken = await getValidMicrosoftToken();
  if (!accessToken) {
    throw new Error('Microsoft Outlook is not authenticated. Active OAuth connection required.');
  }

  const params = new URLSearchParams({
    $top: String(Math.min(maxResults, 10)),
    $select: 'id,conversationId,subject,from,toRecipients,receivedDateTime,bodyPreview,categories',
    $orderby: 'receivedDateTime DESC'
  });

  if (query && query.trim()) {
    params.set('$search', `"${query.replace(/"/g, '\\"')}"`);
  }

  const res = await fetch(`${MS_GRAPH_MESSAGES_ENDPOINT}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    throw new Error(`Microsoft Outlook API call failed with HTTP ${res.status}`);
  }

  const data = await res.json();
  const items = data.value || [];

  const normalizedEmails = items.map(msg => ({
    messageId: msg.id,
    threadId: msg.conversationId,
    subject: msg.subject || '(No Subject)',
    sender: msg.from?.emailAddress?.name || msg.from?.emailAddress?.address || 'Unknown Sender',
    recipients: (msg.toRecipients || []).map(r => r.emailAddress?.address || r.emailAddress?.name),
    timestamp: msg.receivedDateTime,
    snippet: msg.bodyPreview || '',
    labels: msg.categories || [],
    source: 'Microsoft Outlook — Live OAuth',
    provider: 'microsoft'
  }));

  return {
    totalFound: normalizedEmails.length,
    query: query || null,
    source: 'Microsoft Outlook — Live OAuth',
    emails: normalizedEmails
  };
}

/**
 * Fetch a specific Outlook email message.
 */
export async function getOutlookMessage(messageId) {
  const accessToken = await getValidMicrosoftToken();
  if (!accessToken) {
    throw new Error('Microsoft Outlook is not authenticated.');
  }

  const res = await fetch(`${MS_GRAPH_MESSAGES_ENDPOINT}/${encodeURIComponent(messageId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Outlook message ${messageId}: HTTP ${res.status}`);
  }

  const msg = await res.json();
  return {
    messageId: msg.id,
    threadId: msg.conversationId,
    subject: msg.subject || '(No Subject)',
    sender: msg.from?.emailAddress?.name || msg.from?.emailAddress?.address || 'Unknown Sender',
    recipients: (msg.toRecipients || []).map(r => r.emailAddress?.address || r.emailAddress?.name),
    timestamp: msg.receivedDateTime,
    snippet: msg.bodyPreview || '',
    labels: msg.categories || [],
    source: 'Microsoft Outlook — Live OAuth',
    provider: 'microsoft'
  };
}
