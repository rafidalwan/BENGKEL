import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  Loader2,
  X,
  User,
  Car,
  Trash2
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { handleFirestoreError, OperationType } from '../lib/firebase';

interface Appointment {
  id: string;
  customerName: string;
  vehicle: string;
  licensePlate: string;
  serviceType: string;
  date: string;
  time: string;
  status: string;
}

export default function Jadwal() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    customerName: '',
    vehicle: '',
    licensePlate: '',
    serviceType: '',
    date: '',
    time: '',
    status: 'Terjadwal'
  });

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus janji temu ini?')) return;
    try {
      await deleteDoc(doc(db, 'appointments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'appointments');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'appointments', id), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'appointments');
    }
  };

  useEffect(() => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'appointments'),
        where('managerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Appointment[];
        setAppointments(data);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'appointments');
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'appointments');
      setLoading(false);
    }
  }, [user]);

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsAdding(true);

    try {
      await addDoc(collection(db, 'appointments'), {
        customerName: formData.customerName,
        vehicle: formData.vehicle,
        licensePlate: formData.licensePlate,
        serviceType: formData.serviceType,
        date: formData.date,
        time: formData.time,
        status: formData.status,
        managerId: user.uid,
        createdAt: serverTimestamp()
      });
      setShowModal(false);
      setFormData({
        customerName: '',
        vehicle: '',
        licensePlate: '',
        serviceType: '',
        date: '',
        time: '',
        status: 'Terjadwal'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'appointments');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight flex items-center gap-3">
             <Calendar className="w-8 h-8 text-indigo-500" />
             Jadwal Servis
          </h1>
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mt-1">Manajemen pemesanan dan antrean waktu service</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]"
        >
          <Plus className="w-4 h-4" />
          Buat Janji
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="w-4 h-4 text-slate-600 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="CARI_JADWAL..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-[11px] font-mono tracking-tight outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-5 py-3 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-white/5">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-slate-600 border border-dashed border-white/5 rounded-3xl bg-slate-900/50">
          <Calendar className="w-16 h-16 mb-4 opacity-5" />
          <h3 className="text-lg font-bold text-slate-500 uppercase tracking-widest">Jadwal Kosong</h3>
          <p className="text-[10px] font-mono max-w-xs mt-2 uppercase">Belum ada janji temu yang dijadwalkan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="p-6 bg-slate-900 border border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-bold text-white">{appointment.date}</span>
                    <Clock className="w-4 h-4 text-slate-500 ml-2" />
                    <span className="text-sm text-slate-400 font-mono">{appointment.time}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors mt-2">{appointment.serviceType}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    value={appointment.status}
                    onChange={(e) => handleUpdateStatus(appointment.id, e.target.value)}
                    className={`px-2 py-1 text-[10px] font-black uppercase rounded border outline-none cursor-pointer appearance-none ${
                        appointment.status === 'Terjadwal' ? 'text-indigo-400 border-indigo-400/20 bg-indigo-400/5' :
                        appointment.status === 'Selesai' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                        'text-slate-500 border-slate-500/20 bg-slate-500/5'
                    }`}
                  >
                    <option value="Terjadwal">TERJADWAL</option>
                    <option value="Selesai">SELESAI</option>
                    <option value="Dibatalkan">DIBATALKAN</option>
                  </select>
                  <button onClick={() => handleDeleteAppointment(appointment.id)} className="p-1 hover:bg-rose-500/10 rounded-lg transition-all text-slate-600 hover:text-rose-500 hidden group-hover:block" title="Hapus">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex items-center gap-3 text-slate-400">
                  <User className="w-4 h-4 text-slate-600" />
                  <span className="text-sm">{appointment.customerName}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <Car className="w-4 h-4 text-slate-600" />
                  <span className="text-sm">{appointment.vehicle} <span className="text-slate-500 font-mono ml-1 text-xs">({appointment.licensePlate})</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-display text-white">Buat Jadwal Baru</h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                disabled={isAdding}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddAppointment} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Nama Pelanggan</label>
                <input 
                  type="text" 
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-colors"
                  placeholder="Budi Santoso"
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
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-colors"
                    placeholder="Toyota Avanza"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Plat Nomor</label>
                  <input 
                    type="text" 
                    required
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({...formData, licensePlate: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-colors font-mono"
                    placeholder="B 1234 XYZ"
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
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-colors"
                  placeholder="Servis Berkala"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Tanggal</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Waktu</label>
                  <input 
                    type="time" 
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-colors font-mono"
                  />
                </div>
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
                  className="flex-1 flex justify-center items-center py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50"
                >
                  {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Janji'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
