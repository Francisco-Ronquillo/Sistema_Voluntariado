
import "../css/navbar.css";
function Navbar() {
    return (
        <>
            <svg
            className="svg-definitions"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            >
            <symbol id="icon-heart" viewBox="0 0 24 24">
            <path
                d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1
                a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6
                a5.5 5.5 0 0 0 0-7.8Z"
            />
            </symbol>
        </svg>

        <header className="site-header">
            <div className="container header-content">
            <a className="brand" href="./" aria-label="Sumamos, inicio">
                <span className="brand-icon">
                <svg className="icon" aria-hidden="true">
                    <use href="#icon-heart" />
                </svg>
                </span>

                <span className="brand-name">Sumamos</span>
            </a>

            <nav className="main-nav" aria-label="Navegación principal">
                <a
                href="#inicio"
                className="nav-link active"
                aria-current="page"
                >
                Inicio
                </a>

                <a href="#actividades" className="nav-link">
                Actividades
                </a>

                <a href="#participar" className="nav-link">
                Quiero participar
                </a>

                <a href="inscripciones.html" className="nav-link">
                Inscripciones
                </a>
            </nav>

            <a
                href="login.html"
                className="button button-primary login-button"
            >
                <svg
                className="icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
                >
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20v-2a7 7 0 0 1 14 0v2" />
                </svg>

                Iniciar sesión
            </a>
            </div>
        </header>
        
        </>

    );
}

export default Navbar;