import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  Filter, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  X,
  CreditCard,
  Trash2
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { handleFirestoreError, OperationType } from '../lib/firebase';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
}

export default function Keuangan() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'Pemasukan',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'financials', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'financials');
    }
  };

  useEffect(() => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'financials'),
        where('managerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];
        setTransactions(data);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'financials');
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'financials');
      setLoading(false);
    }
  }, [user]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsAdding(true);

    try {
      await addDoc(collection(db, 'financials'), {
        type: formData.type,
        amount: Number(formData.amount),
        description: formData.description,
        date: formData.date,
        managerId: user.uid,
        createdAt: serverTimestamp()
      });
      setShowModal(false);
      setFormData({
        type: 'Pemasukan',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'financials');
    } finally {
      setIsAdding(false);
    }
  };

  const totalIncome = transactions.filter(t => t.type === 'Pemasukan' || t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'Pengeluaran' || t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-8 pb-12 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight flex items-center gap-3">
             <TrendingUp className="w-8 h-8 text-emerald-500" />
             Laporan Keuangan
          </h1>
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mt-1">Pemantauan arus kas pendapatan dan pengeluaran</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all technical-glow-emerald"
        >
          <Plus className="w-4 h-4" />
          Tambah Transaksi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px]"></div>
            <div className="mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Pemasukan</span>
            </div>
            <div className="flex items-end justify-between">
                <div>
                   <h2 className="text-3xl font-bold text-white tracking-tighter">Rp {totalIncome.toLocaleString('id-ID')}</h2>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                   <ArrowUpRight className="w-6 h-6 text-emerald-500" />
                </div>
            </div>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-[50px]"></div>
            <div className="mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Pengeluaran</span>
            </div>
             <div className="flex items-end justify-between">
                <div>
                   <h2 className="text-3xl font-bold text-white tracking-tighter">Rp {totalExpense.toLocaleString('id-ID')}</h2>
                </div>
                <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                   <ArrowDownRight className="w-6 h-6 text-rose-500" />
                </div>
            </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="w-4 h-4 text-slate-600 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="CARI_TRANSAKSI..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-[11px] font-mono tracking-tight outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-700"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-5 py-3 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-white/5">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-slate-600 border border-dashed border-white/5 rounded-3xl bg-slate-900/50">
          <TrendingUp className="w-16 h-16 mb-4 opacity-5" />
          <h3 className="text-lg font-bold text-slate-500 uppercase tracking-widest">Catatan Keuangan Kosong</h3>
          <p className="text-[10px] font-mono max-w-xs mt-2 uppercase">Belum ada transaksi terekam.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950/50 border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    <tr>
                    <th className="px-8 py-4">Tanggal</th>
                    <th className="px-8 py-4">Deskripsi</th>
                    <th className="px-8 py-4">Tipe</th>
                    <th className="px-8 py-4 text-right">Jumlah</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {transactions.map(t => {
                        const isIncome = t.type === 'Pemasukan' || t.type === 'Income';
                        return (
                        <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-8 py-5 text-sm text-slate-400 font-mono">
                                {t.date}
                            </td>
                            <td className="px-8 py-5 text-sm text-white font-medium">
                                <div className="flex items-center gap-3">
                                    <CreditCard className="w-4 h-4 text-slate-600" />
                                    {t.description}
                                </div>
                            </td>
                            <td className="px-8 py-5">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                    isIncome ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-rose-500 border-rose-500/20 bg-rose-500/5'
                                }`}>
                                    {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                                </span>
                            </td>
                            <td className="px-8 py-5 text-right font-mono font-bold flex justify-end items-center gap-4">
                                <span className={isIncome ? 'text-emerald-400' : 'text-rose-400'}>
                                   {isIncome ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
                                </span>
                                <button onClick={() => handleDeleteTransaction(t.id)} className="p-1 hover:bg-rose-500/10 rounded-lg transition-all text-slate-600 hover:text-rose-500" title="Hapus">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-display text-white">Tambah Transaksi</h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                disabled={isAdding}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="space-y-4">
               <div>
                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Tipe Transaksi</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                >
                  <option value="Pemasukan">Pemasukan (Income)</option>
                  <option value="Pengeluaran">Pengeluaran (Expense)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Deskripsi</label>
                <input 
                  type="text" 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                  placeholder="Mis. Servis Mobil Avanza"
                />
              </div>
               <div>
                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Jumlah (Rp)</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors font-mono"
                  placeholder="500000"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Tanggal</label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors font-mono"
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
                  className="flex-1 flex justify-center items-center py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors technical-glow-emerald disabled:opacity-50"
                >
                  {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
