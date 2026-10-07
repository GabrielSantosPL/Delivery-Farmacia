import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import Modal from './Modal';
import { Send, MessageSquare, AlertCircle, ArrowLeft } from 'lucide-react';
import { formatDate } from '../utils/formatters';

export default function ChatModal({ isOpen, onClose, initialContactId = null, initialOrderId = null }) {
  const { currentUser, userRoles, mockUsers } = useAuth();
  const { chatMessages, sendChatMessage, orders, markChatThreadAsRead } = useAppData();

  const [selectedContactId, setSelectedContactId] = useState(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Calcula contatos permitidos para o usuário atual conforme as regras rígidas do sistema
  const allowedContacts = React.useMemo(() => {
    if (!currentUser) return [];

    const contacts = [];
    const gestor = mockUsers.find(u => u.role === userRoles.GERENTE);

    // 1. GESTOR: Pode falar com TODOS os tipos de usuários
    if (currentUser.role === userRoles.GERENTE) {
      mockUsers.forEach(u => {
        if (u.id !== currentUser.id) {
          contacts.push({
            id: u.id,
            name: u.name,
            role: u.role,
            avatar: u.avatar,
            roleLabel: u.role === 'farmaceutico' ? 'Farmacêutico' : u.role === 'entregador' ? 'Motoboy' : 'Cidadão'
          });
        }
      });
      // Inclui pacientes de pedidos que não estejam nos mockUsers fixos
      orders.forEach(o => {
        if (o.patient?.id && !contacts.some(c => c.id === o.patient.id) && o.patient.id !== currentUser.id) {
          contacts.push({
            id: o.patient.id,
            name: o.patient.name,
            role: userRoles.CLIENTE,
            avatar: '👤',
            roleLabel: 'Cidadão / Paciente',
            orderId: o.id
          });
        }
      });
    }

    // 2. FARMACÊUTICO: Apenas chat com o Gestor
    else if (currentUser.role === userRoles.FARMACEUTICO) {
      if (gestor) {
        contacts.push({
          id: gestor.id,
          name: gestor.name,
          role: gestor.role,
          avatar: gestor.avatar,
          roleLabel: 'Gestor Municipal de Saúde'
        });
      }
    }

    // 3. ENTREGADOR: Com o Gestor E com clientes de sua entrega atual
    else if (currentUser.role === userRoles.ENTREGADOR) {
      if (gestor) {
        contacts.push({
          id: gestor.id,
          name: gestor.name,
          role: gestor.role,
          avatar: gestor.avatar,
          roleLabel: 'Gestor Municipal'
        });
      }
      // Clientes de suas entregas designadas
      orders.forEach(o => {
        const isAssignedToMe = o.assignedDriverId === currentUser.driverId || o.assignedDriverName === currentUser.name;
        if (isAssignedToMe && o.patient) {
          if (!contacts.some(c => c.id === o.patient.id)) {
            contacts.push({
              id: o.patient.id,
              name: o.patient.name,
              role: userRoles.CLIENTE,
              avatar: '👵',
              roleLabel: `Cidadão (Pedido ${o.id})`,
              orderId: o.id
            });
          }
        }
      });
    }

    // 4. CLIENTE: Apenas com o motoboy do pedido designado E com o gestor se o gestor contatou primeiro
    else if (currentUser.role === userRoles.CLIENTE) {
      // Checa motoboy de pedidos ativos
      const myActiveOrders = orders.filter(o => 
        (o.patient?.id === currentUser.id || o.patient?.cpf === currentUser.cpf) && 
        o.assignedDriverName
      );
      myActiveOrders.forEach(o => {
        const driverUser = mockUsers.find(u => u.name.includes(o.assignedDriverName) || u.role === userRoles.ENTREGADOR);
        const driverId = driverUser ? driverUser.id : (o.assignedDriverId || 'user-motoboy');
        if (!contacts.some(c => c.id === driverId)) {
          contacts.push({
            id: driverId,
            name: o.assignedDriverName,
            role: userRoles.ENTREGADOR,
            avatar: '🛵',
            roleLabel: `Entregador do seu pedido (${o.id})`,
            orderId: o.id
          });
        }
      });

      // Checa se o Gestor iniciou contato anteriormente
      const gestorInitiated = chatMessages.some(m => 
        m.fromUserRole === userRoles.GERENTE && 
        (m.toUserId === currentUser.id || m.toUserName === currentUser.name)
      );

      if (gestorInitiated && gestor) {
        contacts.push({
          id: gestor.id,
          name: gestor.name,
          role: gestor.role,
          avatar: gestor.avatar,
          roleLabel: 'Gestor Municipal (Contato Estabelecido)'
        });
      }
    }

    return contacts;
  }, [currentUser, mockUsers, orders, chatMessages, userRoles]);

  // Define contato inicial
  useEffect(() => {
    if (initialContactId) {
      setSelectedContactId(initialContactId);
    } else if (allowedContacts.length > 0 && !selectedContactId) {
      setSelectedContactId(allowedContacts[0].id);
    }
  }, [initialContactId, allowedContacts]);

  // Rola mensagens para baixo ao abrir ou atualizar
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, selectedContactId]);

  // Marca o thread selecionado como lido ao abrir ou trocar de contato.
  // A dependência do histórico é intencionalmente omitida para evitar uma
  // nova marcação em cada atualização e manter o contador estável.
  useEffect(() => {
    if (!isOpen || !currentUser || !selectedContactId) return;
    markChatThreadAsRead(currentUser.id, selectedContactId);
  }, [isOpen, currentUser?.id, selectedContactId, markChatThreadAsRead]);

  const handleSelectContact = (contactId) => {
    setSelectedContactId(contactId);
    setMobileChatOpen(true);
    if (currentUser) markChatThreadAsRead(currentUser.id, contactId);
  };

  const handleBackToContacts = () => {
    setMobileChatOpen(false);
  };

  if (!currentUser) return null;

  const currentContact = allowedContacts.find(c => c.id === selectedContactId) || allowedContacts[0];

  // Filtra mensagens entre o usuário atual e o contato selecionado
  const activeThread = chatMessages.filter(m => {
    if (!currentContact) return false;
    return (
      (m.fromUserId === currentUser.id && m.toUserId === currentContact.id) ||
      (m.fromUserId === currentContact.id && m.toUserId === currentUser.id)
    );
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !currentContact) return;

    sendChatMessage({
      fromUserId: currentUser.id,
      fromUserName: currentUser.name,
      fromUserRole: currentUser.role,
      toUserId: currentContact.id,
      toUserName: currentContact.name,
      orderId: initialOrderId || currentContact.orderId || null,
      text: inputText
    });

    setInputText('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Central de Mensagens e Comunicação SUS"
      maxWidth="820px"
    >
      <div className={`chat-modal-layout ${mobileChatOpen ? 'mobile-chat-open' : 'mobile-chat-list'}`}>
        {/* Barra Lateral: Lista de Contatos Permitidos */}
        <div className="chat-contacts-sidebar">
          <div className="contacts-sidebar-title">
            <span>Contatos Autorizados ({allowedContacts.length}):</span>
          </div>

          {allowedContacts.length === 0 ? (
            <div className="no-contacts-warning">
              <AlertCircle size={16} color="#94a3b8" />
              <span>Nenhum canal de comunicação disponível no momento conforme as regras do seu perfil.</span>
            </div>
          ) : (
            <div className="contacts-list-scroll">
              {allowedContacts.map(contact => {
                const isSelected = currentContact?.id === contact.id;
                const unreadFromContact = chatMessages.filter(m =>
                  m.fromUserId === contact.id && m.toUserId === currentUser.id && !m.read
                ).length;
                const latestMessage = chatMessages
                  .filter(m => m.fromUserId === contact.id && m.toUserId === currentUser.id)
                  .slice(-1)[0];
                return (
                  <button
                    key={contact.id}
                    type="button"
                    className={`contact-item-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectContact(contact.id)}
                  >
                    <span className="contact-avatar-badge">{contact.avatar}</span>
                    <div className="contact-item-meta">
                      <span className="contact-item-name">{contact.name}</span>
                      <span className="contact-item-role">{contact.roleLabel}</span>
                      {latestMessage && (
                        <span className="contact-preview">{latestMessage.text}</span>
                      )}
                    </div>
                    {unreadFromContact > 0 && (
                      <span className="contact-unread-pill">{unreadFromContact}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Dica de regras de permissão */}
          <div className="chat-rules-hint">
            <span>🔒 Regras de Acesso: Gestor contata todos; Entregador contata Gestor e seus Clientes; Farmacêutico contata Gestor; Cliente contata Entregador designado ou Gestor ativo.</span>
          </div>
        </div>

        {/* Área Principal: Thread de Conversa */}
        <div className="chat-conversation-panel">
          {currentContact ? (
            <>
              {/* Header do Contato Ativo */}
              <div className="conversation-header">
                <button
                  type="button"
                  className="mobile-chat-back"
                  onClick={handleBackToContacts}
                  aria-label="Voltar para a lista de contatos"
                >
                  <ArrowLeft size={18} />
                  <span>Contatos</span>
                </button>
                <div className="conversation-contact-header">
                  <span style={{ fontSize: '20px' }}>{currentContact.avatar}</span>
                  <div className="conversation-contact-details">
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{currentContact.name}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{currentContact.roleLabel}</div>
                    {currentContact.orderId && (
                      <span className="chat-order-pill">Pedido: {currentContact.orderId}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mensagens */}
              <div className="conversation-messages-list">
                {activeThread.length === 0 ? (
                  <div className="chat-empty-thread">
                    <MessageSquare size={32} color="#cbd5e1" />
                    <p>Inicie a conversa enviando uma mensagem abaixo.</p>
                  </div>
                ) : (
                  activeThread.map(msg => {
                    const isMe = msg.fromUserId === currentUser.id;
                    return (
                      <div key={msg.id} className={`chat-message-bubble-wrapper ${isMe ? 'outgoing' : 'incoming'}`}>
                        <div className={`chat-message-bubble ${isMe ? 'outgoing-bubble' : 'incoming-bubble'}`}>
                          {!isMe && (
                            <div className="bubble-author">{msg.fromUserName}</div>
                          )}
                          <div className="bubble-text">{msg.text}</div>
                          <div className="bubble-time">{formatDate(msg.timestamp)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input para envio */}
              <form onSubmit={handleSend} className="conversation-input-form">
                <input
                  type="text"
                  placeholder={`Enviar mensagem para ${currentContact.name}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="chat-text-input"
                />
                <button type="submit" className="chat-send-btn">
                  <Send size={16} />
                  <span>Enviar</span>
                </button>
              </form>
            </>
          ) : (
            <div className="chat-no-selection">
              <p>Selecione um contato para abrir o chat.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
