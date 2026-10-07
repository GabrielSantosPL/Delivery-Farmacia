# MedDel Indaiatuba 💊🛵
### Sistema Municipal de Delivery de Medicamentos Prescritos pelo SUS

Projeto acadêmico híbrido (Web / Mobile responsivo) desenvolvido em **React** e **Vite**, focado na dispensação e entrega domiciliar de medicamentos receitados pela rede pública municipal de saúde de **Indaiatuba - SP**.

---

## 🎯 Tipos de Usuários e Funcionalidades

O sistema possui autenticação e interfaces dedicadas para os 4 perfis requeridos:

### 1. 👩‍⚕️ Farmacêutico (Validação e Estoque)
- **Conferência de Pedidos**: Visualiza lista de solicitações com nome do paciente, CPF, Cartão SUS e medicamentos prescritos.
- **Auditoria da Receita**: Modal de inspeção em alta resolução da imagem da receita médica digitalizada anexada pelo paciente (conferência de CRM, assinatura e validade).
- **Aprovação / Recusa Justificada**:
  - **Aprovação**: Reserva o estoque na Farmácia Central e despacha o pedido para coleta do entregador.
  - **Recusa**: Exigência obrigatória de inserção de justificativa técnica (ex: receita vencida, falta de CRM/carimbo, posologia ilegível). O paciente é notificado em tempo real.
- **Gestão de Estoque Municipal**: Tabela com saldo em estoque, lote, data de validade, alertas de estoque baixo e botões para ajustes rápidos de quantidade (+/-) ou cadastro de novos insumos.

---

### 2. 🛵 Entregador / Motoboy (Rotas e Comprovação)
- **Meus Pedidos**: Lista de pedidos designados para entrega em Indaiatuba com endereço completo e contato do paciente.
- **Controle de Status**: Alteração de status para *"Em Rota de Entrega"* e *"Finalizar Entrega"*.
- **Comprovação Obrigatória por Foto**: Para finalizar a entrega, o motoboy deve obrigatoriamente anexar uma foto (via câmera do smartphone ou upload de arquivo) comprovando a retenção da receita física ou documento oficial com foto do paciente.
- **Mapa e Navegação GPS**:
  - Mapa interativo (Leaflet / OpenStreetMap) com a rota designada em Indaiatuba.
  - Botão de acesso ao GPS do dispositivo (`navigator.geolocation`).
  - Botão de **Simulação de Deslocamento GPS** para demonstração interativa durante a apresentação do projeto.

---

### 3. 👨‍💼 Gerente Municipal (Supervisão Global e Logística)
- **Mapa Geral da Frota**: Visualização dinâmica e em tempo real da posição de todos os motoboys e pedidos em trânsito pelos bairros de Indaiatuba (Jardim Morada do Sol, Itaici, Centro, etc.).
- **Painel de Roteirização**: Acompanhamento do status de cada entregador, bateria, placa da motocicleta e pedidos atribuídos.
- **Gestão de Pedidos**: Tabela centralizada com opção de reatribuição de entregadores e auditoria completa da linha do tempo de cada pedido.
- **Estoque & Logística**: Edição direta de saldos de medicamentos, lotes, limites mínimos de segurança e cadastro de novos fármacos da REMUME.

---

### 4. 👵 Cidadão / Paciente (Solicitação e Rastreamento)
- **Novo Pedido**:
  - Seleção de múltiplos medicamentos da lista municipal (REMUME Indaiatuba simulada).
  - Definição de quantidade e posologia prescrita.
  - Anexo obrigatório da foto da receita médica assinada (upload direto ou gerador de receita de demonstração com CRM médico).
  - Seleção de endereço e bairro em Indaiatuba.
- **Alteração de Pedido**: Pacientes podem editar as quantidades e itens de um pedido caso ele ainda esteja pendente de validação pela farmácia.
- **Rastreamento em Tempo Real**:
  - Barra de progresso visual de 5 etapas (*Enviado* → *Validação Farmacêutica* → *Separação* → *Em Trânsito* → *Entregue*).
  - Visualização da justificativa do farmacêutico em caso de recusa.
  - Mapa interativo individual exibindo a rota exata da Farmácia Central até sua residência.

---

## 🛠️ Tecnologias Utilizadas

- **React 19** com Hooks (`useState`, `useEffect`, `useContext`, `useRef`)
- **Vite** para compilação ultrarrápida
- **Leaflet & OpenStreetMap** para mapeamento e rotas geográficas sem custos de API
- **Lucide React** para ícones modernos
- **CSS Modular e Responsivo**: Layout híbrido adaptável para telas desktop (painel de farmácia/gerente) e smartphones (visão mobile de entregador e cidadão).
- **LocalStorage API**: Persistência de dados para pedidos, estoque e usuários durante a navegação.

---

## 🚀 Como Executar o Projeto

No terminal, dentro da pasta `Med-Del`:

1. Instalar dependências (caso não tenham sido instaladas):
   ```bash
   npm install
   ```

2. Iniciar o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Abrir o link exibido no terminal no navegador (ex: `http://localhost:5173`).

---

## 🎓 Recursos Especiais para Apresentação Acadêmica

- **Seletor de Perfis no Topo (1 Clique)**: Permite ao professor e avaliadores alternar instantaneamente entre Farmacêutico, Motoboy, Gerente e Cidadão sem precisar deslogar.
- **Simulador de Deslocamento GPS**: Demonstra a movimentação do motoboy no mapa de Indaiatuba em tempo real.
- **Botão "Restaurar Dados"**: Reseta o banco de dados simulado a qualquer momento para reiniciar uma demonstração limpa.
- **Receitas SVG Oficiais**: Gera receitas médicas simuladas com carimbo, CRM e assinatura do SUS para testar o zoom e validação técnica.
