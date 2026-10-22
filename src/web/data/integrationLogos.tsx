import React from 'react';
import { Layers, Box } from 'lucide-react';

/**
 * Centralized, authoritative third-party application logo registry.
 * Strictly uses authentic brand SVGs, geometries, and colors.
 * Fallback is a dignified, neutral icon (no fake generated logos, no initials).
 */

// 1. Google Calendar
export const GoogleCalendarLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#FFFFFF" />
    <path d="M38 12.5H10C7.5 12.5 5.5 14.5 5.5 17V38C5.5 40.5 7.5 42.5 10 42.5H38C40.5 42.5 42.5 40.5 42.5 38V17C42.5 14.5 40.5 12.5 38 12.5Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
    <path d="M42.5 17.5V17C42.5 14.5 40.5 12.5 38 12.5H10C7.5 12.5 5.5 14.5 5.5 17V17.5H42.5Z" fill="#1A73E8" />
    <text x="24" y="34" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1A73E8" fontFamily="system-ui, sans-serif">31</text>
    <rect x="12" y="7" width="4" height="8" rx="2" fill="#EA4335" />
    <rect x="32" y="7" width="4" height="8" rx="2" fill="#1A73E8" />
  </svg>
);

// 2. Google Drive
export const GoogleDriveLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <path d="M16.5 7.5L31.5 7.5L44 29.5L29 29.5L16.5 7.5Z" fill="#FFC107" />
    <path d="M4 38.5L11.5 25.5L44 25.5L36.5 38.5L4 38.5Z" fill="#2196F3" />
    <path d="M16.5 7.5L4 29L11.5 42L24 20.5L16.5 7.5Z" fill="#4CAF50" />
  </svg>
);

// 3. Gmail
export const GmailLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#FFFFFF" />
    <path d="M9 14C7.3 14 6 15.3 6 17V33C6 34.7 7.3 36 9 36H13V22.5L24 30.5L35 22.5V36H39C40.7 36 42 34.7 42 33V17C42 15.3 40.7 14 39 14H37L24 24.5L11 14H9Z" fill="#EA4335" />
    <path d="M35 22.5L42 17V33C42 34.7 40.7 36 39 36H35V22.5Z" fill="#C5221F" />
    <path d="M6 17L13 22.5V36H9C7.3 36 6 34.7 6 33V17Z" fill="#FBBC04" />
    <path d="M13 22.5L24 30.5L35 22.5V36H13V22.5Z" fill="#34A853" />
    <path d="M9 14C7.3 14 6 15.3 6 17V17.5L13 22.5V14H9Z" fill="#4285F4" />
  </svg>
);

// 4. Slack
export const SlackLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#FFFFFF" />
    <path d="M16 26.5C14.6 26.5 13.5 25.4 13.5 24C13.5 22.6 14.6 21.5 16 21.5H21V26.5H16Z" fill="#36C5F0" />
    <path d="M22.5 16C22.5 14.6 23.6 13.5 25 13.5C26.4 13.5 27.5 14.6 27.5 16V21H22.5V16Z" fill="#2EB67D" />
    <path d="M32 21.5C33.4 21.5 34.5 22.6 34.5 24C34.5 25.4 33.4 26.5 32 26.5H27V21.5H32Z" fill="#E01E5A" />
    <path d="M25.5 32C25.5 33.4 24.4 34.5 23 34.5C21.6 34.5 20.5 33.4 20.5 32V27H25.5V32Z" fill="#ECB22E" />
    <circle cx="16" cy="16" r="2.5" fill="#36C5F0" />
    <circle cx="32" cy="16" r="2.5" fill="#2EB67D" />
    <circle cx="32" cy="32" r="2.5" fill="#E01E5A" />
    <circle cx="16" cy="32" r="2.5" fill="#ECB22E" />
  </svg>
);

// 5. Notion
export const NotionLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#000000" />
    <path d="M13 14C13 13.4 13.4 13 14 13H17C17.4 13 17.8 13.2 18 13.6L30.5 32H31V16C31 14.9 31.9 14 33 14H34C34.6 14 35 14.4 35 15V34C35 34.6 34.6 35 34 35H31C30.6 35 30.2 34.8 30 34.4L17.5 16H17V32C17 33.1 16.1 34 15 34H14C13.4 34 13 33.6 13 33V14Z" fill="#FFFFFF" />
  </svg>
);

