import "../css/home.css";
import { Link } from "react-router-dom";

function Home() {
  return (
    <>
      

      <main>
        <section
          className="hero"
          id="inicio"
          aria-labelledby="hero-title"
        >
          <div className="container hero-grid">
            <div className="hero-content">
              <span className="badge">
                <svg
                  className="icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="m9 3 1.6 4.4L15 9l-4.4 1.6L9 15l-1.6-4.4L3 9l4.4-1.6Z"
                  />
                  <path
                    d="m18 13 1.1 2.9L22 17l-2.9 1.1L18 21l-1.1-2.9L14 17l2.9-1.1Z"
                  />
                </svg>

                Voluntariado que transforma
              </span>

              <h1 id="hero-title">
                Tu tiempo puede
                <br className="desktop-break" />
                {" "}cambiar una historia.
              </h1>

              <p className="hero-description">
                Conectamos personas con ganas de ayudar con iniciativas que
                hacen una diferencia real en nuestra comunidad.
              </p>

              <div className="hero-actions">
                <Link
                  to="/actividades"
                  className="button button-primary"
                >
                  Explorar actividades

                  <svg
                    className="icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14m-5-5 5 5-5 5" />
                  </svg>
                </Link>

                <Link
                  to="/inscripciones"
                  className="button button-outline"
                >
                  Ver inscripciones
                </Link>
              </div>
            </div>

            <aside
              className="feature-card"
              aria-labelledby="card-title"
            >
              <svg className="icon feature-icon" aria-hidden="true">
                <use href="#icon-heart" />
              </svg>

              <h2 id="card-title">Cada acción cuenta</h2>

              <p>
                Elige una actividad, crea tu cuenta y reserva tu cupo en pocos
                minutos.
              </p>
            </aside>
          </div>
        </section>

        <section
          className="steps-section"
          id="participar"
          aria-labelledby="steps-title"
        >
          <div className="container" id="actividades">
            <span className="badge">Así de sencillo</span>

            <h2 id="steps-title">
              Elige, inscríbete y empieza a sumar
            </h2>
            <p className="steps-description">
              Explora las actividades disponibles, reserva tu cupo y consulta
              tus inscripciones cuando quieras.
            </p>
            <Link className="button button-primary" to="/actividades">
              Ver actividades disponibles
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

export default Home;