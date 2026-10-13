import React, { useEffect, useState } from 'react';
import { BarChart2, RefreshCw, AlertCircle, Clock, Terminal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { getActivity } from '../api/client';
import { ActivityResponse } from '../types';
import { formatDate } from '../lib/utils';

export const ActivityPage: React.FC = () => {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivity = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getActivity({ limit: 30 });
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
  }, []);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <BarChart2 className="w-6 h-6 text-blue-600" />
            <span>Activity & Audit Telemetry</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Real audit logs, tool executions, and aggregate metrics from SQLite records.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={loadActivity} className="flex items-center space-x-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Aggregating telemetry from SQLite...</p>
        </div>
      ) : error ? (
        <Card variant="light" className="p-8 text-center border-rose-200 bg-rose-50/50">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-rose-900">Failed to load activity</h3>
          <p className="text-xs text-rose-600 mt-1">{error}</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Aggregate Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card variant="light" className="p-4">
              <span className="text-xs text-slate-500 font-medium">Total Activities</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{data?.metrics.totalActivities ?? 0}</div>
            </Card>
            <Card variant="light" className="p-4">
              <span className="text-xs text-slate-500 font-medium">Missions Executed</span>
              <div className="text-2xl font-bold text-blue-600 mt-1">{data?.metrics.missionsCount ?? 0}</div>
            </Card>
            <Card variant="light" className="p-4">
              <span className="text-xs text-slate-500 font-medium">Tool Actions</span>
              <div className="text-2xl font-bold text-indigo-600 mt-1">{data?.metrics.toolActionsCount ?? 0}</div>
            </Card>
            <Card variant="light" className="p-4">
              <span className="text-xs text-slate-500 font-medium">Authenticated Integrations</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{data?.metrics.integrationsCount ?? 0}</div>
            </Card>
          </div>

          {/* Recent Event Log Table */}
          <Card variant="light">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Audit Event Log ({data?.events.length || 0})</CardTitle>
            </CardHeader>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {data?.events.map((evt) => (
                <div key={evt.id} className="p-3.5 flex items-start justify-between text-xs hover:bg-slate-50/50 transition-colors">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={evt.status === 'SUCCESS' ? 'success' : evt.status === 'ERROR' ? 'error' : 'info'} size="sm">
                        {evt.event_type}
                      </Badge>
                      <span className="text-slate-400 font-mono text-[10px]">{evt.id}</span>
                      <span className="text-slate-400 text-[11px] flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(evt.created_at)}</span>
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900">{evt.title}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5 truncate">{evt.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
