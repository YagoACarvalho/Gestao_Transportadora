import { useState } from "react";
import {
  AppShell, PageHeader, Grid, StatCard, ProgressCard, Card,
  GaugeChart, BarChartCard, ListRow, Tabs, Button, Badge,
} from "./index";

/**
 * Tela de referência: toda página nova deve seguir esta estrutura
 * AppShell > PageHeader > Grid > Cards.
 */
export default function ExamplePage() {
  const [range, setRange] = useState("2h");

  return (
    <AppShell
      brand="Ultraleads"
      nav={[
        { label: "Dashboard", href: "/", active: true },
        { label: "Analytics", href: "/analytics" },
        { label: "Invoice", href: "/invoice" },
        { label: "Products", href: "/products" },
      ]}
      right={<Button variant="secondary">Sarah Collins</Button>}
    >
      <PageHeader
        title="Sales Overview"
        subtitle="Your current sales summary and activity"
        actions={
          <>
            <Button variant="secondary">Export</Button>
            <Button variant="primary">Filter</Button>
          </>
        }
      />

      <Grid>
        <div className="ul-col-4" style={{ display: "grid", gap: "var(--ul-space-5)" }}>
          <StatCard title="Total Sales" value="$542,376" change="+22%" variant="navy" span={12} />
          <StatCard title="Total Purchase" value="$275,920" change="+8%" span={12} />
        </div>

        <ProgressCard
          title="User Growth"
          value="205,890"
          percent={55}
          change="+22%"
          footerLeft="Checking totally"
          footerRight="+210 today"
          span={4}
          controls={
            <Tabs
              label="Período"
              value={range}
              onChange={setRange}
              options={[
                { value: "2h", label: "2h" },
                { value: "week", label: "A Week" },
                { value: "month", label: "Month" },
              ]}
            />
          }
        />

        <Card title="Customers Volume" span={4}>
          <GaugeChart value={60} label="145" caption="New Customers" />
          <Badge tone="positive">Your customer volume has increased +25%</Badge>
        </Card>

        <BarChartCard
          title="Statistics"
          span={7}
          highlight={
            <>
              <div className="ul-kpi-value">+76%</div>
              <p className="ul-caption">Customer satisfaction increases every week</p>
            </>
          }
          data={[
            { label: "Mon", value: 40, change: "+9%" },
            { label: "Tue", value: 55, change: "+7%" },
            { label: "Wed", value: 65, change: "+5%" },
            { label: "Thu", value: 90, change: "+16%" },
            { label: "Fri", value: 60, change: "+8%" },
            { label: "Sat", value: 35, change: "-7%" },
            { label: "Sun", value: 60, change: "+6%" },
          ]}
        />

        <Card title="Most Order by Country" span={5}>
          <div className="ul-list">
            <ListRow title="Jenny" description="placed a large order" tag="San Francisco" />
            <ListRow title="Paul" description="purchased item" tag="Los Angeles" />
            <ListRow title="Mike" description="made repeat order" tag="San Diego" />
          </div>
        </Card>
      </Grid>
    </AppShell>
  );
}
