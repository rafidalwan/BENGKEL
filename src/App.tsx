/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import Masuk from './components/Masuk';
import Dasbor from './components/Dasbor';
import BerandaDasbor from './components/BerandaDasbor';
import LayananServis from './components/LayananServis';
import Inventaris from './components/Inventaris';
import Pelanggan from './components/Pelanggan';
import Kendaraan from './components/Kendaraan';
import Jadwal from './components/Jadwal';
import Keuangan from './components/Keuangan';
import Pengaturan from './components/Pengaturan';
import Kasir from './components/Kasir';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './lib/firebase';

function MainApp() {
  const { user, loading } = useAuth();
  const [profileExists, setProfileExists] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAndCreateProfile() {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfileExists(true);
        } else {
          // Auto-create profile for new users
          try {
            await setDoc(docRef, {
              name: user.displayName || 'Pengguna Baru',
              email: user.email,
              workshopName: 'Bengkel Saya',
              role: 'admin',
              createdAt: serverTimestamp()
            });
            setProfileExists(true);
          } catch (error) {
            console.error("Gagal membuat profil:", error);
            setProfileExists(false);
          }
        }
      } else {
        setProfileExists(false);
      }
    }
    if (!loading) {
      checkAndCreateProfile();
    }
  }, [user, loading]);

  if (loading || (user && profileExists === null)) {
    return (
      <div className="min-h-screen bg-[#05060a] flex flex-col items-center justify-center text-white relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-orange-600/10 blur-[120px] pointer-events-none"></div>
        <div className="w-16 h-16 border-2 border-[#ee4323] border-t-transparent rounded-full animate-spin mb-6 technical-glow-orange" />
        <div className="text-center z-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">Autentikasi Sistem</p>
          <h2 className="text-xl font-bold font-display tracking-tight">Menghubungkan AutoWorks_Engine.sys</h2>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          !user ? (
            <Masuk />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          user && profileExists ? (
            <Dasbor />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      >
        <Route index element={<BerandaDasbor />} />
        <Route path="services" element={<LayananServis />} />
        <Route path="inventory" element={<Inventaris />} />
        <Route path="customers" element={<Pelanggan />} />
        <Route path="vehicles" element={<Kendaraan />} />
        <Route path="appointments" element={<Jadwal />} />
        <Route path="pos" element={<Kasir />} />
        <Route path="finance" element={<Keuangan />} />
        <Route path="settings" element={<Pengaturan />} />
      </Route>
      <Route path="*" element={<Navigate to={user && profileExists ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainApp />
      </BrowserRouter>
    </AuthProvider>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="h-full flex items-center justify-center bg-slate-900/40 backdrop-blur-md rounded-[2rem] border border-dashed border-white/10">
      <div className="text-center">
         <h2 className="text-xl font-bold text-slate-500 uppercase tracking-widest">{title}_MODUL</h2>
         <p className="text-[10px] font-mono text-slate-600 uppercase mt-2 tracking-tight">Status Operasi: Menunggu_Implementasi</p>
      </div>
    </div>
  );
}

