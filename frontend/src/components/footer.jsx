import "../css/footer.css"

function Footer() {
    return (
    <>
    <footer className="site-footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <a className="brand" href="/" aria-label="Sumamos, inicio">
            <span className="brand-icon">
              <svg
                className="icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1
                     a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6
                     a5.5 5.5 0 0 0 0-7.8Z"
                />
              </svg>
            </span>

            <span className="brand-name">Sumamos</span>
          </a>

          <p>Pequeñas acciones. Grandes cambios.</p>
        </div>

        <nav className="footer-nav" aria-label="Enlaces del pie de página">
          <a href="/#participar">Participar</a>
          <a href="/#actividades">Actividades</a>
          <a href="/inscripciones">Inscripciones</a>
          <a href="mailto:contacto@ejemplo.com">Contacto</a>
        </nav>

        <small className="copyright">
          © {new Date().getFullYear()} Sumamos
        </small>
      </div>
            </footer>
    </>
  );
}

export default Footer;