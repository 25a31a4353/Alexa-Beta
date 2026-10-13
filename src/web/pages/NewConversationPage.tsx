import React from 'react';
import { Calendar, FileText, CheckSquare, Search, BarChart3, Wrench, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useRouter } from '../state/router';

export const NewConversationPage: React.FC = () => {
  const { navigate } = useRouter();

  const quickStarts = [
    {
      title: 'Plan my day',
      desc: "Check my calendar and prepare for tomorrow's meeting.",
      icon: Calendar,
      color: 'text-blue-500 bg-blue-50 border-blue-100',
    },
    {
      title: 'Analyze a document',
      desc: 'Summarize key roadmap specifications and highlight insights.',
      icon: FileText,
      color: 'text-purple-500 bg-purple-50 border-purple-100',
    },
    {
      title: 'Create a checklist',
      desc: 'Formulate an actionable step-by-step preparation plan.',
      icon: CheckSquare,
      color: 'text-emerald-500 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Find information',
      desc: 'Search connected SQLite knowledge repository for documents.',
      icon: Search,
      color: 'text-amber-500 bg-amber-50 border-amber-100',
    },
    {
      title: 'Analyze data',
      desc: 'Inspect metrics, tool executions, and audit records.',
      icon: BarChart3,
      color: 'text-rose-500 bg-rose-50 border-rose-100',
    },
    {
      title: 'Use my tools',
      desc: 'Dynamically orchestrate registered MCP capabilities.',
      icon: Wrench,
      color: 'text-indigo-500 bg-indigo-50 border-indigo-100',
    },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      {/* Heading */}
      <div className="text-center max-w-2xl mx-auto pt-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          How can <span className="text-blue-600">Alexa+</span> help you today?
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Ask a complex question, set a goal, or dispatch an autonomous mission. I can plan, select tools, and get things done for you.
        </p>
      </div>

      {/* Quick-Start Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickStarts.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.title}
              variant="light"
              className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group"
              onClick={() => navigate('/missions')}
            >
              <CardContent className="p-5 flex items-start space-x-3.5">
                <div className={`p-2.5 rounded-xl border ${item.color} flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    "{item.desc}"
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stage A Notification Banner */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
        <div className="text-xs text-blue-900">
          <span className="font-semibold">Stage A Shell Verified:</span> Route <code className="bg-blue-100/70 px-1 py-0.5 rounded font-mono">/new</code> is functional. Interactive natural language prompt input will be activated in Stage C.
        </div>
        <button
          onClick={() => navigate('/missions')}
          className="text-xs font-semibold text-blue-700 hover:text-blue-800 underline"
        >
          View Missions →
        </button>
      </div>
    </div>
  );
};
