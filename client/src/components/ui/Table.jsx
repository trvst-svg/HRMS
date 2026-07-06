import "./Table.css";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Table({
  columns,
  data,
  emptyMessage = "No data found",
  pagination,
  onPageChange,
}) {
  // Separate action columns from data columns for the mobile card layout
  const dataColumns = columns.filter(
    (col) => col.key !== "actions" && col.label !== "",
  );
  const actionColumn = columns.find(
    (col) => col.key === "actions" || col.label === "",
  );

  return (
    <div className="table-wrap">
      {/* ── Desktop: traditional table ── */}
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={col.width ? { width: col.width } : {}}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((row, i) => (
                <tr key={row._id || row.id || i}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : (row[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="table__empty">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile: card view ── */}
      <div className="table-cards">
        {data && data.length > 0 ? (
          data.map((row, i) => (
            <div className="table-card" key={row._id || row.id || i}>
              {dataColumns.map((col) => (
                <div className="table-card__row" key={col.key}>
                  <span className="table-card__label">{col.label}</span>
                  <span className="table-card__value">
                    {col.render ? col.render(row) : (row[col.key] ?? "—")}
                  </span>
                </div>
              ))}
              {actionColumn && (
                <div className="table-card__actions">
                  {actionColumn.render
                    ? actionColumn.render(row)
                    : (row[actionColumn.key] ?? "")}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="table-cards__empty">{emptyMessage}</div>
        )}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="table__pagination">
          <span className="table__page-info">
            Page {pagination.page} of {pagination.pages} · {pagination.total}{" "}
            records
          </span>
          <div className="table__page-btns">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
              className="table__page-btn"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => onPageChange?.(pagination.page + 1)}
              className="table__page-btn"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

