import "./Card.css";

export default function Card({
  children,
  className = "",
  hover = false,
  glow = false,
  ...props
}) {
  return (
    <div
      className={`card ${hover ? "card--hover" : ""} ${glow ? "card--glow" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return <div className={`card__header ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }) {
  return <h3 className={`card__title ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = "" }) {
  return <div className={`card__content ${className}`}>{children}</div>;
}
