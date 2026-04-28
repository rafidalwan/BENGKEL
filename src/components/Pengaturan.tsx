import React from 'react';
import { 
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Database,
  Monitor
} from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function Pengaturan() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight flex items-center gap-3">
             <SettingsIcon className="w-8 h-8 text-slate-400" />
             Konfigurasi Sistem
          </h1>
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mt-1">Pengaturan preferensi dan keamanan akun</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-2">
            <button className="w-full text-left px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white flex items-center gap-3 transition-colors">
                <User className="w-4 h-4 text-cyan-400" /> Profil Pengguna
            </button>
            <button className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl text-sm font-medium text-slate-400 flex items-center gap-3 transition-colors text-slate-400 hover:text-white">
                <Shield className="w-4 h-4 text-slate-500" /> Keamanan
            </button>
            <button className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl text-sm font-medium text-slate-400 flex items-center gap-3 transition-colors text-slate-400 hover:text-white">
                <Bell className="w-4 h-4 text-slate-500" /> Notifikasi
            </button>
            <button className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl text-sm font-medium text-slate-400 flex items-center gap-3 transition-colors text-slate-400 hover:text-white">
                <Database className="w-4 h-4 text-slate-500" /> Manajemen Data
            </button>
            <button className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl text-sm font-medium text-slate-400 flex items-center gap-3 transition-colors text-slate-400 hover:text-white">
                <Monitor className="w-4 h-4 text-slate-500" /> Tampilan Sistem
            </button>
        </div>

        <div className="md:col-span-3 space-y-8">
            <div className="bg-slate-900 border border-white/5 rounded-3xl p-8">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-400" />
                    Informasi Dasar
                </h3>
                
                <div className="space-y-6 max-w-lg">
                    <div>
                        <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Nama Lengkap</label>
                        <input 
                            type="text" 
                            disabled
                            value={user?.displayName || 'Pengguna'}
                            className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-400 focus:outline-none transition-colors cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Email Akun</label>
                        <input 
                            type="text" 
                            disabled
                            value={user?.email || 'email@example.com'}
                            className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-400 focus:outline-none transition-colors font-mono cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">ID Manajer Kredensial</label>
                        <input 
                            type="text" 
                            disabled
                            value={user?.uid || '---'}
                            className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-400 focus:outline-none transition-colors font-mono text-[10px] cursor-not-allowed"
                        />
                    </div>
                    <div className="pt-4 border-t border-white/5">
                        <button disabled className="px-6 py-3 bg-white/5 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest cursor-not-allowed">
                            Simpan Perubahan
                        </button>
                        <p className="text-[10px] font-mono text-slate-600 mt-3">Perubahan profil saat ini dikelola melalui Provider Autentikasi (Google).</p>
                    </div>
                </div>
            </div>
            
            <div className="bg-slate-900 border border-white/5 rounded-3xl p-8">
                 <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    Izin Aplikasi Pihak Ketiga
                </h3>
                <div className="flex items-center justify-between p-4 bg-slate-950 border border-white/5 rounded-xl">
                    <div className="flex text-sm text-white font-medium items-center gap-3">
                        <img src="https://www.google.com/favicon.ico" className="w-5 h-5 grayscale opacity-50" alt="Google" />
                        Google Cloud Engine
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase text-emerald-500 border border-emerald-500/20 px-2 py-1 bg-emerald-500/5 rounded">Aktif Terhubung</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
