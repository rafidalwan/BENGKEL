import React, { useState, useEffect, useRef } from 'react';
import { 
  CreditCard,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle,
  Loader2,
  Car
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { handleFirestoreError, OperationType } from '../lib/firebase';

interface WorkOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  vehicle: string;
  licensePlate: string;
  status: string;
  serviceType: string;
}

interface InventoryItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
}

interface CartItem extends InventoryItem {
  quantity: number;
}

export default function Kasir() {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [serviceFee, setServiceFee] = useState<number>(0);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch active work orders (Siap, Proses, dll - not Selesai)
    const qOrders = query(
      collection(db, 'workOrders'),
      where('managerId', '==', user.uid),
      where('status', '!=', 'Selesai')
    );

    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setWorkOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkOrder)));
    }, (error) => {
      console.error(error);
    });

    // Fetch inventory
    const qInventory = query(
      collection(db, 'inventory'),
      where('managerId', '==', user.uid)
    );

    const unsubInventory = onSnapshot(qInventory, (snapshot) => {
      setInventory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
    }, (error) => {
      console.error(error);
    });

    return () => {
      unsubOrders();
      unsubInventory();
    };
  }, [user]);

  const addToCart = (item: InventoryItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) return prev; // Cannot add more than stock
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (item.stock <= 0) return prev;
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty > item.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const calculateTotalParts = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const calculateTotal = () => calculateTotalParts() + (Number(serviceFee) || 0);

  const handlePayment = async () => {
    if (!user || !selectedOrder) return;
    setIsProcessing(true);

    try {
      // 1. Update Inventory stock
      for (const item of cart) {
        const inventoryRef = doc(db, 'inventory', item.id);
        const newStock = item.stock - item.quantity;
        await updateDoc(inventoryRef, {
            stock: newStock,
            status: newStock <= 0 ? 'Habis' : 'Tersedia', // basic fallback, assumes minStock is ignored here or handled manually
            updatedAt: serverTimestamp()
        });
      }

      // 2. Add Financial Transaction
      await addDoc(collection(db, 'financials'), {
        type: 'Pemasukan',
        amount: calculateTotal(),
        description: `Pembayaran Service: ${selectedOrder.orderNumber} - ${selectedOrder.customerName}`,
        date: new Date().toISOString().split('T')[0],
        managerId: user.uid,
        createdAt: serverTimestamp()
      });

      // 3. Mark Work Order as 'Selesai'
      await updateDoc(doc(db, 'workOrders', selectedOrder.id), {
        status: 'Selesai',
        updatedAt: serverTimestamp()
      });

      setShowReceipt(true);
    } catch (error) {
      console.error("Payment failed", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = () => {
    if (receiptRef.current) {
        const content = receiptRef.current.innerHTML;
        const printWindow = window.open('', '', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Struk Pembayaran</title>
                    <style>
                        body { font-family: monospace; padding: 20px; color: #000; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px;}
                        th, td { text-align: left; padding: 5px 0; }
                        th { border-bottom: 1px dashed #000; }
                        .text-right { text-align: right; }
                        .border-top { border-top: 1px dashed #000; }
                        .bold { font-weight: bold; }
                        .center { text-align: center; }
                    </style>
                </head>
                <body>
                    ${content}
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    }
  };

  const resetPOS = () => {
    setSelectedOrder(null);
    setCart([]);
    setServiceFee(0);
    setShowReceipt(false);
  };

  const filteredItems = inventory.filter(i => i.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) || i.sku.toLowerCase().includes(itemSearchTerm.toLowerCase()));

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight flex items-center gap-3">
             <CreditCard className="w-8 h-8 text-cyan-400" />
             Point of Sale
          </h1>
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mt-1">Sistem kasir dan transaksi pembayaran servis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Kiri: Pilih Order & Item */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pilih Kendaraan / Order */}
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-6">
            <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                <Car className="w-4 h-4 text-cyan-400" /> Pilih Kendaraan / Servis
            </h2>
            <select 
               className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
               value={selectedOrder?.id || ''}
               onChange={(e) => {
                 const order = workOrders.find(o => o.id === e.target.value);
                 setSelectedOrder(order || null);
               }}
            >
                <option value="">-- Pilih Perintah Kerja --</option>
                {workOrders.map(order => (
                    <option key={order.id} value={order.id}>
                        {order.orderNumber} - {order.customerName} ({order.vehicle} - {order.licensePlate}) - {order.status}
                    </option>
                ))}
            </select>
          </div>

          {/* Pilih Part / Inventaris */}
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 flex-1 min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-cyan-400" /> Tambah Suku Cadang
                </h2>
                <div className="relative w-64 group">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-400 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Cari suku cadang..." 
                        value={itemSearchTerm}
                        onChange={(e) => setItemSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs font-mono tracking-tight focus:border-cyan-500/50 focus:outline-none transition-all placeholder:text-slate-600 outline-none text-white"
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pr-2" style={{maxHeight: '400px'}}>
                {filteredItems.map(item => (
                    <div 
                        key={item.id} 
                        onClick={() => addToCart(item)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                            item.stock > 0 
                            ? 'bg-slate-950 border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.02]' 
                            : 'bg-slate-950/50 border-dashed border-white/5 opacity-50 cursor-not-allowed'
                        }`}
                    >
                        <p className="text-xs font-mono text-slate-500 mb-1">{item.sku}</p>
                        <p className="text-sm font-bold text-white line-clamp-1 mb-2">{item.name}</p>
                        <div className="flex items-center justify-between mt-auto">
                            <span className="text-xs font-bold text-emerald-400">Rp {item.price.toLocaleString('id-ID')}</span>
                            <span className="text-[10px] font-mono text-slate-500">Stok: {item.stock}</span>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>

        {/* Kanan: Keranjang & Pembayaran */}
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 sticky top-24">
            <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">Detail Tagihan</h2>
            
            <div className="bg-slate-950 rounded-xl p-4 min-h-[200px] max-h-[300px] overflow-y-auto mb-4 border border-white/5">
                {cart.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-600 text-xs font-mono text-center">
                        Keranjang Suku Cadang Kosong
                    </div>
                ) : (
                    <div className="space-y-3">
                        {cart.map(item => (
                            <div key={item.id} className="flex items-start justify-between pb-3 border-b border-white/5 last:border-0">
                                <div className="flex-1 pr-2">
                                    <p className="text-xs font-bold text-white leading-tight mb-1">{item.name}</p>
                                    <p className="text-[10px] font-mono text-slate-500">Rp {item.price.toLocaleString('id-ID')} / unit</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <p className="text-xs font-bold text-emerald-400">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                                    <div className="flex items-center gap-1 bg-slate-900 rounded p-0.5 border border-white/5">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white/10 rounded"><Minus className="w-3 h-3 text-slate-400" /></button>
                                        <span className="text-[10px] font-mono w-4 text-center text-white">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white/10 rounded"><Plus className="w-3 h-3 text-slate-400" /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-4 mb-6">
                <div>
                    <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Biaya Jasa Servis</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-bold">Rp</span>
                        <input 
                            type="number"
                            min="0"
                            value={serviceFee || ''}
                            onChange={(e) => setServiceFee(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-emerald-400 font-bold focus:outline-none focus:border-cyan-500/50 font-mono transition-colors"
                            placeholder="0"
                        />
                    </div>
                </div>
            </div>

            <div className="border-t border-white/10 pt-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-400">Total Suku Cadang</span>
                    <span className="text-xs font-mono text-white">Rp {calculateTotalParts().toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs text-slate-400">Biaya Jasa</span>
                    <span className="text-xs font-mono text-white">Rp {(serviceFee || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-white uppercase tracking-widest">Total Pembayaran</span>
                    <span className="text-2xl font-bold text-emerald-400 font-mono tracking-tighter">Rp {calculateTotal().toLocaleString('id-ID')}</span>
                </div>
            </div>

            <button 
                onClick={handlePayment}
                disabled={isProcessing || !selectedOrder || calculateTotal() === 0}
                className="w-full flex items-center justify-center py-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Proses Pembayaran'}
            </button>
        </div>
      </div>

      {/* Modal Cetak Struk */}
      {showReceipt && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
             <div className="bg-white text-black p-8 rounded-xl w-full max-w-sm" >
                {/* Hidden content for printing, shown here for preview */}
                <div ref={receiptRef} className="text-sm font-mono">
                    <div className="center">
                        <h2 className="bold" style={{fontSize: '18px', margin: '0 0 5px 0'}}>AUTOWORKS PRO</h2>
                        <p style={{margin: '0 0 15px 0'}}>Bengkel Spesialis Terpercaya</p>
                    </div>
                    <div style={{borderBottom: '1px dashed #000', margin: '10px 0'}}></div>
                    <p>No. Order : {selectedOrder.orderNumber}</p>
                    <p>Tanggal   : {new Date().toLocaleDateString('id-ID')}</p>
                    <p>Pelanggan : {selectedOrder.customerName}</p>
                    <p>Kendaraan : {selectedOrder.vehicle} ({selectedOrder.licensePlate})</p>
                    <div style={{borderBottom: '1px dashed #000', margin: '10px 0'}}></div>
                    <table style={{width: '100%'}}>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th className="text-right">Qty</th>
                                <th className="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.map(item => (
                                <tr key={item.id}>
                                    <td>{item.name}</td>
                                    <td className="text-right">{item.quantity}</td>
                                    <td className="text-right">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</td>
                                </tr>
                            ))}
                            {serviceFee > 0 && (
                                <tr>
                                    <td>Jasa Service</td>
                                    <td className="text-right">1</td>
                                    <td className="text-right">Rp {serviceFee.toLocaleString('id-ID')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div style={{borderBottom: '1px dashed #000', margin: '10px 0'}}></div>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontWeight: 'bold'}}>
                        <span>TOTAL</span>
                        <span>Rp {calculateTotal().toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{borderBottom: '1px dashed #000', margin: '10px 0'}}></div>
                    <div className="center" style={{marginTop: '20px'}}>
                        <p>Terima kasih atas kunjungan Anda!</p>
                        <p>Hormat kami, AutoWorks Pro.</p>
                    </div>
                </div>

                <div className="mt-8 flex gap-4">
                    <button onClick={resetPOS} className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 rounded font-bold text-sm transition-colors">
                        Selesai
                    </button>
                    <button onClick={printReceipt} className="flex-1 py-3 flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-sm transition-colors">
                        <Printer className="w-4 h-4" /> Cetak Struk
                    </button>
                </div>
             </div>
          </div>
      )}
    </div>
  );
}
