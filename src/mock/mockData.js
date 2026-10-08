import { MOCK_MEDICINES } from './mockMedicines';
import { generatePrescriptionSvg, generateDeliveryProofSvg } from './mockPrescriptions';
import { MOCK_DRIVERS, INDAIATUBA_HUB } from './indaiatubaLocations';

export const USER_ROLES = {
  FARMACEUTICO: 'farmaceutico',
  ENTREGADOR: 'entregador',
  CLIENTE: 'cliente'
};

export const MOCK_USERS = [
  {
    id: 'user-farm',
    name: 'Dra. Camila Sampaio',
    role: USER_ROLES.FARMACEUTICO,
    crf: 'CRF-SP 48.912',
    email: 'farmacia@indaiatuba.sp.gov.br',
    unit: 'Farmácia Central Municipal de Indaiatuba',
    avatar: '👩‍⚕️'
  },
  {
    id: 'user-motoboy',
    name: 'Carlos Eduardo (Carlinhos)',
    role: USER_ROLES.ENTREGADOR,
    plate: 'IND-2026',
    email: 'entregas@indaiatuba.sp.gov.br',
    vehicle: 'Honda CG 160 Fan',
    driverId: 'drv-01',
    avatar: '🛵'
  },
  {
    id: 'user-cliente',
    name: 'Maria Aparecida Santos',
    role: USER_ROLES.CLIENTE,
    cpf: '123.456.789-00',
    susCard: '702 3456 7890 0012',
    phone: '(19) 99123-4567',
    email: 'maria.aparecida@email.com',
    address: 'Rua Martinho Lutero, 320',
    neighborhood: 'Jardim Morada do Sol',
    city: 'Indaiatuba',
    state: 'SP',
    avatar: '👵'
  }
];

export const ORDER_STATUS = {
  PENDENTE_VALIDACAO: 'PENDENTE_VALIDACAO',
  PENDENTE_ESTOQUE: 'PENDENTE_ESTOQUE',
  APROVADO: 'APROVADO',
  PRONTO_ENTREGA: 'PRONTO_ENTREGA',
  EM_TRANSITO: 'EM_TRANSITO',
  ENTREGUE: 'ENTREGUE',
  RECUSADO: 'RECUSADO',
  CANCELADO_ENTREGADOR: 'CANCELADO_ENTREGADOR',
  CANCELADO_CLIENTE: 'CANCELADO_CLIENTE'
};

export const DRIVER_CANCELLATION_REASONS = [
  'Acidente durante trajeto',
  'Perda do medicamento',
  'Ausência na entrega',
  'Cancelamento por parte do cliente'
];