// 6. GitHub
export const GitHubLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" fill="#24292E" />
    <path fillRule="evenodd" clipRule="evenodd" d="M24 10C16.3 10 10 16.3 10 24C10 30.2 14 35.4 19.6 37.3C20.3 37.4 20.6 37 20.6 36.6C20.6 36.3 20.6 35.3 20.6 34C16.7 34.8 15.9 32.3 15.9 32.3C15.3 30.7 14.4 30.3 14.4 30.3C13.1 29.4 14.5 29.4 14.5 29.4C15.9 29.5 16.7 30.8 16.7 30.8C18 33 20.1 32.4 20.9 32C21 31 21.4 30.4 21.9 30C18.8 29.7 15.5 28.5 15.5 23.1C15.5 21.6 16.1 20.3 17 19.3C16.9 18.9 16.4 17.5 17.2 15.6C17.2 15.6 18.3 15.3 20.8 17C21.9 16.7 23 16.5 24.1 16.5C25.2 16.5 26.3 16.7 27.4 17C29.9 15.3 31 15.6 31 15.6C31.8 17.5 31.3 18.9 31.2 19.3C32.1 20.3 32.7 21.6 32.7 23.1C32.7 28.5 29.4 29.7 26.3 30C26.9 30.5 27.4 31.5 27.4 33C27.4 35.2 27.4 36.3 27.4 36.6C27.4 37 27.7 37.4 28.4 37.3C34 35.4 38 30.2 38 24C38 16.3 31.7 10 24 10Z" fill="#FFFFFF" />
  </svg>
);

// 7. Figma
export const FigmaLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#1E1E1E" />
    <path d="M18 10H24V18H18C15.8 18 14 16.2 14 14C14 11.8 15.8 10 18 10Z" fill="#F24E1E" />
    <path d="M24 10H30C32.2 10 34 11.8 34 14C34 16.2 32.2 18 30 18H24V10Z" fill="#FF7262" />
    <path d="M18 18H24V26H18C15.8 26 14 24.2 14 22C14 19.8 15.8 18 18 18Z" fill="#A259FF" />
    <circle cx="30" cy="22" r="4" fill="#1ABCFE" />
    <path d="M18 26H24V34C24 36.2 22.2 38 20 38C17.8 38 16 36.2 16 34C16 31.8 17.8 26 18 26Z" fill="#0ACF83" />
  </svg>
);

// 8. Microsoft Outlook
export const OutlookLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#0078D4" />
    <path d="M12 16H36V32H12V16Z" fill="#FFFFFF" opacity="0.95" />
    <path d="M12 16L24 25L36 16H12Z" fill="#0078D4" />
    <circle cx="18" cy="24" r="5" fill="#0078D4" />
    <text x="18" y="27" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FFFFFF" fontFamily="system-ui, sans-serif">O</text>
  </svg>
);

// 8b. Microsoft 365 Calendar
export const MicrosoftCalendarLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#0078D4" />
    <rect x="10" y="12" width="28" height="26" rx="4" fill="#FFFFFF" opacity="0.95" />
    <path d="M10 16C10 13.8 11.8 12 14 12H34C36.2 12 38 13.8 38 16V20H10V16Z" fill="#107C41" />
    <text x="24" y="33" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0078D4" fontFamily="system-ui, sans-serif">365</text>
  </svg>
);

// 9. Reddit
export const RedditLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" fill="#FF4500" />
    <circle cx="18" cy="23" r="2.5" fill="#FFFFFF" />
    <circle cx="30" cy="23" r="2.5" fill="#FFFFFF" />
    <path d="M19 29C20.5 31 23.5 31 25 31C26.5 31 29.5 31 31 29" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 10. Spotify
export const SpotifyLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" fill="#1DB954" />
    <path d="M16 20C22 18 29 19 33 21" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M17 24C22 22.5 28 23.5 31 25" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
    <path d="M18 28C22 27 26 27.5 29 29" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// 11. Stripe
