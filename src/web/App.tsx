import React from 'react';
import { RouterProvider, useRouter } from './state/router';
import { AppLayout } from './layouts/AppLayout';
import { HomePage } from './pages/HomePage';
import { NewConversationPage } from './pages/NewConversationPage';
import { MissionsPage } from './pages/MissionsPage';
import { MissionDetailPage } from './pages/MissionDetailPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { ToolsPage } from './pages/ToolsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { ActivityPage } from './pages/ActivityPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { path } = useRouter();

  const renderCurrentPage = () => {
    if (path.startsWith('/missions/')) {
      return <MissionDetailPage />;
    }

    switch (path) {
      case '/':
      case '/home':
        return <HomePage />;
      case '/new':
        return <NewConversationPage />;
      case '/missions':
        return <MissionsPage />;
      case '/knowledge':
        return <KnowledgePage />;
      case '/tools':
        return <ToolsPage />;
      case '/integrations':
        return <IntegrationsPage />;
      case '/activity':
        return <ActivityPage />;
      case '/settings':
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };

  return <AppLayout>{renderCurrentPage()}</AppLayout>;
};

export const App: React.FC = () => {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
};
