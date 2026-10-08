import React, { useState, useEffect } from 'react';
import api from '../services/api';
import UserModal from './UserModal';

export default function UsersView() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Error al listar usuarios:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (err) {
        console.error('Error al eliminar:', err);
        alert('No se pudo eliminar el usuario.');
      }
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Gestión de Usuarios</h2>
        <button 
          onClick={handleCreate}
          className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer"
        >
          + Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
              <th className="p-4">Usuario</th>
              <th className="p-4">Correo</th>
              <th className="p-4">Departamento</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
            {users.length > 0 ? (
              users.map((u) => (
                <tr key={u.IdUsuario} className="hover:bg-slate-50/50">
                  <td className="p-4 font-medium">{u.Username}</td>
                  <td className="p-4 text-slate-500">{u.email}</td>
                  <td className="p-4">{u.departamentoNombre || 'Sin asignar'}</td>
                  <td className="p-4 text-right space-x-2">
                    <button 
                      onClick={() => handleEdit(u)}
                      className="text-blue-600 hover:underline font-medium cursor-pointer"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(u.IdUsuario)}
                      className="text-red-600 hover:underline font-medium cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-6 text-center text-slate-400">No hay usuarios registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onUserSaved={fetchUsers} 
        userToEdit={selectedUser} 
      />
    </div>
  );
}