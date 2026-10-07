import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { formatDate } from '../utils/formatters';
import { Bell, CheckCheck, X } from 'lucide-react';

export default function NotificationDrawer({ isOpen, onClose, onOpenChat }) {
  const { currentUser } = useAuth();
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useAppData();

  if (!isOpen || !currentUser) return null;

  // Filtra notificações do usuário logado
  const userNotifications = notifications.filter(n => n.userId === currentUser.id || !n.userId);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  const getNotifIcon = (type) => {
    switch (type) {
      case 'proximity':
        return <div className="notif-icon-badge" style={{ background: '#ffedd5', color: '#ea580c' }}>🛵</div>;
      case 'order':
        return <div className="notif-icon-badge" style={{ background: '#e0f2fe', color: '#0284c7' }}>📦</div>;
      case 'stock':
        return <div className="notif-icon-badge" style={{ background: '#fee2e2', color: '#dc2626' }}>⚠️</div>;
      case 'chat':
        return <div className="notif-icon-badge" style={{ background: '#ede9fe', color: '#7c3aed' }}>💬</div>;
      default:
        return <div className="notif-icon-badge" style={{ background: '#f1f5f9', color: '#475569' }}>ℹ️</div>;
    }
  };

  return (
    <div className="notif-drawer-backdrop" onClick={onClose}>
      <div className="notif-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="notif-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="#0284c7" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Notificações</h3>
            {unreadCount > 0 && (
              <span className="notif-counter-badge">{unreadCount}</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn-mark-all-read"
                onClick={() => markAllNotificationsAsRead(currentUser.id)}
                title="Marcar todas como lidas"
              >
                <CheckCheck size={14} />
                <span>Ler todas</span>
              </button>
            )}
            <button type="button" className="btn-close-drawer" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* List of Notifications */}
        <div className="notif-list-container">
          {userNotifications.length === 0 ? (
            <div className="notif-empty-box">
              <Bell size={36} color="#cbd5e1" />
              <p>Nenhuma notificação no momento.</p>
            </div>
          ) : (
            userNotifications.map(notif => {
              const isProximity = notif.type === 'proximity';
              return (
                <div
                  key={notif.id}
                  className={`notif-card-item ${notif.read ? 'read' : 'unread'} ${isProximity ? 'proximity-alert-card' : ''}`}
                  onClick={() => {
                    markNotificationAsRead(notif.id);
                    if (notif.type === 'chat' && onOpenChat) {
                      onOpenChat();
                      onClose();
                    }
                  }}
                >
                  {getNotifIcon(notif.type)}
                  <div className="notif-card-content">
                    <div className="notif-card-title-row">
                      <strong className="notif-card-title">{notif.title}</strong>
                      <span className="notif-card-time">{formatDate(notif.timestamp)}</span>
                    </div>
                    <p className="notif-card-msg">{notif.message}</p>
                    {isProximity && (
                      <div className="proximity-live-tag">
                        <span>⚡ ATENÇÃO: Motoboy em Aproximação Imediata</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
