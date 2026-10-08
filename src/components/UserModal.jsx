import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function UserModal({ isOpen, onClose, onUserSaved, userToEdit }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [departamentoId, setDepartamentoId] = useState('');
  const [activo, setActivo] = useState(true);
  const [departments, setDepartments] = useState([]);

  const isEditing = Boolean(userToEdit);

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      if (userToEdit) {
        // Mapeamos con las propiedades exactas que devuelve SQL Server
        setUsername(userToEdit.Username || userToEdit.username || '');
        setEmail(userToEdit.email || '');
        setDepartamentoId(userToEdit.IdDepartamento || '');
        setActivo(userToEdit.activo ?? userToEdit.Activo ?? true);
        setPassword('');
        setConfirmPassword('');
      } else {
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setActivo(true);
      }
    }
  }, [isOpen, userToEdit]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/users/departments');
      if (response.data) {
        setDepartments(response.data);
        if (!userToEdit && response.data.length > 0) {
          setDepartamentoId(response.data[0].id || response.data[0].IdDepartamento);
        }
      }
    } catch (err) {
      console.error('Error al cargar departamentos:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    try {
      // Capturamos IdUsuario correctamente
      const userId = userToEdit?.IdUsuario || userToEdit?.id || userToEdit?.idUsuario;

      if (isEditing) {
        if (!userId) {
          alert('Error: No se encontró el ID del usuario.');
          return;
        }

        await api.put(`/users/${userId}`, {
          username,
          email,
          password: password || undefined,
          activo
        });
        alert('¡Usuario actualizado exitosamente!');
      } else {
        await api.post('/users', {
          username,
          email,
          password,
          departamentoId: parseInt(departamentoId)
        });
        alert('¡Usuario creado y credenciales enviadas!');
      }

      if (onUserSaved) onUserSaved();
      onClose();
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      alert(err.response?.data?.error || 'Hubo un error al procesar la solicitud.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg">
            {isEditing ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold text-xl cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Usuario</label>
            <input 
              type="text" required value={username} 
              onChange={(e) => setUsername(e.target.value)}
              className="border border-slate-300 bg-white p-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Correo Electrónico</label>
            <input 
              type="email" required value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="border border-slate-300 bg-white p-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20"
            />
          </div>

          {isEditing ? (
            <>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase">Cambiar Contraseña (Opcional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="password" placeholder="Nueva contraseña" value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="border border-slate-300 bg-white p-2 rounded-lg text-sm focus:outline-none"
                  />
                  <input 
                    type="password" placeholder="Confirmar contraseña" value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border border-slate-300 bg-white p-2 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" id="activoCheck" checked={activo} 
                  onChange={(e) => setActivo(e.target.checked)}
                  className="w-4 h-4 text-red-900 accent-red-900 rounded"
                />
                <label htmlFor="activoCheck" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Usuario Activo (Permitir acceso al sistema)
                </label>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Contraseña</label>
                <input 
                  type="password" required value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-slate-300 bg-white p-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Repetir Contraseña</label>
                <input 
                  type="password" required value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border border-slate-300 bg-white p-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Departamento</label>
                <select 
                  value={departamentoId} 
                  onChange={(e) => setDepartamentoId(e.target.value)} required
                  className="border border-slate-300 bg-white p-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20"
                >
                  {departments.map((dept) => (
                    <option key={dept.IdDepartamento} value={dept.IdDepartamento}>
                      {dept.Nombre}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-sm cursor-pointer">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-red-900 hover:bg-red-800 text-white text-sm cursor-pointer">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}