import React, { useState } from 'react';
import api from '../../services/api';
import { ShieldCheck, Lock, User, Mail, X, KeyRound } from 'lucide-react';
import { LogoIcon } from '../../components/Logo';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Estados para el Modal de Recuperación
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para el cambio obligatorio de contraseña (primer ingreso)
  const [forcedChangeData, setForcedChangeData] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forceError, setForceError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login', { username, password });
      const userData = response.data.usuario;

      // Forzar la validación estricta del booleano (soporta boolean y bit de SQL Server 1/0)
      if (userData.debeCambiarPassword === true || userData.debeCambiarPassword === 1) {
        setForcedChangeData(userData);
      } else {
        onLoginSuccess(userData);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al intentar conectar con el servidor.');
    }
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRecoveryError('');
    setRecoveryMessage('');

    try {
      const response = await api.post('/auth/forgot-password', { email: recoveryEmail });
      setRecoveryMessage(response.data.message || 'Se ha enviado una nueva contraseña temporal a su correo.');
      setRecoveryEmail('');
    } catch (err) {
      setRecoveryError(err.response?.data?.error || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const handleForcePasswordChange = async (e) => {
    e.preventDefault();
    setForceError('');

    if (newPassword !== confirmPassword) {
      setForceError('Las contraseñas no coinciden.');
      return;
    }

    if (newPassword.length < 6) {
      setForceError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      // Usar la propiedad id o IdUsuario que viene en el objeto userData
      const userId = forcedChangeData.id || forcedChangeData.IdUsuario;
      await api.post('/auth/change-password', {
        idUsuario: userId,
        newPassword
      });
      alert('Contraseña actualizada con éxito. Inicie sesión con su nueva clave.');
      setForcedChangeData(null);
      setPassword('');
    } catch (err) {
      setForceError(err.response?.data?.error || 'Error al actualizar la contraseña.');
    }
  };

  // Si el usuario se encuentra en su primer ingreso, se muestra la vista de cambio forzado
  if (forcedChangeData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden p-8">
          <div className="text-center mb-6">
            <div className="inline-flex bg-amber-100 p-3 rounded-full text-amber-700 mb-3">
              <KeyRound size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Cambio de Contraseña</h1>
            <p className="text-xs text-slate-500 mt-1">
              Es su primer ingreso al sistema. Por seguridad, debe establecer una nueva contraseña personal.
            </p>
          </div>

          {forceError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 text-xs text-red-700 rounded">
              {forceError}
            </div>
          )}

          <form onSubmit={handleForcePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nueva Contraseña</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-red-500 outline-none text-sm"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Confirmar Contraseña</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-red-500 outline-none text-sm"
                placeholder="Repita su nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-red-700 hover:bg-red-800 text-white font-medium py-3 rounded-lg transition shadow-md text-sm mt-2"
            >
              Actualizar Contraseña y Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden p-8">
        
        <div className="text-center mb-8">
          {/* <div className="inline-flex bg-red-100 p-3 rounded-full text-red-700 mb-3">
            <ShieldCheck size={32} />
          </div> */}

          <div className="inline-flex mb-3">
            <LogoIcon size={56} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">SGD</h1>
          <p className="text-sm text-slate-500 mt-1">Sistema de Gestión de Documentos - Industrias Amapola</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Usuario</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <User size={18} />
              </span>
              <input 
                type="text" 
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-red-500 outline-none"
                placeholder="Ingrese su usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Contraseña</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock size={18} />
              </span>
              <input 
                type="password" 
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-red-500 outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-red-700 hover:bg-red-800 text-white font-medium py-3 rounded-lg transition shadow-md"
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-4 text-center">
          <button 
            type="button"
            onClick={() => {
              setShowRecoveryModal(true);
              setRecoveryError('');
              setRecoveryMessage('');
              setRecoveryEmail('');
            }}
            className="text-xs text-red-600 hover:underline font-medium focus:outline-none"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          Servidor Activo: 192.168.10.112
        </div>
      </div>

      {/* MODAL DE RECUPERACIÓN DE CONTRASEÑA */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-fadeIn">
            
            <button 
              onClick={() => setShowRecoveryModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-slate-800 mb-2">Recuperar Contraseña</h3>
            <p className="text-xs text-slate-500 mb-5">
              Ingrese su correo electrónico registrado y le enviaremos una contraseña temporal de acceso.
            </p>

            {recoveryError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 text-xs text-red-700 rounded">
                {recoveryError}
              </div>
            )}

            {recoveryMessage && (
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 mb-4 text-xs text-emerald-700 rounded">
                {recoveryMessage}
              </div>
            )}

            <form onSubmit={handleRecoverySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Correo Electrónico</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail size={18} />
                  </span>
                  <input 
                    type="email" 
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-red-500 outline-none text-sm"
                    placeholder="correo@industriasamapola.com"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-lg transition text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-1/2 bg-red-700 hover:bg-red-800 text-white font-medium py-2.5 rounded-lg transition shadow-md text-sm disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Enviar clave'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}