import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_USERS, USER_ROLES } from '../mock/mockData';

const AuthContext = createContext();

const STORAGE_KEY_USER = 'med_del_current_user';
const STORAGE_KEY_USERS_LIST = 'med_del_users_list_v2';

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USERS_LIST);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return MOCK_USERS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return users[0] || MOCK_USERS[0];
  });

  // Salva lista de usuários
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS_LIST, JSON.stringify(users));
  }, [users]);

  // Salva usuário ativo
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [currentUser]);

  // Login flexível
  const login = (roleOrIdentifier) => {
    // Busca por role direta
    let user = users.find(u => u.role === roleOrIdentifier);

    // Se não encontrou por role, busca por e-mail ou CPF
    if (!user) {
      const cleanInput = (roleOrIdentifier || '').trim().toLowerCase();
      user = users.find(u => 
        (u.email && u.email.toLowerCase() === cleanInput) || 
        (u.cpf && u.cpf.replace(/\D/g, '') === cleanInput.replace(/\D/g, ''))
      );
    }

    if (user) {
      setCurrentUser(user);
      return { success: true, user };
    }

    // Se inseriu qualquer outro nome/email, cria um perfil cliente dinâmico com login válido
    if (roleOrIdentifier) {
      const genericUser = {
        id: `user-${Date.now()}`,
        name: roleOrIdentifier.includes('@') ? roleOrIdentifier.split('@')[0] : roleOrIdentifier,
        role: USER_ROLES.CLIENTE,
        email: roleOrIdentifier,
        address: 'Centro, Indaiatuba - SP',
        city: 'Indaiatuba',
        state: 'SP',
        avatar: '👤'
      };
      setUsers(prev => [...prev, genericUser]);
      setCurrentUser(genericUser);
      return { success: true, user: genericUser };
    }

    return { success: false, error: 'Credenciais não encontradas' };
  };

  const switchRole = (role) => {
    const target = users.find(u => u.role === role);
    if (target) {
      setCurrentUser(target);
    }
  };

  const switchUser = (userId) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // Cadastrar Novo Usuário (Restrito ao Gestor)
  const registerUser = (userData) => {
    if (!currentUser || currentUser.role !== USER_ROLES.GERENTE) {
      return { success: false, error: 'Acesso negado: Apenas o Gestor Municipal tem autorização para cadastrar novos usuários no sistema.' };
    }

    if (!userData.name || !userData.role || !userData.email) {
      return { success: false, error: 'Preencha todos os campos obrigatórios (Nome, E-mail e Perfil).' };
    }

    const roleAvatars = {
      [USER_ROLES.FARMACEUTICO]: '👩‍⚕️',
      [USER_ROLES.ENTREGADOR]: '🛵',
      [USER_ROLES.GERENTE]: '👨‍💼',
      [USER_ROLES.CLIENTE]: '👤'
    };

    const newUser = {
      id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: userData.name.trim(),
      role: userData.role,
      email: userData.email.trim(),
      cpf: userData.cpf ? userData.cpf.trim() : null,
      crf: userData.crf ? userData.crf.trim() : null,
      plate: userData.plate ? userData.plate.trim() : null,
      vehicle: userData.vehicle ? userData.vehicle.trim() : null,
      susCard: userData.susCard ? userData.susCard.trim() : null,
      phone: userData.phone ? userData.phone.trim() : '(19) 99876-0000',
      address: userData.address ? userData.address.trim() : 'Indaiatuba - SP',
      neighborhood: userData.neighborhood ? userData.neighborhood.trim() : 'Centro',
      city: 'Indaiatuba',
      state: 'SP',
      unit: userData.unit || 'Secretaria Municipal de Saúde',
      avatar: roleAvatars[userData.role] || '👤',
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [...prev, newUser]);
    return { success: true, user: newUser };
  };

  // Excluir Usuário (Restrito ao Gestor)
  const deleteUser = (userId) => {
    if (!currentUser || currentUser.role !== USER_ROLES.GERENTE) {
      return { success: false, error: 'Apenas o Gestor Municipal pode excluir usuários.' };
    }
    if (userId === currentUser.id) {
      return { success: false, error: 'Não é possível excluir o próprio usuário logado.' };
    }

    setUsers(prev => prev.filter(u => u.id !== userId));
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      users,
      login,
      logout,
      switchRole,
      switchUser,
      registerUser,
      deleteUser,
      userRoles: USER_ROLES,
      mockUsers: users
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }
  return context;
}