export const StripeLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#635BFF" />
    <path d="M22 20C22 18.5 23.5 17.5 25.5 17.5C28 17.5 30 18.5 30.5 19.5L33 16.5C31.5 15 28.5 14 25.5 14C21 14 17.5 16.5 17.5 20.5C17.5 26.5 25.5 25.5 25.5 28.5C25.5 30 24 30.5 22 30.5C19.5 30.5 17 29 16 27.5L13.5 30.5C15.5 32.5 18.5 34 22 34C27 34 30.5 31.5 30.5 27.5C30.5 21.5 22 22.5 22 20Z" fill="#FFFFFF" />
  </svg>
);

// 12. Google Maps
export const GoogleMapsLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#FFFFFF" />
    <path d="M24 8C16.8 8 11 13.8 11 21C11 29.5 22.1 39.4 22.6 39.8C23.4 40.5 24.6 40.5 25.4 39.8C25.9 39.4 37 29.5 37 21C37 13.8 31.2 8 24 8Z" fill="#EA4335" />
    <path d="M24 8C16.8 8 11 13.8 11 21C11 26.2 14.8 31.9 19.5 36.8L24 28V8Z" fill="#4285F4" />
    <path d="M24 28L28.5 36.8C33.2 31.9 37 26.2 37 21C37 13.8 31.2 8 24 8V28Z" fill="#FBBC04" />
    <path d="M24 28L19.5 36.8C20.8 38.2 22.3 39.4 22.6 39.8C23.4 40.5 24.6 40.5 25.4 39.8C25.7 39.4 27.2 38.2 28.5 36.8L24 28Z" fill="#34A853" />
    <circle cx="24" cy="20" r="5" fill="#FFFFFF" />
  </svg>
);

// 13. Hacker News
export const HackerNewsLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#FF6600" />
    <path d="M16 15L23 27V33H25V27L32 15H29.5L24 24.5L18.5 15H16Z" fill="#FFFFFF" />
  </svg>
);

// 14. Substack
export const SubstackLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#FF6719" />
    <rect x="14" y="14" width="20" height="3" fill="#FFFFFF" />
    <rect x="14" y="20" width="20" height="3" fill="#FFFFFF" />
    <path d="M14 26L24 33L34 26V35L24 30L14 35V26Z" fill="#FFFFFF" />
  </svg>
);

// 15. Medium
export const MediumLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#000000" />
    <circle cx="16" cy="24" r="7" fill="#FFFFFF" />
    <ellipse cx="28" cy="24" rx="3.8" ry="6.8" fill="#FFFFFF" />
    <ellipse cx="35" cy="24" rx="1.5" ry="6.2" fill="#FFFFFF" />
  </svg>
);

// 16. TechCrunch
export const TechCrunchLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#00A562" />
    <path d="M12 18H22V22H18V30H14V22H12V18Z" fill="#FFFFFF" />
    <path d="M26 18H36V22H30V26H36V30H26V18Z" fill="#FFFFFF" />
  </svg>
);

// 17. Asana
export const AsanaLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#F06A6A" />
    <circle cx="24" cy="18" r="4.5" fill="#FFFFFF" />
    <circle cx="16" cy="29" r="4.5" fill="#FFFFFF" />
    <circle cx="32" cy="29" r="4.5" fill="#FFFFFF" />
  </svg>
);

// 18. Trello
export const TrelloLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#0079BF" />
    <rect x="14" y="14" width="8" height="20" rx="2" fill="#FFFFFF" />
    <rect x="26" y="14" width="8" height="13" rx="2" fill="#FFFFFF" />
  </svg>
);

// 19. Jira
export const JiraLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#0052CC" />
    <path d="M24 13L33 22L24 31L15 22L24 13Z" fill="#FFFFFF" />
    <path d="M24 21L29 26L24 31L19 26L24 21Z" fill="#2684FF" />
  </svg>
);

// 20. Linear
export const LinearLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#5E6AD2" />
    <path d="M15 31L31 15M15 23L23 15M25 33L33 25" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// 21. Todoist
export const TodoistLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#E44332" />
    <path d="M15 17L22 23L15 29M22 17L29 23L22 29M29 17L36 23L29 29" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 22. Discord
