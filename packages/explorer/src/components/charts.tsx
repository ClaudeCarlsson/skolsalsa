"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import { t, type Lang } from "@/lib/i18n";

const COLORS = {
  blue: "#3b82f6",
  green: "#22c55e",
  orange: "#f59e0b",
  red: "#ef4444",
  purple: "#8b5cf6",
  teal: "#14b8a6",
  gray: "#6b7280",
};

const PALETTE = [
  COLORS.blue,
  COLORS.green,
  COLORS.orange,
  COLORS.red,
  COLORS.purple,
];

const tooltipStyle = {
  backgroundColor: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  fontSize: "13px",
};

interface MeritChartProps {
  data: Array<{
    year: number;
    avg_merit_value: number | null;
    predicted_merit_value: number | null;
    residual_merit: number | null;
  }>;
  lang: Lang;
}

export function MeritTrendChart({ data, lang }: MeritChartProps) {
  const filtered = data.filter(
    (d) => d.avg_merit_value !== null || d.predicted_merit_value !== null
  );

  if (filtered.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        {t("chart.noMeritData", lang)}
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <ComposedChart data={filtered}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" fontSize={12} tick={{ fill: "#6b7280" }} />
          <YAxis fontSize={12} tick={{ fill: "#6b7280" }} domain={["auto", "auto"]} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Area
            type="monotone"
            dataKey="predicted_merit_value"
            name={t("chart.predictedModel", lang)}
            fill={COLORS.blue}
            fillOpacity={0.08}
            stroke="none"
          />
          <Line
            type="monotone"
            dataKey="avg_merit_value"
            name={t("chart.actualMerit", lang)}
            stroke={COLORS.blue}
            strokeWidth={2.5}
            dot={{ r: 3, fill: COLORS.blue }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="predicted_merit_value"
            name={t("chart.predicted", lang)}
            stroke={COLORS.gray}
            strokeWidth={1.5}
            strokeDasharray="6 3"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ResidualChart({ data, lang }: MeritChartProps) {
  const filtered = data.filter((d) => d.residual_merit !== null);

  if (filtered.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        {t("chart.noResidualData", lang)}
      </div>
    );
  }

  const withColor = filtered.map((d) => ({
    ...d,
    fill: (d.residual_merit ?? 0) >= 0 ? COLORS.green : COLORS.red,
  }));

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={withColor}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" fontSize={12} tick={{ fill: "#6b7280" }} />
          <YAxis fontSize={12} tick={{ fill: "#6b7280" }} />
          <Tooltip contentStyle={tooltipStyle} />
          <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1.5} />
          <Bar dataKey="residual_merit" name={t("chart.residual", lang)} radius={[4, 4, 0, 0]}>
            {withColor.map((entry, i) => (
              <rect key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TrendChartProps {
  data: Array<{
    year: number;
    avg_merit: number;
    avg_eligible: number;
    school_count: number;
  }>;
  lang: Lang;
}

export function NationalTrendChart({ data, lang }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground">
        {t("chart.noTrendData", lang)}
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 400 }}>
      <ResponsiveContainer>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" fontSize={12} tick={{ fill: "#6b7280" }} />
          <YAxis
            yAxisId="left"
            fontSize={12}
            tick={{ fill: "#6b7280" }}
            label={{ value: t("chart.meritAxis", lang), angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 12 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            fontSize={12}
            tick={{ fill: "#6b7280" }}
            label={{ value: t("chart.eligibleAxis", lang), angle: 90, position: "insideRight", fill: "#6b7280", fontSize: 12 }}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="avg_merit"
            name={t("chart.avgMeritValue", lang)}
            fill={COLORS.blue}
            fillOpacity={0.1}
            stroke={COLORS.blue}
            strokeWidth={2.5}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="avg_eligible"
            name={t("chart.avgEligible", lang)}
            stroke={COLORS.green}
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SchoolCountChart({
  data,
  lang,
}: {
  data: Array<{ year: number; school_count: number }>;
  lang: Lang;
}) {
  if (data.length === 0) return null;

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" fontSize={12} tick={{ fill: "#6b7280" }} />
          <YAxis fontSize={12} tick={{ fill: "#6b7280" }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar
            dataKey="school_count"
            name={t("chart.schools", lang)}
            fill={COLORS.blue}
            fillOpacity={0.7}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface CompareChartProps {
  data: Array<{
    year: number;
    [key: string]: number | null;
  }>;
  schools: Array<{ code: string; name: string }>;
  lang: Lang;
}

export function CompareChart({ data, schools, lang }: CompareChartProps) {
  if (data.length === 0 || schools.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground">
        {t("chart.selectSchools", lang)}
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 400 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" fontSize={12} tick={{ fill: "#6b7280" }} />
          <YAxis fontSize={12} tick={{ fill: "#6b7280" }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {schools.map((s, i) => (
            <Line
              key={s.code}
              type="monotone"
              dataKey={s.code}
              name={s.name}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BackgroundChart({
  data,
  lang,
}: {
  data: Array<{
    year: number;
    pct_foreign_background: number | null;
    pct_boys: number | null;
    pct_newly_arrived: number | null;
  }>;
  lang: Lang;
}) {
  const filtered = data.filter(
    (d) =>
      d.pct_foreign_background !== null ||
      d.pct_boys !== null ||
      d.pct_newly_arrived !== null
  );

  if (filtered.length === 0) return null;

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <LineChart data={filtered}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" fontSize={12} tick={{ fill: "#6b7280" }} />
          <YAxis fontSize={12} tick={{ fill: "#6b7280" }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line
            type="monotone"
            dataKey="pct_foreign_background"
            name={t("chart.foreignBg", lang)}
            stroke={COLORS.orange}
            strokeWidth={2}
            dot={{ r: 2 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="pct_boys"
            name={t("chart.boys", lang)}
            stroke={COLORS.teal}
            strokeWidth={2}
            dot={{ r: 2 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="pct_newly_arrived"
            name={t("chart.newlyArrived", lang)}
            stroke={COLORS.purple}
            strokeWidth={2}
            dot={{ r: 2 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EligibilityChart({
  data,
  lang,
}: {
  data: Array<{
    year: number;
    pct_eligible_gymnasiet: number | null;
    predicted_eligible: number | null;
  }>;
  lang: Lang;
}) {
  const filtered = data.filter(
    (d) => d.pct_eligible_gymnasiet !== null || d.predicted_eligible !== null
  );

  if (filtered.length === 0) return null;

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <ComposedChart data={filtered}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" fontSize={12} tick={{ fill: "#6b7280" }} />
          <YAxis fontSize={12} tick={{ fill: "#6b7280" }} domain={[0, 100]} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Area
            type="monotone"
            dataKey="pct_eligible_gymnasiet"
            name={t("chart.actualEligible", lang)}
            fill={COLORS.green}
            fillOpacity={0.15}
            stroke={COLORS.green}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="predicted_eligible"
            name={t("chart.predictedPct", lang)}
            stroke={COLORS.gray}
            strokeWidth={1.5}
            strokeDasharray="6 3"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
