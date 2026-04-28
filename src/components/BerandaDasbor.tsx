import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  AlertCircle, 
  Clock,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { handleFirestoreError, OperationType } from './AuthProvider';

const chartData = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 5000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 6890 },
  { name: 'Sat', revenue: 8390 },
  { name: 'Sun', revenue: 3490 },
];

export default function BerandaDasbor() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 'Rp 124.500.000', // Mock for now
    activeOrders: 0,
    inventoryAlerts: 0,
    satisfaction: '98%'
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const ordersQuery = query(
      collection(db, 'workOrders'),
      where('managerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      setRecentOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      const active = snapshot.docs.filter(doc => doc.data().status !== 'Completed' && doc.data().status !== 'Selesai').length;
      setStats(prev => ({ ...prev, activeOrders: active }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'workOrders');
    });

    const inventoryQuery = query(
      collection(db, 'inventory'),
      where('managerId', '==', user.uid)
    );

    const unsubscribeInventory = onSnapshot(inventoryQuery, (snapshot) => {
      const alerts = snapshot.docs.filter(doc => doc.data().stock <= doc.data().minStock).length;
      setStats(prev => ({ ...prev, inventoryAlerts: alerts }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'inventory');
    });

    const financialsQuery = query(
      collection(db, 'financials'),
      where('managerId', '==', user.uid)
    );

    const unsubscribeFinancials = onSnapshot(financialsQuery, (snapshot) => {
      const income = snapshot.docs
        .filter(doc => doc.data().type === 'Pemasukan' || doc.data().type === 'Income')
        .reduce((sum, doc) => sum + doc.data().amount, 0);
      setStats(prev => ({ ...prev, totalRevenue: `Rp ${income.toLocaleString('id-ID')}` }));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'financials');
      setLoading(false);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeInventory();
      unsubscribeFinancials();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl shadow-black/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-white">
              Sistem Siap: <span className="text-cyan-400">{user?.displayName?.split(' ')[0] || 'Manajer'}</span>
            </h1>
            <p className="text-slate-500 font-mono text-sm max-w-md uppercase tracking-tight">
              Status Operasional: <span className="text-emerald-500">Nominal</span> • {stats.activeOrders} Tugas Aktif Tertunda
            </p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[120px]">
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Beban CPU</span>
                <span className="text-xl font-mono text-cyan-500">14.2%</span>
             </div>
             <div className="bg-[#ee4323]/10 border border-[#ee4323]/20 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[120px]">
                <span className="text-[10px] uppercase font-black text-[#ee4323] tracking-widest mb-1">Ukuran Antrean</span>
                <span className="text-xl font-mono text-white">{stats.activeOrders}</span>
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/5 rounded-full -mr-32 -mt-32 blur-[100px] pointer-events-none" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={TrendingUp} 
          label="PENDAPATAN_KOTOR_24J" 
          value={stats.totalRevenue} 
          trend="+12.5%" 
          trendUp={true} 
          color="cyan"
        />
        <StatCard 
          icon={Clock} 
          label="ANTREAN_LAYANAN_AKTIF" 
          value={String(stats.activeOrders)} 
          trend="Sedang Berjalan" 
          trendUp={true} 
          color="orange"
          alert={stats.activeOrders > 10}
        />
        <StatCard 
          icon={AlertCircle} 
          label="PERINGATAN_STOK_KRITIS" 
          value={String(stats.inventoryAlerts)} 
          trend="Kritis" 
          trendUp={false} 
          color="pink"
          alert={stats.inventoryAlerts > 0}
        />
        <StatCard 
          icon={Users} 
          label="INDEKS_KEPUASAN" 
          value={stats.satisfaction} 
          trend="Sangat Baik" 
          trendUp={true} 
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 technical-glow-cyan"></span>
                Profiler Performa
              </h3>
              <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">Metrik: Arus_Pendapatan (IDR)</p>
            </div>
            <div className="flex gap-2">
               <button className="px-3 py-1 bg-white/5 text-[10px] font-black uppercase text-slate-400 rounded-md hover:bg-white/10 transition-all">24j</button>
               <button className="px-3 py-1 bg-cyan-500/10 text-[10px] font-black uppercase text-cyan-400 rounded-md border border-cyan-500/20">7h</button>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)'}}
                  itemStyle={{color: '#06b6d4', fontSize: '12px', fontFamily: 'monospace'}}
                />
                <Area type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 technical-glow-orange"></span>
              Log Langsung
            </h3>
            <span className="text-[9px] font-mono text-slate-500">WAKTU_SYS: {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="space-y-5 flex-1">
            {recentOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Clock className="w-8 h-8 text-slate-800 mb-2" />
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Menunggu transaksi...</p>
              </div>
            ) : recentOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-4 group hover:translate-x-1 transition-transform cursor-pointer">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    ['Ready', 'Siap', 'Selesai', 'Completed'].includes(order.status) ? 'bg-emerald-500 technical-glow-emerald' : 
                    ['In Progress', 'Proses', 'Diagnosa'].includes(order.status) ? 'bg-cyan-500 technical-glow-cyan' : 'bg-slate-600'
                  }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{order.customerName}</p>
                  <p className="text-[9px] font-mono text-slate-600 truncate uppercase mt-0.5">{order.vehicle}</p>
                </div>
                <div className="text-right">
                  <p className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    ['Ready', 'Siap', 'Selesai', 'Completed'].includes(order.status) ? 'text-emerald-500 border-emerald-500/20' : 
                    ['In Progress', 'Proses', 'Diagnosa'].includes(order.status) ? 'text-cyan-400 border-cyan-400/20' : 'text-slate-500 border-white/5'
                  }`}>{order.status.toUpperCase()}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all">
            Lihat Semua Transaksi
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, trendUp, color, alert }: any) {
  const themes: any = {
    cyan: { icon: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', glow: 'technical-glow-cyan', text: 'text-cyan-400' },
    orange: { icon: 'text-orange-500 bg-orange-500/10 border-orange-500/20', glow: 'technical-glow-orange', text: 'text-orange-500' },
    pink: { icon: 'text-pink-500 bg-pink-500/10 border-pink-500/20', glow: 'technical-glow-pink', text: 'text-pink-500' },
    emerald: { icon: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', glow: 'technical-glow-emerald', text: 'text-emerald-500' },
  };

  const theme = themes[color] || themes.cyan;

  return (
    <div className={`bg-slate-900/40 backdrop-blur-md p-6 rounded-[1.5rem] border ${alert ? 'border-[#ee4323]/30 bg-[#ee4323]/5' : 'border-white/5'} shadow-xl group hover:border-white/20 transition-all`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl border ${theme.icon} transition-all group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`text-[9px] font-mono font-bold tracking-tighter ${theme.text}`}>
          {trendUp ? '↑' : '↓'} {trend}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">{label}</p>
        <h3 className="text-3xl font-bold font-mono text-white tracking-tighter group-hover:text-cyan-400 transition-colors uppercase">{value}</h3>
      </div>
    </div>
  );
}