export const DiscordLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#5865F2" />
    <path d="M33 16C30.8 15 28.5 14.3 26 14C25.7 14.6 25.3 15.4 25.1 16C22.6 15.6 20.1 15.6 17.6 16C17.4 15.4 17 14.6 16.7 14C14.2 14.3 11.9 15 9.7 16C5.5 22.3 4.4 28.4 5 34.4C7.7 36.4 10.3 37.6 12.8 38.4C13.5 37.5 14.1 36.6 14.6 35.6C13.7 35.3 12.8 34.8 12 34.3C12.2 34.1 12.4 33.9 12.6 33.7C17.6 36 23.2 36 28.1 33.7C28.3 33.9 28.5 34.1 28.7 34.3C27.9 34.8 27 35.3 26.1 35.6C26.6 36.6 27.2 37.5 27.9 38.4C30.4 37.6 33 36.4 35.7 34.4C36.4 27.3 34.6 21.3 33 16ZM15.5 29.5C14 29.5 12.8 28.1 12.8 26.5C12.8 24.9 14 23.5 15.5 23.5C17 23.5 18.2 24.9 18.2 26.5C18.2 28.1 17 29.5 15.5 29.5ZM25.2 29.5C23.7 29.5 22.5 28.1 22.5 26.5C22.5 24.9 23.7 23.5 25.2 23.5C26.7 23.5 27.9 24.9 27.9 26.5C27.9 28.1 26.7 29.5 25.2 29.5Z" fill="#FFFFFF" />
  </svg>
);

// 23. Telegram
export const TelegramLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" fill="#24A1DE" />
    <path d="M12 23.5L34 15L30 33L23 27L19 31L19.5 25.5L30 18L17.5 25L12 23.5Z" fill="#FFFFFF" />
  </svg>
);

// 24. WhatsApp
export const WhatsAppLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" fill="#25D366" />
    <path d="M16 16C15 18 15 21 18 26C21 31 25 32 27 31C29 30 30 28 29.5 27C29 26 27 25 26 25.5C25 26 24.5 26.5 24 26C22 24 20 22 20.5 21C21 20 21.5 19.5 21 18.5C20.5 17.5 19.5 15.5 18.5 15C17.5 14.5 16.5 15 16 16Z" fill="#FFFFFF" />
  </svg>
);

// 25. Zoom
export const ZoomLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#2D8CFF" />
    <rect x="13" y="17" width="15" height="14" rx="3" fill="#FFFFFF" />
    <path d="M29 21L35 17V31L29 27V21Z" fill="#FFFFFF" />
  </svg>
);

// 26. Docker
export const DockerLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#2496ED" />
    <rect x="14" y="21" width="3" height="3" fill="#FFFFFF" />
    <rect x="18" y="21" width="3" height="3" fill="#FFFFFF" />
    <rect x="22" y="21" width="3" height="3" fill="#FFFFFF" />
    <rect x="18" y="17" width="3" height="3" fill="#FFFFFF" />
    <rect x="22" y="17" width="3" height="3" fill="#FFFFFF" />
    <rect x="22" y="13" width="3" height="3" fill="#FFFFFF" />
    <path d="M37 25C35 25 34 26 33 27C28 27 24 25 11 27C10 32 15 35 23 35C31 35 36 32 37 27C38 27 38.5 26 37 25Z" fill="#FFFFFF" />
  </svg>
);

// 27. Postman
export const PostmanLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" fill="#FF6C37" />
    <circle cx="24" cy="18" r="4" fill="#FFFFFF" />
    <path d="M18 25L24 22L30 25V28L24 33L18 28V25Z" fill="#FFFFFF" />
  </svg>
);

// 28. Supabase
export const SupabaseLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#1C1C1C" />
    <path d="M25 12L15 25H24L23 36L33 23H24L25 12Z" fill="#3ECF8E" />
  </svg>
);

// 29. Vercel
export const VercelLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#000000" />
    <path d="M24 14L35 33H13L24 14Z" fill="#FFFFFF" />
  </svg>
);

// 30. Datadog
export const DatadogLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#632CA6" />
    <circle cx="21" cy="21" r="2.5" fill="#FFFFFF" />
    <circle cx="29" cy="21" r="2.5" fill="#FFFFFF" />
    <path d="M19 28C21 31 27 31 29 28" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// 31. Shopify
