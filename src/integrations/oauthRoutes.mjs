import { Router } from 'express';
import {
  getGoogleAuthUrl,
  exchangeGoogleCode,
  checkGoogleHealth,
  getGoogleConfig
} from './google.mjs';
import {
  getMicrosoftAuthUrl,
  exchangeMicrosoftCode,
  checkMicrosoftHealth,
  getMicrosoftConfig
} from './microsoft.mjs';
import {
  verifyAndConsumeOAuthState,
  deleteOAuthTokens,
  getOAuthTokens
} from './tokenStore.mjs';
import { getDatabase, recordActivityEvent } from '../db/index.mjs';

export const oauthRouter = Router();

// =========================================================================
// 1. GOOGLE OAUTH FLOW
// =========================================================================

oauthRouter.get('/api/integrations/google/authorize', (req, res) => {
  try {
    const config = getGoogleConfig();
    if (!config.isConfigured) {
      return res.status(400).json({
        error: 'CONFIGURATION_REQUIRED',
        message: 'Google OAuth is not configured on the server. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
        requiredVariables: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI']
      });
    }

    const integrationId = req.query.integrationId || 'google-calendar';
    const authUrl = getGoogleAuthUrl(integrationId);
    res.redirect(authUrl);
  } catch (err) {
    res.status(500).json({ error: 'AUTH_INITIATION_ERROR', message: err.message });
  }
});

oauthRouter.get('/api/integrations/google/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    console.warn('[Google OAuth] User denied or error occurred:', error);
    return res.redirect(`/#/integrations?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return res.status(400).send('Bad Request: Missing OAuth code or state parameter.');
  }

  const verification = verifyAndConsumeOAuthState(state);
  if (!verification.valid) {
    return res.status(400).send(`Invalid OAuth state: ${verification.error}. Authorization rejected.`);
  }

  try {
    const user = await exchangeGoogleCode(code);

    try {
      recordActivityEvent({
        id: `act_oauth_${Date.now()}`,
        missionId: null,
        conversationId: null,
        eventType: 'integration.connected',
        title: 'Google Services Connected (Live OAuth)',
        description: `Successfully authenticated Google account (${user.email}) for Calendar, Gmail, and Drive.`,
        domain: 'Integration',
        status: 'SUCCESS',
        metadata: { provider: 'google', email: user.email },
        isSynthetic: 0
      });
    } catch {}

    // Clean redirect back to the application Integrations page
    res.redirect('/#/integrations?connected=google');
  } catch (err) {
    console.error('[Google OAuth] Callback processing failed:', err.message);
    res.redirect(`/#/integrations?error=${encodeURIComponent(err.message)}`);
  }
});

// =========================================================================
// 2. MICROSOFT OAUTH FLOW
// =========================================================================

oauthRouter.get('/api/integrations/microsoft/authorize', (req, res) => {
  try {
    const config = getMicrosoftConfig();
    if (!config.isConfigured) {
      return res.status(400).json({
        error: 'CONFIGURATION_REQUIRED',
        message: 'Microsoft OAuth is not configured on the server. Please set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET environment variables.',
        requiredVariables: ['MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET', 'MICROSOFT_REDIRECT_URI']
      });
    }

    const integrationId = req.query.integrationId || 'outlook';
    const authUrl = getMicrosoftAuthUrl(integrationId);
    res.redirect(authUrl);
  } catch (err) {
    res.status(500).json({ error: 'AUTH_INITIATION_ERROR', message: err.message });
  }
});

oauthRouter.get('/api/integrations/microsoft/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    console.warn('[Microsoft OAuth] User denied or error occurred:', error);
    return res.redirect(`/#/integrations?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return res.status(400).send('Bad Request: Missing OAuth code or state parameter.');
  }

  const verification = verifyAndConsumeOAuthState(state);
  if (!verification.valid) {
    return res.status(400).send(`Invalid OAuth state: ${verification.error}. Authorization rejected.`);
  }

  try {
    const user = await exchangeMicrosoftCode(code);

    try {
      recordActivityEvent({
        id: `act_oauth_${Date.now()}`,
        missionId: null,
        conversationId: null,
        eventType: 'integration.connected',
        title: 'Microsoft 365 Connected (Live OAuth)',
        description: `Successfully authenticated Microsoft account (${user.email}) for Outlook and Calendar.`,
        domain: 'Integration',
        status: 'SUCCESS',
        metadata: { provider: 'microsoft', email: user.email },
        isSynthetic: 0
      });
    } catch {}

    // Clean redirect back to the application Integrations page
    res.redirect('/#/integrations?connected=microsoft');
  } catch (err) {
    console.error('[Microsoft OAuth] Callback processing failed:', err.message);
    res.redirect(`/#/integrations?error=${encodeURIComponent(err.message)}`);
  }
});

// =========================================================================
// 3. INTEGRATION HEALTH VERIFICATION
// =========================================================================

oauthRouter.get('/api/integrations/:id/health', async (req, res) => {
  const integId = req.params.id;

  if (integId === 'google-calendar' || integId === 'gmail' || integId === 'google-drive') {
    const health = await checkGoogleHealth(integId);
    return res.json(health);
  }

  if (integId === 'outlook' || integId === 'microsoft-calendar' || integId === 'microsoft-365-calendar') {
    const health = await checkMicrosoftHealth();
    return res.json(health);
  }

  // Non-OAuth simulated catalog entries
  const db = getDatabase();
  const row = db.prepare('SELECT id, name, status, account_email, is_synthetic FROM integrations WHERE id = ?').get(integId);
  if (!row) {
    return res.status(404).json({ error: 'INTEGRATION_NOT_FOUND', message: `Integration "${integId}" not found.` });
  }

  res.json({
    provider: integId,
    status: row.status,
    accountEmail: row.account_email,
    lastVerifiedAt: new Date().toISOString(),
    capabilities: [],
    error: null
  });
});
