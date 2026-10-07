// Pontos geográficos de referência em Indaiatuba - SP
export const INDAIATUBA_HUB = {
  id: 'hub-central',
  name: 'Farmácia Municipal Central de Indaiatuba',
  address: 'Av. Eng. Fábio Roberto Barnabé, 2800 - Marginal Direita, Indaiatuba - SP',
  coordinates: [-23.0885, -47.2185],
  type: 'pharmacy'
};

export const INDAIATUBA_NEIGHBORHOODS = [
  'Jardim Morada do Sol',
  'Jardim Pau Preto',
  'Cidade Nova',
  'Itaici',
  'Parque Ecológico',
  'Jardim Europa',
  'Jardim Cecap',
  'Centro Histórico',
  'Jardim Tropical',
  'Recreio Campestre Viracopos'
];

export const MOCK_DRIVERS = [
  {
    id: 'drv-01',
    name: 'Carlos Eduardo (Carlinhos)',
    phone: '(19) 99876-1234',
    plate: 'IND-2026',
    vehicle: 'Honda CG 160 Fan - Vermelha',
    currentLocation: [-23.0950, -47.2210],
    status: 'Em Entrega',
    battery: 88,
    activeOrderIds: ['PED-2026-001', 'PED-2026-003']
  },
  {
    id: 'drv-02',
    name: 'Lucas Ferreira',
    phone: '(19) 98765-4321',
    plate: 'SP-9988X',
    vehicle: 'Yamaha Factor 150 - Preta',
    currentLocation: [-23.0780, -47.2090],
    status: 'Disponível',
    battery: 95,
    activeOrderIds: []
  }
];

// Gera coordenadas aproximadas por bairro de Indaiatuba
export function getCoordinatesForNeighborhood(neighborhood) {
  switch (neighborhood) {
    case 'Jardim Morada do Sol':
      return [-23.1145, -47.2340];
    case 'Jardim Pau Preto':
      return [-23.0845, -47.2150];
    case 'Cidade Nova':
      return [-23.0925, -47.2080];
    case 'Itaici':
      return [-23.0531, -47.1692];
    case 'Parque Ecológico':
      return [-23.0898, -47.2210];
    case 'Jardim Cecap':
      return [-23.0974, -47.1950];
    case 'Jardim Europa':
      return [-23.0760, -47.2050];
    default:
      return [-23.0885, -47.2185];
  }
}
