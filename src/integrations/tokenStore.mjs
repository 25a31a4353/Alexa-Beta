import crypto from 'node:crypto';
import { getDatabase } from '../db/index.mjs';

/**
 * Derive a 32-byte (256-bit) encryption key from OAUTH_TOKEN_ENCRYPTION_KEY.
 * Falls back to a deterministic machine-derived key in dev/test if unset.
 */
function getEncryptionKey() {
  const secret = process.env.OAUTH_TOKEN_ENCRYPTION_KEY || 'alexa-plus-oauth-dev-key-fallback-32b';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Format: ivHex:authTagHex:encryptedHex
 */
export function encryptToken(plaintext) {
  if (!plaintext) return null;
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string.
 */
export function decryptToken(encryptedString) {
  if (!encryptedString) return null;
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted payload format. Expected iv:authTag:cipher.');
  }
  const [ivHex, authTagHex, encrypted] = parts;
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Ensure OAuth database tables exist.
 */
export function initOAuthTables() {
  const db = getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS oauth_connections (
      provider TEXT PRIMARY KEY,
      account_email TEXT,
      access_token_encrypted TEXT NOT NULL,
      refresh_token_encrypted TEXT,
      expires_at INTEGER NOT NULL,
      scopes TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS oauth_states (
      state TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      integration_id TEXT,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);
}

export function createOAuthState(providerOrObj, maybeIntegId) {
  initOAuthTables();
  const db = getDatabase();
  const provider = typeof providerOrObj === 'object' ? providerOrObj?.provider : providerOrObj;
  const integrationId = typeof providerOrObj === 'object' ? (providerOrObj?.integrationId || provider) : (maybeIntegId || provider);
  const state = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes TTL

  // Purge expired states
  db.prepare('DELETE FROM oauth_states WHERE expires_at < ?').run(Date.now());

  db.prepare(`
    INSERT INTO oauth_states (state, provider, integration_id, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(state, provider || 'unknown', integrationId || provider || 'unknown', expiresAt);

  return state;
}

/**
 * Verify and consume an OAuth state value.
 * Returns { valid: boolean, provider, integrationId }
 */
export function verifyAndConsumeOAuthState(state) {
  initOAuthTables();
  const db = getDatabase();
  if (!state || typeof state !== 'string') {
    return { valid: false, error: 'STATE_EMPTY' };
  }

  const record = db.prepare('SELECT * FROM oauth_states WHERE state = ?').get(state);
  if (!record) {
    return { valid: false, error: 'STATE_NOT_FOUND_OR_ALREADY_USED' };
  }

  // Delete immediately so it cannot be reused
  db.prepare('DELETE FROM oauth_states WHERE state = ?').run(state);

  if (record.expires_at < Date.now()) {
    return { valid: false, error: 'STATE_EXPIRED' };
  }

  return {
    valid: true,
    provider: record.provider,
    integrationId: record.integration_id
  };
}

/**
 * Save or update OAuth tokens for a provider.
 */
export function saveOAuthTokens(providerOrObj, maybeTokens) {
  initOAuthTables();
  const db = getDatabase();
  const isObj = typeof providerOrObj === 'object';
  const provider = isObj ? providerOrObj.provider : providerOrObj;
  const data = isObj ? providerOrObj : (maybeTokens || {});
  const accountEmail = data.accountEmail;
  const accessToken = data.accessToken;
  const refreshToken = data.refreshToken;
  const expiresInSeconds = data.expiresInSeconds || data.expiresIn;
  const scopes = data.scopes;

  const expiresAt = Date.now() + (expiresInSeconds || 3600) * 1000;
  const encAccess = encryptToken(accessToken);
  const encRefresh = refreshToken ? encryptToken(refreshToken) : null;
  const scopesStr = Array.isArray(scopes) ? scopes.join(' ') : (scopes || '');
  const nowIso = new Date().toISOString();

  // If new refresh token is omitted during refresh, retain existing encrypted refresh token
  if (!encRefresh) {
    const existing = db.prepare('SELECT refresh_token_encrypted FROM oauth_connections WHERE provider = ?').get(provider);
    const retainedRefresh = existing?.refresh_token_encrypted || null;

    db.prepare(`
      INSERT INTO oauth_connections (provider, account_email, access_token_encrypted, refresh_token_encrypted, expires_at, scopes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(provider) DO UPDATE SET
        account_email = coalesce(excluded.account_email, oauth_connections.account_email),
        access_token_encrypted = excluded.access_token_encrypted,
        expires_at = excluded.expires_at,
        scopes = coalesce(excluded.scopes, oauth_connections.scopes),
        updated_at = excluded.updated_at
    `).run(provider, accountEmail, encAccess, retainedRefresh, expiresAt, scopesStr, nowIso);
  } else {
    db.prepare(`
      INSERT INTO oauth_connections (provider, account_email, access_token_encrypted, refresh_token_encrypted, expires_at, scopes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(provider) DO UPDATE SET
        account_email = excluded.account_email,
        access_token_encrypted = excluded.access_token_encrypted,
        refresh_token_encrypted = excluded.refresh_token_encrypted,
        expires_at = excluded.expires_at,
        scopes = excluded.scopes,
        updated_at = excluded.updated_at
    `).run(provider, accountEmail, encAccess, encRefresh, expiresAt, scopesStr, nowIso);
  }
}

/**
 * Retrieve decrypted OAuth tokens for a provider.
 * Returns null if not connected.
 */
export function getOAuthTokens(provider) {
  initOAuthTables();
  const db = getDatabase();
  const record = db.prepare('SELECT * FROM oauth_connections WHERE provider = ?').get(provider);
  if (!record) return null;

  try {
    const accessToken = decryptToken(record.access_token_encrypted);
    const refreshToken = record.refresh_token_encrypted ? decryptToken(record.refresh_token_encrypted) : null;
    return {
      provider: record.provider,
      accountEmail: record.account_email,
      accessToken,
      refreshToken,
      expiresAt: record.expires_at,
      scopes: record.scopes ? record.scopes.split(' ') : [],
      isExpired: Date.now() >= (record.expires_at - 60000) // Margin of 60 seconds
    };
  } catch (err) {
    console.error(`[TokenStore] Failed to decrypt tokens for provider "${provider}":`, err.message);
    return null;
  }
}

/**
 * Delete stored OAuth tokens and reset associated integration records in SQLite.
 */
export function deleteOAuthTokens(provider) {
  initOAuthTables();
  const db = getDatabase();
  db.prepare('DELETE FROM oauth_connections WHERE provider = ?').run(provider);

  // Reset corresponding integration status
  const relatedIntegrationIds = provider === 'google'
    ? ['google-calendar', 'gmail', 'google-drive']
    : ['outlook', 'microsoft-calendar', 'microsoft-teams'];

  for (const id of relatedIntegrationIds) {
    db.prepare(`
      UPDATE integrations
      SET status = 'AVAILABLE',
          account_email = NULL,
          is_synthetic = 1,
          last_sync_at = NULL
      WHERE id = ?
    `).run(id);
  }
}

/**
 * Sync the status of provider-related integration items in the database.
 */
export function markProviderIntegrationsConnected(provider, accountEmail) {
  const db = getDatabase();
  const nowIso = new Date().toISOString();
  const relatedIntegrationIds = provider === 'google'
    ? ['google-calendar', 'gmail', 'google-drive']
    : ['outlook', 'microsoft-calendar'];

  for (const id of relatedIntegrationIds) {
    db.prepare(`
      UPDATE integrations
      SET status = 'CONNECTED',
          account_email = ?,
          is_synthetic = 0,
          last_sync_at = ?
      WHERE id = ?
    `).run(accountEmail, nowIso, id);
  }
}
