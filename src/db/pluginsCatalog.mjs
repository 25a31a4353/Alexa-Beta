// Complete 17-Category Plugins & Integrations Catalog
// Aligned with the ChatGPT Plugins & Extensions standard hierarchy

export const PLUGIN_CATEGORIES = [
  'Popular',
  'News & Information',
  'Smart Workplace',
  'Productivity',
  'Communication',
  'Creativity',
  'Developer Tools',
  'Healthcare',
  'Finance',
  'Travel',
  'Entertainment',
  'Education',
  'Business & Operations',
  'Data & Analytics',
  'Automotive',
  'Security',
  'Other'
];

export const PLUGINS_CATALOG = [
  // ==========================================
  // 1. POPULAR
  // ==========================================
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    category: 'Popular',
    description: 'Real-time schedule lookup, meeting preparation intelligence, and calendar reminders.',
    status: 'DEMO',
    account_email: 'shanmukheswaramedicharla@gmail.com',
    is_synthetic: 1,
    mcpTool: 'calendar_get_events',
    domain: 'Productivity / Calendar',
    authType: 'DEMO_SIMULATION'
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    category: 'Popular',
    description: 'Cloud document retrieval, roadmaps indexing, and semantic file search.',
    status: 'DEMO',
    account_email: 'shanmukheswaramedicharla@gmail.com',
    is_synthetic: 1,
    mcpTool: 'knowledge_search / document_analyze',
    domain: 'Knowledge / Document Index',
    authType: 'DEMO_SIMULATION'
  },
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'Popular',
    description: 'Email client, message drafting, inbox thread search, and automated follow-ups.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'gmail_query_inbox (Planned)',
    domain: 'Communication / Email',
    authType: 'OAUTH2'
  },
  {
    id: 'reddit',
    name: 'Reddit',
    category: 'Popular',
    description: 'Community sentiment analysis, trending subreddits, and technical discussion search.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'reddit_search_posts (Planned)',
    domain: 'Community / Social',
    authType: 'OAUTH2'
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'Popular',
    description: 'Repository inspection, issue tracking, commit telemetry, and pull request reviews.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'github_repo_inspect (Planned)',
    domain: 'Development / VCS',
    authType: 'APP_TOKEN'
  },
  {
    id: 'typeform',
    name: 'Typeform',
    category: 'Popular',
    description: 'Interactive forms, conversational data collection, and customer survey ingestion.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'typeform_get_responses (Planned)',
    domain: 'Forms / Research',
    authType: 'API_KEY'
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    category: 'Popular',
    description: 'Microsoft 365 enterprise email, inbox triage, and calendar availability coordination.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'outlook_get_messages (Planned)',
    domain: 'Communication / Email',
    authType: 'MICROSOFT_GRAPH'
  },

  // ==========================================
  // 2. NEWS & INFORMATION
  // ==========================================
  {
    id: 'hacker-news',
    name: 'Hacker News',
    category: 'News & Information',
    description: 'Top technology articles, community discussions, and startup launch alerts.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'hn_get_top_stories (Planned)',
    domain: 'News / Tech',
    authType: 'API_KEY'
  },
  {
    id: 'reuters',
    name: 'Reuters',
    category: 'News & Information',
    description: 'Global financial reporting, macroeconomic indices, and international news dispatches.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'reuters_get_headlines (Planned)',
    domain: 'News / Finance',
    authType: 'API_KEY'
  },
  {
    id: 'substack',
    name: 'Substack',
    category: 'News & Information',
    description: 'Curated technical newsletters, author publications, and domain deep dives.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'substack_read_feed (Planned)',
    domain: 'News / Publications',
    authType: 'API_KEY'
  },
  {
    id: 'flipboard',
    name: 'Flipboard',
    category: 'News & Information',
    description: 'Personalized industry magazines, topic discovery, and story syndication.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'flipboard_fetch_magazine (Planned)',
    domain: 'News / Aggregator',
    authType: 'API_KEY'
  },
  {
    id: 'medium',
    name: 'Medium',
    category: 'News & Information',
    description: 'Software architecture publications, technical blogs, and engineering insights.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'medium_search_articles (Planned)',
    domain: 'News / Publishing',
    authType: 'OAUTH2'
  },
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    category: 'News & Information',
    description: 'Venture capital deals, seed funding rounds, and emerging artificial intelligence coverage.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'techcrunch_get_disrupt (Planned)',
    domain: 'News / Venture',
    authType: 'API_KEY'
  },

  // ==========================================
  // 3. SMART WORKPLACE
  // ==========================================
  {
    id: 'dropbox',
    name: 'Dropbox',
    category: 'Smart Workplace',
    description: 'Distributed cloud file storage, team asset synchronization, and paper docs.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'dropbox_search_files (Planned)',
    domain: 'Storage / Files',
    authType: 'OAUTH2'
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'Smart Workplace',
    description: 'Inbound marketing campaigns, CRM contacts, and sales deal pipeline tracking.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'hubspot_query_deals (Planned)',
    domain: 'CRM / Marketing',
    authType: 'OAUTH2'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'Smart Workplace',
    description: 'Payment gateway transactions, billing subscriptions, and customer invoice records.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'stripe_list_charges (Planned)',
    domain: 'Finance / Billing',
    authType: 'API_KEY'
  },
  {
    id: 'canva',
    name: 'Canva',
    category: 'Smart Workplace',
    description: 'Presentation decks, brand identity templates, and collaborative marketing assets.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'canva_get_designs (Planned)',
    domain: 'Design / Assets',
    authType: 'OAUTH2'
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    category: 'Smart Workplace',
    description: 'Customer support tickets, SLA performance metrics, and knowledge base triage.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'zendesk_list_tickets (Planned)',
    domain: 'Support / Service',
    authType: 'API_KEY'
  },
  {
    id: 'figma',
    name: 'Figma',
    category: 'Smart Workplace',
    description: 'Collaborative UI design files, vector wireframes, and design token inspection.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'figma_get_file (Planned)',
    domain: 'Design / Prototyping',
    authType: 'APP_TOKEN'
  },

  // ==========================================
  // 4. PRODUCTIVITY
  // ==========================================
  {
    id: 'notion',
    name: 'Notion',
    category: 'Productivity',
    description: 'Connected workspaces, project roadmaps, sprint tasks, and structured databases.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'notion_query_database (Planned)',
    domain: 'Productivity / Wiki',
    authType: 'API_KEY'
  },
  {
    id: 'todoist',
    name: 'Todoist',
    category: 'Productivity',
    description: 'Prioritized daily task checklists, project boards, and recurring reminder schedules.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'todoist_sync_tasks (Planned)',
    domain: 'Productivity / Tasks',
    authType: 'API_KEY'
  },
  {
    id: 'clockify',
    name: 'Clockify',
    category: 'Productivity',
    description: 'Billable time tracking, team timesheet audits, and project duration logs.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'clockify_log_entry (Planned)',
    domain: 'Productivity / Time',
    authType: 'API_KEY'
  },
  {
    id: 'asana',
    name: 'Asana',
    category: 'Productivity',
    description: 'Cross-functional project management, team milestone tracking, and task dependencies.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'asana_get_tasks (Planned)',
    domain: 'Productivity / PM',
    authType: 'OAUTH2'
  },
  {
    id: 'trello',
    name: 'Trello',
    category: 'Productivity',
    description: 'Kanban boards, list columns, workflow card automation, and team assignees.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'trello_get_cards (Planned)',
    domain: 'Productivity / Kanban',
    authType: 'OAUTH2'
  },
  {
    id: 'linear',
    name: 'Linear',
    category: 'Productivity',
    description: 'High-speed software issue tracking, cycle management, and roadmap synchronization.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'linear_list_issues (Planned)',
    domain: 'Productivity / Agile',
    authType: 'API_KEY'
  },

  // ==========================================
  // 5. COMMUNICATION
  // ==========================================
  {
    id: 'slack',
    name: 'Slack',
    category: 'Communication',
    description: 'Team channels, instant messaging, bot alert dispatch, and notification webhooks.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'slack_post_message (Planned)',
    domain: 'Communication / Chat',
    authType: 'OAUTH2'
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    category: 'Communication',
    description: 'Enterprise video conferences, group channels, direct calls, and calendar sync.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'teams_send_notification (Planned)',
    domain: 'Communication / Teams',
    authType: 'MICROSOFT_GRAPH'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    category: 'Communication',
    description: 'End-to-end encrypted direct messaging and automated customer notification dispatch.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'whatsapp_send_alert (Planned)',
    domain: 'Communication / Mobile',
    authType: 'API_KEY'
  },
  {
    id: 'zoom',
    name: 'Zoom',
    category: 'Communication',
    description: 'Cloud video meeting scheduling, participant invitations, and audio transcription.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'zoom_create_meeting (Planned)',
    domain: 'Communication / Video',
    authType: 'OAUTH2'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    category: 'Communication',
    description: 'Broadcast channel publishing, automated bot handlers, and encrypted chats.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'telegram_send_msg (Planned)',
    domain: 'Communication / Bot',
    authType: 'API_KEY'
  },
  {
    id: 'discord',
    name: 'Discord',
    category: 'Communication',
    description: 'Developer voice channels, community guild moderation, and webhook alerts.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'discord_post_embed (Planned)',
    domain: 'Communication / Guild',
    authType: 'APP_TOKEN'
  },

  // ==========================================
  // 6. CREATIVITY
  // ==========================================
  {
    id: 'midjourney',
    name: 'Midjourney',
    category: 'Creativity',
    description: 'Generative AI photorealistic concept rendering, digital art, and lighting presets.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'midjourney_generate_image (Planned)',
    domain: 'Generative AI / Art',
    authType: 'API_KEY'
  },
  {
    id: 'runway',
    name: 'Runway',
    category: 'Creativity',
    description: 'Gen-2 generative video synthesis, text-to-video motion control, and multi-track editing.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'runway_generate_video (Planned)',
    domain: 'Generative AI / Video',
    authType: 'API_KEY'
  },
  {
    id: 'adobe-creative',
    name: 'Adobe Creative Cloud',
    category: 'Creativity',
    description: 'Photoshop, Illustrator, and Premiere Pro cloud libraries and vector asset synchronization.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'adobe_sync_libraries (Planned)',
    domain: 'Creative / Suite',
    authType: 'OAUTH2'
  },
  {
    id: 'ray-ban-meta',
    name: 'Ray-Ban Meta',
    category: 'Creativity',
    description: 'Smart glasses camera imagery sync, hands-free video recording, and audio notes.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'meta_fetch_media (Planned)',
    domain: 'Wearables / Vision',
    authType: 'OAUTH2'
  },
  {
    id: 'dall-e',
    name: 'DALL-E 3',
    category: 'Creativity',
    description: 'High-fidelity visual illustration, logo concept drafting, and image expansions.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'dalle_create_image (Planned)',
    domain: 'Generative AI / Images',
    authType: 'API_KEY'
  },
  {
    id: 'flaticon',
    name: 'Flaticon & SVG Repo',
    category: 'Creativity',
    description: 'Vector icon repository search, UI sticker catalogs, and SVG design downloads.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'flaticon_search_icons (Planned)',
    domain: 'Design / Assets',
    authType: 'API_KEY'
  },

  // ==========================================
  // 7. DEVELOPER TOOLS
  // ==========================================
  {
    id: 'replit',
    name: 'Replit',
    category: 'Developer Tools',
    description: 'Interactive cloud development environments, instant deployments, and sandboxes.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'replit_run_code (Planned)',
    domain: 'Development / Cloud IDE',
    authType: 'API_KEY'
  },
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'Developer Tools',
    description: 'Frontend edge deployments, serverless function logs, and preview domains.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'vercel_get_deployments (Planned)',
    domain: 'DevOps / Hosting',
    authType: 'APP_TOKEN'
  },
  {
    id: 'supabase',
    name: 'Supabase',
    category: 'Developer Tools',
    description: 'PostgreSQL database queries, Row Level Security rules, and real-time storage.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'supabase_query_db (Planned)',
    domain: 'Database / BaaS',
    authType: 'API_KEY'
  },
  {
    id: 'postman',
    name: 'Postman',
    category: 'Developer Tools',
    description: 'REST and GraphQL API collections, automated contract runs, and mock servers.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'postman_run_collection (Planned)',
    domain: 'Development / Testing',
    authType: 'API_KEY'
  },
  {
    id: 'docker',
    name: 'Docker',
    category: 'Developer Tools',
    description: 'Container registry builds, image inspection, and microservice container lifecycles.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'docker_inspect_container (Planned)',
    domain: 'DevOps / Containers',
    authType: 'APP_TOKEN'
  },
  {
    id: 'datadog',
    name: 'Datadog',
    category: 'Developer Tools',
    description: 'Full-stack infrastructure telemetry, distributed APM traces, and synthetic tests.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'datadog_query_metrics (Planned)',
    domain: 'Observability / APM',
    authType: 'API_KEY'
  },

  // ==========================================
  // 8. HEALTHCARE
  // ==========================================
  {
    id: 'ada-health',
    name: 'Ada Health',
    category: 'Healthcare',
    description: 'Medical symptom assessment, clinical triage guidance, and health condition lookup.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'ada_assess_symptoms (Planned)',
    domain: 'Healthcare / Triage',
    authType: 'API_KEY'
  },
  {
    id: 'whoop',
    name: 'WHOOP',
    category: 'Healthcare',
    description: 'Physiological cardiovascular strain score, recovery percentage, and sleep duration.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'whoop_get_recovery (Planned)',
    domain: 'Biometrics / Fitness',
    authType: 'OAUTH2'
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    category: 'Healthcare',
    description: 'Daily step counts, active heart rate zones, and workout summary telemetry.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'fitbit_get_activity (Planned)',
    domain: 'Biometrics / Wearables',
    authType: 'OAUTH2'
  },
  {
    id: 'strava',
    name: 'Strava',
    category: 'Healthcare',
    description: 'GPS running routes, cycling splits, elevation profiles, and segment leaderboards.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'strava_list_activities (Planned)',
    domain: 'Fitness / Tracking',
    authType: 'OAUTH2'
  },
  {
    id: 'calm',
    name: 'Calm',
    category: 'Healthcare',
    description: 'Guided mindfulness meditations, sleep soundscapes, and stress reduction exercises.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'calm_play_session (Planned)',
    domain: 'Wellness / Mindfulness',
    authType: 'API_KEY'
  },
  {
    id: 'oura',
    name: 'Oura Ring',
    category: 'Healthcare',
    description: 'Circadian readiness score, skin temperature variation, and REM sleep metrics.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'oura_get_sleep_score (Planned)',
    domain: 'Biometrics / Sleep',
    authType: 'OAUTH2'
  },

  // ==========================================
  // 9. FINANCE
  // ==========================================
  {
    id: 'bloomberg',
    name: 'Bloomberg Terminal',
    category: 'Finance',
    description: 'Institutional financial markets, equity indices, sovereign yields, and macro news.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'bloomberg_query_quote (Planned)',
    domain: 'Finance / Markets',
    authType: 'API_KEY'
  },
  {
    id: 'robinhood',
    name: 'Robinhood',
    category: 'Finance',
    description: 'Commission-free stock quotes, ETF holdings, option contracts, and portfolio balances.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'robinhood_get_portfolio (Planned)',
    domain: 'Finance / Trading',
    authType: 'OAUTH2'
  },
  {
    id: 'binance',
    name: 'Binance',
    category: 'Finance',
    description: 'Cryptocurrency spot order books, BTC/ETH price tickers, and 24h trading volume.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'binance_ticker_price (Planned)',
    domain: 'Crypto / Exchange',
    authType: 'API_KEY'
  },
  {
    id: 'tradingview',
    name: 'TradingView',
    category: 'Finance',
    description: 'Interactive technical charts, moving average indicators, and candlestick patterns.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'tradingview_get_indicators (Planned)',
    domain: 'Finance / Technical',
    authType: 'API_KEY'
  },
  {
    id: 'mint',
    name: 'Mint & Personal Capital',
    category: 'Finance',
    description: 'Aggregate net worth tracking, bank account balances, and monthly budget trends.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'mint_get_networth (Planned)',
    domain: 'Finance / Budgeting',
    authType: 'OAUTH2'
  },
  {
    id: 'financial-datasets',
    name: 'Financial Datasets',
    category: 'Finance',
    description: 'SEC 10-K filings, corporate quarterly earnings, and balance sheet financial statements.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'sec_query_filings (Planned)',
    domain: 'Finance / SEC Data',
    authType: 'API_KEY'
  },

  // ==========================================
  // 10. TRAVEL
  // ==========================================
  {
    id: 'booking',
    name: 'Booking.com',
    category: 'Travel',
    description: 'Global hotel accommodations, city apartments, nightly pricing, and guest reviews.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'booking_search_hotels (Planned)',
    domain: 'Travel / Hotels',
    authType: 'API_KEY'
  },
  {
    id: 'skyscanner',
    name: 'Skyscanner',
    category: 'Travel',
    description: 'Worldwide flight route comparisons, airfare deal alerts, and multi-city itineraries.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'skyscanner_search_flights (Planned)',
    domain: 'Travel / Flights',
    authType: 'API_KEY'
  },
  {
    id: 'expedia',
    name: 'Expedia',
    category: 'Travel',
    description: 'Bundled holiday travel packages, airport rental cars, and resort bookings.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'expedia_search_packages (Planned)',
    domain: 'Travel / Bookings',
    authType: 'API_KEY'
  },
  {
    id: 'trip-com',
    name: 'Trip.com',
    category: 'Travel',
    description: 'High-speed rail train tickets, regional hotel stays, and international flight routes.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'trip_search_trains (Planned)',
    domain: 'Travel / Transit',
    authType: 'API_KEY'
  },
  {
    id: 'flightradar24',
    name: 'Flightradar24',
    category: 'Travel',
    description: 'Real-time aircraft position radar, arrival delay status, and flight trajectory tracking.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'flightradar_get_status (Planned)',
    domain: 'Travel / Radar',
    authType: 'API_KEY'
  },
  {
    id: 'google-maps',
    name: 'Google Maps',
    category: 'Travel',
    description: 'Geocoding, driving navigation routes, traffic delay estimation, and place ratings.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'maps_geocode_route (Planned)',
    domain: 'Data / Navigation',
    authType: 'API_KEY'
  },

  // ==========================================
  // 11. ENTERTAINMENT
  // ==========================================
  {
    id: 'spotify',
    name: 'Spotify',
    category: 'Entertainment',
    description: 'On-demand music streaming, personal playlists, podcast episodes, and artist radio.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'spotify_search_tracks (Planned)',
    domain: 'Media / Audio',
    authType: 'OAUTH2'
  },
  {
    id: 'apple-music',
    name: 'Apple Music',
    category: 'Entertainment',
    description: 'Lossless spatial audio streaming, Apple Music 1 radio broadcasts, and curated mixes.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'applemusic_search (Planned)',
    domain: 'Media / Music',
    authType: 'APP_TOKEN'
  },
  {
    id: 'letterboxd',
    name: 'Letterboxd',
    category: 'Entertainment',
    description: 'Film diary logging, cinema star ratings, community reviews, and watchlist tracking.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'letterboxd_get_watchlist (Planned)',
    domain: 'Media / Cinema',
    authType: 'API_KEY'
  },
  {
    id: 'tidal',
    name: 'Tidal',
    category: 'Entertainment',
    description: 'HiFi Master Quality audio streaming and direct artist revenue sharing playlists.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'tidal_get_playlists (Planned)',
    domain: 'Media / HiFi Audio',
    authType: 'OAUTH2'
  },
  {
    id: 'bandsintown',
    name: 'Bandsintown',
    category: 'Entertainment',
    description: 'Live concert tour schedules, regional festival dates, and ticket on-sale notifications.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'bandsintown_get_events (Planned)',
    domain: 'Live / Concerts',
    authType: 'API_KEY'
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    category: 'Entertainment',
    description: 'Independent creator audio uploads, DJ mixes, community comments, and electronic beats.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'soundcloud_search_tracks (Planned)',
    domain: 'Media / Indie Audio',
    authType: 'OAUTH2'
  },

  // ==========================================
  // 12. EDUCATION
  // ==========================================
  {
    id: 'coursera',
    name: 'Coursera',
    category: 'Education',
    description: 'Accredited university degrees, AI specializations, and professional certificate tracks.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'coursera_list_courses (Planned)',
    domain: 'Education / MOOC',
    authType: 'OAUTH2'
  },
  {
    id: 'edx',
    name: 'edX',
    category: 'Education',
    description: 'Ivy League open courseware, computer science micro-masters, and syllabus materials.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'edx_search_programs (Planned)',
    domain: 'Education / Higher Ed',
    authType: 'API_KEY'
  },
  {
    id: 'duolingo',
    name: 'Duolingo',
    category: 'Education',
    description: 'Bite-sized language learning drills, daily streak counters, and vocabulary lessons.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'duolingo_get_progress (Planned)',
    domain: 'Education / Languages',
    authType: 'API_KEY'
  },
  {
    id: 'khan-academy',
    name: 'Khan Academy',
    category: 'Education',
    description: 'Free instructional math and science video libraries with step-by-step practice problems.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'khan_search_lessons (Planned)',
    domain: 'Education / K-12 STEM',
    authType: 'API_KEY'
  },
  {
    id: 'wolfram-alpha',
    name: 'Wolfram Alpha',
    category: 'Education',
    description: 'Computational symbolic knowledge engine, differential equation solutions, and chemistry data.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'wolfram_calculate (Planned)',
    domain: 'Computation / Science',
    authType: 'API_KEY'
  },
  {
    id: 'quizlet',
    name: 'Quizlet',
    category: 'Education',
    description: 'Digital flashcard study decks, spaced repetition study sets, and practice exams.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'quizlet_get_deck (Planned)',
    domain: 'Education / Flashcards',
    authType: 'OAUTH2'
  },

  // ==========================================
  // 13. BUSINESS & OPERATIONS
  // ==========================================
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'Business & Operations',
    description: 'E-commerce merchant catalog sync, live inventory tracking, and order fulfillment status.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'shopify_list_orders (Planned)',
    domain: 'Commerce / Storefront',
    authType: 'APP_TOKEN'
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'Business & Operations',
    description: 'Enterprise CRM accounts, opportunities pipeline, sales leads, and revenue forecasting.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'salesforce_query_leads (Planned)',
    domain: 'Enterprise / CRM',
    authType: 'OAUTH2'
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    category: 'Business & Operations',
    description: 'Corporate profit-and-loss statements, expense receipts, and payroll accounts.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'quickbooks_query_invoices (Planned)',
    domain: 'Accounting / Tax',
    authType: 'OAUTH2'
  },
  {
    id: 'hubspot-sales',
    name: 'HubSpot Sales',
    category: 'Business & Operations',
    description: 'Outbound sales sequence campaigns, prospect activity tracking, and meeting bookings.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'hubspot_sales_pipelines (Planned)',
    domain: 'Sales / Pipeline',
    authType: 'OAUTH2'
  },
  {
    id: 'stripe-billing',
    name: 'Stripe Billing',
    category: 'Business & Operations',
    description: 'SaaS recurring subscription plans, customer checkout sessions, and payment dispute logs.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'stripe_list_subscriptions (Planned)',
    domain: 'Billing / SaaS',
    authType: 'API_KEY'
  },
  {
    id: 'workday',
    name: 'Workday',
    category: 'Business & Operations',
    description: 'Enterprise human capital management, PTO holiday approvals, and organizational roster.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'workday_get_org_chart (Planned)',
    domain: 'Enterprise / HR',
    authType: 'OAUTH2'
  },

  // ==========================================
  // 14. DATA & ANALYTICS
  // ==========================================
  {
    id: 'tableau',
    name: 'Tableau',
    category: 'Data & Analytics',
    description: 'Executive business intelligence dashboards, KPI chart worksheets, and visual data models.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'tableau_query_workbook (Planned)',
    domain: 'Analytics / BI',
    authType: 'API_KEY'
  },
  {
    id: 'power-bi',
    name: 'Microsoft Power BI',
    category: 'Data & Analytics',
    description: 'Microsoft enterprise reports, DAX query execution, and interactive dataset views.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'powerbi_get_reports (Planned)',
    domain: 'Analytics / Reporting',
    authType: 'MICROSOFT_GRAPH'
  },
  {
    id: 'snowflake',
    name: 'Snowflake',
    category: 'Data & Analytics',
    description: 'Cloud analytical data warehouse, secure data shares, and petabyte-scale SQL queries.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'snowflake_execute_sql (Planned)',
    domain: 'Warehouse / SQL',
    authType: 'API_KEY'
  },
  {
    id: 'datadog-metrics',
    name: 'Datadog Metrics',
    category: 'Data & Analytics',
    description: 'Real-time system telemetry, microservice error rates, and infrastructure anomalies.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'datadog_get_timeseries (Planned)',
    domain: 'Metrics / Monitoring',
    authType: 'API_KEY'
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    category: 'Data & Analytics',
    description: 'Product behavioral analytics, user retention cohorts, and conversion funnel drops.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'mixpanel_query_funnel (Planned)',
    domain: 'Product / Funnels',
    authType: 'API_KEY'
  },
  {
    id: 'bigquery',
    name: 'Google BigQuery',
    category: 'Data & Analytics',
    description: 'Serverless machine learning datasets, SQL partitioned tables, and query execution.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'bigquery_query_dataset (Planned)',
    domain: 'Cloud / Big Data',
    authType: 'OAUTH2'
  },

  // ==========================================
  // 15. AUTOMOTIVE
  // ==========================================
  {
    id: 'porsche',
    name: 'Porsche Connect',
    category: 'Automotive',
    description: 'Remote vehicle telemetry, cabin climate pre-heating, charging state, and door status.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'porsche_get_telemetry (Planned)',
    domain: 'Automotive / EV',
    authType: 'OAUTH2'
  },
  {
    id: 'bmw',
    name: 'BMW ConnectedDrive',
    category: 'Automotive',
    description: 'Real-time vehicle location, fuel range, remote horn flash, and navigation route sync.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'bmw_get_status (Planned)',
    domain: 'Automotive / Telematics',
    authType: 'OAUTH2'
  },
  {
    id: 'mercedes',
    name: 'Mercedes me',
    category: 'Automotive',
    description: 'Digital vehicle key, remote engine start, tire pressure telemetry, and maintenance alerts.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'mercedes_query_vehicle (Planned)',
    domain: 'Automotive / Connected',
    authType: 'OAUTH2'
  },
  {
    id: 'tesla',
    name: 'Tesla',
    category: 'Automotive',
    description: 'Supercharging battery status, remote climate pre-conditioning, Sentry Mode, and summon.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'tesla_vehicle_data (Planned)',
    domain: 'Automotive / EV',
    authType: 'OAUTH2'
  },
  {
    id: 'ford',
    name: 'FordPass',
    category: 'Automotive',
    description: 'Remote vehicle start, oil life percentage, fuel tank level, and scheduled starts.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'ford_get_status (Planned)',
    domain: 'Automotive / Fleet',
    authType: 'OAUTH2'
  },
  {
    id: 'rivian',
    name: 'Rivian',
    category: 'Automotive',
    description: 'Electric adventure truck battery telemetry, gear guard camera status, and route sync.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'rivian_query_state (Planned)',
    domain: 'Automotive / Adventure',
    authType: 'OAUTH2'
  },

  // ==========================================
  // 16. SECURITY
  // ==========================================
  {
    id: 'one-password',
    name: '1Password',
    category: 'Security',
    description: 'Enterprise credential vaults, multi-factor TOTP codes, and passkey authentication.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'onepassword_get_item (Planned)',
    domain: 'Security / Credentials',
    authType: 'APP_TOKEN'
  },
  {
    id: 'bitwarden',
    name: 'Bitwarden',
    category: 'Security',
    description: 'Zero-knowledge end-to-end encrypted password vaults and secure text notes.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'bitwarden_sync_vault (Planned)',
    domain: 'Security / Encryption',
    authType: 'API_KEY'
  },
  {
    id: 'okta',
    name: 'Okta Identity',
    category: 'Security',
    description: 'Enterprise Single Sign-On (SSO), adaptive multi-factor authentication, and user access.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'okta_verify_session (Planned)',
    domain: 'Security / IAM',
    authType: 'OAUTH2'
  },
  {
    id: 'crowdstrike',
    name: 'CrowdStrike Falcon',
    category: 'Security',
    description: 'Cloud endpoint threat telemetry, hostile process detection, and instant host containment.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'crowdstrike_get_alerts (Planned)',
    domain: 'Security / EDR',
    authType: 'API_KEY'
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    category: 'Security',
    description: 'DDoS traffic mitigation, Web Application Firewall (WAF) rules, and Zero Trust access.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'cloudflare_update_dns (Planned)',
    domain: 'Security / WAF',
    authType: 'API_KEY'
  },
  {
    id: 'vanta',
    name: 'Vanta',
    category: 'Security',
    description: 'Automated SOC 2, ISO 27001, and HIPAA compliance audit evidence and test monitoring.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'vanta_get_compliance_tests (Planned)',
    domain: 'Security / Compliance',
    authType: 'API_KEY'
  },

  // ==========================================
  // 17. OTHER
  // ==========================================
  {
    id: 'zapier',
    name: 'Zapier',
    category: 'Other',
    description: 'Automated multi-app workflows, webhook triggers, and cross-platform actions.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'zapier_trigger_zap (Planned)',
    domain: 'Automation / Webhooks',
    authType: 'API_KEY'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'Other',
    description: 'Professional networking profiles, candidate searches, and industry article sharing.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'linkedin_post_update (Planned)',
    domain: 'Social / Professional',
    authType: 'OAUTH2'
  },
  {
    id: 'opentable',
    name: 'OpenTable',
    category: 'Other',
    description: 'Restaurant table reservations, available dining times, and dining party bookings.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'opentable_book_table (Planned)',
    domain: 'Dining / Reservations',
    authType: 'API_KEY'
  },
  {
    id: 'yelp',
    name: 'Yelp',
    category: 'Other',
    description: 'Local business operating hours, customer food reviews, photo galleries, and ratings.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'yelp_search_businesses (Planned)',
    domain: 'Local / Reviews',
    authType: 'API_KEY'
  },
  {
    id: 'web-search',
    name: 'Web Search',
    category: 'Other',
    description: 'Autonomous internet web scraping, live search queries, and real-time link extraction.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'web_search_query (Planned)',
    domain: 'Search / Browsing',
    authType: 'DEMO_SIMULATION'
  },
  {
    id: 'askyourpdf',
    name: 'AskYourPDF',
    category: 'Other',
    description: 'Conversational PDF document analysis, technical manual QA, and citation lookup.',
    status: 'AVAILABLE',
    account_email: null,
    is_synthetic: 1,
    mcpTool: 'askyourpdf_analyze (Planned)',
    domain: 'Documents / QA',
    authType: 'API_KEY'
  }
];
