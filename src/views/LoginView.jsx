import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginView() {
  const { login, userRoles } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(userRoles.FARMACEUTICO);
  const [error, setError] = useState('');

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Por favor, informe um e-mail, CPF ou selecione um perfil.');
      return;
    }
    const result = login(identifier, password);
    if (!result.success) {
      // Fallback: se não encontrou exatamente, entra com o perfil selecionado
      login(selectedRole, password);
    }
  };

  const handleQuickLogin = (role) => {
    login(role, 'demo123');
  };

  return (
    <div className="login-page-container">
      <div className="gov-topbar login-gov-bar">
        <div className="gov-topbar-inner">
          <span>Prefeitura Municipal de Indaiatuba</span>
          <span className="hide-on-mobile">Cidadão • Saúde • Farmácia Municipal</span>
        </div>
      </div>
      <div className="login-card-box">
        {/* Header */}
        <div className="login-header-section">
          <div className="brand-logo-icon login-sun" aria-label="Logo da Prefeitura de Indaiatuba">
            <img src="/Logo.png" alt="Logo da Prefeitura de Indaiatuba" />
          </div>
          <p className="brand-kicker">Prefeitura de</p>
          <h1 className="login-title">INDAIATUBA</h1>
          <p className="login-slogan">Um novo tempo pra você</p>
          <p className="login-subtitle">
            Saúde Ativa Indaiatuba - SAI
          </p>
        </div>

        {/* Quick Demo Access (Ideal para Banca Acadêmica) */}
        <div className="quick-access-box">
          <div className="quick-access-title">
            <Sparkles size={16} color="#0b3aaf" />
            <span>Acesso Rápido para Avaliação Acadêmica:</span>
          </div>
          <p className="quick-access-desc">
            Selecione qualquer um dos 3 perfis abaixo para testar instantaneamente os fluxos de telas:
          </p>

          <div className="role-cards-grid">
            {/* 1. Farmacêutico */}
            <button
              type="button"
              className="role-card-btn role-farmaceutico"
              onClick={() => handleQuickLogin(userRoles.FARMACEUTICO)}
            >
              <div className="role-card-top">
                <span className="role-card-emoji">👩‍⚕️</span>
                <span className="role-card-tag">Farmacêutico</span>
              </div>
              <strong className="role-card-name">Dra. Camila Sampaio</strong>
              <p className="role-card-detail">Validação de receitas, aprovação/recusa justificada e controle de estoque da farmácia central.</p>
            </button>

            {/* 2. Entregador / Motoboy */}
            <button
              type="button"
              className="role-card-btn role-entregador"
              onClick={() => handleQuickLogin(userRoles.ENTREGADOR)}
            >
              <div className="role-card-top">
                <span className="role-card-emoji">🛵</span>
                <span className="role-card-tag">Entregador / Motoboy</span>
              </div>
              <strong className="role-card-name">Carlos Eduardo (Carlinhos)</strong>
              <p className="role-card-detail">Pedidos em rota, GPS de entrega em Indaiatuba e confirmação com foto da receita/documento.</p>
            </button>

            {/* 3. Cliente */}
            <button
              type="button"
              className="role-card-btn role-cliente"
              onClick={() => handleQuickLogin(userRoles.CLIENTE)}
            >
              <div className="role-card-top">
                <span className="role-card-emoji">👵</span>
                <span className="role-card-tag">Cidadão / Paciente</span>
              </div>
              <strong className="role-card-name">Maria Aparecida Santos</strong>
              <p className="role-card-detail">Solicitar remédios, anexar foto da receita, alterar pedidos e rastrear entrega em tempo real.</p>
            </button>
          </div>
        </div>

        {/* Separator */}
        <div className="login-divider">
          <span>OU ENTRE COM CREDENCIAIS</span>
        </div>

        {/* Standard Form */}
        <form onSubmit={handleCustomSubmit} className="login-form">
          {error && (
            <div className="login-error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Perfil de Acesso Desejado:</label>
            <select
              className="form-input"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value={userRoles.FARMACEUTICO}>Farmacêutico (Validação e Estoque)</option>
              <option value={userRoles.ENTREGADOR}>Entregador / Motoboy (Rota e Comprovante)</option>
              <option value={userRoles.CLIENTE}>Cidadão / Paciente (Novo Pedido e Rastreio)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">E-mail, CPF ou Matrícula:</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="text"
                className="form-input has-icon"
                placeholder="Ex: farmacia@indaiatuba.sp.gov.br ou seu CPF"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Senha:</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                className="form-input has-icon"
                placeholder="Qualquer senha para demonstração"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="login-submit-btn">
            Acessar Sistema
          </button>
        </form>

        <div className="login-footer-info">
          <span>Av. Eng. Fábio Roberto Barnabé, 2800 • Indaiatuba/SP • Assistência Farmacêutica Municipal</span>
        </div>
      </div>
    </div>
  );
}
