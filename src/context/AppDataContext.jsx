import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_ORDERS, ORDER_STATUS, INITIAL_CHAT_MESSAGES, INITIAL_NOTIFICATIONS } from '../mock/mockData';
import { MOCK_MEDICINES } from '../mock/mockMedicines';
import { MOCK_DRIVERS, INDAIATUBA_HUB } from '../mock/indaiatubaLocations';
import { calculateDistanceKm } from '../utils/routeOptimizer';

const AppDataContext = createContext();

const ORDERS_KEY = 'med_del_orders_v2';
const INVENTORY_KEY = 'med_del_inventory_v2';
const DRIVERS_KEY = 'med_del_drivers_v2';
const CHAT_KEY = 'med_del_chat_v2';
const NOTIF_KEY = 'med_del_notif_v2';

const generateDeliveryCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
};

export function AppDataProvider({ children }) {
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem(ORDERS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_ORDERS;
  });

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem(INVENTORY_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return MOCK_MEDICINES;
  });

  const [drivers, setDrivers] = useState(() => {
    const saved = localStorage.getItem(DRIVERS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return MOCK_DRIVERS;
  });

  const [chatMessages, setChatMessages] = useState(() => {
    const saved = localStorage.getItem(CHAT_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_CHAT_MESSAGES;
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem(NOTIF_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_NOTIFICATIONS;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(DRIVERS_KEY, JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem(CHAT_KEY, JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // Adicionar notificação
  const addNotification = ({ userId, title, message, type = 'system', orderId = null }) => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      title,
      message,
      type,
      orderId,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    return newNotif;
  };

  const markNotificationAsRead = (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = (userId) => {
    setNotifications(prev => prev.map(n => n.userId === userId ? { ...n, read: true } : n));
  };

  const markChatThreadAsRead = (readerUserId, otherUserId) => {
    if (!readerUserId || !otherUserId) return;

    setChatMessages(prev => {
      let changed = false;
      const next = prev.map(message => {
        const incomingUnread = message.toUserId === readerUserId && message.fromUserId === otherUserId && !message.read;
        if (!incomingUnread) return message;
        changed = true;
        return { ...message, read: true };
      });
      return changed ? next : prev;
    });

    setNotifications(prev => {
      let changed = false;
      const next = prev.map(notif => {
        const isChatNotif = notif.userId === readerUserId && notif.type === 'chat' && !notif.read;
        if (!isChatNotif) return notif;
        changed = true;
        return { ...notif, read: true };
      });
      return changed ? next : prev;
    });
  };

  // Enviar Mensagem de Chat
  const sendChatMessage = ({ fromUserId, fromUserName, fromUserRole, toUserId, toUserName, orderId = null, text }) => {
    if (!text || !text.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fromUserId,
      fromUserName,
      fromUserRole,
      toUserId,
      toUserName,
      orderId,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      read: false
    };

    setChatMessages(prev => [...prev, newMsg]);

    // Cria notificação automática para o destinatário
    addNotification({
      userId: toUserId,
      title: `💬 Nova mensagem de ${fromUserName}`,
      message: text.trim().length > 60 ? `${text.trim().substring(0, 60)}...` : text.trim(),
      type: 'chat',
      orderId
    });

    return newMsg;
  };

  // Disparar Alerta de Proximidade (Manualmente ou por GPS)
  const triggerProximityAlert = (orderId) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    // Atualiza pedido com flag
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, isProximityAlert: true } : o));

    // Notifica paciente
    addNotification({
      userId: targetOrder.patient?.id || 'user-cliente',
      title: '🛵 Entregador Próximo ao Seu Endereço!',
      message: `O motoboy ${targetOrder.assignedDriverName || 'do SUS'} está a poucos minutos da sua casa no bairro ${targetOrder.patient?.neighborhood}. Por favor, deixe a receita física e um documento em mãos!`,
      type: 'proximity',
      orderId: targetOrder.id
    });
  };

  // Criar Pedido (Cliente)
  const createOrder = (orderData) => {
    const newOrderId = `PED-2026-${String(orders.length + 1).padStart(3, '0')}`;
    const newOrder = {
      id: newOrderId,
      createdAt: new Date().toISOString(),
      patient: orderData.patient,
      items: orderData.items,
      prescriptionUrl: orderData.prescriptionUrl,
      status: ORDER_STATUS.PENDENTE_VALIDACAO,
      assignedDriverId: null,
      assignedDriverName: null,
      validatedBy: null,
      validatedAt: null,
      rejectionReason: null,
      cancellationReason: null,
      cancellationDetails: null,
      deliveryProofPhoto: null,
      isProximityAlert: false,
      history: [
        {
          status: ORDER_STATUS.PENDENTE_VALIDACAO,
          time: new Date().toISOString(),
          note: 'Solicitação de medicamentos cadastrada pelo paciente.'
        }
      ]
    };

    setOrders(prev => [newOrder, ...prev]);

    // Notifica farmacêutico de novo pedido pendente
    addNotification({
      userId: 'user-farm',
      title: 'Novo Pedido para Conferência',
      message: `Pedido ${newOrderId} de ${orderData.patient.name} aguardando validação da receita.`,
      type: 'order',
      orderId: newOrderId
    });

    return newOrder;
  };

  // Alterar Pedido Existente (Cliente - antes de validado)
  const updateOrder = (orderId, updatedData) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          ...updatedData,
          history: [
            ...order.history,
            {
              status: order.status,
              time: new Date().toISOString(),
              note: 'Pedido alterado pelo paciente antes da validação.'
            }
          ]
        };
      }
      return order;
    }));
  };

  // Aprovar Pedido (Farmacêutico)
  const approveOrder = (orderId, pharmacistName, options = {}) => {
    const { selectedItems = null, shortageAction = 'full' } = options;
    const targetOrder = orders.find(order => order.id === orderId);
    if (!targetOrder) return false;

    const finalItems = selectedItems && selectedItems.length ? selectedItems : targetOrder.items;
    const shortageItems = finalItems.filter(item => {
      const stockItem = inventory.find(m => m.id === item.medicineId);
      if (!stockItem) return false;
      return Number(item.quantity || 0) > Number(stockItem.currentStock || 0);
    });

    if (shortageItems.length > 0 && shortageAction === 'full') {
      setOrders(prev => prev.map(order => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          status: ORDER_STATUS.PENDENTE_ESTOQUE,
          stockResolution: 'waiting',
          shortageItems,
          history: [
            ...order.history,
            {
              status: ORDER_STATUS.PENDENTE_ESTOQUE,
              time: new Date().toISOString(),
              note: `Pedido aguardando decisão do cliente porque faltam medicamentos: ${shortageItems.map(item => item.name).join(', ')}.`
            }
          ]
        };
      }));

      addNotification({
        userId: targetOrder.patient?.id || 'user-cliente',
        title: '⚠️ Falta de medicamento no pedido',
        message: `No pedido ${orderId}, alguns itens estão fora de estoque. Escolha como deseja receber o restante.`,
        type: 'order',
        orderId: orderId
      });
      return { needsResolution: true, shortageItems };
    }

    if (shortageAction === 'cancel') {
      setOrders(prev => prev.map(order => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          status: ORDER_STATUS.RECUSADO,
          validatedBy: pharmacistName,
          validatedAt: new Date().toISOString(),
          rejectionReason: 'Pedido cancelado pela gestão farmacêutica por indisponibilidade de itens críticos.',
          history: [
            ...order.history,
            {
              status: ORDER_STATUS.RECUSADO,
              time: new Date().toISOString(),
              note: `Pedido cancelado por indisponibilidade de itens. ${pharmacistName} orientou o cliente.`
            }
          ]
        };
      }));
      addNotification({
        userId: targetOrder.patient?.id || 'user-cliente',
        title: '❌ Pedido cancelado',
        message: `Seu pedido ${orderId} foi cancelado porque alguns medicamentos não podem ser dispensados no momento.`,
        type: 'order',
        orderId: orderId
      });
      return true;
    }

    const availableItems = finalItems.filter(item => {
      const stockItem = inventory.find(m => m.id === item.medicineId);
      return !stockItem || Number(item.quantity || 0) <= Number(stockItem.currentStock || 0);
    });

    const driver = drivers[0];
    const deliveryCode = targetOrder.deliveryCode || generateDeliveryCode();

    setInventory(prevInv => prevInv.map(item => {
      const reqItem = availableItems.find(i => i.medicineId === item.id);
      if (!reqItem) return item;
      return {
        ...item,
        currentStock: Math.max(0, Number(item.currentStock || 0) - Number(reqItem.quantity || 0))
      };
    }));

    const nextOrder = {
      ...targetOrder,
      items: availableItems,
      deliveryCode,
      status: ORDER_STATUS.PRONTO_ENTREGA,
      validatedBy: pharmacistName,
      validatedAt: new Date().toISOString(),
      assignedDriverId: driver ? driver.id : null,
      assignedDriverName: driver ? driver.name : null,
      history: [
        ...targetOrder.history,
        {
          status: ORDER_STATUS.APROVADO,
          time: new Date().toISOString(),
          note: `Receita validada e aprovada por ${pharmacistName}. Estoque reservado.`
        },
        {
          status: ORDER_STATUS.PRONTO_ENTREGA,
          time: new Date().toISOString(),
          note: `Pedido separado na Farmácia Central. Aguardando coleta do motoboy ${driver ? driver.name : ''}. Código de entrega: ${deliveryCode}.`
        }
      ]
    };

    setOrders(prev => {
      const withoutCurrent = prev.filter(order => order.id !== orderId);
      const followUpItems = shortageItems.length > 0 ? shortageItems : [];

      if (shortageAction === 'open_new' && followUpItems.length > 0) {
        const followUpOrder = {
          ...targetOrder,
          id: `PED-2026-${String(prev.length + 1).padStart(3, '0')}`,
          createdAt: new Date().toISOString(),
          items: followUpItems,
          status: ORDER_STATUS.PENDENTE_VALIDACAO,
          assignedDriverId: null,
          assignedDriverName: null,
          validatedBy: null,
          validatedAt: null,
          rejectionReason: null,
          placementReason: 'Pedido complementar por falta de estoque no item principal.',
          deliveryCode: generateDeliveryCode(),
          history: [
            {
              status: ORDER_STATUS.PENDENTE_VALIDACAO,
              time: new Date().toISOString(),
              note: `Pedido complementar gerado por indisponibilidade temporária do(s) item(ns) ${followUpItems.map(item => item.name).join(', ')}.`
            }
          ]
        };

        return [nextOrder, followUpOrder, ...withoutCurrent];
      }

      return [nextOrder, ...withoutCurrent];
    });

    addNotification({
      userId: targetOrder.patient?.id || 'user-cliente',
      title: '✅ Receita Médica Aprovada!',
      message: `Seu pedido ${orderId} foi conferido e liberado pela farmácia. Código de confirmação: ${deliveryCode}.`,
      type: 'order',
      orderId: orderId
    });

    return true;
  };

  // Recusar Pedido (Farmacêutico) - Obriga motivo
  const rejectOrder = (orderId, pharmacistName, reason) => {
    if (!reason || !reason.trim()) {
      alert('É obrigatório informar uma justificativa detalhada para recusar o pedido.');
      return false;
    }

    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        // Notifica paciente sobre o motivo
        addNotification({
          userId: order.patient?.id || 'user-cliente',
          title: '❌ Receita Médica Não Aprovada',
          message: `Seu pedido ${order.id} foi recusado: ${reason.trim()}`,
          type: 'order',
          orderId: order.id
        });

        return {
          ...order,
          status: ORDER_STATUS.RECUSADO,
          validatedBy: pharmacistName,
          validatedAt: new Date().toISOString(),
          rejectionReason: reason.trim(),
          history: [
            ...order.history,
            {
              status: ORDER_STATUS.RECUSADO,
              time: new Date().toISOString(),
              note: `Pedido recusado por ${pharmacistName}. Motivo: ${reason.trim()}`
            }
          ]
        };
      }
      return order;
    }));
    return true;
  };

  // Iniciar Rota (Entregador)
  const startOrderDelivery = (orderId) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        // Notifica cliente
        addNotification({
          userId: order.patient?.id || 'user-cliente',
          title: '🛵 Medicamentos a Caminho!',
          message: `O motoboy ${order.assignedDriverName || 'do SUS'} iniciou o trajeto para entrega no seu endereço.`,
          type: 'order',
          orderId: order.id
        });

        return {
          ...order,
          status: ORDER_STATUS.EM_TRANSITO,
          history: [
            ...order.history,
            {
              status: ORDER_STATUS.EM_TRANSITO,
              time: new Date().toISOString(),
              note: 'Entregador iniciou a rota de entrega em Indaiatuba.'
            }
          ]
        };
      }
      return order;
    }));
  };

  // Cancelar Entrega pelo Entregador com Justificativa Categorizada
  const cancelOrderDelivery = (orderId, driverName, reasonCategory, reasonDetails) => {
    if (!reasonCategory) {
      alert('Selecione uma categoria de cancelamento.');
      return false;
    }

    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        // Notifica a farmácia responsável
        addNotification({
          userId: 'user-farm',
          title: `⚠️ Entrega Cancelada pelo Entregador: ${order.id}`,
          message: `Motoboy ${driverName} cancelou a entrega. Motivo: ${reasonCategory}. Detalhes: ${reasonDetails || 'Nenhum'}.`,
          type: 'system',
          orderId: order.id
        });

        // Notifica o Cidadão
        addNotification({
          userId: order.patient?.id || 'user-cliente',
          title: '⚠️ Entrega de Medicamento Não Concluída',
          message: `A entrega do pedido ${order.id} não pôde ser finalizada (${reasonCategory}). Entre em contato com a Central SUS de Indaiatuba.`,
          type: 'order',
          orderId: order.id
        });

        return {
          ...order,
          status: ORDER_STATUS.CANCELADO_ENTREGADOR,
          cancellationReason: reasonCategory,
          cancellationDetails: reasonDetails || '',
          history: [
            ...order.history,
            {
              status: ORDER_STATUS.CANCELADO_ENTREGADOR,
              time: new Date().toISOString(),
              note: `Entrega cancelada pelo motoboy ${driverName}. Categoria: [${reasonCategory}]. Justificativa: ${reasonDetails || 'Não informada'}`
            }
          ]
        };
      }
      return order;
    }));

    return true;
  };

  // Finalizar Entrega com Foto (Entregador)
  const completeOrderDelivery = (orderId, proofPhotoUrl, confirmationCode = null) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;

      const normalizedCode = (confirmationCode || '').trim().toUpperCase();
      const expectedCode = (order.deliveryCode || '').trim().toUpperCase();

      if (expectedCode && normalizedCode && normalizedCode !== expectedCode) {
        alert('Código de confirmação inválido. Solicite ao cliente que informe o código correto para concluir a entrega.');
        return order;
      }

      if (expectedCode && !normalizedCode) {
        alert('É obrigatório informar o código de confirmação informado pelo paciente para finalizar a entrega.');
        return order;
      }

      addNotification({
        userId: order.patient?.id || 'user-cliente',
        title: '🎉 Medicamentos Entregues com Sucesso!',
        message: `Seu pedido ${order.id} foi entregue com confirmação do receptor. Agradecemos por utilizar o SUS Indaiatuba!`,
        type: 'order',
        orderId: order.id
      });

      return {
        ...order,
        status: ORDER_STATUS.ENTREGUE,
        deliveryProofPhoto: proofPhotoUrl || order.deliveryProofPhoto,
        completedAt: new Date().toISOString(),
        history: [
          ...order.history,
          {
            status: ORDER_STATUS.ENTREGUE,
            time: new Date().toISOString(),
            note: 'Medicamento entregue ao paciente. Confirmação do receptor validada via código de entrega.'
          }
        ]
      };
    }));
  };

  // Atribuir Entregador
  const assignDriverToOrder = (orderId, driverId) => {
    const driver = drivers.find(d => d.id === driverId);
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          assignedDriverId: driverId,
          assignedDriverName: driver ? driver.name : null,
          history: [
            ...order.history,
            {
              status: order.status,
              time: new Date().toISOString(),
              note: `Farmacêutica atribuiu pedido ao entregador ${driver ? driver.name : 'N/A'}.`
            }
          ]
        };
      }
      return order;
    }));
  };

  // Atualizar Estoque (Farmacêutico)
  const updateStock = (medicineId, newStockQuantity) => {
    setInventory(prev => prev.map(item => {
      if (item.id === medicineId) {
        const qty = Math.max(0, Number(newStockQuantity));
        if (qty <= item.minStock) {
          addNotification({
            userId: 'user-farm',
            title: `Alerta de Estoque Crítico: ${item.name}`,
            message: `O saldo de ${item.name} atingiu ${qty} ${item.unit}. Ponto de reposição atingido.`,
            type: 'stock'
          });
        }
        return {
          ...item,
          currentStock: qty
        };
      }
      return item;
    }));
  };

  // Ajustar Estoque por delta (+ ou -)
  const adjustStockDelta = (medicineId, delta) => {
    setInventory(prev => prev.map(item => {
      if (item.id === medicineId) {
        const newQty = Math.max(0, item.currentStock + Number(delta));
        if (newQty <= item.minStock) {
          addNotification({
            userId: 'user-farm',
            title: `Alerta de Estoque Crítico: ${item.name}`,
            message: `O saldo de ${item.name} atingiu ${newQty} ${item.unit}.`,
            type: 'stock'
          });
        }
        return {
          ...item,
          currentStock: newQty
        };
      }
      return item;
    }));
  };

  // Adicionar / Editar Medicamento Completo
  const saveMedicine = (medicineData) => {
    setInventory(prev => {
      const exists = prev.find(m => m.id === medicineData.id);
      if (exists) {
        return prev.map(m => m.id === medicineData.id ? { ...m, ...medicineData } : m);
      }
      const newMed = {
        ...medicineData,
        id: `med-${Date.now()}`
      };
      return [...prev, newMed];
    });
  };

  // Atualizar Localização do Entregador
  const updateDriverLocation = (driverId, newCoords) => {
    setDrivers(prev => prev.map(d => {
      if (d.id === driverId) {
        return { ...d, currentLocation: newCoords };
      }
      return d;
    }));
  };

  // Simular deslocamento do motoboy em direção a um ponto com detecção de proximidade automática
  const stepSimulateDriver = (driverId, targetCoords, targetOrderId = null) => {
    setDrivers(prev => prev.map(d => {
      if (d.id === driverId) {
        const [currLat, currLng] = d.currentLocation;
        const [targetLat, targetLng] = targetCoords;
        const newLat = currLat + (targetLat - currLat) * 0.35;
        const newLng = currLng + (targetLng - currLng) * 0.35;
        const newCoords = [newLat, newLng];

        // Checa distância para o alvo
        const distKm = calculateDistanceKm(newCoords, targetCoords);
        if (distKm <= 0.8 && targetOrderId) {
          triggerProximityAlert(targetOrderId);
        }

        return { ...d, currentLocation: newCoords };
      }
      return d;
    }));
  };

  // Restaurar dados iniciais
  const resetToDefaults = () => {
    setOrders(INITIAL_ORDERS);
    setInventory(MOCK_MEDICINES);
    setDrivers(MOCK_DRIVERS);
    setChatMessages(INITIAL_CHAT_MESSAGES);
    setNotifications(INITIAL_NOTIFICATIONS);
    localStorage.removeItem(ORDERS_KEY);
    localStorage.removeItem(INVENTORY_KEY);
    localStorage.removeItem(DRIVERS_KEY);
    localStorage.removeItem(CHAT_KEY);
    localStorage.removeItem(NOTIF_KEY);
  };

  return (
    <AppDataContext.Provider value={{
      orders,
      inventory,
      drivers,
      chatMessages,
      notifications,
      createOrder,
      updateOrder,
      approveOrder,
      rejectOrder,
      startOrderDelivery,
      cancelOrderDelivery,
      completeOrderDelivery,
      assignDriverToOrder,
      updateStock,
      adjustStockDelta,
      saveMedicine,
      updateDriverLocation,
      stepSimulateDriver,
      triggerProximityAlert,
      sendChatMessage,
      addNotification,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      markChatThreadAsRead,
      resetToDefaults,
      hub: INDAIATUBA_HUB
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData deve ser utilizado dentro de AppDataProvider');
  }
  return context;
}
