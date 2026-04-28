import React, { useEffect, useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  ArrowDown, 
  TrendingUp, 
  AlertTriangle,
  MoreVertical,
  Filter,
  Loader2,
  X,
  Trash2
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { handleFirestoreError, OperationType } from '../lib/firebase';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  status: string;
}

export default function Inventaris() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus inventaris ini? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      await deleteDoc(doc(db, 'inventory', itemId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'inventory');
    }
  };

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    stock: 0,
    minStock: 0,
    price: 0,
    status: 'Tersedia'
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'inventory'),
      where('managerId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InventoryItem[];
      setItems(inventoryData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'inventory');
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsAdding(true);
    try {
      const itemCount = items.length + 1;
      await addDoc(collection(db, 'inventory'), {
        sku: `PRT-${String(1000 + itemCount)}`,
        name: formData.name,
        category: formData.category || 'Umum',
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        price: Number(formData.price),
        status: Number(formData.stock) <= 0 ? 'Habis' : (Number(formData.stock) <= Number(formData.minStock) ? 'Stok Rendah' : 'Tersedia'),
        managerId: user.uid,
        updatedAt: serverTimestamp()
      });
      setShowModal(false);
      setFormData({
        name: '',
        category: '',
        stock: 0,
        minStock: 0,
        price: 0,
        status: 'Tersedia'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'inventory');
    } finally {
      setIsAdding(false);
    }
  };

  const lowStockCount = items.filter(i => i.stock <= i.minStock).length;
  const totalValue = items.reduce((acc, i) => acc + (i.price * i.stock), 0);

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight flex items-center gap-3">
             <Package className="w-8 h-8 text-cyan-400" />
             Intelijensi Inventaris
          </h1>
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mt-1">Sistem alokasi sumber daya & pemantauan stok</p>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
            <ArrowDown className="w-4 h-4" />
            Stok Masuk
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-8 py-2.5 bg-[#ee4323] hover:bg-[#ff5733] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all technical-glow-orange disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Daftar Part
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SmallStatCard icon={Package} label="TOTAL_SKU_LOAD" value={String(items.length)} color="cyan" />
        <SmallStatCard icon={AlertTriangle} label="PERINGATAN_STOK" value={String(lowStockCount)} color="orange" alert={lowStockCount > 0} />
        <SmallStatCard icon={TrendingUp} label="EST_NILAI_ASET" value={`Rp${totalValue.toLocaleString('id-ID')}`} color="emerald" />
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-6 items-center justify-between bg-white/[0.02]">
            <div className="relative w-full md:w-96 group">
              <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-400 transition-colors" />
              <input 
                type="text" 
                placeholder="PROSA_DATABASE_BERDASARKAN_SKU_ATAU_NAMA..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-white/5 rounded-lg text-[11px] font-mono tracking-tight outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700" 
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button className="flex items-center gap-2 px-4 py-2 bg-white/5 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/5 hover:bg-white/10 hover:text-white transition-all">
                <Filter className="w-3.5 h-3.5" /> Filter
              </button>
            </div>
        </div>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-600">
            <Package className="w-16 h-16 mb-4 opacity-5" />
            <h3 className="text-lg font-bold text-slate-500 uppercase tracking-widest">Database Kosong</h3>
            <p className="text-[10px] font-mono max-w-xs mt-2 uppercase">Menunggu pendaftaran sumber daya bengkel.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left bg-transparent">
              <thead className="bg-slate-950/50 border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-4">Info Sumber Daya</th>
                  <th className="px-8 py-4">Kelas</th>
                  <th className="px-8 py-4">Status Alokasi</th>
                  <th className="px-8 py-4">Nilai Unit</th>
                  <th className="px-8 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{item.name}</p>
                      <p className="text-[10px] text-slate-600 mt-1 font-mono uppercase tracking-widest">{item.sku}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-mono px-2 py-1 bg-white/5 text-slate-400 rounded border border-white/5">
                        {item.category.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-2">
                         <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-white font-bold">{item.stock} UNIT</span>
                            <span className="text-slate-600">AMBANG: {item.minStock}</span>
                         </div>
                         <div className="w-36 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className={`h-full transition-all ${
                                item.stock === 0 ? 'bg-pink-500 shadow-[0_0_8px_#ec4899]' : 
                                item.stock <= item.minStock ? 'bg-orange-500 shadow-[0_0_8px_#f97316]' : 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]'
                              }`} 
                              style={{ width: `${Math.min((item.stock / (item.minStock * 3)) * 100, 100)}%` }} 
                            />
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-mono font-bold text-white tracking-tighter">Rp{item.price.toLocaleString('id-ID')}</p>
                    </td>
                    <td className="px-8 py-5 text-right flex justify-end gap-2">
                       <button onClick={() => handleDeleteItem(item.id)} className="p-2 hover:bg-rose-500/10 rounded-lg transition-all text-slate-600 hover:text-rose-500" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-display text-white">Daftar Suku Cadang Baru</h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                disabled={isAdding}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Nama Suku Cadang</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors placeholder:text-slate-700"
                  placeholder="Mis. Filter Udara Racing"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Kategori</label>
                <input 
                  type="text" 
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors placeholder:text-slate-700"
                  placeholder="Mis. Mesin"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Stok Awal</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={formData.stock || ''}
                    onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors placeholder:text-slate-700 font-mono"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Batas Stok Rendah</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={formData.minStock || ''}
                    onChange={(e) => setFormData({...formData, minStock: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors placeholder:text-slate-700 font-mono"
                    placeholder="5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Harga (Rp)</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors placeholder:text-slate-700 font-mono"
                  placeholder="50000"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  disabled={isAdding}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isAdding}
                  className="flex-1 flex justify-center items-center py-3 px-4 rounded-xl bg-[#ee4323] hover:bg-[#ff5733] text-white font-bold text-sm transition-colors technical-glow-orange disabled:opacity-50"
                >
                  {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Daftarkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SmallStatCard({ icon: Icon, label, value, color, alert }: any) {
  const colors: any = {
    cyan: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20 glow-cyan',
    orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20 glow-orange',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 glow-emerald',
  };

  const theme = colors[color] || colors.cyan;

  return (
    <div className={`bg-slate-900/40 p-6 rounded-2xl border ${alert ? 'border-orange-500/30 bg-orange-500/5' : 'border-white/5'} flex items-center justify-between shadow-xl`}>
       <div>
         <p className="text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">{label}</p>
         <h4 className="text-2xl font-bold text-white font-mono tracking-tighter">{value}</h4>
       </div>
       <div className={`p-3 rounded-xl border ${theme} ${theme.includes('glow') ? (theme.includes('cyan') ? 'technical-glow-cyan' : theme.includes('orange') ? 'technical-glow-orange' : 'technical-glow-emerald') : ''}`}>
          <Icon className="w-5 h-5" />
       </div>
    </div>
  );
}

