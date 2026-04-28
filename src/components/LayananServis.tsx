import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2,
  MoreHorizontal, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Car,
  Loader2,
  Wrench,
  X,
  PlayCircle
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where, orderBy, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { handleFirestoreError, OperationType } from './AuthProvider';

interface WorkOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  vehicle: string;
  licensePlate: string;
  serviceType: string;
  status: string;
  priority: string;
  createdAt: any;
}

export default function LayananServis() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // Modal & Filter state
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('SEMUA');
  const [formData, setFormData] = useState({
    customerName: '',
    vehicle: '',
    licensePlate: '',
    serviceType: '',
    priority: 'Menengah',
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'workOrders'),
      where('managerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WorkOrder[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'workOrders');
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsCreating(true);
    try {
      const orderCount = orders.length + 1;
      await addDoc(collection(db, 'workOrders'), {
        orderNumber: `WO-${new Date().getFullYear()}-${String(orderCount).padStart(3, '0')}`,
        customerName: formData.customerName,
        vehicle: formData.vehicle,
        licensePlate: formData.licensePlate,
        serviceType: formData.serviceType,
        status: 'Antrean',
        priority: formData.priority,
        managerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setShowModal(false);
      setFormData({
        customerName: '',
        vehicle: '',
        licensePlate: '',
        serviceType: '',
        priority: 'Menengah',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'workOrders');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'workOrders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'workOrders');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus perintah kerja ini? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      await deleteDoc(doc(db, 'workOrders', orderId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'workOrders');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.licensePlate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'SEMUA' || order.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-12 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight flex items-center gap-3">
             <Wrench className="w-8 h-8 text-orange-500" />
             Unit Komando Servis
          </h1>
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mt-1">Orkestrasi pesanan & alur kerja teknisi</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-[#ee4323] hover:bg-[#ff5733] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all technical-glow-orange disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Order Baru
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="w-4 h-4 text-slate-600 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-400 transition-colors" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="PINDAI_LOG_BERDASARKAN_NAMA_ATAU_ID..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-[11px] font-mono tracking-tight outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex items-center gap-2 px-5 py-3 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-white/5">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-none px-5 py-3 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-white/5 outline-none cursor-pointer appearance-none"
          >
            <option value="SEMUA">SEMUA_STATUS</option>
            <option value="ANTREAN">ANTREAN</option>
            <option value="DIAGNOSA">DIAGNOSA</option>
            <option value="PROSES">PROSES</option>
            <option value="MENUNGGU PART">MENUNGGU_PART</option>
            <option value="SIAP">SIAP</option>
            <option value="SELESAI">SELESAI</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-600">
            <Clock className="w-16 h-16 mb-4 opacity-5" />
            <h3 className="text-lg font-bold text-slate-500 uppercase tracking-widest">Pencarian Kosong</h3>
            <p className="text-[10px] font-mono max-w-xs mt-2 uppercase">Tidak ada perintah kerja yang cocok dengan filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left bg-transparent">
              <thead className="bg-slate-950/50 border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-4">ID Transaksi</th>
                  <th className="px-8 py-4">Subjek & Aset</th>
                  <th className="px-8 py-4">Operasi</th>
                  <th className="px-8 py-4">Status & Tindakan</th>
                  <th className="px-8 py-4">Prioritas</th>
                  <th className="px-8 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5">
                      <p className="font-mono font-bold text-cyan-400 text-xs tracking-tighter">{order.orderNumber}</p>
                      <p className="text-[9px] text-slate-600 mt-1 font-mono uppercase">
                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'REALTIME'}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{order.customerName}</p>
                          <p className="text-[10px] text-slate-600 flex items-center gap-1 font-mono uppercase mt-0.5">
                            <Car className="w-3 h-3" /> {order.vehicle} • {order.licensePlate}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs text-slate-400 font-mono uppercase tracking-tight">{order.serviceType}</p>
                    </td>
                    <td className="px-8 py-5">
                      <select 
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className={`text-[10px] font-mono font-black px-3 py-1.5 rounded-full border outline-none cursor-pointer appearance-none ${
                          order.status === 'Proses' ? 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5' :
                          order.status === 'Menunggu Part' ? 'text-orange-500 border-orange-500/20 bg-orange-500/5' :
                          order.status === 'Siap' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                          order.status === 'Selesai' ? 'text-slate-500 border-white/5 bg-white/5' :
                          order.status === 'Diagnosa' ? 'text-indigo-400 border-indigo-400/20 bg-indigo-400/5' :
                          'text-slate-400 border-white/5 bg-white/5'
                        }`}
                      >
                        <option value="Antrean">ANTREAN</option>
                        <option value="Diagnosa">DIAGNOSA</option>
                        <option value="Proses">PROSES</option>
                        <option value="Menunggu Part">MENUNGGU PART</option>
                        <option value="Siap">SIAP</option>
                        <option value="Selesai">SELESAI</option>
                      </select>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded border inline-block ${
                        order.priority === 'Tinggi' ? 'text-pink-500 border-pink-500/20 bg-pink-500/5' :
                        order.priority === 'Menengah' ? 'text-orange-500 border-orange-500/20 bg-orange-500/5' :
                        'text-slate-500 border-white/5 bg-white/5'
                      }`}>
                        {(order.priority || 'NORMAL').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right flex justify-end gap-2">
                       <button onClick={() => handleDeleteOrder(order.id)} className="p-2 hover:bg-rose-500/10 rounded-lg transition-all text-slate-600 hover:text-rose-500" title="Hapus">
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
              <h2 className="text-xl font-bold font-display text-white">Buat Order Baru</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Nama Pelanggan</label>
                <input 
                  type="text" 
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors placeholder:text-slate-700"
                  placeholder="Mis. Bambang S."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Kendaraan</label>
                  <input 
                    type="text" 
                    required
                    value={formData.vehicle}
                    onChange={(e) => setFormData({...formData, vehicle: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors placeholder:text-slate-700"
                    placeholder="Mis. Toyota Avanza"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Plat Nomor</label>
                  <input 
                    type="text" 
                    required
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({...formData, licensePlate: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors placeholder:text-slate-700"
                    placeholder="Mis. B 1234 XYZ"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Jenis Layanan</label>
                <input 
                  type="text" 
                  required
                  value={formData.serviceType}
                  onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors placeholder:text-slate-700"
                  placeholder="Mis. Ganti Oli & Filter"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Prioritas</label>
                <select 
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
                >
                  <option value="Normal">Normal</option>
                  <option value="Menengah">Menengah</option>
                  <option value="Tinggi">Tinggi</option>
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
                  disabled={isCreating}
                  className="flex-1 flex justify-center items-center py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors"
                >
                  {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
