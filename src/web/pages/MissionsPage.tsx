import React, { useEffect, useState } from 'react';
import { Compass, Clock, CheckCircle2, AlertCircle, PlayCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { listMissions } from '../api/client';
import { Mission } from '../types';
import { useRouter } from '../state/router';
import { formatDate, formatDuration } from '../lib/utils';

export const MissionsPage: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { navigate } = useRouter();

  const loadMissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listMissions();
      setMissions(data.missions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMissions();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'EXECUTING':
      case 'PLANNING':
      case 'UNDERSTANDING':
      case 'VERIFYING':
        return <Badge variant="warning">In Progress</Badge>;
      case 'FAILED':
        return <Badge variant="error">Failed</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Compass className="w-6 h-6 text-blue-600" />
            <span>Autonomous Missions</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Audit and inspect multi-step agent objectives executed across MCP tools.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadMissions}
            className="flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/new')}
          >
            + New Mission
          </Button>
        </div>
      </div>

      {/* Content Feed */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Loading persisted missions from SQLite...</p>
        </div>
      ) : error ? (
        <Card variant="light" className="p-8 text-center border-rose-200 bg-rose-50/50">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-rose-900">Failed to load missions</h3>
          <p className="text-xs text-rose-600 mt-1">{error}</p>
          <Button variant="secondary" size="sm" onClick={loadMissions} className="mt-4">
            Try Again
          </Button>
        </Card>
      ) : missions.length === 0 ? (
        <Card variant="light" className="p-12 text-center text-slate-500">
          <Compass className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No missions found</h3>
          <p className="text-xs text-slate-500 mt-1">Dispatch your first autonomous objective to view live traces.</p>
          <Button variant="primary" size="sm" onClick={() => navigate('/new')} className="mt-4">
            Create Goal
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {missions.map((m) => (
            <Card
              key={m.id}
              variant="light"
              className="hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
              onClick={() => navigate(`/missions/${m.id}`)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center space-x-2.5 mb-1">
                    {getStatusBadge(m.status)}
                    <span className="text-xs font-mono text-slate-400">ID: {m.id}</span>
                    <span className="text-xs text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(m.created_at)}</span>
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 truncate">
                    {m.title || m.goal}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {m.goal}
                  </p>
                </div>

                <div className="flex items-center space-x-3 flex-shrink-0">
                  <span className="text-xs font-medium text-slate-500">
                    {formatDuration(m.duration_ms)}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
