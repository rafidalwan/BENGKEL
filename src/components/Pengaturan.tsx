import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Database,
  Monitor,
  Plus,
  Trash2,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export default function Pengaturan() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profil');

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight flex items-center gap-3">
             <SettingsIcon className="w-8 h-8 text-slate-400" />
             Konfigurasi Sistem
          </h1>
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mt-1">Pengaturan preferensi dan manajemen data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-2">
            <button onClick={() => setActiveTab('profil')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors ${activeTab === 'profil' ? 'bg-white/5 border border-white/10 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}>
                <User className={`w-4 h-4 ${activeTab === 'profil' ? 'text-cyan-400' : 'text-slate-500'}`} /> Profil Pengguna
            </button>
            <button onClick={() => setActiveTab('keamanan')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors ${activeTab === 'keamanan' ? 'bg-white/5 border border-white/10 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}>
                <Shield className={`w-4 h-4 ${activeTab === 'keamanan' ? 'text-emerald-400' : 'text-slate-500'}`} /> Keamanan
            </button>
            <button onClick={() => setActiveTab('notifikasi')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors ${activeTab === 'notifikasi' ? 'bg-white/5 border border-white/10 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}>
                <Bell className={`w-4 h-4 ${activeTab === 'notifikasi' ? 'text-amber-400' : 'text-slate-500'}`} /> Notifikasi
            </button>
            <button onClick={() => setActiveTab('manajemen_data')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors ${activeTab === 'manajemen_data' ? 'bg-white/5 border border-white/10 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}>
                <Database className={`w-4 h-4 ${activeTab === 'manajemen_data' ? 'text-indigo-400' : 'text-slate-500'}`} /> Manajemen Data
            </button>
            <button onClick={() => setActiveTab('tampilan')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors ${activeTab === 'tampilan' ? 'bg-white/5 border border-white/10 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}>
                <Monitor className={`w-4 h-4 ${activeTab === 'tampilan' ? 'text-pink-400' : 'text-slate-500'}`} /> Tampilan Sistem
            </button>
        </div>

        <div className="md:col-span-3 space-y-8">
            {activeTab === 'profil' && <ProfilTab user={user} />}
            {activeTab === 'keamanan' && <KeamananTab />}
            {activeTab === 'notifikasi' && <NotifikasiTab />}
            {activeTab === 'tampilan' && <TampilanTab />}
            {activeTab === 'manajemen_data' && <ManajemenDataTab user={user} />}
        </div>
      </div>
    </div>
  );
}

function ProfilTab({ user }: any) {
    return (
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                Informasi Dasar
            </h3>
            <div className="space-y-6 max-w-lg">
                <div>
                    <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Nama Lengkap</label>
                    <input type="text" disabled value={user?.displayName || 'Pengguna'} className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-400 focus:outline-none transition-colors cursor-not-allowed" />
                </div>
                <div>
                    <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Email Akun</label>
                    <input type="text" disabled value={user?.email || 'email@example.com'} className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-400 focus:outline-none transition-colors font-mono cursor-not-allowed" />
                </div>
                <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] font-mono text-slate-600 mt-3">Perubahan profil saat ini dikelola melalui Provider Autentikasi (Google).</p>
                </div>
            </div>
        </div>
    );
}

function KeamananTab() {
    const [twoFA, setTwoFA] = useState(false);
    return (
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                Pengaturan Keamanan
            </h3>
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-white/5 rounded-xl">
                <div>
                    <div className="text-sm text-white font-bold">Autentikasi Dua Faktor (2FA)</div>
                    <div className="text-xs text-slate-500 mt-1">Tambahkan lapisan keamanan ekstra dengan PIN/SMS.</div>
                </div>
                <button 
                  onClick={() => setTwoFA(!twoFA)} 
                  className={`w-12 h-6 rounded-full relative transition-colors ${twoFA ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${twoFA ? 'translate-x-7' : 'translate-x-1'}`}></div>
                </button>
            </div>
            {twoFA && <p className="text-emerald-400 text-xs font-mono">Autentikasi dua faktor berhasil disimulasikan sebagai aktif.</p>}
        </div>
    );
}

function NotifikasiTab() {
    const [emailNotif, setEmailNotif] = useState(true);
    const [waNotif, setWaNotif] = useState(false);
    return (
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                Preferensi Notifikasi
            </h3>
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-white/5 rounded-xl">
                <div>
                    <div className="text-sm text-white font-bold">Notifikasi Email</div>
                    <div className="text-xs text-slate-500 mt-1">Terima laporan harian dan pembaruan sistem via email.</div>
                </div>
                <button 
                  onClick={() => setEmailNotif(!emailNotif)} 
                  className={`w-12 h-6 rounded-full relative transition-colors ${emailNotif ? 'bg-amber-500' : 'bg-slate-700'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${emailNotif ? 'translate-x-7' : 'translate-x-1'}`}></div>
                </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-white/5 rounded-xl">
                <div>
                    <div className="text-sm text-white font-bold">Notifikasi WhatsApp (Beta)</div>
                    <div className="text-xs text-slate-500 mt-1">Terima notifikasi real-time ke nomor handphone Anda.</div>
                </div>
                <button 
                  onClick={() => setWaNotif(!waNotif)} 
                  className={`w-12 h-6 rounded-full relative transition-colors ${waNotif ? 'bg-amber-500' : 'bg-slate-700'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${waNotif ? 'translate-x-7' : 'translate-x-1'}`}></div>
                </button>
            </div>
            <button className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-colors">
                Simpan Preferensi
            </button>
        </div>
    );
}

function TampilanTab() {
    const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'dark');

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        localStorage.setItem('app-theme', newTheme);
        if (newTheme === 'light') {
            document.documentElement.classList.add('light-theme-forced');
        } else {
            document.documentElement.classList.remove('light-theme-forced');
        }
    };

    return (
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Monitor className="w-5 h-5 text-pink-400" />
                Tampilan Sistem
            </h3>
            <div className="space-y-4">
                <div 
                    onClick={() => handleThemeChange('dark')}
                    className={`p-4 border rounded-xl cursor-pointer transition-colors flex items-center justify-between ${theme === 'dark' ? 'border-pink-500 bg-pink-500/5' : 'border-white/10 bg-slate-950'}`}
                >
                    <div>
                        <div className="text-sm text-white font-bold">Gelap (Dark Mode)</div>
                        <div className="text-xs text-slate-500 mt-1">Tampilan standar, nyaman untuk mata (disarankan).</div>
                    </div>
                    {theme === 'dark' && <CheckCircle className="w-5 h-5 text-pink-500" />}
                </div>
                <div 
                    onClick={() => handleThemeChange('light')}
                    className={`p-4 border rounded-xl cursor-pointer transition-colors flex items-center justify-between ${theme === 'light' ? 'border-pink-500 bg-pink-500/5' : 'border-white/10 bg-slate-950'}`}
                >
                    <div>
                        <div className="text-sm text-white font-bold">Terang (Light Mode)</div>
                        <div className="text-xs text-slate-500 mt-1">Tampilan terang dengan kontras tinggi (eksperimental).</div>
                    </div>
                    {theme === 'light' && <CheckCircle className="w-5 h-5 text-pink-500" />}
                </div>
            </div>
            <p className="text-[10px] text-pink-400 font-mono mt-4">Perubahan tema akan otomatis disimpan di perangkat Anda.</p>
        </div>
    );
}

function ManajemenDataTab({ user }: any) {
    return (
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 space-y-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-400" />
                    Manajemen Data Referensi
                </h3>
                <div className="flex bg-slate-950 p-1 rounded-lg">
                    <button 
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all bg-white/10 text-white`}
                    >
                        Data Mekanik
                    </button>
                </div>
            </div>
            
            <DataMekanik user={user} />
        </div>
    );
}

function DataMekanik({ user }: any) {
    const [mechanics, setMechanics] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'mechanics'), where('managerId', '==', user.uid));
        const unsub = onSnapshot(q, (snap) => {
            setMechanics(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [user]);

    const handleAdd = async (e: any) => {
        e.preventDefault();
        if (!user || !name) return;
        try {
            await addDoc(collection(db, 'mechanics'), {
                name,
                phone,
                managerId: user.uid,
                createdAt: serverTimestamp()
            });
            setName('');
            setPhone('');
            setIsAdding(false);
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'mechanics');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'mechanics', id));
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, 'mechanics');
        }
    };

    return (
        <div>
            {isAdding ? (
                <form onSubmit={handleAdd} className="bg-slate-950 p-4 rounded-xl border border-white/5 space-y-4 mb-6">
                    <input type="text" placeholder="Nama Mekanik" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-indigo-500" />
                    <input type="text" placeholder="Nomor Telepon" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-indigo-500" />
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold w-full">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold w-full">Simpan</button>
                    </div>
                </form>
            ) : (
                <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-600/30 transition-colors mb-6">
                    <Plus className="w-4 h-4" /> Tambah Mekanik Baru
                </button>
            )}

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {mechanics.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-4 bg-slate-950 border border-white/5 rounded-xl">
                        <div>
                            <div className="text-sm font-bold text-white">{m.name}</div>
                            <div className="text-xs font-mono text-slate-500">{m.phone || '-'}</div>
                        </div>
                        <button onClick={() => handleDelete(m.id)} className="p-2 hover:bg-rose-500/10 text-slate-600 hover:text-rose-500 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {mechanics.length === 0 && <p className="text-center text-slate-500 text-xs font-mono py-4">Belum ada data mekanik</p>}
            </div>
        </div>
    );
}





