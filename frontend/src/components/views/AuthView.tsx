import React, { useState } from 'react';
import { 
  Zap, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Sparkles,
  TrendingUp,
  CreditCard,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import { authService } from '../../services/authService';
import { UserModel } from '../../types';
import { useApp } from '../../context/AppContext';

interface AuthViewProps {
  onAuthenticated: (user: UserModel) => void;
  addToast: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthenticated, addToast }) => {
  const { theme, toggleTheme } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regRole, setRegRole] = useState<'customer' | 'staff' | 'admin'>('customer');
  const [regPhone, setRegPhone] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await authService.login(loginEmail, loginPassword);
      addToast('Welcome Back', `Logged in as ${res.user.name} (${res.user.role.toUpperCase()}).`, 'success');
      onAuthenticated(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
      addToast('Login Failed', err.message || 'Authentication error.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await authService.register({
        name: regName,
        email: regEmail,
        password: regPassword,
        company: regCompany,
        role: regRole,
        phone: regPhone,
      });
      addToast('Account Registered', `Registered and logged in as ${res.user.name}.`, 'success');
      onAuthenticated(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
      addToast('Registration Failed', err.message || 'Could not register user.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Preset 1-click personas for testing
  const handleQuickLogin = async (email: string) => {
    setLoginEmail(email);
    setLoginPassword('password123');
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await authService.login(email, 'password123');
      addToast('Session Activated', `Authenticated as ${res.user.name} (${res.user.role.toUpperCase()}).`, 'success');
      onAuthenticated(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not authenticate demo user.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    addToast('Password Reset', 'Password reset instructions have been dispatched to your email.', 'info');
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* LEFT PANEL: Clean Modern SaaS Form */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 relative z-10 min-h-screen overflow-y-auto">
        
        {/* Top Header: Brand Lockup & Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Zap className="w-5 h-5 fill-current text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                StackForge
              </span>
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Subscription Cloud
              </span>
            </div>
          </div>

          {/* Quick Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shadow-xs"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>

        {/* Center Auth Card */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          
          {/* Header Texts */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {mode === 'login' ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              {mode === 'login' 
                ? 'Sign in to access your billing pipelines and revenue operations.' 
                : 'Start orchestrating contracts, invoices, and customer subscriptions.'}
            </p>
          </div>

          {/* Segmented Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all duration-150 ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all duration-150 ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="flex-1">{errorMsg}</span>
            </div>
          )}

          {/* Sign In Form */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all duration-150"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all duration-150"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center pt-0.5">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="remember-me" className="ml-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                  Keep me signed in for 30 days
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-150 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Company <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Acme Inc"
                      value={regCompany}
                      onChange={e => setRegCompany(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Corporate Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="jane@company.com"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={regRole}
                    onChange={e => setRegRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  >
                    <option value="customer">Customer</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      placeholder="Min 8 characters"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Direct Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      placeholder="+1 (555) 019-2831"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs shadow-sm hover:shadow-md transition-all duration-150 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60"
              >
                <span>{loading ? 'Creating Account...' : 'Complete Enterprise Registration'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>
          )}

          {/* Quick Demo Personas (1-Click Testing) */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Instant Demo Access
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                1-click login
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('j.chen@brightloopsoftware.com')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-indigo-500/40 hover:bg-indigo-50/40 dark:hover:bg-slate-800/80 text-left transition-all group"
              >
                <div className="font-semibold text-slate-900 dark:text-white text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Jessica Chen
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Admin
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('a.rivera@brightloopsoftware.com')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-indigo-500/40 hover:bg-indigo-50/40 dark:hover:bg-slate-800/80 text-left transition-all group"
              >
                <div className="font-semibold text-slate-900 dark:text-white text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Alex Rivera
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Staff
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('s.jenkins@novuhealth.io')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-indigo-500/40 hover:bg-indigo-50/40 dark:hover:bg-slate-800/80 text-left transition-all group"
              >
                <div className="font-semibold text-slate-900 dark:text-white text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Sarah Jenkins
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Customer (Novu Health)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('marcus@finmatrix.co')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-indigo-500/40 hover:bg-indigo-50/40 dark:hover:bg-slate-800/80 text-left transition-all group"
              >
                <div className="font-semibold text-slate-900 dark:text-white text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Marcus Vance
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Customer (FinMatrix)
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Security Footer */}
        <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-bit TLS Encrypted</span>
          </div>
          <span>SOC 2 Type II Certified</span>
        </div>
      </div>

      {/* RIGHT PANEL: Abstract Visual SaaS Showcase (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative bg-slate-950 text-white flex-col justify-between p-12 xl:p-16 overflow-hidden select-none">
        
        {/* Background Ambient Glow Orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

        {/* Top Status Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono backdrop-blur-md text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>StackForge Subscription Platform</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">99.99% Platform SLA</span>
        </div>

        {/* Centerpiece: Interactive Visual Revenue Preview Card */}
        <div className="relative z-10 my-auto max-w-lg w-full mx-auto space-y-6">
          <div className="rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-xl p-6 shadow-2xl space-y-6">
            
            {/* Window Pill Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              </div>
              <span className="text-xs font-mono text-slate-400">revenue-orchestrator.stackforge</span>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Active MRR</span>
                  <span className="text-emerald-400 font-semibold text-[11px]">+14.8%</span>
                </div>
                <div className="text-2xl font-bold font-mono tracking-tight text-white">
                  ₹1,48,250
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Recurring billing engine</span>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>ARR Run-rate</span>
                  <span className="text-indigo-400 font-semibold text-[11px]">99.2% NRR</span>
                </div>
                <div className="text-2xl font-bold font-mono tracking-tight text-white">
                  ₹1.78 Cr
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Multi-tier contracts</span>
              </div>
            </div>

            {/* Lifecycle Pipeline Visualization */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                Subscription Lifecycle Stages
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-400" />
                    <span>CPQ Quotation Approved</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                    100% Automated
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    <span>Dynamic Tier Entitlements</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                    Active Provisioning
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-violet-400" />
                    <span>Multi-Gateway Payment Dispatch</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 font-semibold">
                    UPI / NetBanking / Cards
                  </span>
                </div>
              </div>
            </div>

            {/* Live Feed Event Chip */}
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs min-w-0">
                <span className="font-semibold text-indigo-200">Novu Health Contract Activated</span>
                <p className="text-[10px] text-slate-400 truncate">₹2,40,000 Annual Enterprise billing synced</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Abstract Panel Feature Highlights */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span className="font-semibold text-slate-200 block">Unified Subscription Architecture</span>
            <span className="text-[11px]">Quotations • Subscriptions • Invoices • Payments</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Role-Based Access Control</span>
          </div>
        </div>

      </div>
    </div>
  );
};
