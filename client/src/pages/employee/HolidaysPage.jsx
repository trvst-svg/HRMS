import { getEmployeeHolidays } from "../../api/dashboardApi";
import Table from "../../components/ui/Table";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { PageLoader } from "../../components/ui/Spinner";
import { useApi } from "../../hooks/useApi";
import { formatDate } from "../../utils/helpers";

export default function HolidaysPage() {
  const { data, loading } = useApi(getEmployeeHolidays);
  const columns = [
    { key: "name", label: "Holiday" },
    {
      key: "startDate",
      label: "Date",
      render: (r) => formatDate(r.startDate || r.date),
    },
    {
      key: "type",
      label: "Type",
      render: (r) => <Badge variant="brand">{r.type}</Badge>,
    },
    {
      key: "description",
      label: "Description",
      render: (r) => r.description || "—",
    },
  ];

  return (
    <div className="animate-fade-in">
      <h1
        style={{
          fontSize: "var(--font-size-2xl)",
          fontWeight: 700,
          marginBottom: "var(--space-6)",
        }}
      >
        Holidays
      </h1>
      <Card>
        {loading ? (
          <PageLoader />
        ) : (
          <Table
            columns={columns}
            data={data || []}
            emptyMessage="No holidays"
          />
        )}
      </Card>
    </div>
  );
}
