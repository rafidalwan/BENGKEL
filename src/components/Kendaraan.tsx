import React, { useState, useEffect } from 'react';
import { 
  Car,
  Plus,
  Trash2,
  Search,
  Loader2,
  X,
  User
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from './AuthProvider';

export default function Kendaraan() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [licensePlate, setLicensePlate] = useState('');
  const [model, setModel] = useState('');
  const [customerId, setCustomerId] = useState('');

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const q1 = query(collection(db, 'vehicles'), where('managerId', '==', user.uid));
    const unsub1 = onSnapshot(q1, (snap) => {
        setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
    });
    
    const q2 = query(collection(db, 'customers'), where('managerId', '==', user.uid));
    const unsub2 = onSnapshot(q2, (snap) => setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    return () => { unsub1(); unsub2(); }
  }, [user]);

  const handleAdd = async (e: any) => {
    e.preventDefault();
    if (!user || !licensePlate || !customerId) return;
    try {
        const customer = customers.find(c => c.id === customerId);
        await addDoc(collection(db, 'vehicles'), {
            licensePlate,
            model,
            customerId,
            customerName: customer?.name || 'Unknown',
            managerId: user.uid,
            createdAt: serverTimestamp()
        });
        setLicensePlate('');
        setModel('');
        setCustomerId('');
        setShowModal(false);
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'vehicles');
    }
  };

  const handleDelete = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'vehicles', id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'vehicles');
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold font-display text-white tracking-tight flex items-center gap-3">
             <Car className="w-10 h-10 text-emerald-500" />
             Kendaraan
          </h1>
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mt-2 ml-1 cursor-default">DATA_KENDARAAN_PELANGGAN // AKTIF</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-[#ee4323] hover:bg-[#ff5733] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all technical-glow-orange disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Tambah Kendaraan
        </button>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="w-4 h-4 text-slate-600 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-400 transition-colors" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="PINDAI_BERDASARKAN_PLAT/NAMA_PELANGGAN..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-[11px] font-mono tracking-tight outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-700 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-slate-600 border border-white/5 rounded-3xl bg-slate-900/50">
            <Car className="w-16 h-16 mb-4 opacity-10 text-emerald-500" />
            <h3 className="text-lg font-bold text-slate-500 uppercase tracking-widest">Tidak Ada Data</h3>
            <p className="text-[10px] font-mono max-w-xs mt-2 uppercase">Belum ada kendaraan yang ditambahkan atau cocok dengan filter.</p>
          </div>
        ) : (
          filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="group bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all shadow-xl hover:shadow-emerald-500/10 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:bg-emerald-500/10 transition-colors pointer-events-none"></div>
              
              <div className="relative z-10 flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all text-emerald-500">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-mono text-white tracking-tight leading-none group-hover:text-emerald-400 transition-colors">
                      {vehicle.licensePlate}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-wider">{vehicle.model}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(vehicle.id)} 
                  className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100" 
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="relative z-10 flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-bold text-white">{vehicle.customerName}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-display text-white">Tambah Kendaraan Baru</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Plat Nomor</label>
                <input 
                  type="text" 
                  required
                  value={licensePlate}
                  onChange={e => setLicensePlate(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors uppercase font-mono"
                  placeholder="Mis. B 1234 XYZ"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Merk / Model</label>
                <input 
                  type="text" 
                  required
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                  placeholder="Mis. Toyota Innova Venturer"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Pemilik (Pelanggan)</label>
                <select 
                  required
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                >
                  <option value="">-- Pilih Pelanggan --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 flex justify-center items-center py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors"
                >
                  Simpan Kendaraan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
