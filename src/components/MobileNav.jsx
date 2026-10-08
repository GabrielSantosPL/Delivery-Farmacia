import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, RefreshCw, LogOut } from 'lucide-react';

export default function MobileNav() {
  const { currentUser, switchRole, logout, mockUsers } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="mobile-bottom-bar">
      <div className="mobile-role-scroll">
        {mockUsers.map(u => {
          const isActive = u.role === currentUser.role;
          return (
            <button
              key={u.id}
              type="button"
              className={`mobile-role-chip ${isActive ? 'active' : ''}`}
              onClick={() => switchRole(u.role)}
            >
              <span>{u.avatar}</span>
              <span>{u.role === 'farmaceutico' ? 'Farmácia' : u.role === 'entregador' ? 'Motoboy' : 'Cidadão'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
