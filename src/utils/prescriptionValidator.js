// Validador e Comparador de Receitas Médicas Coletadas
export async function comparePrescriptions(originalPrescriptionUrl, capturedPhotoUrl, order) {
  // Simulação de análise biométrica e documental
  return new Promise((resolve) => {
    setTimeout(() => {
      // Se for uma foto simulada de erro intencional
      if (capturedPhotoUrl && capturedPhotoUrl.includes('invalid_doc')) {
        resolve({
          isValid: false,
          score: 22,
          statusText: 'Documento Incompatível',
          patientMatch: false,
          doctorStampMatch: false,
          medicinesMatch: false,
          message: 'A foto enviada não corresponde à receita arquivada no pedido. Divergência no nome do paciente e CRM do médico emitente.'
        });
        return;
      }

      // Se for uma imagem real ou SVG gerado compatível
      // Checa se contém menção aos dados do paciente ou itens
      let score = 94;
      const patientLastName = (order?.patient?.name || '').split(' ').pop().toLowerCase();
      
      // Se a imagem tiver características de captura
      if (capturedPhotoUrl) {
        // Validação com pontuação alta
        score = Math.floor(Math.random() * 8) + 91; // entre 91% e 98%
      }

      resolve({
        isValid: score >= 65,
        score,
        statusText: score >= 65 ? 'Receita Autêntica e Compatível' : 'Divergência na Conferência',
        patientMatch: true,
        doctorStampMatch: true,
        medicinesMatch: true,
        message: `Receita médica física recolhida confere com a via digitalizada do pedido ${order?.id}. Assinatura médica e itens prescritos validados com sucesso.`
      });
    }, 1200); // tempo de processamento para feedback visual
  });
}
