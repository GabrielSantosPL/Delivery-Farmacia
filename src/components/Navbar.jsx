import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { RotateCcw, LogOut, ChevronDown, Bell, MessageSquare, MoonStar, SunMedium } from 'lucide-react';
import ChatModal from './ChatModal';
import NotificationDrawer from './NotificationDrawer';

export default function Navbar({ onOpenChatTrigger = null }) {
  const { currentUser, switchRole, logout, userRoles, mockUsers } = useAuth();
  const { resetToDefaults, notifications, chatMessages } = useAppData();
  
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('meddel-theme') === 'dark');

  useEffect(() => {
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('meddel-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  if (!currentUser) return null;

  // Conta notificações não lidas
  const unreadNotifs = notifications.filter(n => (n.userId === currentUser.id || !n.userId) && !n.read).length;

  // Conta mensagens não lidas
  const unreadChat = chatMessages.filter(m => m.toUserId === currentUser.id && !m.read).length;

  const getRoleBadge = (role) => {
    switch (role) {
      case userRoles.FARMACEUTICO:
        return { label: 'Farmacêutico(a)', color: '#0284c7', bg: '#e0f2fe' };
      case userRoles.ENTREGADOR:
        return { label: 'Entregador / Motoboy', color: '#ea580c', bg: '#ffedd5' };
      case userRoles.CLIENTE:
        return { label: 'Cidadão / Paciente', color: '#059669', bg: '#d1fae5' };
      default:
        return { label: 'Usuário', color: '#64748b', bg: '#f1f5f9' };
    }
  };

  const badge = getRoleBadge(currentUser.role);

  return (
    <>
      <header className="app-navbar">
        <div className="gov-topbar">
          <div className="gov-topbar-inner">
            <span>Prefeitura Municipal de Indaiatuba</span>
            <span className="hide-on-mobile">Secretaria Municipal de Saúde • SUS</span>
          </div>
        </div>
        <div className="navbar-container">
          {/* Brand / Logo */}
          <div className="navbar-brand">
            <div className="brand-logo-icon" aria-label="Logo da Prefeitura de Indaiatuba">
              <img src="/Logo.png" alt="Logo da Prefeitura de Indaiatuba" />
            </div>
            <div className="brand-texts">
              <div className="brand-kicker">Prefeitura de</div>
              <div className="brand-title">
                <span className="brand-city">INDAIATUBA</span>
              </div>
              <div className="brand-subtitle">
                Saúde Ativa Indaiatuba - SAI
              </div>
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="navbar-actions">
            {/* Botão de Chat com Contador */}
            <button
              type="button"
              className="navbar-icon-btn"
              onClick={() => setShowChatModal(true)}
              title="Abrir Chat de Comunicação SUS"
            >
              <MessageSquare size={18} />
              {unreadChat > 0 && <span className="btn-badge-counter">{unreadChat}</span>}
              <span className="hide-on-mobile" style={{ fontSize: '13px', fontWeight: '600', marginLeft: '4px' }}>Chat</span>
            </button>

            {/* Botão de Notificações com Contador */}
            <button
              type="button"
              className="navbar-icon-btn"
              onClick={() => setShowNotifDrawer(true)}
              title="Notificações e Alertas"
            >
              <Bell size={18} />
              {unreadNotifs > 0 && <span className="btn-badge-counter notif-pulse">{unreadNotifs}</span>}
              <span className="hide-on-mobile" style={{ fontSize: '13px', fontWeight: '600', marginLeft: '4px' }}>Alertas</span>
            </button>

            <button
              type="button"
              className="navbar-icon-btn theme-toggle-btn"
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label={darkMode ? 'Ativar tema claro' : 'Ativar tema escuro'}
              title={darkMode ? 'Tema escuro ativo' : 'Tema claro ativo'}
            >
              {darkMode ? <SunMedium size={18} /> : <MoonStar size={18} />}
              <span className="hide-on-mobile" style={{ fontSize: '13px', fontWeight: '600', marginLeft: '4px' }}>
                {darkMode ? 'Claro' : 'Escuro'}
              </span>
            </button>

            {/* Quick Role Switcher Dropdown */}
            <div className="role-switcher-wrapper">
              <button
                type="button"
                className="role-selector-btn"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                title="Clique para alternar perfil de usuário instantaneamente"
              >
                <div className="user-avatar-tag">{currentUser.avatar || '👤'}</div>
                <div className="user-details-tag">
                  <span className="user-name-text">{currentUser.name}</span>
                  <span className="user-role-badge" style={{ color: badge.color, backgroundColor: badge.bg }}>
                    {badge.label}
                  </span>
                </div>
                <ChevronDown size={16} />
              </button>

              {showRoleMenu && (
                <div className="role-dropdown-menu">
                  <div className="dropdown-header">Alternar Perfil (Demonstração):</div>
                  {mockUsers.map(user => {
                    const b = getRoleBadge(user.role);
                    const isSelected = user.role === currentUser.role;
                    return (
                      <button
                        key={user.id}
                        type="button"
                        className={`role-option-item ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          switchRole(user.role);
                          setShowRoleMenu(false);
                        }}
                      >
                        <span className="role-opt-avatar">{user.avatar}</span>
                        <div className="role-opt-info">
                          <span className="role-opt-name">{user.name}</span>
                          <span className="role-opt-type" style={{ color: b.color }}>{b.label}</span>
                        </div>
                        {isSelected && <span className="check-indicator">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reset Demo Data button */}
            <button
              type="button"
              className="action-btn-secondary"
              onClick={() => {
                if (window.confirm('Deseja restaurar os pedidos, estoque e chats para os valores iniciais da demonstração?')) {
                  resetToDefaults();
                }
              }}
              title="Restaurar dados iniciais para nova simulação"
            >
              <RotateCcw size={15} />
              <span className="hide-on-mobile">Restaurar</span>
            </button>

            {/* Logout */}
            <button
              type="button"
              className="action-btn-logout"
              onClick={logout}
              title="Sair do sistema"
            >
              <LogOut size={16} />
              <span className="hide-on-mobile">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Modais Globais de Chat e Notificações */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
      />

      <NotificationDrawer
        isOpen={showNotifDrawer}
        onClose={() => setShowNotifDrawer(false)}
        onOpenChat={() => setShowChatModal(true)}
      />
    </>
  );
}
