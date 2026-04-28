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
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, where, orderBy, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from './AuthProvider';

interface WorkOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  vehicle: string;
  licensePlate: string;
  jenisService: string;
  opsiService: string[];
  keluhan: string;
  status: string;
  createdAt: any;
  mechanicName?: string;
}

export default function LayananServis() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [mechanics, setMechanics] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('SEMUA');
  
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    vehicleId: '',
    vehicleName: '',
    licensePlate: '',
    mechanicId: '',
    mechanicName: '',
    jenisService: 'Service Rutin',
    opsiService: [] as string[],
    keluhan: '',
    opsiLainnya: '',
  });

  const getOptions = (jenis: string) => {
    switch (jenis) {
       case 'Service Rutin': return ['Penggantian Oli Mesin', 'Penggantian Filter Oli', 'Pengecekan dan Pembersihan Filter Udara', 'Pengecekan Cairan Kendaraan', 'Pengecekan Sistem Kelistrikan Dasar', 'Pengecekan Tekanan dan Kondisi Ban', 'Lainnya'];
       case 'Service Ringan': return ['Tune Up Mesin', 'Servis Sistem Pengereman', 'Spooring dan Balancing', 'Servis AC Ringan', 'Penggantian Oli Transmisi dan Gardan', 'Kuras Radiator (Flushing)', 'Lainnya'];
       case 'Service Berat': return ['Turun Mesin (Engine Overhaul)', 'Overhaul Transmisi', 'Penggantian Kopling Set', 'Perbaikan Kaki-Kaki Total', 'Perbaikan Sistem Kelistrikan Total', 'Lainnya'];
       default: return [];
    }
  };

  useEffect(() => {
    if (!user) return;

    const qOrders = query(collection(db, 'workOrders'), where('managerId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WorkOrder[]);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'workOrders'));

    const qCustomers = query(collection(db, 'customers'), where('managerId', '==', user.uid));
    const unsubCust = onSnapshot(qCustomers, (snap) => setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qVehicles = query(collection(db, 'vehicles'), where('managerId', '==', user.uid));
    const unsubVeh = onSnapshot(qVehicles, (snap) => setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qMechanics = query(collection(db, 'mechanics'), where('managerId', '==', user.uid));
    const unsubMech = onSnapshot(qMechanics, (snap) => setMechanics(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubOrders(); unsubCust(); unsubVeh(); unsubMech(); };
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
        customerId: formData.customerId,
        vehicle: formData.vehicleName,
        vehicleId: formData.vehicleId,
        licensePlate: formData.licensePlate,
        mechanicName: formData.mechanicName || 'Belum Ditugaskan',
        mechanicId: formData.mechanicId || '',
        jenisService: formData.jenisService,
        opsiService: formData.opsiService.map(opsi => opsi === 'Lainnya' ? (formData.opsiLainnya || 'Lainnya') : opsi),
        keluhan: formData.keluhan,
        status: 'Antrean',
        managerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setShowModal(false);
      setFormData({
        customerId: '', customerName: '', vehicleId: '', vehicleName: '', licensePlate: '', mechanicId: '', mechanicName: '', jenisService: 'Service Rutin', opsiService: [], keluhan: '', opsiLainnya: '',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'workOrders');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'workOrders', orderId), { status: newStatus, updatedAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'workOrders');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'workOrders', orderId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'workOrders');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'SEMUA' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold font-display text-white tracking-tight flex items-center gap-3">
             <Wrench className="w-10 h-10 text-cyan-500" />
             Layanan Servis
          </h1>
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mt-2 ml-1 cursor-default">MEMANTAU_PERINTAH_KERJA // STATUS_AKTIF_OPERASIONAL</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-[#ee4323] hover:bg-[#ff5733] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all technical-glow-orange disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Order Baru
        </button>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="w-4 h-4 text-slate-600 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-400 transition-colors" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="PINDAI_LOG_BERDASARKAN_NAMA_ATAU_ID..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-[11px] font-mono tracking-tight outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700 text-white"
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
            <option value="Antrean">ANTREAN</option>
            <option value="Diagnosa">DIAGNOSA</option>
            <option value="Proses">PROSES</option>
            <option value="Menunggu Part">MENUNGGU_PART</option>
            <option value="Siap">SIAP</option>
            <option value="Selesai">SELESAI</option>
          </select>
        </div>
      </div>

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
                  <th className="px-8 py-4">Mekanik</th>
                  <th className="px-8 py-4">Operasi</th>
                  <th className="px-8 py-4">Status & Tindakan</th>
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
                      <p className="text-xs text-indigo-400 font-bold tracking-tight">{order.mechanicName || 'Belum Ditugaskan'}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs text-slate-400 font-mono tracking-tight">{order.jenisService}</p>
                      <p className="text-[10px] text-cyan-400 font-mono tracking-tight mt-0.5">{order.opsiService?.join(', ')}</p>
                      {order.keluhan && <p className="text-[9px] text-slate-500 font-mono tracking-tight mt-1 line-clamp-2">Keluhan: {order.keluhan}</p>}
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
                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Pelanggan</label>
                <select 
                  required
                  value={formData.customerId}
                  onChange={(e) => {
                    const cust = customers.find(c => c.id === e.target.value);
                    setFormData({...formData, customerId: e.target.value, customerName: cust?.name || '', vehicleId: '', vehicleName: '', licensePlate: ''});
                  }}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="">-- Pilih Pelanggan --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {formData.customerId && (
                <div>
                  <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Kendaraan Pelanggan</label>
                  <select 
                    required
                    value={formData.vehicleId}
                    onChange={(e) => {
                      const v = vehicles.find(vec => vec.id === e.target.value);
                      setFormData({...formData, vehicleId: e.target.value, vehicleName: v?.model || '', licensePlate: v?.licensePlate || ''});
                    }}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="">-- Pilih Kendaraan (Plat - Model) --</option>
                    {vehicles.filter(v => v.customerId === formData.customerId).map(v => (
                      <option key={v.id} value={v.id}>{v.licensePlate} - {v.model}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                 <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Mekanik</label>
                 <select 
                    value={formData.mechanicId}
                    onChange={(e) => {
                      const m = mechanics.find(mech => mech.id === e.target.value);
                      setFormData({...formData, mechanicId: e.target.value, mechanicName: m?.name || ''});
                    }}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="">-- Pilih Mekanik (Opsional) --</option>
                    {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                 </select>
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Jenis Service</label>
                <select 
                  value={formData.jenisService}
                  onChange={(e) => {
                    const newJenis = e.target.value;
                    setFormData({...formData, jenisService: newJenis, opsiService: []});
                  }}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                >
                  <option value="Service Rutin">Service Rutin</option>
                  <option value="Service Ringan">Service Ringan</option>
                  <option value="Service Berat">Service Berat</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Opsi Service</label>
                <div className="grid grid-cols-1 gap-2 bg-slate-950 border border-white/10 rounded-xl p-4">
                  {getOptions(formData.jenisService).map((opsi) => (
                    <label key={opsi} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center w-5 h-5 rounded border border-white/20 bg-slate-900 group-hover:border-cyan-500 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={formData.opsiService.includes(opsi)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, opsiService: [...formData.opsiService, opsi]});
                            } else {
                              setFormData({...formData, opsiService: formData.opsiService.filter(o => o !== opsi)});
                            }
                          }}
                          className="absolute opacity-0 w-full h-full cursor-pointer"
                        />
                        {formData.opsiService.includes(opsi) && <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{opsi}</span>
                    </label>
                  ))}
                  {formData.opsiService.includes('Lainnya') && (
                    <div className="mt-2 pl-8">
                      <input 
                        type="text" 
                        value={formData.opsiLainnya}
                        onChange={(e) => setFormData({...formData, opsiLainnya: e.target.value})}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-700"
                        placeholder="Tuliskan opsi service lainnya"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Keluhan</label>
                <textarea 
                  rows={3}
                  value={formData.keluhan}
                  onChange={(e) => setFormData({...formData, keluhan: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-700 resize-none"
                  placeholder="Deskripsikan keluhan kendaraan (Opsional)"
                />
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
