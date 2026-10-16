const categoryClasses = {
  'Medio ambiente': 'category-environment',
  'Ayuda social': 'category-social',
  Educación: 'category-education',
  Animales: 'category-animals',
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function formatDate(date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function RecordCard({ record }) {
  return (
    <article className="record-card">
      <div className="record-card-meta">
        <span className={`record-category ${categoryClasses[record.categoria] ?? ''}`}>
          {record.categoria}
        </span>
        <span className="record-status">
          <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m5 12 4 4L19 6" />
          </svg>
          {record.estado}
        </span>
      </div>
      <h2>{record.actividad}</h2>
      <p className="record-motivation">{record.descripcion}</p>
      <div className="record-card-footer">
        <div className="record-volunteer">
          <span className="participant-avatar" aria-hidden="true">
            {getInitials(record.nombre)}
          </span>
          <div>
            <p>{record.nombre}</p>
            <span>Voluntario Sumamos</span>
          </div>
        </div>
        <div className="record-date">
          <span>Fecha</span>
          <p>{formatDate(record.fecha)}</p>
        </div>
      </div>
    </article>
  )
}

export default RecordCard
