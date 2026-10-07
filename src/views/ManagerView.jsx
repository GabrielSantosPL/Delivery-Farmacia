import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { formatDate } from '../utils/formatters';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import LeafletMap from '../components/LeafletMap';
import ChatModal from '../components/ChatModal';
import { 
  Map, PackageCheck, Boxes, Users, Truck, AlertTriangle, 
  Search, Edit3, CheckCircle2, History, Sparkles, Plus, MessageSquare 
} from 'lucide-react';

function StockAdjuster({ medId, onAdjust }) {
  const [amount, setAmount] = useState(10);
  return (
    <div className="stock-number-adjuster">
      <input
        type="number"
        min="1"
        value={amount}
        onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 1))}
        className="stock-adjust-input"
        title="Quantidade a alterar"
      />
      <button
        type="button"
        className="btn-stock-sub"
        onClick={() => onAdjust(medId, -amount)}
        title={`Subtrair ${amount} do estoque`}
      >
        - Subtrair
      </button>
      <button
        type="button"
        className="btn-stock-add"
        onClick={() => onAdjust(medId, amount)}
        title={`Adicionar ${amount} ao estoque`}
      >
        + Adicionar
      </button>
    </div>
  );
}

export default function ManagerView() {
  const { 
    orders, inventory, drivers, hub, 
    assignDriverToOrder, updateStock, adjustStockDelta, saveMedicine, 
    stepSimulateDriver 
  } = useAppData();

  const [activeTab, setActiveTab] = useState('mapa'); // 'mapa' | 'pedidos' | 'estoque'
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [editingStockItem, setEditingStockItem] = useState(null);
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [newMedForm, setNewMedForm] = useState({
    name: '',
    form: 'Comprimido',
    category: 'Geral',
    controlType: 'Receita Simples',
    currentStock: 200,
    minStock: 50,
    unit: 'unidades',
    batch: 'LOTE-GER-2026',
    expiryDate: '2028-01-01'
  });

  // Métricas para Dashboard de Gestão
  const inTransitCount = orders.filter(o => o.status === 'EM_TRANSITO').length;
  const pendingReviewCount = orders.filter(o => o.status === 'PENDENTE_VALIDACAO').length;
  const deliveredCount = orders.filter(o => o.status === 'ENTREGUE').length;
  const lowStockCount = inventory.filter(m => m.currentStock <= m.minStock).length;

  // Filtragem de pedidos
  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.patient?.name.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.patient?.neighborhood.toLowerCase().includes(orderSearch.toLowerCase())
  );

  // Simular movimento dos entregadores para demonstração dinâmica
  const handleSimulateAllDrivers = () => {
    drivers.forEach(driver => {
      // move em direção ao primeiro pedido ativo ou hub
      const activeOrder = orders.find(o => o.assignedDriverId === driver.id && o.status === 'EM_TRANSITO');
      const targetCoords = activeOrder ? activeOrder.patient.coordinates : hub.coordinates;
      stepSimulateDriver(driver.id, targetCoords);
    });
  };

  const handleSaveStockEdit = (e) => {
    e.preventDefault();
    if (!editingStockItem) return;
    updateStock(editingStockItem.id, editingStockItem.currentStock);
    setEditingStockItem(null);
  };

  const handleCreateMed = (e) => {
    e.preventDefault();
    if (!newMedForm.name.trim()) return;
    saveMedicine(newMedForm);
    setShowAddMedModal(false);
  };

  return (
    <div className="view-container">
      {/* Top Banner do Gerente */}
      <div className="view-header-card">
        <div className="header-info-group">
          <div className="header-icon-box" style={{ background: '#ede9fe', color: '#7c3aed' }}>
            👨‍💼
          </div>
          <div>
            <h1 className="header-title">Centro de Controle e Gestão Municipal</h1>
            <p className="header-subtitle">
              Supervisão de frota de entregas, roteirização dinâmica e estoque farmacêutico de Indaiatuba/SP
            </p>
          </div>

          <button
            type="button"
            className="btn-chat-manager-shortcut"
            onClick={() => setChatTarget({ contactId: 'user-farm' })}
            style={{ marginLeft: 'auto' }}
            title="Abrir chat direto com a Farmacêutica Responsável"
          >
            <MessageSquare size={16} />
            <span>Chat com Farmacêutica</span>
          </button>
        </div>

        {/* Abas */}
        <div className="view-tabs-container">
          <button
            type="button"
            className={`view-tab-btn ${activeTab === 'mapa' ? 'active' : ''}`}
            onClick={() => setActiveTab('mapa')}
          >
            <Map size={18} />
            <span>Mapa Geral da Frota</span>
            {inTransitCount > 0 && (
              <span className="tab-pill-badge" style={{ background: '#7c3aed', color: '#fff' }}>
                {inTransitCount} em rota
              </span>
            )}
          </button>

          <button
            type="button"
            className={`view-tab-btn ${activeTab === 'pedidos' ? 'active' : ''}`}
            onClick={() => setActiveTab('pedidos')}
          >
            <PackageCheck size={18} />
            <span>Gestão de Pedidos</span>
          </button>

          <button
            type="button"
            className={`view-tab-btn ${activeTab === 'estoque' ? 'active' : ''}`}
            onClick={() => setActiveTab('estoque')}
          >
            <Boxes size={18} />
            <span>Estoque & Logística</span>
            {lowStockCount > 0 && <span className="tab-pill-badge badge-alert">{lowStockCount} alertas</span>}
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <Truck size={20} />
          </div>
          <div>
            <div className="kpi-value">{inTransitCount}</div>
            <div className="kpi-label">Entregas em Rota Agora</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: '#fef3c7', color: '#b45309' }}>
            <Users size={20} />
          </div>
          <div>
            <div className="kpi-value">{pendingReviewCount}</div>
            <div className="kpi-label">Aguardando Farmácia</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: '#dcfce7', color: '#15803d' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="kpi-value">{deliveredCount}</div>
            <div className="kpi-label">Entregues com Sucesso</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: '#fee2e2', color: '#b91c1c' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="kpi-value">{lowStockCount}</div>
            <div className="kpi-label">Itens c/ Estoque Crítico</div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ABA 1: MAPA DA FROTA E ROTAS DINÂMICAS */}
      {/* ============================================================== */}
      {activeTab === 'mapa' && (
        <div className="manager-map-section">
          <div className="map-panel-split">
            {/* Mapa de Indaiatuba */}
            <div className="map-panel-main">
              <LeafletMap
                drivers={drivers}
                orders={orders}
                hub={hub}
                height="540px"
                onSimulateMove={handleSimulateAllDrivers}
              />
            </div>

            {/* Painel Lateral dos Motoboys */}
            <div className="map-panel-sidebar">
              <div className="sidebar-box-header">
                <h3>Frota Ativa em Indaiatuba</h3>
                <button
                  type="button"
                  className="btn-quick-pulse"
                  onClick={handleSimulateAllDrivers}
                  title="Avança a posição das motos no mapa"
                >
                  <Sparkles size={14} />
                  <span>Simular Deslocamento</span>
                </button>
              </div>

              <div className="drivers-cards-stack">
                {drivers.map(driver => {
                  const assignedOrders = orders.filter(o => o.assignedDriverId === driver.id && ['PRONTO_ENTREGA', 'EM_TRANSITO'].includes(o.status));
                  return (
                    <div key={driver.id} className="driver-monitor-card">
                      <div className="driver-card-topbar">
                        <div className="driver-card-name">
                          <span>🛵</span>
                          <strong>{driver.name}</strong>
                        </div>
                        <span className="driver-badge-status">{driver.status}</span>
                      </div>

                      <div className="driver-specs">
                        <div><b>Veículo:</b> {driver.vehicle}</div>
                        <div><b>Placa:</b> {driver.plate}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <span><b>Bateria:</b> {driver.battery}% • GPS Ativo</span>
                          <button
                            type="button"
                            className="btn-chat-patient-pill"
                            onClick={() => setChatTarget({ contactId: driver.id })}
                            title="Conversar via chat com este entregador"
                          >
                            <MessageSquare size={12} />
                            <span>Chat</span>
                          </button>
                        </div>
                      </div>

                      <div className="driver-active-orders-box">
                        <strong>Entregas em Andamento ({assignedOrders.length}):</strong>
                        {assignedOrders.length === 0 ? (
                          <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                            Sem entregas ativas no momento
                          </div>
                        ) : (
                          assignedOrders.map(o => (
                            <div key={o.id} className="driver-order-mini-pill">
                              <span>{o.id}</span>
                              <span>• {o.patient?.neighborhood}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 2: GESTÃO DE PEDIDOS DOS CLIENTES */}
      {/* ============================================================== */}
      {activeTab === 'pedidos' && (
        <div className="manager-orders-section">
          <div className="manager-search-bar">
            <div className="search-input-box" style={{ maxWidth: '400px' }}>
              <Search size={18} color="#64748b" />
              <input
                type="text"
                placeholder="Buscar por código, paciente ou bairro..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="custom-table mobile-order-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Paciente & Bairro</th>
                  <th>Medicamentos</th>
                  <th>Status</th>
                  <th>Entregador Designado</th>
                  <th>Ações do Gerente</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.id}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{formatDate(order.createdAt)}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <b>{order.patient?.name}</b>
                        <button
                          type="button"
                          className="btn-chat-patient-pill"
                          onClick={() => setChatTarget({ contactId: order.patient?.id || 'user-cliente', orderId: order.id })}
                          title="Iniciar conversa via chat com este cidadão"
                        >
                          <MessageSquare size={11} />
                          <span>Chat</span>
                        </button>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>📍 {order.patient?.neighborhood}</div>
                      {order.status === 'CANCELADO_ENTREGADOR' && (
                        <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px', fontWeight: 'bold' }}>
                          ⚠️ Cancelado: {order.cancellationReason}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        {order.items.map((it, idx) => (
                          <div key={idx}>• {it.name} (Qtd: {it.quantity})</div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <Badge status={order.status} />
                    </td>
                    <td>
                      <select
                        className="select-driver-dropdown"
                        value={order.assignedDriverId || ''}
                        onChange={(e) => assignDriverToOrder(order.id, e.target.value)}
                      >
                        <option value="">Não atribuído</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-table-action"
                        onClick={() => setSelectedOrderDetails(order)}
                      >
                        <History size={14} />
                        <span>Auditoria</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 3: ESTOQUE MUNICIPAL & LOGÍSTICA */}
      {/* ============================================================== */}
      {activeTab === 'estoque' && (
        <div className="manager-stock-section">
          <div className="stock-controls-bar">
            <div>
              <h3>Controle e Ajuste de Estoque Municipal</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                O Gerente tem permissão para alterar saldos, lotes e cadastrar novos insumos da farmácia central.
              </p>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowAddMedModal(true)}
            >
              <Plus size={16} />
              <span>Cadastrar Medicamento</span>
            </button>
          </div>

          <div className="table-responsive-wrapper">
            <table className="custom-table mobile-stock-table">
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Classe / Forma</th>
                  <th>Lote</th>
                  <th>Estoque Atual</th>
                  <th>Estoque Mínimo</th>
                  <th>Status</th>
                  <th>Ação Gerencial</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(med => {
                  const isLow = med.currentStock <= med.minStock;
                  return (
                    <tr key={med.id} className={isLow ? 'row-alert' : ''}>
                      <td>
                        <strong>{med.name}</strong>
                      </td>
                      <td>
                        <div>{med.category}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{med.form}</div>
                      </td>
                      <td>{med.batch}</td>
                      <td>
                        <strong style={{ fontSize: '15px' }}>{med.currentStock}</strong> {med.unit}
                      </td>
                      <td>{med.minStock} {med.unit}</td>
                      <td>
                        {isLow ? (
                          <span className="badge-low-stock">⚠️ Estoque Crítico</span>
                        ) : (
                          <span className="badge-normal-stock">✓ OK</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <StockAdjuster medId={med.id} onAdjust={adjustStockDelta} />
                          <button
                            type="button"
                            className="btn-edit-stock"
                            onClick={() => setEditingStockItem({ ...med })}
                            title="Editar cadastro completo"
                          >
                            <Edit3 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DETALHES E HISTÓRICO DO PEDIDO */}
      {/* ============================================================== */}
      <Modal
        isOpen={!!selectedOrderDetails}
        onClose={() => setSelectedOrderDetails(null)}
        title={selectedOrderDetails ? `Trilha de Auditoria • Pedido ${selectedOrderDetails.id}` : ''}
        maxWidth="600px"
      >
        {selectedOrderDetails && (
          <div className="audit-modal-content">
            <div className="data-info-card">
              <div><strong>Paciente:</strong> {selectedOrderDetails.patient?.name}</div>
              <div><strong>Endereço:</strong> {selectedOrderDetails.patient?.address}, {selectedOrderDetails.patient?.neighborhood}</div>
              <div><strong>Status Atual:</strong> <Badge status={selectedOrderDetails.status} /></div>
              {selectedOrderDetails.validatedBy && (
                <div><strong>Validado por:</strong> {selectedOrderDetails.validatedBy}</div>
              )}
              {selectedOrderDetails.rejectionReason && (
                <div style={{ color: '#dc2626', marginTop: '6px' }}>
                  <strong>Motivo da Recusa:</strong> {selectedOrderDetails.rejectionReason}
                </div>
              )}
            </div>

            <div className="section-title-sm" style={{ marginTop: '16px' }}>
              Histórico de Eventos do Pedido:
            </div>
            <div className="timeline-container">
              {selectedOrderDetails.history?.map((step, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-marker" />
                  <div className="timeline-content">
                    <div className="timeline-time">{formatDate(step.time)}</div>
                    <div className="timeline-title">{step.note}</div>
                  </div>
                </div>
              ))}
            </div>

            {selectedOrderDetails.deliveryProofPhoto && (
              <div style={{ marginTop: '16px' }}>
                <div className="section-title-sm">Comprovante de Entrega Coletado pelo Motoboy:</div>
                <img
                  src={selectedOrderDetails.deliveryProofPhoto}
                  alt="Comprovante"
                  style={{ width: '100%', borderRadius: '8px', marginTop: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* MODAL: ALTERAR ESTOQUE (GERENTE) */}
      {/* ============================================================== */}
      <Modal
        isOpen={!!editingStockItem}
        onClose={() => setEditingStockItem(null)}
        title={editingStockItem ? `Alterar Saldo de Estoque • ${editingStockItem.name}` : ''}
        maxWidth="450px"
      >
        {editingStockItem && (
          <form onSubmit={handleSaveStockEdit}>
            <div className="form-group">
              <label className="form-label">Medicamento:</label>
              <input type="text" disabled className="form-input" value={editingStockItem.name} />
            </div>

            <div className="form-group">
              <label className="form-label">Novo Saldo de Estoque ({editingStockItem.unit}):</label>
              <input
                type="number"
                min="0"
                required
                className="form-input"
                value={editingStockItem.currentStock}
                onChange={(e) => setEditingStockItem({ ...editingStockItem, currentStock: Number(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estoque Mínimo de Alerta:</label>
              <input
                type="number"
                min="0"
                required
                className="form-input"
                value={editingStockItem.minStock}
                onChange={(e) => setEditingStockItem({ ...editingStockItem, minStock: Number(e.target.value) })}
              />
            </div>

            <div className="modal-actions-footer">
              <button type="button" className="btn-secondary" onClick={() => setEditingStockItem(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                Salvar Alterações
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* MODAL: CADASTRAR MEDICAMENTO (GERENTE) */}
      {/* ============================================================== */}
      <Modal
        isOpen={showAddMedModal}
        onClose={() => setShowAddMedModal(false)}
        title="Cadastrar Medicamento no Sistema"
        maxWidth="500px"
      >
        <form onSubmit={handleCreateMed}>
          <div className="form-group">
            <label className="form-label">Nome do Princípio Ativo:</label>
            <input
              type="text"
              required
              className="form-input"
              value={newMedForm.name}
              onChange={(e) => setNewMedForm({ ...newMedForm, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Classe Terapêutica:</label>
            <input
              type="text"
              className="form-input"
              value={newMedForm.category}
              onChange={(e) => setNewMedForm({ ...newMedForm, category: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Estoque Inicial:</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={newMedForm.currentStock}
                onChange={(e) => setNewMedForm({ ...newMedForm, currentStock: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mínimo de Alerta:</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={newMedForm.minStock}
                onChange={(e) => setNewMedForm({ ...newMedForm, minStock: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="modal-actions-footer">
            <button type="button" className="btn-secondary" onClick={() => setShowAddMedModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Cadastrar Medicamento
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Chat Integrado do Gerente */}
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
