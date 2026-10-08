export function formatDate(isoString) {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export function formatCPF(cpf) {
  if (!cpf) return '';
  const digits = cpf.replace(/\D/g, '');
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function getStatusInfo(status) {
  switch (status) {
    case 'PENDENTE_VALIDACAO':
      return {
        label: 'Aguardando Farmacêutico',
        color: 'badge-warning',
        bg: '#fef3c7',
        text: '#92400e',
        border: '#fde68a',
        icon: '⏳'
      };
    case 'APROVADO':
      return {
        label: 'Aprovado / Em Separação',
        color: 'badge-info',
        bg: '#e0f2fe',
        text: '#0369a1',
        border: '#bae6fd',
        icon: '📋'
      };
    case 'PENDENTE_ESTOQUE':
      return {
        label: 'Aguardando Decisão do Cliente',
        color: 'badge-warning',
        bg: '#fef3c7',
        text: '#92400e',
        border: '#fde68a',
        icon: '📦'
      };
    case 'PRONTO_ENTREGA':
      return {
        label: 'Pronto para Coleta',
        color: 'badge-purple',
        bg: '#ede9fe',
        text: '#6d28d9',
        border: '#ddd6fe',
        icon: '📦'
      };
    case 'EM_TRANSITO':
      return {
        label: 'Em Rota de Entrega',
        color: 'badge-orange',
        bg: '#ffedd5',
        text: '#c2410c',
        border: '#fed7aa',
        icon: '🛵'
      };
    case 'ENTREGUE':
      return {
        label: 'Entregue com Sucesso',
        color: 'badge-success',
        bg: '#dcfce7',
        text: '#15803d',
        border: '#bbf7d0',
        icon: '✅'
      };
    case 'RECUSADO':
      return {
        label: 'Receita Recusada',
        color: 'badge-danger',
        bg: '#fee2e2',
        text: '#b91c1c',
        border: '#fecaca',
        icon: '❌'
      };
    case 'CANCELADO_ENTREGADOR':
      return {
        label: 'Entrega Cancelada (Motoboy)',
        color: 'badge-danger',
        bg: '#fff1f2',
        text: '#be123c',
        border: '#fda4af',
        icon: '⚠️'
      };
    case 'CANCELADO_CLIENTE':
      return {
        label: 'Cancelado pelo Cliente',
        color: 'badge-secondary',
        bg: '#f1f5f9',
        text: '#475569',
        border: '#cbd5e1',
        icon: '↩️'
      };
    default:
      return {
        label: status || 'Desconhecido',
        color: 'badge-secondary',
        bg: '#f1f5f9',
        text: '#475569',
        border: '#e2e8f0',
        icon: 'ℹ️'
      };
  }
}
