import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LayoutDashboard, ShoppingCart, Truck, ChevronRight, ArrowLeft } from 'lucide-react';

type Role = 'manager' | 'staff' | 'driver' | null;

const ROLES = [
  {
    id: 'manager' as Role,
    label: 'Manager',
    subtitle: 'Dashboard & Settings',
    icon: LayoutDashboard,
    accentColor: '#f97316',
    accentBg: 'rgba(249,115,22,0.12)',
    accentBorder: 'rgba(249,115,22,0.2)',
    focusBorder: 'rgba(249,115,22,0.7)',
    btnBg: '#ea580c',
    btnHover: '#f97316',
    sessionKey: 'manager_session',
    sessionTimeKey: 'manager_session_time',
    redirect: '/manager',
    passwordField: 'manager_password',
    sessionDuration: 24 * 60 * 60 * 1000,
  },
  {
    id: 'staff' as Role,
    label: 'Staff',
    subtitle: 'POS & Inventory',
    icon: ShoppingCart,
    accentColor: '#ff8c00',
    accentBg: 'rgba(255,140,0,0.12)',
    accentBorder: 'rgba(255,140,0,0.2)',
    focusBorder: 'rgba(255,140,0,0.7)',
    btnBg: '#ff8c00',
    btnHover: '#ff9f1a',
    sessionKey: 'staff_session',
    sessionTimeKey: 'staff_session_time',
    redirect: '/staff',
    passwordField: 'staff_password',
    sessionDuration: 12 * 60 * 60 * 1000,
  },
  {
    id: 'driver' as Role,
    label: 'Driver',
    subtitle: 'Deliveries',
    icon: Truck,
    accentColor: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.12)',
    accentBorder: 'rgba(59,130,246,0.2)',
    focusBorder: 'rgba(59,130,246,0.7)',
    btnBg: '#2563eb',
    btnHover: '#3b82f6',
    sessionKey: 'delivery_session',
    sessionTimeKey: 'delivery_session_time',
    redirect: '/delivery',
    passwordField: 'delivery_password',
    sessionDuration: 12 * 60 * 60 * 1000,
  },
];

export default function Login() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const activeRole = ROLES.find(r => r.id === selectedRole);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRole) return;
    setIsLoggingIn(true);
    setError('');
    try {
      const { data, error: dbError } = await supabase
        .from('store_settings')
        .select(activeRole.passwordField)
        .eq('id', 1)
        .single();
      if (dbError) throw dbError;
      const dbPassword = data?.[activeRole.passwordField];
      const masterKey = import.meta.env.VITE_MASTER_RECOVERY_KEY;
      setTimeout(() => {
        if (password === dbPassword || (activeRole.id === 'manager' && password === masterKey)) {
          localStorage.setItem(activeRole.sessionKey, 'authenticated');
          localStorage.setItem(activeRole.sessionTimeKey, new Date().getTime().toString());
          navigate(activeRole.redirect);
        } else {
          setError('Incorrect password. Please try again.');
          setPassword('');
        }
        setIsLoggingIn(false);
      }, 500);
    } catch {
      setError('Login failed. Please try again.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full"
          style={{ background: activeRole ? `${activeRole.accentColor}08` : 'rgba(249,115,22,0.05)', filter: 'blur(120px)' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full"
          style={{ background: activeRole ? `${activeRole.accentColor}04` : 'rgba(249,115,22,0.03)', filter: 'blur(100px)' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: activeRole ? activeRole.accentBg : 'rgba(249,115,22,0.1)', border: `1px solid ${activeRole ? activeRole.accentBorder : 'rgba(249,115,22,0.2)'}` }}>
            {activeRole
              ? <activeRole.icon size={26} style={{ color: activeRole.accentColor }} />
              : <div className="grid grid-cols-2 gap-0.5">
                  {[LayoutDashboard, ShoppingCart, Truck, LayoutDashboard].map((Icon, i) => (
                    <Icon key={i} size={10} className="text-orange-500" />
                  ))}
                </div>
            }
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            {activeRole ? activeRole.label : 'Grandpa\'s OS'}
          </h1>
          <p className="text-zinc-600 text-xs font-semibold uppercase tracking-widest mt-1">
            {activeRole ? activeRole.subtitle : 'Select your role to continue'}
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800/60 rounded-2xl p-7 shadow-2xl">

          {/* Step 1: Role selector */}
          {!selectedRole && (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Who are you?</p>
              {ROLES.map(role => {
                const Icon = role.icon;
                return (
                  <button key={role.id} onClick={() => setSelectedRole(role.id)}
                    className="w-full flex items-center justify-between px-4 py-4 rounded-xl border transition-all active:scale-[0.98] group"
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      borderColor: 'rgba(63,63,70,0.6)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = role.accentBorder; (e.currentTarget as HTMLElement).style.background = role.accentBg; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(63,63,70,0.6)'; (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.4)'; }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: role.accentBg, border: `1px solid ${role.accentBorder}` }}>
                        <Icon size={16} style={{ color: role.accentColor }} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black uppercase text-white tracking-wide">{role.label}</p>
                        <p className="text-[10px] text-zinc-500 font-semibold">{role.subtitle}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Password */}
          {selectedRole && activeRole && (
            <form onSubmit={handleLogin} className="space-y-5">
              <button type="button" onClick={() => { setSelectedRole(null); setPassword(''); setError(''); }}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-xs font-black uppercase tracking-wider mb-2">
                <ArrowLeft size={13} /> Back
              </button>

              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">
                  {activeRole.label} Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder={`Enter ${activeRole.label.toLowerCase()} password`}
                  className="w-full bg-black/60 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm font-medium text-white placeholder:text-zinc-700 outline-none transition-all"
                  style={{ '--tw-ring-color': activeRole.accentColor } as React.CSSProperties}
                  onFocus={e => (e.target.style.borderColor = activeRole.focusBorder)}
                  onBlur={e => (e.target.style.borderColor = '')}
                  disabled={isLoggingIn}
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-500/8 border border-red-500/25 rounded-xl p-3 text-center">
                  <p className="text-red-400 text-xs font-bold">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!password || isLoggingIn}
                className="w-full text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: activeRole.btnBg }}
                onMouseEnter={e => { if (password && !isLoggingIn) (e.currentTarget as HTMLElement).style.background = activeRole.btnHover; }}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = activeRole.btnBg}>
                {isLoggingIn
                  ? <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Verifying...
                    </span>
                  : `Access ${activeRole.label} Portal`
                }
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-zinc-700 text-[10px] font-bold uppercase tracking-widest mt-5">
          Grandpa's Dream Supermarket OS
        </p>
      </div>
    </div>
  );
}