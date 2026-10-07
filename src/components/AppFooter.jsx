export default function AppFooter() {
  return (
    <footer className="gov-footer">
      <div className="gov-rainbow-bar" aria-hidden="true">
        <span className="stripe-pink" />
        <span className="stripe-blue" />
        <span className="stripe-yellow" />
        <span className="stripe-green" />
      </div>
      <div className="gov-footer-inner">
        <div>
          <strong>Prefeitura Municipal de Indaiatuba</strong>
          <p>Secretaria Municipal de Saúde • Assistência Farmacêutica</p>
        </div>
        <p className="gov-footer-address">
          Av. Eng. Fábio Roberto Barnabé, 2800 - M.D. - 13331-900 | Indaiatuba/SP
        </p>
      </div>
    </footer>
  );
}
