import "./StatCard.css";

export default function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color = "brand",
  delay = 0,
}) {
  return (
    <div
      className={`stat-card stat-card--${color} animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="stat-card__icon-wrap">{Icon && <Icon size={22} />}</div>
      <div className="stat-card__info">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__value">{value}</span>
        {subtitle && <span className="stat-card__subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}