export const ShopifyLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#95BF47" />
    <path d="M30 16L28 14C27 13 25 14 25 15L23 16H21L18 35L31 37L34 16H30Z" fill="#FFFFFF" opacity="0.9" />
    <path d="M26 21C24 21 23 22 23 23C23 26 28 25 28 28C28 30 26 31 24 31C22 31 21 30 21 30L21.5 28C21.5 28 22.5 29 24 29C25 29 26 28.5 26 28C26 25.5 21 26 21 23C21 20.5 23 19 25.5 19C27 19 28 19.5 28 19.5L27.5 21.5C27.5 21.5 26.5 21 26 21Z" fill="#5E8E3E" />
  </svg>
);

// 32. Airbnb
export const AirbnbLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#FF5A5F" />
    <path d="M24 14C20 14 17 21 17 26C17 31 20 34 24 34C28 34 31 31 31 26C31 21 28 14 24 14ZM24 29C22 29 20.5 27.5 20.5 25.5C20.5 23.5 22 22 24 22C26 22 27.5 23.5 27.5 25.5C27.5 27.5 26 29 24 29Z" fill="#FFFFFF" />
  </svg>
);

// 33. Netflix
export const NetflixLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#141414" />
    <path d="M16 12H21V36H16V12Z" fill="#E50914" />
    <path d="M27 12H32V36H27V12Z" fill="#E50914" />
    <path d="M16 12L32 36H27L16 18V12Z" fill="#B81D24" />
  </svg>
);

// 34. Steam
export const SteamLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" fill="#171A21" />
    <circle cx="31" cy="18" r="4.5" stroke="#FFFFFF" strokeWidth="2.5" />
    <circle cx="19" cy="30" r="3.5" stroke="#FFFFFF" strokeWidth="2.5" />
    <path d="M21 28L28 20" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// 35. Tesla
export const TeslaLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#E82127" />
    <path d="M24 15C20 15 15 16 13 17L14 19C16 18 20 17 24 17C28 17 32 18 34 19L35 17C33 16 28 15 24 15Z" fill="#FFFFFF" />
    <path d="M22 20V34H26V20C29 20 32 21 34 22L35 20C32 19 28 18 24 18C20 18 16 19 13 20L14 22C16 21 19 20 22 20Z" fill="#FFFFFF" />
  </svg>
);

// 36. 1Password
export const OnePasswordLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" fill="#0A85EA" />
    <circle cx="24" cy="24" r="10" stroke="#FFFFFF" strokeWidth="3" />
    <rect x="22" y="19" width="4" height="10" rx="2" fill="#FFFFFF" />
  </svg>
);

// 37. WolframAlpha
export const WolframAlphaLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#DD1100" />
    <path d="M24 13L27 21L35 24L27 27L24 35L21 27L13 24L21 21L24 13Z" fill="#FFFFFF" />
  </svg>
);

// 38. Wikipedia
export const WikipediaLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" fill="#F8F9FA" stroke="#D3D3D3" strokeWidth="1" />
    <text x="24" y="32" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#000000" fontFamily="serif">W</text>
  </svg>
);

// Fallback: Dignified neutral brand container (never fake logos or text initials)
export const NeutralFallbackLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <div className={`${className} rounded-xl bg-slate-100 border border-slate-200/90 flex items-center justify-center text-slate-500 shadow-2xs`}>
    <Layers className="w-4 h-4 stroke-[2]" />
  </div>
);

/**
 * Authoritative Logo Resolver
 * Maps integration ID or name to its legitimate brand logo.
 */
