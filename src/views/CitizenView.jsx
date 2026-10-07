import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { formatDate } from '../utils/formatters';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import LeafletMap from '../components/LeafletMap';
import ChatModal from '../components/ChatModal';
import { generatePrescriptionSvg } from '../mock/mockPrescriptions';
import { INDAIATUBA_NEIGHBORHOODS, getCoordinatesForNeighborhood } from '../mock/indaiatubaLocations';
import { 
  PlusCircle, FileUp, Clock, CheckCircle2, 
  AlertCircle, Edit2, Trash2, Camera, Navigation, 
  Sparkles, Eye, MessageSquare, Bell 
} from 'lucide-react';

export default function CitizenView() {
  const { currentUser } = useAuth();
  const { orders, inventory, hub, drivers, chatMessages, createOrder, updateOrder } = useAppData();

  const [activeTab, setActiveTab] = useState('pedidos'); // 'pedidos' | 'novo' | 'rastreio'
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingPrescription, setViewingPrescription] = useState(null);
  const [chatTarget, setChatTarget] = useState(null);

  // Form states para Novo Pedido
  const [selectedMeds, setSelectedMeds] = useState([
    { medicineId: 'med-002', name: 'Losartana Potássica 50mg', quantity: 30, dosage: '1 comprimido pela manhã' }
  ]);
  const [currentMedSelect, setCurrentMedSelect] = useState(inventory[0]?.id || '');
  const [currentMedQty, setCurrentMedQty] = useState(30);
  const [currentMedDosage, setCurrentMedDosage] = useState('Uso contínuo conforme receita médica');
  
  const [patientAddress, setPatientAddress] = useState(currentUser.address || 'Rua Martinho Lutero, 320');
  const [patientNeighborhood, setPatientNeighborhood] = useState(currentUser.neighborhood || 'Jardim Morada do Sol');
  const [patientPhone, setPatientPhone] = useState(currentUser.phone || '(19) 99123-4567');
  const [prescriptionImage, setPrescriptionImage] = useState(null);
  const [formError, setFormError] = useState('');

  // Meus pedidos (do usuário logado)
  const myOrders = orders.filter(o => 
    o.patient?.id === currentUser.id || 
    o.patient?.cpf === currentUser.cpf ||
    o.patient?.name === currentUser.name
  );

  // Adicionar medicamento à lista do pedido
  const handleAddMedToOrder = () => {
    const medObj = inventory.find(m => m.id === currentMedSelect);
    if (!medObj) return;

    if (selectedMeds.some(m => m.medicineId === medObj.id)) {
      alert('Este medicamento já foi adicionado à lista. Você pode ajustar a quantidade.');
      return;
    }

    setSelectedMeds(prev => [
      ...prev,
      {
        medicineId: medObj.id,
        name: medObj.name,
        quantity: Number(currentMedQty),
        dosage: currentMedDosage
      }
    ]);
  };

  const handleRemoveMedFromOrder = (idx) => {
    setSelectedMeds(prev => prev.filter((_, i) => i !== idx));
  };

  // Upload da foto da receita
  const handlePrescriptionUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrescriptionImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Simular receita com carimbo da UBS Morada do Sol para facilidade acadêmica
  const handleSimulatePrescription = () => {
    const medNames = selectedMeds.map(m => `${m.name} (${m.quantity} un)`);
    const mockSvg = generatePrescriptionSvg({
      patientName: currentUser.name,
      susCard: currentUser.susCard || '702 3456 7890 0012',
      date: new Date().toLocaleDateString('pt-BR'),
      items: medNames.length > 0 ? medNames : ['Losartana 50mg', 'Metformina 850mg'],
      unit: `UBS Indaiatuba - ${patientNeighborhood}`
    });
    setPrescriptionImage(mockSvg);
  };

  // Enviar Novo Pedido
  const handleSubmitNewOrder = (e) => {
    e.preventDefault();
    if (selectedMeds.length === 0) {
      setFormError('Selecione pelo menos um medicamento da lista municipal.');
      return;
    }
    if (!prescriptionImage) {
      setFormError('É obrigatório anexar a foto da receita médica assinada pelo médico.');
      return;
    }

    const coords = getCoordinatesForNeighborhood(patientNeighborhood);
    const newOrder = createOrder({
      patient: {
        id: currentUser.id,
        name: currentUser.name,
        cpf: currentUser.cpf || '123.456.789-00',
        susCard: currentUser.susCard || '702 3456 7890 0012',
        phone: patientPhone,
        address: patientAddress,
        neighborhood: patientNeighborhood,
        city: 'Indaiatuba',
        state: 'SP',
        coordinates: coords
      },
      items: selectedMeds,
      prescriptionUrl: prescriptionImage
    });

    setFormError('');
    setSelectedMeds([]);
    setPrescriptionImage(null);
    setActiveTab('pedidos');
    setSelectedTrackingOrder(newOrder);
    alert(`Pedido ${newOrder.id} enviado com sucesso! Agora o farmacêutico irá avaliar a receita.`);
  };

  // Salvar Edição de Pedido Existente
  const handleSaveOrderEdit = (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    updateOrder(editingOrder.id, {
      items: editingOrder.items,
      patient: {
        ...editingOrder.patient,
        address: editingOrder.patient.address,
        neighborhood: editingOrder.patient.neighborhood
      }
    });
    setEditingOrder(null);
    alert('Pedido atualizado com sucesso no sistema!');
  };

  // Pedido ativo para rastreio
  const trackingOrder = selectedTrackingOrder || myOrders.find(o => ['EM_TRANSITO', 'PRONTO_ENTREGA'].includes(o.status)) || myOrders[0];

  return (
    <div className="view-container">
      {/* Header do Cidadão */}
      <div className="view-header-card">
        <div className="header-info-group">
          <div className="header-icon-box" style={{ background: '#d1fae5', color: '#059669' }}>
            👵
          </div>
          <div>
            <h1 className="header-title">Portal do Cidadão • Remédios em Casa</h1>
            <p className="header-subtitle">
              Solicitação e acompanhamento de medicamentos receitados • SUS Indaiatuba/SP
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
            <Clock size={18} />
            <span>Meus Pedidos</span>
            <span className="tab-pill-badge">{myOrders.length}</span>
          </button>

          <button
            type="button"
            className={`view-tab-btn ${activeTab === 'novo' ? 'active' : ''}`}
            onClick={() => setActiveTab('novo')}
          >
            <PlusCircle size={18} />
            <span>Fazer Novo Pedido</span>
          </button>

          <button
            type="button"
            className={`view-tab-btn ${activeTab === 'rastreio' ? 'active' : ''}`}
            onClick={() => setActiveTab('rastreio')}
          >
            <Navigation size={18} />
            <span>Rastrear Entrega</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ABA 1: MEUS PEDIDOS & STATUS */}
      {/* ============================================================== */}
      {activeTab === 'pedidos' && (
        <div className="citizen-orders-section">
          {myOrders.length === 0 ? (
            <div className="empty-state-card">
              <p>Você ainda não possui nenhum pedido cadastrado.</p>
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: '12px' }}
                onClick={() => setActiveTab('novo')}
              >
                Solicitar Meu Primeiro Medicamento
              </button>
            </div>
          ) : (
            <div className="orders-grid">
              {myOrders.map(order => {
                const canEdit = order.status === 'PENDENTE_VALIDACAO';
                const isRejected = order.status === 'RECUSADO';
                const isCancelled = order.status === 'CANCELADO_ENTREGADOR';
                const gestorInitiated = chatMessages.some(m => 
                  m.fromUserRole === 'gerente' && 
                  (m.toUserId === currentUser.id || m.toUserName === currentUser.name)
                );

                return (
                  <div key={order.id} className="order-card">
                    <div className="order-card-header">
                      <div>
                        <div className="order-code">{order.id}</div>
                        <div className="order-date">{formatDate(order.createdAt)}</div>
                      </div>
                      <Badge status={order.status} />
                    </div>

                    {/* ALERTA DE PROXIMIDADE (PEDIDO PERTO DE SER ENTREGUE) */}
                    {(order.isProximityAlert || order.status === 'EM_TRANSITO') && (
                      <div className="citizen-proximity-live-alert">
                        <div className="proximity-alert-icon">🛵</div>
                        <div className="proximity-alert-body">
                          <strong>Atenção: Seu pedido está chegando!</strong>
                          <p>O entregador {order.assignedDriverName || 'Carlos Eduardo'} está nas proximidades do seu endereço ({order.patient?.neighborhood}). Deixe a <b>receita física</b> e seu <b>documento com foto</b> em mãos para receber!</p>
                        </div>
                      </div>
                    )}

                    {/* Alerta de Cancelamento pelo Motoboy */}
                    {isCancelled && (
                      <div className="rejection-box-alert">
                        <strong>⚠️ Entrega Não Concluída pelo Motoboy: {order.cancellationReason}</strong>
                        <p>{order.cancellationDetails || 'Houve um imprevisto na rota. Entre em contato com a Central SUS para reagendamento da entrega.'}</p>
                      </div>
                    )}

                    {/* Alerta de Recusa com Motivo do Farmacêutico */}
                    {isRejected && (
                      <div className="rejection-box-alert">
                        <strong>Motivo informado pela Farmácia Municipal:</strong>
                        <p>{order.rejectionReason || 'Receita não aprovada pela equipe farmacêutica.'}</p>
                      </div>
                    )}

                    {/* Timeline de Progresso do Pedido */}
                    <div className="order-step-progress">
                      <div className={`step-circle ${order.status ? 'done' : ''}`} title="Pedido Feito">1</div>
                      <div className={`step-line ${['APROVADO', 'PRONTO_ENTREGA', 'EM_TRANSITO', 'ENTREGUE'].includes(order.status) ? 'done' : ''}`} />
                      <div className={`step-circle ${['APROVADO', 'PRONTO_ENTREGA', 'EM_TRANSITO', 'ENTREGUE'].includes(order.status) ? 'done' : ''}`} title="Receita Validada">2</div>
                      <div className={`step-line ${['PRONTO_ENTREGA', 'EM_TRANSITO', 'ENTREGUE'].includes(order.status) ? 'done' : ''}`} />
                      <div className={`step-circle ${['PRONTO_ENTREGA', 'EM_TRANSITO', 'ENTREGUE'].includes(order.status) ? 'done' : ''}`} title="Em Separação">3</div>
                      <div className={`step-line ${['EM_TRANSITO', 'ENTREGUE'].includes(order.status) ? 'done' : ''}`} />
                      <div className={`step-circle ${['EM_TRANSITO', 'ENTREGUE'].includes(order.status) ? 'done' : ''}`} title="Em Rota">4</div>
                      <div className={`step-line ${order.status === 'ENTREGUE' ? 'done' : ''}`} />
                      <div className={`step-circle ${order.status === 'ENTREGUE' ? 'done' : ''}`} title="Entregue">5</div>
                    </div>

                    {/* Medicamentos do Pedido */}
                    <div className="meds-list-box">
                      <div className="meds-list-title">Itens do Pedido:</div>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="med-item-row">
                          <span className="med-item-name">• {item.name}</span>
                          <span className="med-item-qty">Qtd: {item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Endereço de Entrega */}
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>
                      📍 <b>Entrega em:</b> {order.patient?.address}, {order.patient?.neighborhood} (Indaiatuba)
                    </div>

                    {/* Botões de Ação do Paciente */}
                    <div className="citizen-card-footer">
                      <button
                        type="button"
                        className="btn-view-prescription-link"
                        onClick={() => setViewingPrescription(order.prescriptionUrl)}
                      >
                        <Eye size={15} />
                        <span>Ver Receita</span>
                      </button>

                      {order.assignedDriverName && (
                        <button
                          type="button"
                          className="btn-chat-patient-pill"
                          onClick={() => setChatTarget({ contactId: order.assignedDriverId || 'user-motoboy', orderId: order.id })}
                          title="Enviar mensagem para o motoboy do seu pedido"
                        >
                          <MessageSquare size={14} />
                          <span>Falar c/ Motoboy</span>
                        </button>
                      )}

                      {gestorInitiated && (
                        <button
                          type="button"
                          className="btn-chat-patient-pill"
                          onClick={() => setChatTarget({ contactId: 'user-gerente' })}
                          title="Conversar com a Gestão Municipal do SUS"
                        >
                          <MessageSquare size={14} />
                          <span>Falar c/ Gestor</span>
                        </button>
                      )}

                      {canEdit && (
                        <button
                          type="button"
                          className="btn-edit-order"
                          onClick={() => setEditingOrder({ ...order })}
                          title="Permitido alterar enquanto a farmácia não validar"
                        >
                          <Edit2 size={15} />
                          <span>Alterar Pedido</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-track-order"
                        onClick={() => {
                          setSelectedTrackingOrder(order);
                          setActiveTab('rastreio');
                        }}
                      >
                        <Navigation size={15} />
                        <span>Rastrear no Mapa</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 2: NOVO PEDIDO DE MEDICAMENTO */}
      {/* ============================================================== */}
      {activeTab === 'novo' && (
        <div className="new-order-section">
          <form onSubmit={handleSubmitNewOrder} className="new-order-form-grid">
            {formError && (
              <div className="login-error-alert" style={{ gridColumn: '1 / -1' }}>
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            {/* Coluna 1: Medicamentos Desejados */}
            <div className="form-column-box">
              <div className="box-title">
                <span>1. Selecionar Medicamentos Prescritos</span>
              </div>
              <p className="box-desc">
                Selecione os medicamentos receitados disponíveis no catálogo municipal (REMUME Indaiatuba):
              </p>

              <div className="add-med-widget">
                <div className="form-group">
                  <label className="form-label">Medicamento da Relação Municipal:</label>
                  <select
                    className="form-input"
                    value={currentMedSelect}
                    onChange={(e) => setCurrentMedSelect(e.target.value)}
                  >
                    {inventory.map(med => (
                      <option key={med.id} value={med.id}>
                        {med.name} ({med.form}) - {med.category}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                  <div className="form-group">
                    <label className="form-label">Quantidade:</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={currentMedQty}
                      onChange={(e) => setCurrentMedQty(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Posologia indicada pelo médico:</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: 1 cp a cada 12h"
                      value={currentMedDosage}
                      onChange={(e) => setCurrentMedDosage(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-add-item-list"
                  onClick={handleAddMedToOrder}
                >
                  <PlusCircle size={16} />
                  <span>Adicionar Medicamento à Lista</span>
                </button>
              </div>

              {/* Lista dos remédios adicionados */}
              <div className="selected-meds-basket">
                <strong>Medicamentos no seu pedido ({selectedMeds.length}):</strong>
                {selectedMeds.length === 0 ? (
                  <div className="empty-basket-note">Nenhum medicamento adicionado ainda.</div>
                ) : (
                  selectedMeds.map((m, idx) => (
                    <div key={idx} className="basket-item-row">
                      <div>
                        <strong>{m.name}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Qtd: {m.quantity} • {m.dosage}</div>
                      </div>
                      <button
                        type="button"
                        className="btn-remove-basket"
                        onClick={() => handleRemoveMedFromOrder(idx)}
                        title="Remover"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Coluna 2: Anexar Receita & Endereço de Entrega */}
            <div className="form-column-box">
              <div className="box-title">
                <span>2. Anexar Receita Médica Assinada</span>
              </div>
              <p className="box-desc">
                É obrigatório enviar uma foto legível da receita expedida pelo médico (com carimbo e CRM):
              </p>

              <div className="prescription-upload-box">
                {prescriptionImage ? (
                  <div className="prescription-uploaded-preview">
                    <img src={prescriptionImage} alt="Receita Anexada" />
                    <button
                      type="button"
                      className="btn-retake-photo"
                      onClick={() => setPrescriptionImage(null)}
                    >
                      Trocar Imagem
                    </button>
                  </div>
                ) : (
                  <div className="prescription-drop-area">
                    <Camera size={36} color="#0284c7" />
                    <p>Tire uma foto ou envie a imagem da receita</p>
                    <div className="upload-buttons-group">
                      <label className="btn-file-picker">
                        <FileUp size={16} />
                        <span>Selecionar Arquivo / Câmera</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handlePrescriptionUpload}
                        />
                      </label>

                      <button
                        type="button"
                        className="btn-simulate-photo"
                        onClick={handleSimulatePrescription}
                      >
                        <Sparkles size={16} />
                        <span>Simular Receita Médica SUS</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Endereço em Indaiatuba */}
              <div className="box-title" style={{ marginTop: '20px' }}>
                <span>3. Endereço de Entrega em Indaiatuba</span>
              </div>

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label">Bairro de Indaiatuba:</label>
                <select
                  className="form-input"
                  value={patientNeighborhood}
                  onChange={(e) => setPatientNeighborhood(e.target.value)}
                >
                  {INDAIATUBA_NEIGHBORHOODS.map(nh => (
                    <option key={nh} value={nh}>{nh}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Rua, Número e Complemento:</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefone para Contato / WhatsApp:</label>
                <input
                  type="text"
                  className="form-input"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-submit-order"
              >
                <CheckCircle2 size={18} />
                <span>Confirmar e Enviar Pedido para Validação</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 3: RASTREIO NO MAPA DE INDAIATUBA */}
      {/* ============================================================== */}
      {activeTab === 'rastreio' && (
        <div className="citizen-tracking-section">
          {trackingOrder ? (
            <div>
              <div className="tracking-summary-card">
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>Rastreamento do Pedido: {trackingOrder.id}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                    Destino: {trackingOrder.patient?.address}, {trackingOrder.patient?.neighborhood} (Indaiatuba/SP)
                  </p>
                </div>
                <Badge status={trackingOrder.status} />
              </div>

              {/* Mapa com a rota específica do pedido */}
              <div className="map-wrapper" style={{ marginTop: '16px' }}>
                <LeafletMap
                  drivers={drivers}
                  orders={[trackingOrder]}
                  hub={hub}
                  singleOrder={trackingOrder}
                  height="480px"
                />
              </div>

              <div className="map-route-legend" style={{ marginTop: '12px' }}>
                <div className="legend-item">
                  <span className="legend-icon" style={{ background: '#0284c7' }}>🏥</span>
                  <span>Farmácia Central de Indaiatuba (Origem)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-icon" style={{ background: '#ea580c' }}>🛵</span>
                  <span>Entregador em Deslocamento ({trackingOrder.assignedDriverName || 'Motoboy Designado'})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-icon" style={{ background: '#10b981' }}>🏠</span>
                  <span>Sua Residência ({currentUser.name})</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state-card">
              <p>Nenhum pedido ativo para rastrear.</p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDITAR PEDIDO PENDENTE */}
      {/* ============================================================== */}
      <Modal
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        title={editingOrder ? `Alterar Pedido • ${editingOrder.id}` : ''}
        maxWidth="500px"
      >
        {editingOrder && (
          <form onSubmit={handleSaveOrderEdit}>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: 0 }}>
              Você pode alterar os detalhes do seu pedido enquanto ele aguarda a conferência do farmacêutico.
            </p>

            <div className="form-group">
              <label className="form-label">Endereço de Entrega:</label>
              <input
                type="text"
                className="form-input"
                value={editingOrder.patient?.address || ''}
                onChange={(e) => setEditingOrder({
                  ...editingOrder,
                  patient: { ...editingOrder.patient, address: e.target.value }
                })}
              />
            </div>

            <div className="section-title-sm" style={{ marginTop: '12px' }}>
              Medicamentos Solicitados:
            </div>
            {editingOrder.items.map((it, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ flex: 1, fontSize: '13px' }}>{it.name}</span>
                <input
                  type="number"
                  min="1"
                  style={{ width: '80px' }}
                  className="form-input"
                  value={it.quantity}
                  onChange={(e) => {
                    const newItems = [...editingOrder.items];
                    newItems[idx].quantity = Number(e.target.value);
                    setEditingOrder({ ...editingOrder, items: newItems });
                  }}
                />
              </div>
            ))}

            <div className="modal-actions-footer">
              <button type="button" className="btn-secondary" onClick={() => setEditingOrder(null)}>
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
      {/* MODAL: VER RECEITA ANEXADA */}
      {/* ============================================================== */}
      <Modal
        isOpen={!!viewingPrescription}
        onClose={() => setViewingPrescription(null)}
        title="Receita Médica Anexada"
        maxWidth="600px"
      >
        {viewingPrescription && (
          <div style={{ textAlign: 'center' }}>
            <img
              src={viewingPrescription}
              alt="Receita Médica"
              style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }}
            />
          </div>
        )}
      </Modal>

      {/* Modal de Chat Integrado do Cidadão */}
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
