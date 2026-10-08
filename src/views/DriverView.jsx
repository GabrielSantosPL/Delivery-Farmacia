import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { formatDate } from '../utils/formatters';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import LeafletMap from '../components/LeafletMap';
import ChatModal from '../components/ChatModal';
import { DRIVER_CANCELLATION_REASONS } from '../mock/mockData';
import { optimizeDeliveryQueue } from '../utils/routeOptimizer';
import { 
  Navigation, CheckCircle, Camera, MapPin, Phone, 
  Package, Crosshair, AlertCircle, Sparkles, 
  Eye, XCircle, MessageSquare, Bell, ShieldCheck, 
  AlertTriangle, Layers
} from 'lucide-react';

export default function DriverView() {
  const { currentUser } = useAuth();
  const { 
    orders, drivers, hub, 
    startOrderDelivery, cancelOrderDelivery, completeOrderDelivery, 
    updateDriverLocation, stepSimulateDriver, triggerProximityAlert 
  } = useAppData();

  const [activeTab, setActiveTab] = useState('pedidos'); // 'pedidos' | 'mapa' | 'fila'
  
  // Estado para Finalizar Entrega com Conferência
  const [selectedOrderToDeliver, setSelectedOrderToDeliver] = useState(null);
  const [deliveryConfirmationCode, setDeliveryConfirmationCode] = useState('');
  const [deliveryError, setDeliveryError] = useState('');

  // Estado para Cancelamento de Entrega
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancellationCategory, setCancellationCategory] = useState(DRIVER_CANCELLATION_REASONS[0]);
  const [cancellationDetails, setCancellationDetails] = useState('');

  // Estado para Chat
  const [chatTarget, setChatTarget] = useState(null); // { contactId, orderId }

  // Visualizar comprovante
  const [viewingProofOrder, setViewingProofOrder] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('GPS Pronto (Indaiatuba)');

  // Entregador atual
  const currentDriver = drivers.find(d => d.id === currentUser?.driverId) || drivers[0];

  // Filtra pedidos designados ao entregador
  const myOrders = orders.filter(o => 
    o.assignedDriverId === currentDriver.id || 
    (o.status === 'PRONTO_ENTREGA' && !o.assignedDriverId) ||
    o.assignedDriverName === currentDriver.name
  );

  const pendingDeliveries = myOrders.filter(o => ['PRONTO_ENTREGA', 'EM_TRANSITO'].includes(o.status));

  // Calcula Fila Otimizada de Entregas por Proximidade Comum
  const routeOptimization = optimizeDeliveryQueue(currentDriver.currentLocation, pendingDeliveries);

  // Solicitar GPS do navegador
  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocalização não suportada no navegador');
      return;
    }
    setGpsStatus('Conectando a satélites GPS...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        updateDriverLocation(currentDriver.id, [latitude, longitude]);
        setGpsStatus(`GPS Ativo: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      },
      () => {
        setGpsStatus('Acesso GPS negado. Usando rota simulada de Indaiatuba.');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Finalizar entrega após validar o código informado pelo cliente
  const handleConfirmDelivery = () => {
    const code = (deliveryConfirmationCode || '').trim().toUpperCase();
    if (!code) {
      setDeliveryError('Informe o código de confirmação fornecido pelo receptor.');
      return;
    }

    if (!selectedOrderToDeliver?.deliveryCode) {
      setDeliveryError('Este pedido ainda não possui código de confirmação. Solicite apoio à farmácia.');
      return;
    }

    if (code !== selectedOrderToDeliver.deliveryCode.trim().toUpperCase()) {
      setDeliveryError('Código de confirmação inválido. Peça ao destinatário que informe o código correto.');
      return;
    }

    completeOrderDelivery(selectedOrderToDeliver.id, null, code);
    setSelectedOrderToDeliver(null);
    setDeliveryConfirmationCode('');
    setDeliveryError('');
    alert(`Entrega ${selectedOrderToDeliver.id} validada e confirmada com sucesso!`);
  };

  // Confirmar cancelamento de entrega
  const handleConfirmCancel = () => {
    if (!orderToCancel) return;
    const ok = cancelOrderDelivery(
      orderToCancel.id,
      currentDriver.name,
      cancellationCategory,
      cancellationDetails
    );
    if (ok) {
      setOrderToCancel(null);
      setCancellationDetails('');
      alert(`Entrega ${orderToCancel.id} cancelada no sistema com a justificativa: [${cancellationCategory}]. A farmácia responsável e o paciente foram notificados.`);
    }
  };

  // Simulação de deslocamento
  const handleSimulateMovement = () => {
    if (routeOptimization.queue.length > 0) {
      const nextStop = routeOptimization.queue[0];
      stepSimulateDriver(currentDriver.id, nextStop.coords, nextStop.order.id);
    } else {
      stepSimulateDriver(currentDriver.id, hub.coordinates);
    }
  };

  return (
    <div className="view-container">
      {/* Header do Entregador */}
      <div className="view-header-card">
        <div className="header-info-group">
          <div className="header-icon-box" style={{ background: '#ffedd5', color: '#ea580c' }}>
            🛵
          </div>
          <div>
            <h1 className="header-title">Painel do Entregador SUS</h1>
            <p className="header-subtitle">
              {currentDriver.name} • {currentDriver.vehicle} ({currentDriver.plate}) • Indaiatuba/SP
            </p>
          </div>
        </div>

        {/* Abas */}
        <div className="view-tabs-container">
          <button
            type="button"
            className={`view-tab-btn ${activeTab === 'pedidos' ? 'active' : ''}`}
            onClick={() => setActiveTab('pedidos')}
          >
            <Package size={18} />
            <span>Meus Pedidos</span>
            {pendingDeliveries.length > 0 && (
              <span className="tab-pill-badge" style={{ background: '#ea580c', color: '#fff' }}>
                {pendingDeliveries.length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`view-tab-btn ${activeTab === 'fila' ? 'active' : ''}`}
            onClick={() => setActiveTab('fila')}
          >
            <Layers size={18} />
            <span>Fila Otimizada por Proximidade</span>
            {routeOptimization.queue.length > 0 && (
              <span className="tab-pill-badge" style={{ background: '#0284c7', color: '#fff' }}>
                {routeOptimization.queue.length} paradas
              </span>
            )}
          </button>

          <button
            type="button"
            className={`view-tab-btn ${activeTab === 'mapa' ? 'active' : ''}`}
            onClick={() => setActiveTab('mapa')}
          >
            <Navigation size={18} />
            <span>Mapa & Navegação</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ABA 1: MEUS PEDIDOS */}
      {/* ============================================================== */}
      {activeTab === 'pedidos' && (
        <div className="driver-orders-section">
          {/* Barra com Botão de Chat com o Gestor */}
          <div className="driver-summary-bar">
            <div className="driver-summary-stats">
              <span>📦 Total de entregas: <b>{myOrders.length}</b></span>
              <span>⚡ Em andamento: <b>{pendingDeliveries.length}</b></span>
            </div>

            <button
              type="button"
              className="btn-chat-manager-shortcut driver-manager-chat-btn"
              onClick={() => setChatTarget({ contactId: 'user-farm' })}
            >
              <MessageSquare size={15} />
              <span>Falar com Farmácia</span>
            </button>
          </div>

          <div className="orders-grid">
            {myOrders.length === 0 ? (
              <div className="empty-state-card">
                <p>Nenhum pedido atribuído no momento.</p>
              </div>
            ) : (
              myOrders.map(order => {
                const isReady = order.status === 'PRONTO_ENTREGA';
                const isInTransit = order.status === 'EM_TRANSITO';
                const isDelivered = order.status === 'ENTREGUE';
                const isCancelled = order.status === 'CANCELADO_ENTREGADOR';

                return (
                  <div key={order.id} className="order-card">
                    <div className="order-card-header">
                      <div>
                        <div className="order-code">{order.id}</div>
                        <div className="order-date">{formatDate(order.createdAt)}</div>
                      </div>
                      <Badge status={order.status} />
                    </div>

                    {/* Alerta caso cancelado pelo motoboy */}
                    {isCancelled && (
                      <div className="rejection-box-alert">
                        <strong>Entrega Cancelada: {order.cancellationReason}</strong>
                        <p>{order.cancellationDetails || 'Sem detalhes informados.'}</p>
                      </div>
                    )}

                    {/* Dados do Paciente */}
                    <div className="patient-box">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="patient-name">👤 {order.patient?.name}</div>
                        {/* Botão de Chat direto com o cliente */}
                        <button
                          type="button"
                          className="btn-chat-patient-pill"
                          onClick={() => setChatTarget({ contactId: order.patient?.id || 'user-cliente', orderId: order.id })}
                          title="Enviar mensagem para o paciente desta entrega"
                        >
                          <MessageSquare size={13} />
                          <span>Chat</span>
                        </button>
                      </div>

                      <div className="patient-address">
                        <MapPin size={15} color="#ea580c" />
                        <span>{order.patient?.address}, {order.patient?.neighborhood} - Indaiatuba</span>
                      </div>

                      <div className="patient-meta" style={{ marginTop: '6px' }}>
                        <Phone size={13} />
                        <span>{order.patient?.phone || '(19) 99876-0000'}</span>
                      </div>
                    </div>

                    {/* Medicamentos */}
                    <div className="meds-list-box">
                      <div className="meds-list-title">Medicamentos para Entrega:</div>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="med-item-row">
                          <span className="med-item-name">• {item.name}</span>
                          <span className="med-item-qty">Qtd: {item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Ações do Entregador */}
                    <div className="driver-card-actions">
                      {isReady && (
                        <button
                          type="button"
                          className="btn-start-route"
                          onClick={() => startOrderDelivery(order.id)}
                        >
                          <Navigation size={16} />
                          <span>Iniciar Rota (A Caminho)</span>
                        </button>
                      )}

                      {isInTransit && (
                        <>
                          {/* Botão Notificar Proximidade */}
                          <button
                            type="button"
                            className="btn-notify-proximity"
                            onClick={() => {
                              triggerProximityAlert(order.id);
                              alert(`Notificação enviada para ${order.patient?.name}: Motoboy se aproximando da residência!`);
                            }}
                            title="Avisa o morador para preparar a receita médica"
                          >
                            <Bell size={15} />
                            <span>Avisar Morador (Chegando)</span>
                          </button>

                          {/* Botão Finalizar Entrega com Foto */}
                          <button
                            type="button"
                            className="btn-finish-delivery"
                            onClick={() => {
                              setSelectedOrderToDeliver(order);
                              setDeliveryConfirmationCode('');
                              setDeliveryError('');
                            }}
                          >
                            <Camera size={16} />
                            <span>Conferir & Entregar</span>
                          </button>

                          {/* Botão Cancelar Entrega */}
                          <button
                            type="button"
                            className="btn-cancel-delivery"
                            onClick={() => {
                              setOrderToCancel(order);
                              setCancellationCategory(DRIVER_CANCELLATION_REASONS[0]);
                              setCancellationDetails('');
                            }}
                          >
                            <XCircle size={15} />
                            <span>Cancelar Entrega...</span>
                          </button>
                        </>
                      )}

                      {isDelivered && order.deliveryProofPhoto && (
                        <button
                          type="button"
                          className="btn-view-proof"
                          onClick={() => setViewingProofOrder(order)}
                        >
                          <Eye size={16} />
                          <span>Ver Receita Coletada</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 2: FILA OTIMIZADA POR PROXIMIDADE */}
      {/* ============================================================== */}
      {activeTab === 'fila' && (
        <div className="route-queue-section">
          <div className="route-queue-summary-card">
            <div>
              <h3>Fila de Rota Inteligente (Proximidade Comum)</h3>
              <p>
                Os destinos de entrega foram organizados sequencialmente a partir da sua localização atual em Indaiatuba para minimizar a quilometragem total.
              </p>
            </div>
            <div className="queue-stats-badge">
              <div><b>{routeOptimization.totalDistanceKm} km</b> trajeto total</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>~{routeOptimization.estimatedMinutes} min estimados</div>
            </div>
          </div>

          {routeOptimization.queue.length === 0 ? (
            <div className="empty-state-card">
              <p>Nenhuma entrega pendente para roteirizar no momento.</p>
            </div>
          ) : (
            <div className="queue-stops-stack">
              {routeOptimization.queue.map(stop => (
                <div key={stop.order.id} className="queue-stop-card">
                  <div className="stop-number-badge">
                    #{stop.stopIndex}
                  </div>
                  <div className="stop-details">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '15px' }}>{stop.order.patient?.name}</strong>
                      <span className="stop-distance-tag">+{stop.distanceFromPrevKm} km</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                      📍 {stop.order.patient?.address}, {stop.order.patient?.neighborhood}
                    </div>
                    <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '4px' }}>
                      Pedido: <b>{stop.order.id}</b> • Status: <Badge status={stop.order.status} />
                    </div>
                  </div>
                  <div className="stop-action">
                    <button
                      type="button"
                      className="btn-jump-order"
                      onClick={() => {
                        setSelectedOrderToDeliver(stop.order);
                        setDeliveryConfirmationCode('');
                        setDeliveryError('');
                      }}
                    >
                      <Camera size={14} />
                      <span>Entregar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 3: MAPA E NAVEGAÇÃO */}
      {/* ============================================================== */}
      {activeTab === 'mapa' && (
        <div className="map-view-section">
          <div className="gps-control-bar">
            <div className="gps-status-indicator">
              <span className="gps-pulse-dot" />
              <span>{gpsStatus}</span>
            </div>

            <div className="gps-action-group">
              <button
                type="button"
                className="btn-gps-trigger"
                onClick={requestGeolocation}
              >
                <Crosshair size={16} />
                <span>GPS do Smartphone</span>
              </button>

              <button
                type="button"
                className="btn-simulate-trigger"
                onClick={handleSimulateMovement}
              >
                <Sparkles size={16} />
                <span>Simular Avanço na Rota</span>
              </button>
            </div>
          </div>

          <div className="map-wrapper">
            <LeafletMap
              drivers={[currentDriver]}
              orders={myOrders}
              hub={hub}
              optimizedQueue={routeOptimization.queue}
              height="500px"
              onSimulateMove={handleSimulateMovement}
            />
          </div>

          <div className="map-route-legend">
            <div className="legend-item">
              <span className="legend-icon" style={{ background: '#0284c7' }}>#1</span>
              <span>Paradas Ordenadas na Fila de Menor Trajeto</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon" style={{ background: '#ea580c' }}>🛵</span>
              <span>Sua Moto ({currentDriver.name})</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon" style={{ background: '#0284c7' }}>🏥</span>
              <span>Farmácia Central</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: FINALIZAR ENTREGA COM CHECAGEM DA RECEITA */}
      {/* ============================================================== */}
      <Modal
        isOpen={!!selectedOrderToDeliver}
        onClose={() => setSelectedOrderToDeliver(null)}
        title={selectedOrderToDeliver ? `Conferência e Entrega • ${selectedOrderToDeliver.id}` : ''}
        maxWidth="680px"
      >
        {selectedOrderToDeliver && (
          <div className="delivery-verification-modal">
            <div className="delivery-instruction-card">
              <ShieldCheck size={26} color="#0284c7" />
              <div>
                <strong>Confirmação de Entrega por Código:</strong>
                <p>
                  Solicite ao receptor <b>{selectedOrderToDeliver.patient?.name}</b> que informe o código de entrega. A confirmação não exige foto da receita.
                </p>
              </div>
            </div>

            <div className="delivery-code-verification">
              <label className="verif-label" htmlFor="delivery-confirmation-code">
                Código de confirmação do cliente
              </label>
              <p className="delivery-code-instruction">
                Peça o código ao cliente. O código correto não é exibido nesta tela.
              </p>
              <input
                id="delivery-confirmation-code"
                className="form-input"
                value={deliveryConfirmationCode}
                onChange={(e) => {
                  setDeliveryConfirmationCode(e.target.value.toUpperCase());
                  setDeliveryError('');
                }}
                placeholder="Informe o código recebido"
                maxLength={6}
                autoComplete="one-time-code"
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            {deliveryError && (
              <div className="login-error-alert" style={{ marginTop: '10px' }}>
                <AlertCircle size={16} />
                <span>{deliveryError}</span>
              </div>
            )}

            <div className="modal-actions-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedOrderToDeliver(null)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn-confirm-delivery-submit"
                onClick={handleConfirmDelivery}
                disabled={!deliveryConfirmationCode.trim()}
                style={{ opacity: !deliveryConfirmationCode.trim() ? 0.6 : 1 }}
              >
                <CheckCircle size={18} />
                <span>Confirmar Entrega</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 2: CANCELAR ENTREGA COM JUSTIFICATIVA */}
      {/* ============================================================== */}
      <Modal
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        title={orderToCancel ? `Cancelar Entrega • ${orderToCancel.id}` : ''}
        maxWidth="520px"
      >
        {orderToCancel && (
          <div className="cancel-delivery-modal">
            <div className="reject-notice">
              <AlertTriangle size={24} color="#dc2626" />
              <div>
                <strong>Atenção: Cancelamento de Rota</strong>
                <p>O cancelamento registrará ocorrência imediata para a farmácia responsável e o paciente ({orderToCancel.patient?.name}) será notificado.</p>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '14px' }}>
              <label className="form-label">Motivo Classificado do Cancelamento:</label>
              <select
                className="form-input"
                value={cancellationCategory}
                onChange={(e) => setCancellationCategory(e.target.value)}
              >
                {DRIVER_CANCELLATION_REASONS.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Detalhamento da Ocorrência:</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Descreva detalhes do ocorrido (ex: morador não atendeu campainha, pneu furou na Av. Fábio Barnabé, etc.)..."
                value={cancellationDetails}
                onChange={(e) => setCancellationDetails(e.target.value)}
              />
            </div>

            <div className="modal-actions-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setOrderToCancel(null)}
              >
                Voltar
              </button>
              <button
                type="button"
                className="btn-confirm-reject"
                onClick={handleConfirmCancel}
              >
                Registrar Cancelamento
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 3: VER COMPROVANTE ENTREGUE */}
      {/* ============================================================== */}
      <Modal
        isOpen={!!viewingProofOrder}
        onClose={() => setViewingProofOrder(null)}
        title={viewingProofOrder ? `Receita Coletada • ${viewingProofOrder.id}` : ''}
        maxWidth="500px"
      >
        {viewingProofOrder && (
          <div>
            <img
              src={viewingProofOrder.deliveryProofPhoto}
              alt="Comprovante"
              style={{ width: '100%', borderRadius: '8px' }}
            />
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
              <div><b>Destinatário:</b> {viewingProofOrder.patient?.name}</div>
              <div><b>Data de Finalização:</b> {formatDate(viewingProofOrder.completedAt)}</div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Chat Rápido */}
      {chatTarget && (
        <ChatModal
          isOpen={true}
          onClose={() => setChatTarget(null)}
          initialContactId={chatTarget.contactId}
          initialOrderId={chatTarget.orderId}
        />
      )}
    </div>
  );
}
