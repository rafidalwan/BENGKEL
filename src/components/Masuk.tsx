import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail } from '../lib/firebase';
import { Wrench, Loader2, User, Lock, ExternalLink } from 'lucide-react';

export default function Masuk() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const formatEmail = (user: string) => {
    return user.includes('@') ? user : `${user}@autoworks.local`;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!username || !password) {
      setErrorMsg('Username dan password harus diisi');
      return;
    }
    
    setIsLoading(true);
    try {
      const email = formatEmail(username);
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setErrorMsg('Username atau password salah.');
      } else if (error.code === 'auth/user-not-found') {
        setErrorMsg('User tidak ditemukan.');
      } else if (error.code === 'auth/email-already-in-use') {
        setErrorMsg('Username sudah digunakan.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMsg('Password terlalu lemah (minimal 6 karakter).');
      } else if (error.code === 'auth/configuration-not-found') {
        setErrorMsg('Autentikasi Email/Password belum diaktifkan di Console Firebase.');
      } else {
        setErrorMsg(error.message || 'Terjadi kesalahan saat masuk.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060a] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Atmosphere */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-orange-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/5 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl p-10 z-10 text-center">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-[#ee4323] rounded-2xl flex items-center justify-center technical-glow-orange rotate-3">
            <Wrench className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold font-display text-white tracking-tight mb-2">AutoWorks <span className="text-[#ee4323]">Pro</span></h1>
        <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em] mb-8">Sistem Perintah Bengkel v4.0</p>

        <form onSubmit={handleAuth} className="space-y-4 text-left">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-xs text-center mb-4">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 pl-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-700"
                placeholder="Masukkan username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 pl-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-700"
                placeholder="Masukkan password"
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#ee4323] hover:bg-[#ff5733] border border-[#ff5733]/50 rounded-2xl transition-all group technical-glow-orange"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : null}
              <span className="text-[12px] font-black uppercase tracking-widest text-white"> {isLogin ? 'Masuk Sistem' : 'Daftar Sistem'} </span>
            </button>
          </div>
          
          <div className="text-center pt-2">
             <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs text-slate-400 hover:text-white transition-colors"
                disabled={isLoading}
             >
                {isLogin ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
             </button>
          </div>
        </form>

        <div className="pt-8 mt-6 border-t border-white/5">
          <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest leading-loose">
            Pastikan provider <span className="text-cyan-400/80">Email/Password</span> aktif di 
            <br />
            <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-[#ee4323] hover:text-[#ff5733] transition-colors inline-flex items-center gap-1 mt-1">
               Console Firebase <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
