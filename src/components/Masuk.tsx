import React, { useState } from 'react';
import { signInWithGoogle } from '../lib/firebase';
import { Wrench, Loader2 } from 'lucide-react';

export default function Masuk() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login error:', error);
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
        <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em] mb-10">Sistem Perintah Bengkel v4.0</p>

        <div className="space-y-6">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-4 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all group technical-glow-cyan/20"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            ) : (
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google" />
            )}
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-300"> Masuk dengan Google </span>
          </button>

          <div className="pt-6 border-t border-white/5">
            <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest leading-loose">
              Didukung oleh Kerangka Kerja <br />
              <span className="text-orange-500/80">CodeIgniter 4 Engine</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
