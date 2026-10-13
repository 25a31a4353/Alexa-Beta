import React from 'react';
import { Sparkles, ArrowRight, Compass, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useRouter } from '../state/router';

export const HomePage: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <div className="min-h-full flex flex-col justify-between p-6 lg:p-12 max-w-6xl mx-auto">
      {/* Top Hero Section */}
      <div className="pt-8 lg:pt-14 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-400 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Autonomous Agentic Mission Execution Engine</span>
          <Badge variant="beta" size="sm">BETA</Badge>
        </div>

        <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Turn complex goals into{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
            real outcomes with Alexa+
          </span>
        </h1>

        <p className="mt-4 text-base lg:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          I can understand your objective, plan the work, discover real MCP tools over Streamable HTTP, take verifiable actions, and keep you updated.
        </p>

        {/* Action button leading to New Conversation or Missions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="amber"
            size="lg"
            onClick={() => navigate('/new')}
            className="flex items-center space-x-2 font-semibold shadow-lg shadow-amber-500/20"
          >
            <span>Start a New Goal</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            variant="dark"
            size="lg"
            onClick={() => navigate('/missions')}
            className="flex items-center space-x-2"
          >
            <Compass className="w-4 h-4 text-blue-400" />
            <span>View Active Missions</span>
          </Button>
        </div>
      </div>

      {/* Feature capabilities banner */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Calendar & Schedules', desc: 'Discovers meetings, agendas, and attendee contexts via MCP.', tag: 'Active' },
          { title: 'Document Intelligence', desc: 'Deeply analyzes product specs, risks, and roadmap briefs.', tag: 'Active' },
          { title: 'Deterministic Grounding', desc: 'Synthesizes conclusions verified against actual tool traces.', tag: 'Verified' },
          { title: 'Real-Time SSE Stream', desc: 'Real-time telemetry without polling or fake progress timers.', tag: 'Real-time' },
        ].map((feat) => (
          <div key={feat.title} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-smooth">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-200">{feat.title}</h3>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                {feat.tag}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </div>

      {/* Bottom Stage A Anchor Note */}
      <div className="mt-12 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Connected to Live Application API :3000 & Real MCP Server :3001</span>
      </div>
    </div>
  );
};
