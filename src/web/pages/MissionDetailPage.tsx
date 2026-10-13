import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Compass, CheckCircle2, XCircle, Wrench, ShieldCheck, Terminal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { getMission } from '../api/client';
import { Mission } from '../types';
import { useRouter } from '../state/router';
import { formatDate, formatDuration } from '../lib/utils';

export const MissionDetailPage: React.FC = () => {
  const { params, navigate } = useRouter();
  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    setIsLoading(true);
    getMission(params.id)
      .then(setMission)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs">Loading mission details...</p>
      </div>
    );
  }

  if (error || !mission) {
    return (
      <div className="p-10 max-w-2xl mx-auto text-center space-y-4">
        <p className="text-sm text-rose-600">Failed to load mission: {error || 'Not found'}</p>
        <Button variant="secondary" onClick={() => navigate('/missions')}>
          Back to Missions
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      {/* Back button and breadcrumb */}
      <div className="flex items-center space-x-3 text-xs text-slate-500">
        <button
          onClick={() => navigate('/missions')}
          className="flex items-center space-x-1 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Missions</span>
        </button>
        <span>/</span>
        <span className="font-mono text-slate-400">{mission.id}</span>
      </div>

      {/* Header Card */}
      <Card variant="light" className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <Badge variant={mission.status === 'COMPLETED' ? 'success' : mission.status === 'FAILED' ? 'error' : 'warning'}>
                {mission.status}
              </Badge>
              <span className="text-xs text-slate-400 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Duration: {formatDuration(mission.duration_ms)}</span>
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{mission.title || mission.goal}</h1>
            <p className="mt-1 text-xs text-slate-600">{mission.goal}</p>
          </div>
        </div>
      </Card>

      {/* Steps & Tool Executions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Planned Steps */}
        <Card variant="light">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center space-x-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Milestone Steps ({mission.steps?.length || 0})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {mission.steps?.map((step) => (
              <div key={step.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start space-x-3">
                <div className="mt-0.5">
                  {step.status === 'COMPLETED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : step.status === 'FAILED' ? (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-900">{step.label}</div>
                  <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                    <span>{step.domain}</span>
                    {step.assigned_tool && <span>• Tool: {step.assigned_tool}</span>}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Real Tool Traces */}
        <Card variant="light">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-indigo-600" />
              <span>Executed Tool Traces ({mission.toolExecutions?.length || 0})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {mission.toolExecutions?.map((te) => (
              <div key={te.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-900 flex items-center space-x-1.5">
                    <Terminal className="w-3.5 h-3.5 text-blue-600" />
                    <span>{te.tool_name}</span>
                  </span>
                  <Badge variant={te.status === 'COMPLETED' ? 'success' : 'error'} size="sm">
                    {te.status}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  Duration: {formatDuration(te.duration_ms)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Synthesized Answer */}
      {mission.result_summary && (
        <Card variant="light" className="p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Grounded Synthesis & Result</span>
          </h3>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
            {mission.result_summary}
          </div>
        </Card>
      )}
    </div>
  );
};
