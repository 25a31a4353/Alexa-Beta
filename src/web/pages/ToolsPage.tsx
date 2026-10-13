import React, { useEffect, useState } from 'react';
import { Wrench, Terminal, RefreshCw, AlertCircle, ShieldAlert, Cpu } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { listTools } from '../api/client';
import { McpTool } from '../types';

export const ToolsPage: React.FC = () => {
  const [tools, setTools] = useState<McpTool[]>([]);
  const [serverUrl, setServerUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTools = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listTools();
      setTools(data.tools || []);
      setServerUrl(data.serverUrl || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Wrench className="w-6 h-6 text-indigo-600" />
            <span>MCP Tool Registry</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Live capabilities dynamically discovered via Model Context Protocol (<code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">tools/list</code>).
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={loadTools} className="flex items-center space-x-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Discover Tools</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Connecting to MCP Server over Streamable HTTP...</p>
        </div>
      ) : error ? (
        <Card variant="light" className="p-8 text-center border-rose-200 bg-rose-50/50">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-rose-900">MCP Discovery Refused</h3>
          <p className="text-xs text-rose-600 mt-1">{error}</p>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="text-xs text-slate-500 flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <span>Real MCP Endpoint: <code className="font-mono text-slate-700">{serverUrl || 'http://127.0.0.1:3001/mcp'}</code></span>
            </span>
            <Badge variant="success">Online • {tools.length} Registered Tools</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((t) => (
              <Card key={t.name} variant="light" className="p-5 hover:border-indigo-300 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-slate-900 font-mono">{t.name}</h3>
                  </div>
                  <Badge variant="info" size="sm">{t.domain}</Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">{t.description}</p>
                {t.requiresApproval && (
                  <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/80 p-2 rounded-md flex items-center space-x-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Requires explicit human approval sign-off before invocation</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
