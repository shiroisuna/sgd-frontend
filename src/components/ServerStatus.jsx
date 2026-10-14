import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

// Revisa cada 30 s si el backend responde y muestra ✔ / ✖
export default function ServerStatus({ className = '' }) {
  const [estado, setEstado] = useState('verificando'); // 'verificando' | 'conectado' | 'desconectado'

  useEffect(() => {
    let activo = true;

    const verificar = async () => {
      try {
        await api.get('/health', { timeout: 5000 });
        if (activo) setEstado('conectado');
      } catch {
        if (activo) setEstado('desconectado');
      }
    };

    verificar();
    const intervalo = setInterval(verificar, 30000);
    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, []);

  if (estado === 'verificando') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-slate-400 ${className}`}>
        <Loader2 size={16} className="animate-spin" /> Verificando conexión...
      </span>
    );
  }

  if (estado === 'conectado') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-emerald-600 font-semibold ${className}`}>
        <CheckCircle2 size={16} /> Conectado al servidor
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-rose-600 font-semibold ${className}`}>
      <XCircle size={16} /> Sin conexión con el servidor
    </span>
  );
}