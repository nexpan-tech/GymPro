import {
  Users,
  Activity,
  CreditCard,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Members",
      value: "124",
      icon: Users,
      trend: "+8%",
      status: "good",
    },
    {
      title: "Active Today",
      value: "87",
      icon: Activity,
      trend: "+4%",
      status: "good",
    },
    {
      title: "Monthly Revenue",
      value: "₹45,000",
      icon: CreditCard,
      trend: "+12%",
      status: "excellent",
    },
    {
      title: "Growth Rate",
      value: "+12%",
      icon: TrendingUp,
      trend: "+2.1%",
      status: "neutral",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* HEADER */}
      <div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            margin: 0,
          }}
        >
          Dashboard
        </h1>

        <p
          style={{
            marginTop: 6,
            color: "var(--muted)",
            fontSize: 14,
          }}
        >
          Real-time insights into your gym performance, members, and revenue
        </p>
      </div>

      {/* STATS GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {stats.map((item, i) => {
          const Icon = item.icon;

          return (
            <div
              key={i}
              style={{
                background:
                  "linear-gradient(180deg, var(--surface), var(--surface-2))",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: 18,
                boxShadow: "var(--shadow-sm)",
                cursor: "pointer",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.transform = "translateY(-4px)";
                el.style.boxShadow = "var(--shadow-md)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.transform = "translateY(0px)";
                el.style.boxShadow = "var(--shadow-sm)";
              }}
            >
              {/* TOP */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--muted)",
                    fontWeight: 500,
                  }}
                >
                  {item.title}
                </span>

                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--primary-soft)",
                    color: "var(--primary)",
                  }}
                >
                  <Icon size={18} />
                </div>
              </div>

              {/* VALUE */}
              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {item.value}
                </h2>

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color:
                      item.status === "excellent"
                        ? "var(--success)"
                        : item.status === "good"
                        ? "var(--primary)"
                        : "var(--muted)",
                  }}
                >
                  {item.trend}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* LOWER SECTION */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 16,
        }}
      >
        {/* MAIN PANEL */}
        <div
          style={{
            borderRadius: 16,
            border: "1px solid var(--border)",
            background:
              "linear-gradient(135deg, var(--surface), var(--surface-2))",
            padding: 20,
            minHeight: 280,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
            Performance Overview
          </h3>

          <div
            style={{
              marginTop: 20,
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
              fontSize: 13,
              border: "1px dashed var(--border)",
              borderRadius: 12,
            }}
          >
            📊 Analytics charts will be integrated here (Recharts / ApexCharts)
          </div>
        </div>

        {/* SIDE PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          
          <div
            style={{
              borderRadius: 16,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              padding: 16,
            }}
          >
            <h4 style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
              Quick Insight
            </h4>
            <p style={{ marginTop: 10, fontSize: 13 }}>
              Peak gym usage is between 6 PM – 8 PM.
            </p>
          </div>

          <div
            style={{
              borderRadius: 16,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              padding: 16,
            }}
          >
            <h4 style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
              Alerts
            </h4>
            <p style={{ marginTop: 10, fontSize: 13 }}>
              5 memberships are expiring this week.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}