import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { formatDate } from '../utils/formatters';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import ChatModal from '../components/ChatModal';
import LeafletMap from '../components/LeafletMap';
import { 
  FileText, CheckCircle2, XCircle, AlertTriangle, Search, 
  Package, Plus, Eye, ZoomIn, MessageSquare, Truck 
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

export default function PharmacistView() {
  const { currentUser } = useAuth();
  const { orders, inventory, drivers, hub, approveOrder, rejectOrder, adjustStockDelta, saveMedicine } = useAppData();

  const [activeTab, setActiveTab] = useState('pedidos'); // 'pedidos' | 'estoque'
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pharmacyDraftItems, setPharmacyDraftItems] = useState([]);
  const [medicineSearch, setMedicineSearch] = useState('');
  const [stockAvailabilityByMedicineId, setStockAvailabilityByMedicineId] = useState({});
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showChatWithEquipe, setShowChatWithEquipe] = useState(false);

  // Estados para Gestão de Estoque
  const [stockSearch, setStockSearch] = useState('');
  const [showNewMedModal, setShowNewMedModal] = useState(false);
  const [newMedForm, setNewMedForm] = useState({
    name: '',
    form: 'Comprimido',
    category: 'Geral',
    controlType: 'Receita Simples',
    currentStock: 100,
    minStock: 30,
    unit: 'unidades',
    batch: 'LOTE-2026',
    expiryDate: '2027-12-31'
  });

  // Filtragem de pedidos
  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'TODOS') return true;
    if (statusFilter === 'PENDENTE') return ['PENDENTE_VALIDACAO', 'PENDENTE_ESTOQUE'].includes(order.status);
    if (statusFilter === 'APROVADO') return ['APROVADO', 'PRONTO_ENTREGA', 'EM_TRANSITO', 'ENTREGUE'].includes(order.status);
    if (statusFilter === 'RECUSADO') return order.status === 'RECUSADO';
    return true;
  });

  const pendingCount = orders.filter(o => ['PENDENTE_VALIDACAO', 'PENDENTE_ESTOQUE'].includes(o.status)).length;

  const openOrderReview = (order) => {
    const draftItems = (order.items || []).map(item => ({ ...item }));
    setSelectedOrder(order);
    setPharmacyDraftItems(draftItems);
    setMedicineSearch('');
    setStockAvailabilityByMedicineId(Object.fromEntries(draftItems.map(item => {
      const stockItem = inventory.find(medicine => medicine.id === item.medicineId);
      const available = stockItem && Number(stockItem.currentStock || 0) >= Number(item.quantity || 0);
      const savedClassification = order.stockResolution === 'awaiting_restock'
        ? null
        : item.stockAvailability;
      return [item.medicineId, savedClassification || (available ? 'available' : 'shortage')];
    })));
  };

  const addMedicineToDraft = (medicine) => {
    setPharmacyDraftItems(prev => {
      if (prev.some(item => item.medicineId === medicine.id)) return prev;
      return [...prev, {
        medicineId: medicine.id,
        name: medicine.name,
        quantity: 1,
        dosage: ''
      }];
    });
    setStockAvailabilityByMedicineId(prev => ({
      ...prev,
      [medicine.id]: Number(medicine.currentStock || 0) >= 1 ? 'available' : 'shortage'
    }));
  };

  const updateDraftItem = (medicineId, field, value) => {
    setPharmacyDraftItems(prev => prev.map(item => item.medicineId === medicineId
      ? { ...item, [field]: field === 'quantity' ? Math.max(1, Number(value) || 1) : value }
      : item));

    if (field === 'quantity') {
      const stockItem = inventory.find(medicine => medicine.id === medicineId);
      setStockAvailabilityByMedicineId(prev => ({
        ...prev,
        [medicineId]: stockItem && Number(stockItem.currentStock || 0) >= Number(value || 1) ? 'available' : 'shortage'
      }));
    }
  };

  const removeMedicineFromDraft = (medicineId) => {
    setPharmacyDraftItems(prev => prev.filter(item => item.medicineId !== medicineId));
    setStockAvailabilityByMedicineId(prev => {
      const next = { ...prev };
      delete next[medicineId];
      return next;
    });
  };

  const hasFullStock = (items) => items.length > 0 && items.every(item => {
    const stockItem = inventory.find(medicine => medicine.id === item.medicineId);
    return stockAvailabilityByMedicineId[item.medicineId] === 'available'
      && stockItem
      && Number(stockItem.currentStock || 0) >= Number(item.quantity || 0);
  });

  const handleApprove = (order) => {
    if (pharmacyDraftItems.length === 0) {
      alert('Adicione ao menos um medicamento da receita antes de encaminhar o pedido ao cliente.');
      return;
    }
    if (window.confirm(`Confirma a decisão do pedido ${order.id}?`)) {
      const result = approveOrder(order.id, currentUser.name, {
        selectedItems: pharmacyDraftItems,
        availabilityByMedicineId: stockAvailabilityByMedicineId
      });
      if (result === false) return;
      setSelectedOrder(null);
    }
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      alert('Atenção: Por determinação sanitária, é obrigatório informar uma justificativa clara para a recusa da receita.');
      return;
    }
    const success = rejectOrder(selectedOrder.id, currentUser.name, rejectionReason);
    if (success) {
      setShowRejectModal(false);
      setSelectedOrder(null);
      setRejectionReason('');
    }
  };

  const handleCreateMed = (e) => {
    e.preventDefault();
    if (!newMedForm.name.trim()) return;
    saveMedicine(newMedForm);
    setShowNewMedModal(false);
    setNewMedForm({
      name: '',
      form: 'Comprimido',
      category: 'Geral',
      controlType: 'Receita Simples',
      currentStock: 100,
      minStock: 30,
      unit: 'unidades',
      batch: 'LOTE-2026',
      expiryDate: '2027-12-31'
    });
  };

  const filteredInventory = inventory.filter(med => 
    med.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
    med.category.toLowerCase().includes(stockSearch.toLowerCase()) ||
    med.batch.toLowerCase().includes(stockSearch.toLowerCase())
  );

  const dashboardStats = {
    inTransit: orders.filter(o => o.status === 'EM_TRANSITO').length,
    pendingReview: orders.filter(o => ['PENDENTE_VALIDACAO', 'PENDENTE_ESTOQUE'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'ENTREGUE').length,
    lowStock: inventory.filter(m => m.currentStock <= m.minStock).length
  };

  const lowStockCount = inventory.filter(m => m.currentStock <= m.minStock).length;

  return (
    <div className="view-container">
      {/* Top Banner do Farmacêutico */}
      <div className="view-header-card">
        <div className="header-info-group">
          <div className="header-icon-box" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            👩‍⚕️
          </div>
          <div>
            <h1 className="header-title">Central do Farmacêutico Responsável</h1>
            <p className="header-subtitle">
              Validação técnica de receitas médicas SUS e dispensação de medicamentos • Indaiatuba/SP
            </p>
          </div>

          <button
            type="button"
            className="btn-chat-manager-shortcut"
            onClick={() => setShowChatWithEquipe(true)}
            style={{ marginLeft: 'auto' }}
            title="Abrir canal de comunicação direto com a equipe assistencial"
          >
            <MessageSquare size={16} />
            <span>Chat da Equipe</span>
          </button>
        </div>

        {/* Abas Superiores */}
        <div className="view-tabs-container">
          <button
            type="button"
            className={`view-tab-btn ${activeTab === 'resumo' ? 'active' : ''}`}
            onClick={() => setActiveTab('resumo')}
          >
            <FileText size={18} />
            <span>Dashboard Geral</span>
          </button>

          <button
            type="button"
            className={`view-tab-btn ${activeTab === 'pedidos' ? 'active' : ''}`}
            onClick={() => setActiveTab('pedidos')}
          >
            <FileText size={18} />
            <span>Conferência de Pedidos</span>
            {pendingCount > 0 && <span className="tab-pill-badge">{pendingCount}</span>}
          </button>

          <button
            type="button"
            className={`view-tab-btn ${activeTab === 'estoque' ? 'active' : ''}`}
            onClick={() => setActiveTab('estoque')}
          >
            <Package size={18} />
            <span>Gestão de Estoque</span>
            {lowStockCount > 0 && <span className="tab-pill-badge badge-alert">{lowStockCount} alertas</span>}
          </button>
        </div>
      </div>

      {activeTab === 'resumo' && (
        <>
          <div className="fleet-overview-header pharmacist-fleet-header">
            <h3>Visão Geral da Frota Municipal</h3>
            <span>{drivers.length} entregadores ativos</span>
          </div>
          <div className="pharmacist-dashboard-layout">
            <div className="kpi-grid pharmacist-dashboard-kpis">
              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                  <Package size={20} />
                </div>
                <div>
                  <div className="kpi-value">{dashboardStats.pendingReview}</div>
                  <div className="kpi-label">Pendências de validação</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#ffedd5', color: '#ea580c' }}>
                  <Truck size={20} />
                </div>
                <div>
                  <div className="kpi-value">{dashboardStats.inTransit}</div>
                  <div className="kpi-label">Entregas em rota</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#dcfce7', color: '#15803d' }}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="kpi-value">{dashboardStats.delivered}</div>
                  <div className="kpi-label">Entregues no mês</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <div className="kpi-value">{dashboardStats.lowStock}</div>
                  <div className="kpi-label">Itens com estoque crítico</div>
                </div>
              </div>
            </div>

            <div className="fleet-overview-panel pharmacist-fleet-panel">
              <div className="map-wrapper pharmacist-fleet-map">
                <LeafletMap
                  drivers={drivers}
                  orders={orders}
                  hub={hub}
                  height="100%"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* ABA 1: CONFERÊNCIA DE PEDIDOS */}
      {/* ============================================================== */}
      {activeTab === 'pedidos' && (
        <div className="orders-section">
          {/* Barra de Filtros */}
          <div className="filter-bar">
            <span className="filter-title">Filtrar por Status:</span>
            <div className="filter-buttons">
              <button
                type="button"
                className={`filter-btn ${statusFilter === 'PENDENTE' ? 'active' : ''}`}
                onClick={() => setStatusFilter('PENDENTE')}
              >
                ⏳ Pendentes ({pendingCount})
              </button>
              <button
                type="button"
                className={`filter-btn ${statusFilter === 'TODOS' ? 'active' : ''}`}
                onClick={() => setStatusFilter('TODOS')}
              >
                Todos os Pedidos ({orders.length})
              </button>
              <button
                type="button"
                className={`filter-btn ${statusFilter === 'APROVADO' ? 'active' : ''}`}
                onClick={() => setStatusFilter('APROVADO')}
              >
                Aprovados / Em Entrega
              </button>
              <button
                type="button"
                className={`filter-btn ${statusFilter === 'RECUSADO' ? 'active' : ''}`}
                onClick={() => setStatusFilter('RECUSADO')}
              >
                Recusados
              </button>
            </div>
          </div>

          {/* Lista de Pedidos em Cards */}
          <div className="orders-grid">
            {filteredOrders.length === 0 ? (
              <div className="empty-state-card">
                <p>Nenhum pedido encontrado para o filtro selecionado.</p>
              </div>
            ) : (
              filteredOrders.map(order => {
                const isPending = order.status === 'PENDENTE_VALIDACAO';
                return (
                  <div key={order.id} className={`order-card ${isPending ? 'border-pending' : ''}`}>
                    <div className="order-card-header">
                      <div>
                        <div className="order-code">{order.id}</div>
                        <div className="order-date">{formatDate(order.createdAt)}</div>
                      </div>
                      <Badge
                        status={order.status}
                        text={order.stockResolution === 'awaiting_restock' ? 'Aguardando reposição' : undefined}
                      />
                    </div>

                    {/* Dados do Paciente */}
                    <div className="patient-box">
                      <div className="patient-name">👤 {order.patient?.name}</div>
                      <div className="patient-meta">
                        <span>CPF: {order.patient?.cpf}</span>
                        <span>• Cartão SUS: {order.patient?.susCard}</span>
                      </div>
                      <div className="patient-address">
                        📍 {order.patient?.address}, {order.patient?.neighborhood} (Indaiatuba)
                      </div>
                    </div>

                    {/* Medicamentos Solicitados */}
                    <div className="meds-list-box">
                      <div className="meds-list-title">Medicamentos Solicitados:</div>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="med-item-row">
                          <span className="med-item-name">• {item.name}</span>
                          <span className="med-item-qty">Qtd: {item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Justificativa caso recusado */}
                    {order.status === 'RECUSADO' && order.rejectionReason && (
                      <div className="rejection-box-alert">
                        <strong>Motivo da Recusa Informado:</strong>
                        <p>{order.rejectionReason}</p>
                      </div>
                    )}

                    {/* Miniatura da Receita e Botão de Ação */}
                    <div className="order-card-footer">
                      <div 
                        className="prescription-thumbnail"
                        onClick={() => openOrderReview(order)}
                        title="Clique para visualizar a receita completa"
                      >
                        <img src={order.prescriptionUrl} alt="Receita Médica" />
                        <span className="thumb-hover-overlay"><ZoomIn size={14} /> Ver Receita</span>
                      </div>

                      <button
                        type="button"
                        className="btn-evaluate"
                        onClick={() => openOrderReview(order)}
                      >
                        <Eye size={16} />
                        <span>{isPending ? 'Avaliar Receita' : 'Ver Detalhes'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 2: GESTÃO DE ESTOQUE MUNICIPAL */}
      {/* ============================================================== */}
      {activeTab === 'estoque' && (
        <div className="stock-section">
          {/* Header do Estoque */}
          <div className="stock-controls-bar">
            <div className="search-input-box">
              <Search size={18} color="#64748b" />
              <input
                type="text"
                placeholder="Buscar por medicamento, lote ou classe..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowNewMedModal(true)}
            >
              <Plus size={16} />
              <span>Cadastrar Medicamento</span>
            </button>
          </div>

          {/* Tabela de Estoque */}
          <div className="table-responsive-wrapper">
            <table className="custom-table mobile-stock-table">
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Forma Farmacêutica</th>
                  <th>Controle Sanitário</th>
                  <th>Lote / Validade</th>
                  <th>Estoque Atual</th>
                  <th>Status</th>
                  <th>Ações Rápidas</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map(med => {
                  const isLow = med.currentStock <= med.minStock;
                  return (
                    <tr key={med.id} className={isLow ? 'row-alert' : ''}>
                      <td>
                        <strong>{med.name}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{med.category}</div>
                      </td>
                      <td>{med.form}</td>
                      <td>
                        <span className="control-badge">{med.controlType}</span>
                      </td>
                      <td>
                        <div>{med.batch}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Val: {med.expiryDate}</div>
                      </td>
                      <td>
                        <div className="stock-quantity-number">
                          <strong>{med.currentStock}</strong> {med.unit}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Mínimo: {med.minStock}</div>
                      </td>
                      <td>
                        {isLow ? (
                          <span className="badge-low-stock">⚠️ Estoque Baixo</span>
                        ) : (
                          <span className="badge-normal-stock">✓ Regular</span>
                        )}
                      </td>
                      <td>
                        <StockAdjuster medId={med.id} onAdjust={adjustStockDelta} />
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
      {/* MODAL 1: AVALIAÇÃO TÉCNICA DA RECEITA */}
      {/* ============================================================== */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Auditoria da Receita • Pedido ${selectedOrder.id}` : ''}
        maxWidth="850px"
      >
        {selectedOrder && (
          <div className="prescription-modal-content">
            <div className="modal-two-columns">
              {/* Coluna da Imagem da Receita */}
              <div className="prescription-preview-side">
                <div className="prescription-frame">
                  <img
                    src={selectedOrder.prescriptionUrl}
                    alt="Receita Médica Prescrita"
                    className="full-prescription-img"
                  />
                </div>
                <div className="prescription-caption">
                  <span>📄 Imagem digitalizada anexada pelo paciente para validação do CRF.</span>
                </div>
              </div>

              {/* Coluna de Dados e Decisão */}
              <div className="prescription-data-side">
                <div className="section-title-sm">Dados do Paciente & SUS</div>
                <div className="data-info-card">
                  <div><strong>Nome:</strong> {selectedOrder.patient?.name}</div>
                  <div><strong>CPF:</strong> {selectedOrder.patient?.cpf}</div>
                  <div><strong>Cartão SUS:</strong> {selectedOrder.patient?.susCard}</div>
                  <div><strong>Endereço:</strong> {selectedOrder.patient?.address}, {selectedOrder.patient?.neighborhood} (Indaiatuba)</div>
                </div>

                <div className="section-title-sm" style={{ marginTop: '16px' }}>
                  Medicamentos identificados na receita:
                </div>
                <div className="pharmacist-medicine-picker">
                  <label className="form-label" htmlFor="pharmacist-medicine-search">Adicionar medicamento do estoque</label>
                  <input
                    id="pharmacist-medicine-search"
                    className="form-input"
                    value={medicineSearch}
                    onChange={event => setMedicineSearch(event.target.value)}
                    placeholder="Buscar medicamento..."
                  />
                  <div className="pharmacist-medicine-results">
                    {inventory
                      .filter(medicine => medicine.name.toLowerCase().includes(medicineSearch.toLowerCase()))
                      .map(medicine => {
                        const alreadyAdded = pharmacyDraftItems.some(item => item.medicineId === medicine.id);
                        return (
                          <div key={medicine.id} className="pharmacist-medicine-result">
                            <div>
                              <strong>{medicine.name}</strong>
                              <span>Saldo: {medicine.currentStock} {medicine.unit || 'unidades'}</span>
                            </div>
                            <button
                              type="button"
                              className="btn-add-medicine-to-order"
                              onClick={() => addMedicineToDraft(medicine)}
                              disabled={alreadyAdded}
                            >
                              <Plus size={14} />
                              {alreadyAdded ? 'Adicionado' : 'Adicionar'}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="section-title-sm" style={{ marginTop: '12px' }}>
                  Itens incluídos neste pedido:
                </div>
                <div className="data-info-card pharmacist-order-items">
                  {pharmacyDraftItems.length === 0 ? (
                    <span className="pharmacist-empty-order-items">Adicione os medicamentos identificados na receita para continuar.</span>
                  ) : pharmacyDraftItems.map((item, idx) => {
                    const stockItem = inventory.find(m => m.id === item.medicineId);
                    const hasStock = Boolean(stockItem && Number(stockItem.currentStock || 0) >= Number(item.quantity || 0));
                    const classification = stockAvailabilityByMedicineId[item.medicineId] || (hasStock ? 'available' : 'shortage');
                    return (
                      <div key={`${item.medicineId}-${idx}`} className="pharmacist-order-item-row">
                        <div className="pharmacist-order-item-details">
                          <strong>{item.name}</strong>
                          <label>
                            Quantidade
                            <input
                              type="number"
                              className="form-input pharmacist-item-quantity"
                              min="1"
                              value={item.quantity}
                              onChange={event => updateDraftItem(item.medicineId, 'quantity', event.target.value)}
                            />
                          </label>
                          <label>
                            Posologia da receita
                            <input
                              type="text"
                              className="form-input"
                              value={item.dosage || ''}
                              onChange={event => updateDraftItem(item.medicineId, 'dosage', event.target.value)}
                              placeholder="Informe conforme a receita"
                            />
                          </label>
                          <button
                            type="button"
                            className="btn-remove-order-medicine"
                            onClick={() => removeMedicineFromDraft(item.medicineId)}
                          >
                            Remover do pedido
                          </button>
                        </div>
                        <div className="medicine-stock-classifier">
                          <div className="medicine-stock-actions" role="group" aria-label={`Disponibilidade de ${item.name}`}>
                            <button
                              type="button"
                              className={`medicine-stock-choice available ${classification === 'available' ? 'selected' : ''}`}
                              aria-pressed={classification === 'available'}
                              disabled={!hasStock}
                              onClick={() => setStockAvailabilityByMedicineId(prev => ({ ...prev, [item.medicineId]: 'available' }))}
                            >
                              Disponível
                            </button>
                            <button
                              type="button"
                              className={`medicine-stock-choice shortage ${classification === 'shortage' ? 'selected' : ''}`}
                              aria-pressed={classification === 'shortage'}
                              onClick={() => setStockAvailabilityByMedicineId(prev => ({ ...prev, [item.medicineId]: 'shortage' }))}
                            >
                              Em falta
                            </button>
                          </div>
                          <span className="medicine-stock-quantity">
                            Saldo atual: {stockItem?.currentStock ?? 0}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Status Atual */}
                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Status Atual:</span>
                  <Badge
                    status={selectedOrder.status}
                    text={selectedOrder.stockResolution === 'awaiting_restock' ? 'Aguardando reposição' : undefined}
                  />
                </div>

                {selectedOrder.rejectionReason && (
                  <div className="rejection-box-alert" style={{ marginTop: '12px' }}>
                    <strong>Justificativa da Recusa:</strong>
                    <p>{selectedOrder.rejectionReason}</p>
                  </div>
                )}

                {/* Botões de Ação para pedidos pendentes */}
                {selectedOrder.status === 'PENDENTE_VALIDACAO' ? (
                  <div className="pharmacist-decision-actions">
                    <button
                      type="button"
                      className="btn-approve-action"
                      onClick={() => handleApprove(selectedOrder)}
                    >
                      <CheckCircle2 size={18} />
                      <span>Aprovar e encaminhar decisão ao cliente</span>
                    </button>

                    <button
                      type="button"
                      className="btn-reject-action"
                      onClick={() => setShowRejectModal(true)}
                    >
                      <XCircle size={18} />
                      <span>Recusar receita</span>
                    </button>
                  </div>
                ) : selectedOrder.stockResolution === 'waiting_customer_choice' ? (
                  <div className="data-info-card stock-decision-waiting">
                    <strong>Aguardando decisão do cliente</strong>
                    <span>As opções foram encaminhadas e a farmácia não deve escolher pelo paciente.</span>
                  </div>
                ) : selectedOrder.stockResolution === 'awaiting_restock' ? (
                  <div className="pharmacist-decision-actions">
                    <div className="data-info-card stock-decision-waiting">
                      <strong>Aguardando reposição do estoque</strong>
                      <span>
                        {selectedOrder.customerStockChoice === 'deliver_available_only'
                          ? 'O cliente decidiu manter o pedido original, sem criar outro para os itens faltantes.'
                          : 'O cliente escolheu receber os itens faltantes em um pedido complementar.'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-approve-action"
                      onClick={() => handleApprove(selectedOrder)}
                      disabled={!hasFullStock(selectedOrder.items)}
                    >
                      <CheckCircle2 size={18} />
                      <span>{hasFullStock(selectedOrder.items) ? 'Liberar pedido complementar' : 'Aguardando reposição do estoque'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="already-evaluated-notice">
                    <span>Pedido já processado por {selectedOrder.validatedBy || 'Farmacêutico'}.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 2: JUSTIFICATIVA OBRIGATÓRIA DE RECUSA */}
      {/* ============================================================== */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Justificativa Obrigatória de Recusa"
        maxWidth="500px"
      >
        <div className="reject-modal-box">
          <div className="reject-notice">
            <AlertTriangle size={24} color="#dc2626" />
            <div>
              <strong>Exigência Sanitária / Regulamentar</strong>
              <p>Conforme normas do SUS e do CRF, o paciente deve ser notificado do motivo técnico que impediu a dispensação.</p>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '14px' }}>
            <label className="form-label">Selecione ou digite a justificativa:</label>
            <div className="quick-reasons-list">
              <button
                type="button"
                className="btn-quick-reason"
                onClick={() => setRejectionReason('Receita médica vencida (validade superior ao limite legal de 30 dias). Necessário comparecer à UBS para nova avaliação.')}
              >
                📅 Receita Vencida
              </button>
              <button
                type="button"
                className="btn-quick-reason"
                onClick={() => setRejectionReason('Ausência de assinatura ou carimbo legível do médico com número do CRM.')}
              >
                ✍️ Falta Assinatura/CRM
              </button>
              <button
                type="button"
                className="btn-quick-reason"
                onClick={() => setRejectionReason('Medicamento não contemplado na Relação Municipal de Medicamentos Essenciais (REMUME Indaiatuba).')}
              >
                💊 Não consta na REMUME
              </button>
              <button
                type="button"
                className="btn-quick-reason"
                onClick={() => setRejectionReason('Dosagem ou posologia incompatível ou ilegível na prescrição.')}
              >
                🔍 Posologia Ilegível
              </button>
            </div>

            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Descreva detalhadamente o motivo para orientação do cidadão..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{ marginTop: '10px' }}
            />
          </div>

          <div className="modal-actions-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowRejectModal(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-confirm-reject"
              onClick={handleConfirmReject}
            >
              Confirmar Recusa e Notificar Paciente
            </button>
          </div>
        </div>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 3: CADASTRAR NOVO MEDICAMENTO */}
      {/* ============================================================== */}
      <Modal
        isOpen={showNewMedModal}
        onClose={() => setShowNewMedModal(false)}
        title="Cadastrar Medicamento no Estoque Municipal"
        maxWidth="550px"
      >
        <form onSubmit={handleCreateMed}>
          <div className="form-group">
            <label className="form-label">Nome do Princípio Ativo / Dosagem:</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Ex: Ciprofloxacino 500mg"
              value={newMedForm.name}
              onChange={(e) => setNewMedForm({ ...newMedForm, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Forma Farmacêutica:</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Comprimido"
                value={newMedForm.form}
                onChange={(e) => setNewMedForm({ ...newMedForm, form: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Categoria / Classe:</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Antibiótico"
                value={newMedForm.category}
                onChange={(e) => setNewMedForm({ ...newMedForm, category: e.target.value })}
              />
            </div>
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
              <label className="form-label">Estoque Mínimo de Alerta:</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={newMedForm.minStock}
                onChange={(e) => setNewMedForm({ ...newMedForm, minStock: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Lote Municipal:</label>
              <input
                type="text"
                className="form-input"
                value={newMedForm.batch}
                onChange={(e) => setNewMedForm({ ...newMedForm, batch: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Data de Validade:</label>
              <input
                type="date"
                className="form-input"
                value={newMedForm.expiryDate}
                onChange={(e) => setNewMedForm({ ...newMedForm, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-actions-footer">
            <button type="button" className="btn-secondary" onClick={() => setShowNewMedModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Salvar Medicamento
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Chat da Equipe */}
      <ChatModal
        isOpen={showChatWithEquipe}
        onClose={() => setShowChatWithEquipe(false)}
        initialContactId="user-motoboy"
      />
    </div>
  );
}