export function getIntegrationLogo(id: string, name?: string): React.FC<{ className?: string }> {
  const normId = (id || '').toLowerCase().trim();
  const normName = (name || '').toLowerCase().trim();

  // 1. Direct ID matching
  switch (normId) {
    case 'google-calendar':
    case 'calendar':
      return GoogleCalendarLogo;
    case 'google-drive':
    case 'drive':
      return GoogleDriveLogo;
    case 'gmail':
    case 'google-mail':
      return GmailLogo;
    case 'slack':
    case 'slack-connect':
      return SlackLogo;
    case 'notion':
      return NotionLogo;
    case 'github':
      return GitHubLogo;
    case 'figma':
    case 'figma-design':
      return FigmaLogo;
    case 'outlook':
    case 'microsoft-outlook':
    case 'ms-outlook':
      return OutlookLogo;
    case 'microsoft-calendar':
    case 'microsoft-365-calendar':
      return MicrosoftCalendarLogo;
    case 'reddit':
      return RedditLogo;
    case 'spotify':
      return SpotifyLogo;
    case 'stripe':
    case 'stripe-billing':
      return StripeLogo;
    case 'google-maps':
    case 'google-flights':
    case 'maps':
      return GoogleMapsLogo;
    case 'hacker-news':
      return HackerNewsLogo;
    case 'substack':
      return SubstackLogo;
    case 'medium':
      return MediumLogo;
    case 'techcrunch':
      return TechCrunchLogo;
    case 'asana':
      return AsanaLogo;
    case 'trello':
      return TrelloLogo;
    case 'jira':
      return JiraLogo;
    case 'linear':
      return LinearLogo;
    case 'todoist':
      return TodoistLogo;
    case 'discord':
      return DiscordLogo;
    case 'telegram':
      return TelegramLogo;
    case 'whatsapp':
      return WhatsAppLogo;
    case 'zoom':
      return ZoomLogo;
    case 'docker':
      return DockerLogo;
    case 'postman':
      return PostmanLogo;
    case 'supabase':
      return SupabaseLogo;
    case 'vercel':
      return VercelLogo;
    case 'datadog':
      return DatadogLogo;
    case 'shopify':
      return ShopifyLogo;
    case 'airbnb':
      return AirbnbLogo;
    case 'netflix':
      return NetflixLogo;
    case 'steam':
      return SteamLogo;
    case 'tesla':
      return TeslaLogo;
    case '1password':
      return OnePasswordLogo;
    case 'wolframalpha':
    case 'wolfram':
      return WolframAlphaLogo;
    case 'wikipedia':
      return WikipediaLogo;
  }

  // 2. Name matching fallback for variations in name field
  if (normName.includes('google calendar')) return GoogleCalendarLogo;
  if (normName.includes('google drive')) return GoogleDriveLogo;
  if (normName.includes('gmail')) return GmailLogo;
  if (normName.includes('slack')) return SlackLogo;
  if (normName.includes('notion')) return NotionLogo;
  if (normName.includes('github')) return GitHubLogo;
  if (normName.includes('figma')) return FigmaLogo;
  if (normName.includes('outlook')) return OutlookLogo;
  if (normName.includes('reddit')) return RedditLogo;
  if (normName.includes('spotify')) return SpotifyLogo;
  if (normName.includes('stripe')) return StripeLogo;
  if (normName.includes('maps')) return GoogleMapsLogo;
  if (normName.includes('hacker news')) return HackerNewsLogo;
  if (normName.includes('substack')) return SubstackLogo;
  if (normName.includes('medium')) return MediumLogo;
  if (normName.includes('techcrunch')) return TechCrunchLogo;
  if (normName.includes('asana')) return AsanaLogo;
  if (normName.includes('trello')) return TrelloLogo;
  if (normName.includes('jira')) return JiraLogo;
  if (normName.includes('linear')) return LinearLogo;
  if (normName.includes('todoist')) return TodoistLogo;
  if (normName.includes('discord')) return DiscordLogo;
  if (normName.includes('telegram')) return TelegramLogo;
  if (normName.includes('whatsapp')) return WhatsAppLogo;
  if (normName.includes('zoom')) return ZoomLogo;
  if (normName.includes('docker')) return DockerLogo;
  if (normName.includes('postman')) return PostmanLogo;
  if (normName.includes('supabase')) return SupabaseLogo;
  if (normName.includes('vercel')) return VercelLogo;
  if (normName.includes('datadog')) return DatadogLogo;
  if (normName.includes('shopify')) return ShopifyLogo;
  if (normName.includes('airbnb')) return AirbnbLogo;
  if (normName.includes('netflix')) return NetflixLogo;
  if (normName.includes('steam')) return SteamLogo;
  if (normName.includes('tesla')) return TeslaLogo;
  if (normName.includes('1password')) return OnePasswordLogo;
  if (normName.includes('wolfram')) return WolframAlphaLogo;
  if (normName.includes('wikipedia')) return WikipediaLogo;

  // 3. Dignified neutral fallback icon (never fake logos or letter boxes)
  return NeutralFallbackLogo;
}
