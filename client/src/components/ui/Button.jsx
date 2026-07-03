import "./Button.css";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  type = "button",
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`btn btn--${variant} btn--${size} ${fullWidth ? "btn--full" : ""} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="btn__spinner" />
      ) : Icon ? (
        <Icon size={size === "sm" ? 14 : 16} className="btn__icon" />
      ) : null}
      {children && <span className="btn__label">{children}</span>}
    </button>
  );
}
