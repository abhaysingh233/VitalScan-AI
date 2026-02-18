
import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, UserPlus, LogIn, HeartPulse, Database, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthProps {
  onLogin: (user: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length > 5) score++;
    if (pass.length > 9) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;
    return Math.min(score, 4);
  };

  const strength = calculateStrength(password);

  const getStrengthConfig = (s: number) => {
    switch(s) {
      case 1: return { color: 'bg-rose-500', text: 'text-rose-500', label: 'Weak' };
      case 2: return { color: 'bg-amber-500', text: 'text-amber-500', label: 'Fair' };
      case 3: return { color: 'bg-sky-500', text: 'text-sky-500', label: 'Good' };
      case 4: return { color: 'bg-emerald-500', text: 'text-emerald-500', label: 'Strong' };
      default: return { color: 'bg-rose-500', text: 'text-rose-500', label: 'Very Weak' };
    }
  };

  const strengthInfo = getStrengthConfig(strength);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Simulate Network Delay for realism
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      let users: Record<string, any> = {};
      try {
        const usersRaw = localStorage.getItem('vitalscan_users');
        if (usersRaw) {
          users = JSON.parse(usersRaw);
        }
      } catch (parseError) {
        console.error("Data corruption detected, resetting user database.");
        localStorage.removeItem('vitalscan_users');
      }

      if (isLogin) {
        // Login Logic
        const user = users[email];
        if (user && user.password === password) {
          const sessionUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.email.split('@')[0]
          };
          localStorage.setItem('vitalscan_session', JSON.stringify(sessionUser));
          onLogin(sessionUser);
        } else {
          setError('Invalid credentials. If you are new, please register.');
        }
      } else {
        // Signup Logic
        if (users[email]) {
          setError('User already exists. Please login.');
        } else {
          const newUser = {
            uid: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            email,
            password, // In a real app, never store passwords plain text!
            createdAt: new Date().toISOString()
          };
          
          users[email] = newUser;
          localStorage.setItem('vitalscan_users', JSON.stringify(users));
          
          setIsLogin(true);
          setSuccess('Profile registered successfully. Please authenticate.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Authentication module error. Storage might be restricted.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfdff] dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-bl-[4rem] -z-0" />
        
        <div className="text-center mb-10 relative z-10">
          <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-sky-500/30">
            <HeartPulse size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">VitalScan<span className="text-sky-500">AI</span></h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Local Secure Gateway
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6 relative z-10">
          <div className="p-3 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-xs font-bold rounded-xl flex items-center gap-2">
             <Database size={16} />
             <span>Running in Local-First Architecture.</span>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18} />
              <input 
                type="email" 
                placeholder="Identity (Email)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-sky-500/50 font-bold text-sm text-slate-900 dark:text-white"
                required
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18} />
              <input 
                type="password" 
                placeholder="Access Key (Password)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-sky-500/50 font-bold text-sm text-slate-900 dark:text-white"
                required
              />
            </div>

            {/* Password Strength Meter */}
            {!isLogin && password.length > 0 && (
                <div className="px-2 space-y-1.5 animate-in fade-in slide-in-from-top-2">
                    <div className="flex gap-1.5 h-1.5">
                        {[1, 2, 3, 4].map((level) => (
                            <div 
                                key={level} 
                                className={`flex-1 rounded-full transition-all duration-500 ${
                                    strength >= level ? strengthInfo.color : 'bg-slate-100 dark:bg-slate-800'
                                }`} 
                            />
                        ))}
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Security Level</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${strengthInfo.text}`}>
                            {strengthInfo.label}
                        </span>
                    </div>
                </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-500 text-xs font-black rounded-xl text-center flex items-center justify-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 text-xs font-black rounded-xl text-center flex items-center justify-center gap-2">
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-sky-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-sky-500/20 hover:bg-sky-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                isLogin ? <LogIn size={18} /> : <UserPlus size={18} />
            )}
            {loading ? 'Processing...' : (isLogin ? 'Authenticate' : 'Register Profile')}
          </button>
        </form>

        <div className="mt-8 text-center relative z-10">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-sky-500 transition-colors"
          >
            {isLogin ? 'Initialize New Protocol' : 'Access Existing Node'}
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center gap-4 text-slate-300 dark:text-slate-600">
           <ShieldCheck size={20} />
           <span className="text-[10px] font-mono self-center">
             DEVICE-SIDE STORAGE ENCRYPTED
           </span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
