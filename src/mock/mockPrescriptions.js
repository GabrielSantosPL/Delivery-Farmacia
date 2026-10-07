// Gerador de imagens SVG seguras de receitas e comprovantes médicos para simulação
export function generatePrescriptionSvg({
  patientName = 'Maria Aparecida Santos',
  susCard = '702 3456 7890 0012',
  doctorName = 'Dr. Marcos Silveira - Clínico Geral',
  crm = 'CRM/SP 142.880',
  date = '05/10/2026',
  items = ['Losartana Potássica 50mg - Tomar 1 comprimido pela manhã', 'Metformina 850mg - Tomar 1 comprimido após o almoço'],
  unit = 'UBS V - Morada do Sol (Indaiatuba - SP)'
}) {
  const itemsText = items.map((item, idx) => `
    <text x="50" y="${250 + idx * 36}" font-family="monospace" font-size="14" fill="#1e293b" font-weight="bold">${idx + 1}. ${item}</text>
    <text x="65" y="${268 + idx * 36}" font-family="sans-serif" font-size="12" fill="#64748b">Uso contínuo - 30 dias</text>
  `).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 650" width="100%" height="100%">
    <defs>
      <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.1" />
      </filter>
    </defs>
    <!-- Folha Receituário -->
    <rect width="600" height="650" fill="#fffdfa" stroke="#cbd5e1" stroke-width="2" rx="8" filter="url(#shadow)"/>
    
    <!-- Cabeçalho Oficial SUS / Prefeitura -->
    <rect x="0" y="0" width="600" height="85" fill="#0284c7" rx="8"/>
    <rect x="0" y="75" width="600" height="10" fill="#0284c7"/>
    <text x="30" y="38" font-family="sans-serif" font-size="17" font-weight="800" fill="#ffffff" letter-spacing="0.5">PREFEITURA DO MUNICÍPIO DE INDAIATUBA</text>
    <text x="30" y="60" font-family="sans-serif" font-size="13" font-weight="500" fill="#e0f2fe">SECRETARIA MUNICIPAL DE SAÚDE • SISTEMA ÚNICO DE SAÚDE (SUS)</text>

    <!-- Marca d'água -->
    <text x="300" y="350" font-family="sans-serif" font-size="44" font-weight="900" fill="#f1f5f9" text-anchor="middle" transform="rotate(-25 300 350)">RECEITUÁRIO MÉDICO</text>

    <!-- Dados do Estabelecimento -->
    <text x="50" y="115" font-family="sans-serif" font-size="12" fill="#475569">Unidade Emitente: <tspan font-weight="bold" fill="#0f172a">${unit}</tspan></text>
    <text x="50" y="135" font-family="sans-serif" font-size="12" fill="#475569">Data da Prescrição: <tspan font-weight="bold" fill="#0f172a">${date}</tspan> (Válido p/ 30 dias)</text>
    <line x1="50" y1="148" x2="550" y2="148" stroke="#e2e8f0" stroke-width="1.5" />

    <!-- Dados do Paciente -->
    <rect x="50" y="160" width="500" height="52" fill="#f8fafc" stroke="#e2e8f0" rx="4"/>
    <text x="65" y="180" font-family="sans-serif" font-size="12" fill="#64748b">PACIENTE:</text>
    <text x="135" y="180" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">${patientName}</text>
    <text x="65" y="200" font-family="sans-serif" font-size="12" fill="#64748b">CARTÃO NACIONAL SUS:</text>
    <text x="215" y="200" font-family="monospace" font-size="13" font-weight="bold" fill="#0369a1">${susCard}</text>

    <!-- Prescrição / Itens -->
    <text x="50" y="235" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0284c7">PRESCRIÇÃO TERAPÊUTICA (Rp):</text>
    ${itemsText}

    <!-- Carimbo e Assinatura Médica -->
    <g transform="translate(320, 480)">
      <rect width="230" height="95" fill="#f8fafc" stroke="#2563eb" stroke-dasharray="4" rx="6" opacity="0.9"/>
      <path d="M 20 55 Q 50 20, 80 50 T 140 40 T 190 45" stroke="#1e3a8a" stroke-width="2.5" fill="none" />
      <line x1="20" y1="65" x2="210" y2="65" stroke="#94a3b8" stroke-width="1" />
      <text x="115" y="78" font-family="sans-serif" font-size="11" font-weight="bold" fill="#1e3a8a" text-anchor="middle">${doctorName}</text>
      <text x="115" y="90" font-family="sans-serif" font-size="10" fill="#475569" text-anchor="middle">${crm} • CLÍNICA GERAL</text>
    </g>

    <!-- Rodapé -->
    <line x1="50" y1="595" x2="550" y2="595" stroke="#cbd5e1" stroke-width="1" />
    <text x="300" y="618" font-family="sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">Dispensação pública municipal sujeita à retenção da via e validação farmacêutica - Indaiatuba/SP</text>
  </svg>`;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

export function generateDeliveryProofSvg({
  orderId = 'PED-2026-001',
  recipientName = 'Maria Aparecida Santos',
  timestamp = '07/10/2026 às 10:45',
  driverName = 'Carlos Eduardo (Carlinhos)'
}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
    <rect width="500" height="400" fill="#0f172a" rx="10"/>
    <rect x="20" y="20" width="460" height="360" fill="#1e293b" rx="8" stroke="#334155" stroke-width="2"/>
    <circle cx="250" cy="110" r="45" fill="#10b981" opacity="0.2"/>
    <circle cx="250" cy="110" r="30" fill="#10b981"/>
    <!-- Checkmark icon -->
    <path d="M 238 110 L 246 118 L 262 102" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    
    <text x="250" y="175" font-family="sans-serif" font-size="18" font-weight="bold" fill="#f8fafc" text-anchor="middle">RECEITA FÍSICA COLETADA E CONFERIDA</text>
    <text x="250" y="198" font-family="sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">Comprovante Digital de Entrega - Delivery SUS</text>
    
    <rect x="50" y="220" width="400" height="110" fill="#0f172a" rx="6" stroke="#334155"/>
    <text x="70" y="245" font-family="sans-serif" font-size="12" fill="#94a3b8">Código do Pedido: <tspan font-weight="bold" fill="#38bdf8">${orderId}</tspan></text>
    <text x="70" y="270" font-family="sans-serif" font-size="12" fill="#94a3b8">Recebedor: <tspan font-weight="bold" fill="#f1f5f9">${recipientName}</tspan></text>
    <text x="70" y="295" font-family="sans-serif" font-size="12" fill="#94a3b8">Entregador: <tspan font-weight="bold" fill="#f1f5f9">${driverName}</tspan></text>
    <text x="70" y="320" font-family="sans-serif" font-size="11" fill="#10b981">Data/Hora: ${timestamp} • Coordenadas GPS Verificadas</text>
  </svg>`;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

export function generatePhysicalPrescriptionCollectedSvg({
  orderId = 'PED-2026-001',
  patientName = 'Maria Aparecida Santos',
  date = '07/10/2026'
}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 650" width="100%" height="100%">
    <!-- Folha Receituário Recolhida com Carimbo do Entregador -->
    <rect width="600" height="650" fill="#fefce8" stroke="#ca8a04" stroke-width="2" rx="8"/>
    <rect x="0" y="0" width="600" height="75" fill="#0284c7" rx="8"/>
    <text x="30" y="42" font-family="sans-serif" font-size="16" font-weight="800" fill="#ffffff">PREFEITURA DO MUNICÍPIO DE INDAIATUBA - SUS</text>
    
    <!-- Carimbo de Coleta no Ato da Entrega -->
    <g transform="translate(340, 100) rotate(-12)">
      <rect width="210" height="70" fill="none" stroke="#dc2626" stroke-width="3" stroke-dasharray="6,3" rx="4"/>
      <text x="105" y="28" font-family="sans-serif" font-size="12" font-weight="900" fill="#dc2626" text-anchor="middle">VIA FÍSICA RETIDA</text>
      <text x="105" y="46" font-family="sans-serif" font-size="10" font-weight="bold" fill="#dc2626" text-anchor="middle">DELIVERY SUS INDAIATUBA</text>
      <text x="105" y="60" font-family="sans-serif" font-size="9" fill="#dc2626" text-anchor="middle">Data Coleta: ${date}</text>
    </g>

    <!-- Dados do Paciente e Prescrição -->
    <text x="50" y="125" font-family="sans-serif" font-size="12" fill="#475569">PACIENTE CONFERIDO:</text>
    <text x="50" y="145" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">${patientName}</text>
    <text x="50" y="170" font-family="sans-serif" font-size="11" fill="#64748b">Pedido ID: ${orderId} • Coletado pelo Motoboy</text>
    
    <line x1="50" y1="185" x2="550" y2="185" stroke="#cbd5e1" stroke-width="1.5" />
    <text x="50" y="220" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0284c7">PRESCRIÇÃO TERAPÊUTICA (Rp):</text>
    <text x="50" y="250" font-family="monospace" font-size="13" font-weight="bold" fill="#1e293b">1. Losartana Potássica 50mg - 60 cps</text>
    <text x="50" y="285" font-family="monospace" font-size="13" font-weight="bold" fill="#1e293b">2. Metformina Cloridrato 850mg - 60 cps</text>

    <!-- Assinatura do Cidadão e Médico -->
    <g transform="translate(60, 480)">
      <line x1="0" y1="30" x2="220" y2="30" stroke="#475569" stroke-width="1"/>
      <text x="110" y="48" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="middle">Assinatura de Recebimento do Cidadão</text>
    </g>
    <g transform="translate(320, 480)">
      <rect width="210" height="75" fill="#f8fafc" stroke="#2563eb" stroke-dasharray="4" rx="6"/>
      <text x="105" y="42" font-family="sans-serif" font-size="11" font-weight="bold" fill="#1e3a8a" text-anchor="middle">Dr. Marcos Silveira</text>
      <text x="105" y="58" font-family="sans-serif" font-size="10" fill="#475569" text-anchor="middle">CRM/SP 142.880</text>
    </g>
  </svg>`;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

export function generateInvalidDocumentSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
    <!-- Documento Divergente (Foto de Nota de Supermercado ou Paciente Incorreto) -->
    <rect width="500" height="400" fill="#f1f5f9" stroke="#ef4444" stroke-width="3" rx="8"/>
    <text x="250" y="100" font-family="sans-serif" font-size="20" font-weight="bold" fill="#ef4444" text-anchor="middle">⚠️ DOCUMENTO INCOMPATÍVEL</text>
    <text x="250" y="140" font-family="sans-serif" font-size="13" fill="#64748b" text-anchor="middle">Comprovante de Compra Particular / Outro Paciente</text>
    <text x="250" y="180" font-family="monospace" font-size="12" fill="#334155" text-anchor="middle">PACIENTE: Desconhecido (Sem CRM Médico)</text>
    <text x="250" y="210" font-family="monospace" font-size="12" fill="#334155" text-anchor="middle">EMISSOR: Farmácia Comercial Não-SUS</text>
    <text x="250" y="280" font-family="sans-serif" font-size="11" fill="#dc2626" text-anchor="middle">Este documento não confere com a receita médica arquivada.</text>
  </svg>`;

  // Insere a tag invalid_doc na url para detecção no validador
  return 'data:image/svg+xml;utf8,invalid_doc_' + encodeURIComponent(svg);
}