export const INITIAL_ORDERS = [
  {
    id: 'PED-2026-001',
    createdAt: '2026-10-07T08:15:00',
    patient: {
      id: 'user-cliente',
      name: 'Maria Aparecida Santos',
      cpf: '123.456.789-00',
      susCard: '702 3456 7890 0012',
      phone: '(19) 99123-4567',
      address: 'Rua Martinho Lutero, 320',
      neighborhood: 'Jardim Morada do Sol',
      city: 'Indaiatuba',
      state: 'SP',
      coordinates: [-23.1145, -47.2340]
    },
    items: [
      {
        medicineId: 'med-002',
        name: 'Losartana Potássica 50mg',
        quantity: 60,
        dosage: '1 comprimido a cada 12 horas'
      },
      {
        medicineId: 'med-003',
        name: 'Metformina Cloridrato 850mg',
        quantity: 60,
        dosage: '1 comprimido após o almoço e 1 após o jantar'
      }
    ],
    prescriptionUrl: generatePrescriptionSvg({
      patientName: 'Maria Aparecida Santos',
      susCard: '702 3456 7890 0012',
      date: '02/10/2026',
      items: [
        'Losartana Potássica 50mg - 60 comprimidos',
        'Metformina Cloridrato 850mg - 60 comprimidos'
      ]
    }),
    status: ORDER_STATUS.EM_TRANSITO,
    assignedDriverId: 'drv-01',
    assignedDriverName: 'Carlos Eduardo (Carlinhos)',
    validatedBy: 'Dra. Camila Sampaio (CRF-SP 48.912)',
    validatedAt: '2026-10-07T08:30:00',
    rejectionReason: null,
    deliveryProofPhoto: null,
    history: [
      { status: ORDER_STATUS.PENDENTE_VALIDACAO, time: '2026-10-07T08:15:00', note: 'Pedido solicitado pelo cidadão' },
      { status: ORDER_STATUS.APROVADO, time: '2026-10-07T08:30:00', note: 'Receita médica validada pela farmacêutica' },
      { status: ORDER_STATUS.EM_TRANSITO, time: '2026-10-07T09:00:00', note: 'Motoboy retirou os medicamentos e iniciou a entrega' }
    ]
  },
  {
    id: 'PED-2026-002',
    createdAt: '2026-10-07T08:45:00',
    patient: {
      id: 'user-cliente-2',
      name: 'João Pedro de Alencar',
      cpf: '321.654.987-11',
      susCard: '805 1122 3344 5566',
      phone: '(19) 99765-8899',
      address: 'Rua Pedro de Toledo, 450',
      neighborhood: 'Jardim Pau Preto',
      city: 'Indaiatuba',
      state: 'SP',
      coordinates: [-23.0845, -47.2150]
    },
    items: [
      {
        medicineId: 'med-001',
        name: 'Amoxicilina 500mg',
        quantity: 21,
        dosage: '1 cápsula a cada 8 horas por 7 dias'
      }
    ],
    prescriptionUrl: generatePrescriptionSvg({
      patientName: 'João Pedro de Alencar',
      susCard: '805 1122 3344 5566',
      date: '06/10/2026',
      items: ['Amoxicilina 500mg (21 cápsulas) - Tomar 1 cp de 8 em 8h']
    }),
    status: ORDER_STATUS.PENDENTE_VALIDACAO,
    assignedDriverId: null,
    assignedDriverName: null,
    validatedBy: null,
    validatedAt: null,
    rejectionReason: null,
    deliveryProofPhoto: null,
    history: [
      { status: ORDER_STATUS.PENDENTE_VALIDACAO, time: '2026-10-07T08:45:00', note: 'Aguardando validação da receita pelo Farmacêutico' }
    ]
  },
  {
    id: 'PED-2026-003',
    createdAt: '2026-10-07T07:20:00',
    patient: {
      id: 'user-cliente-3',
      name: 'Clara Silveira Ramos',
      cpf: '456.789.123-44',
      susCard: '789 4433 2211 0099',
      phone: '(19) 99654-1122',
      address: 'Rua Tuiuti, 550',
      neighborhood: 'Cidade Nova',
      city: 'Indaiatuba',
      state: 'SP',
      coordinates: [-23.0925, -47.2080]
    },
    items: [
      {
        medicineId: 'med-008',
        name: 'Insulina Humana NPH 100 UI/mL',
        quantity: 2,
        dosage: '25 UI pela manhã e 15 UI ao deitar'
      }
    ],
    prescriptionUrl: generatePrescriptionSvg({
      patientName: 'Clara Silveira Ramos',
      susCard: '789 4433 2211 0099',
      date: '04/10/2026',
      items: ['Insulina Humana NPH 100 UI/mL - 2 frascos']
    }),
    status: ORDER_STATUS.PRONTO_ENTREGA,
    assignedDriverId: 'drv-01',
    assignedDriverName: 'Carlos Eduardo (Carlinhos)',
    validatedBy: 'Dra. Camila Sampaio (CRF-SP 48.912)',
    validatedAt: '2026-10-07T07:50:00',
    rejectionReason: null,
    deliveryProofPhoto: null,
    history: [
      { status: ORDER_STATUS.PENDENTE_VALIDACAO, time: '2026-10-07T07:20:00', note: 'Solicitação registrada' },
      { status: ORDER_STATUS.APROVADO, time: '2026-10-07T07:50:00', note: 'Receita conferida e aprovada' },
      { status: ORDER_STATUS.PRONTO_ENTREGA, time: '2026-10-07T08:10:00', note: 'Medicamento em caixa térmica pronto para coleta do motoboy' }
    ]
  },
  {
    id: 'PED-2026-004',
    createdAt: '2026-10-06T14:10:00',
    patient: {
      id: 'user-cliente-4',
      name: 'Antonio Carlos Barreto',
      cpf: '789.123.456-88',
      susCard: '901 3322 1100 7788',
      phone: '(19) 99444-2233',
      address: 'Alameda das Nações, 110',
      neighborhood: 'Jardim Europa',
      city: 'Indaiatuba',
      state: 'SP',
      coordinates: [-23.0760, -47.2050]
    },
    items: [
      {
        medicineId: 'med-007',
        name: 'Sertralina Cloridrato 50mg',
        quantity: 30,
        dosage: '1 comprimido pela manhã'
      }
    ],
    prescriptionUrl: generatePrescriptionSvg({
      patientName: 'Antonio Carlos Barreto',
      susCard: '901 3322 1100 7788',
      date: '01/08/2026', // Data vencida intencionalmente
      items: ['Sertralina Cloridrato 50mg - 30 comprimidos']
    }),
    status: ORDER_STATUS.RECUSADO,
    assignedDriverId: null,
    assignedDriverName: null,
    validatedBy: 'Dra. Camila Sampaio (CRF-SP 48.912)',
    validatedAt: '2026-10-06T14:35:00',
    rejectionReason: 'Receita médica vencida (emitida em 01/08/2026 - validade máxima de 30 dias para medicamentos de controle especial C1 conforme Portaria 344/98). Por favor, consulte sua UBS para revalidação.',
    deliveryProofPhoto: null,
    history: [
      { status: ORDER_STATUS.PENDENTE_VALIDACAO, time: '2026-10-06T14:10:00', note: 'Solicitação registrada' },
      { status: ORDER_STATUS.RECUSADO, time: '2026-10-06T14:35:00', note: 'Recusado pelo farmacêutico: Receita vencida' }
    ]
  },
  {
    id: 'PED-2026-005',
    createdAt: '2026-10-06T10:00:00',
    patient: {
      id: 'user-cliente',
      name: 'Maria Aparecida Santos',
      cpf: '123.456.789-00',
      susCard: '702 3456 7890 0012',
      phone: '(19) 99123-4567',
      address: 'Rua Martinho Lutero, 320',
      neighborhood: 'Jardim Morada do Sol',
      city: 'Indaiatuba',
      state: 'SP',
      coordinates: [-23.1145, -47.2340]
    },
    items: [
      {
        medicineId: 'med-004',
        name: 'Dipirona Monoidratada 500mg/mL',
        quantity: 1,
        dosage: '35 gotas se dor ou febre'
      },
      {
        medicineId: 'med-006',
        name: 'Omeprazol 20mg',
        quantity: 30,
        dosage: '1 cápsula em jejum'
      }
    ],
    prescriptionUrl: generatePrescriptionSvg({
      patientName: 'Maria Aparecida Santos',
      susCard: '702 3456 7890 0012',
      date: '01/10/2026',
      items: ['Dipirona 500mg/mL gotas', 'Omeprazol 20mg - 30 cps']
    }),
    status: ORDER_STATUS.ENTREGUE,
    assignedDriverId: 'drv-01',
    assignedDriverName: 'Carlos Eduardo (Carlinhos)',
    validatedBy: 'Dra. Camila Sampaio (CRF-SP 48.912)',
    validatedAt: '2026-10-06T10:40:00',
    rejectionReason: null,
    deliveryProofPhoto: generateDeliveryProofSvg({
      orderId: 'PED-2026-005',
      recipientName: 'Maria Aparecida Santos',
      timestamp: '06/10/2026 às 15:20',
      driverName: 'Carlos Eduardo (Carlinhos)'
    }),
    history: [
      { status: ORDER_STATUS.PENDENTE_VALIDACAO, time: '2026-10-06T10:00:00', note: 'Solicitação registrada' },
      { status: ORDER_STATUS.APROVADO, time: '2026-10-06T10:40:00', note: 'Receita aprovada pelo farmacêutico' },
      { status: ORDER_STATUS.EM_TRANSITO, time: '2026-10-06T14:15:00', note: 'Saiu para entrega' },
      { status: ORDER_STATUS.ENTREGUE, time: '2026-10-06T15:20:00', note: 'Entregue com sucesso - Receita física recolhida' }
    ]
  }
];

