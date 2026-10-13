import React, { useEffect, useState } from 'react';
import { Boxes, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { listIntegrations } from '../api/client';
import { Integration } from '../types';

export const IntegrationsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIntegrations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listIntegrations();
      setIntegrations(data.integrations || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const getStatusBadge = (status: string, isSynthetic: number) => {
    if (status === 'DEMO') {
      return <Badge variant="demo">Demo Data</Badge>;
    }
    if (status === 'AVAILABLE') {
      return <Badge variant="neutral">Available</Badge>;
    }
    if (status === 'CONNECTED' && !isSynthetic) {
      return <Badge variant="success">Authenticated</Badge>;
    }
    return <Badge variant="neutral">Not Connected</Badge>;
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Boxes className="w-6 h-6 text-blue-600" />
            <span>Connectors & Integrations</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Audit third-party workspace services with strictly honest connection badges.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={loadIntegrations} className="flex items-center space-x-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Loading integration audit records from SQLite...</p>
        </div>
      ) : error ? (
        <Card variant="light" className="p-8 text-center border-rose-200 bg-rose-50/50">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-rose-900">Failed to load integrations</h3>
          <p className="text-xs text-rose-600 mt-1">{error}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((item) => (
            <Card key={item.id} variant="light" className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm">
                  {item.name.charAt(0)}
                </div>
                {getStatusBadge(item.status, item.is_synthetic)}
              </div>
              <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Category: {item.category}</p>
              {item.account_email && (
                <p className="text-[11px] font-mono text-slate-400 mt-2 truncate">
                  Account: {item.account_email}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
