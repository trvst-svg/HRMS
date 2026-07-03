import "./Spinner.css";

export default function Spinner({ size = 32, className = "" }) {
  return (
    <div className={`spinner-wrap ${className}`}>
      <div className="spinner" style={{ width: size, height: size }} />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="page-loader">
      <Spinner size={40} />
    </div>
  );
}

export function Skeleton({ width = "100%", height = 20, radius = 8 }) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: radius }} />
  );
}