export const INITIAL_CHAT_MESSAGES = [
  {
    id: 'msg-001',
    fromUserId: 'user-farm',
    fromUserName: 'Dra. Camila Sampaio',
    fromUserRole: USER_ROLES.FARMACEUTICO,
    toUserId: 'user-motoboy',
    toUserName: 'Carlos Eduardo (Carlinhos)',
    text: 'Carlos, priorize o pedido PED-2026-001 no Jardim Morada do Sol antes do almoço.',
    timestamp: '2026-10-07T08:20:00',
    read: true
  },
  {
    id: 'msg-002',
    fromUserId: 'user-farm',
    fromUserName: 'Dra. Camila Sampaio',
    fromUserRole: USER_ROLES.FARMACEUTICO,
    toUserId: 'user-cliente',
    toUserName: 'Maria Aparecida Santos',
    text: 'Olá Sra. Maria! A equipe da farmácia municipal já conferiu sua receita e o pedido segue em processo de entrega.',
    timestamp: '2026-10-07T08:25:00',
    read: false
  },
  {
    id: 'msg-003',
    fromUserId: 'user-motoboy',
    fromUserName: 'Carlos Eduardo (Carlinhos)',
    fromUserRole: USER_ROLES.ENTREGADOR,
    toUserId: 'user-farm',
    toUserName: 'Dra. Camila Sampaio',
    text: 'Farmácia, já estamos saindo com o pedido e vou confirmar o código de entrega ao paciente.',
    timestamp: '2026-10-07T08:28:00',
    read: true
  },
  {
    id: 'msg-004',
    fromUserId: 'user-motoboy',
    fromUserName: 'Carlos Eduardo (Carlinhos)',
    fromUserRole: USER_ROLES.ENTREGADOR,
    toUserId: 'user-cliente',
    toUserName: 'Maria Aparecida Santos',
    orderId: 'PED-2026-001',
    text: 'Bom dia Sra. Maria! Sou o motoboy do SUS. Seus medicamentos já estão comigo e estou a caminho da Rua Martinho Lutero!',
    timestamp: '2026-10-07T09:05:00',
    read: false
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-001',
    userId: 'user-cliente',
    title: '🛵 Entregador Próximo ao Endereço!',
    message: 'O motoboy Carlos Eduardo está a menos de 500 metros da sua residência. Por favor, prepare a receita médica física e seu documento com foto para conferência!',
    type: 'proximity',
    orderId: 'PED-2026-001',
    timestamp: '2026-10-07T09:15:00',
    read: false
  },
  {
    id: 'notif-002',
    userId: 'user-farm',
    title: 'Novo Pedido Aguardando Conferência',
    message: 'O pedido PED-2026-002 (Amoxicilina) de João Pedro de Alencar necessita de validação técnica da receita médica.',
    type: 'order',
    orderId: 'PED-2026-002',
    timestamp: '2026-10-07T08:45:00',
    read: false
  },
  {
    id: 'notif-003',
    userId: 'user-farm',
    title: 'Alerta de Estoque Baixo',
    message: 'Sertralina Cloridrato 50mg atingiu nível crítico (28 unidades restantes).',
    type: 'stock',
    timestamp: '2026-10-07T08:00:00',
    read: true
  }
];
