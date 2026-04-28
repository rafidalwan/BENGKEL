import React from 'react';
import { useLocation, Link, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wrench, 
  Package, 
  Users, 
  Settings, 
  Bell, 
  Search, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  Calendar,
  LogOut,
  Plus,
  CreditCard
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuth } from './AuthProvider';

export default function Dasbor() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <div className="flex bg-[#05060a] min-h-screen text-slate-300 relative overflow-hidden font-sans">
      {/* Background Atmosphere */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-orange-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/5 blur-[100px] pointer-events-none"></div>

      {/* Sidebar */}
      <aside className="w-72 bg-slate-900/60 backdrop-blur-xl border-r border-white/5 hidden md:flex flex-col z-20">
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#ee4323] rounded-lg flex items-center justify-center technical-glow-orange">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white font-display">AutoWorks Pro</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">System Nexus v4.0</p>
          </div>
        </div>

        <div className="px-6 mb-6">
          <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest mb-4 opacity-50">Modul Utama</p>
          <nav className="space-y-1">
            <SidebarLink icon={LayoutDashboard} label="Panel Utama" to="/dashboard" active={currentPath === '/dashboard'} />
            <SidebarLink icon={Wrench} label="Layanan Servis" to="/dashboard/services" active={currentPath === '/dashboard/services'} />
            <SidebarLink icon={CreditCard} label="Point of Sale" to="/dashboard/pos" active={currentPath === '/dashboard/pos'} />
            <SidebarLink icon={Package} label="Inventaris" to="/dashboard/inventory" active={currentPath === '/dashboard/inventory'} />
            <SidebarLink icon={Users} label="Pelanggan" to="/dashboard/customers" active={currentPath === '/dashboard/customers'} />
            <SidebarLink icon={Calendar} label="Janji Temu" to="/dashboard/appointments" active={currentPath === '/dashboard/appointments'} />
          </nav>
        </div>

        <div className="px-6 mb-6">
          <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest mb-4 opacity-50">Manajemen</p>
          <nav className="space-y-1">
            <SidebarLink icon={TrendingUp} label="Keuangan" to="/dashboard/finance" active={currentPath === '/dashboard/finance'} />
            <SidebarLink icon={Settings} label="Konfig Sistem" to="/dashboard/settings" active={currentPath === '/dashboard/settings'} />
          </nav>
        </div>

        <div className="mt-auto p-6">
          <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center text-white font-bold uppercase overflow-hidden">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{user?.displayName || 'Pengguna'}</p>
                  <p className="text-[10px] font-mono text-cyan-400 truncate tracking-tight">{user?.email}</p>
                </div>
             </div>
             <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2 text-[10px] uppercase tracking-widest font-black bg-white/5 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-all border border-white/5"
             >
               <LogOut className="w-3 h-3" /> Keluar Sistem
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 z-10 relative">
        {/* Header */}
        <header className="h-20 bg-slate-900/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-6 flex-1">
            <div className="relative w-96 max-w-full group">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-400 transition-colors" />
              <input 
                type="text" 
                placeholder="CARI_REKAM_DATA_SISTEM..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-lg text-xs font-mono tracking-tight focus:bg-white/10 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all placeholder:text-slate-600"
              />
            </div>
            <div className="h-6 w-px bg-white/10 hidden lg:block"></div>
            <div className="hidden lg:flex items-center gap-4">
               <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-widest font-black text-slate-600">Wilayah</span>
                  <span className="text-[11px] font-mono text-cyan-500 font-bold">SEA-SOUTHEAST-1</span>
               </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 technical-glow-emerald"></div>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest font-mono">Aktif</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2.5 bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-orange-500 rounded-full technical-glow-orange" />
              </button>
              <button className="flex items-center gap-2 px-6 py-2.5 bg-[#ee4323] hover:bg-[#ff5733] text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all technical-glow-orange active:scale-95 shadow-lg shadow-orange-600/20">
                <Plus className="w-4 h-4" /> Order Baru
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 overflow-y-auto flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ icon: Icon, label, to, active = false }: { icon: any, label: string, to: string, active?: boolean }) {
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all group border border-transparent ${
        active 
          ? 'bg-orange-600/10 border-white/5 border-l-2 border-l-orange-500 text-white shadow-[inset_4px_0_12px_rgba(238,67,35,0.05)]' 
          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-orange-500' : 'group-hover:text-slate-300'}`} />
      <span className={`text-sm font-medium tracking-tight ${active ? 'font-bold' : ''}`}>{label}</span>
      {active && <div className="ml-auto w-1 h-1 bg-orange-500 rounded-full technical-glow-orange" />}
    </Link>
  );
}
