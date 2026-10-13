import React, { useEffect, useState } from 'react';
import { Settings, User, Shield, Bell, Moon, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { getSettings } from '../api/client';
import { SettingsPayload } from '../types';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <Settings className="w-6 h-6 text-slate-700" />
          <span>Settings & Preferences</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Manage your account profile, plan features, and operational preferences.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading profile settings...</div>
      ) : (
        <div className="space-y-6">
          {/* Profile Card */}
          <Card variant="light" className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <Avatar initials="SM" size="lg" status="online" />
              <div>
                <h2 className="text-base font-bold text-slate-900">{settings?.profile.name}</h2>
                <p className="text-xs text-slate-500">{settings?.profile.email}</p>
                <div className="flex items-center space-x-2 mt-1.5">
                  <Badge variant="info" size="sm">{settings?.profile.role}</Badge>
                  <span className="text-[11px] text-slate-400">Location: {settings?.profile.location}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-400">Subscription Tier</span>
                <div className="font-semibold text-slate-900 mt-0.5">{settings?.plan.tier}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-400">Default Model</span>
                <div className="font-semibold text-slate-900 mt-0.5">{settings?.preferences.defaultModel}</div>
              </div>
            </div>
          </Card>

          {/* Plan Features */}
          <Card variant="light" className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Active Capabilities & Quotas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {settings?.plan.features.map((feat) => (
                <div key={feat} className="flex items-center space-x-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
