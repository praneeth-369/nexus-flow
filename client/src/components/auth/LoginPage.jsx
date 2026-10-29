import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  Layers,
  ShieldCheck,
  UserCheck,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

export const DEMO_ACCOUNTS = [
  {
    role: 'Project Lead',
    badge: 'Admin',
    name: 'Alex Rivera',
    email: 'lead@nexusflow.io',
    username: 'lead',
    password: 'lead123',
    icon: ShieldCheck,
    color: 'text-zinc-100',
    border: 'border-zinc-700 hover:border-zinc-500',
    bg: 'bg-zinc-800/60',
    desc: 'Full CRUD, dependency editing & cycle overrides',
  },
  {
    role: 'Team Member',
    badge: 'Editor',
    name: 'Elena Rostova',
    email: 'member@nexusflow.io',
    username: 'member',
    password: 'member123',
    icon: UserCheck,
    color: 'text-emerald-400',
    border: 'border-emerald-500/30 hover:border-emerald-400',
    bg: 'bg-emerald-500/10',
    desc: 'Can update task progress and advance status',
  },
  {
    role: 'Viewer',
    badge: 'Read-only',
    name: 'Jordan Miller',
    email: 'viewer@nexusflow.io',
    username: 'viewer',
    password: 'viewer123',
    icon: Eye,
    color: 'text-zinc-400',
    border: 'border-zinc-800 hover:border-zinc-700',
    bg: 'bg-zinc-900/60',
    desc: 'Inspect graph, metrics, and timeline only',
  },
];

export default function LoginPage() {
  const { handleLogin } = useProject();

  const [identifier, setIdentifier] = useState('lead@nexusflow.io');
  const [password, setPassword] = useState('lead123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const result = await handleLogin(identifier, password);
    if (!result?.success) {
      setErrorMsg(result?.error || 'Invalid email or password.');
    }
    setLoading(false);
  };

  const handleQuickLogin = async (acc) => {
    setIdentifier(acc.email);
    setPassword(acc.password);
    setErrorMsg('');
    setLoading(true);

    await handleLogin(acc.email, acc.password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-screen bg-canvas flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Subtle neutral atmosphere glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-zinc-800/20 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[250px] bg-emerald-950/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 text-white shadow-md mb-3">
            <Layers className="w-6 h-6 text-zinc-100" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Sign in to NexusFlow
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Project Dependency & Critical Path Management SaaS
          </p>
        </div>

        {/* Main Card */}
        <div className="p-7 rounded-3xl bg-panel-card border border-panel-border glass-modal shadow-2xl">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. lead@nexusflow.io or lead"
                  className="w-full bg-panel border border-panel-border rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">Demo Protected</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-panel border border-panel-border rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 outline-none transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-white text-zinc-950 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              {!loading && <ArrowRight className="w-4 h-4 stroke-[2.5]" />}
            </button>
          </form>

          {/* Quick-Fill Role Accounts */}
          <div className="mt-6 pt-5 border-t border-panel-border">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <KeyRound className="w-3 h-3 text-zinc-300" />
              Quick-Select Role Account & Password
            </span>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                const isSelected = identifier === acc.email;

                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleQuickLogin(acc)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-zinc-800 border-zinc-600 shadow-sm'
                        : `${acc.bg} ${acc.border} hover:bg-zinc-800/80`
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg bg-panel border border-panel-border flex items-center justify-center ${acc.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-white">{acc.role}</span>
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {acc.badge}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block truncate font-mono">
                          {acc.email} • {acc.password}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-300">
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <span className="text-[10px] text-zinc-400 opacity-70 group-hover:opacity-100">Use</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[11px] text-zinc-500 font-mono">
          <span>HACK-P395 • Project Dependency Graph & Critical Path Engine</span>
        </div>
      </div>
    </div>
  );
}
