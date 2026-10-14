
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";

function ChartCard({ title, description, children }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-5 h-72 w-full">
        {children}
      </div>
    </section>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-slate-500">
      No valid metrics available for this chart.
    </div>
  );
}

export default function ModelPerformanceCharts({ metrics }) {
  const classification = metrics?.classification;
  const regression = metrics?.regression;

  const classificationData = [
    { name: "Accuracy", value: classification?.accuracy },
    { name: "Precision", value: classification?.macro_precision },
    { name: "Recall", value: classification?.macro_recall },
    { name: "F1-score", value: classification?.macro_f1 },
  ]
    .filter(
      (item) =>
        typeof item.value === "number" &&
        Number.isFinite(item.value)
    )
    .map((item) => ({
      ...item,
      value: item.value * 100,
    }));

  const regressionErrorData = [
    { name: "MAE", value: regression?.mae },
    { name: "RMSE", value: regression?.rmse },
  ].filter(
    (item) =>
      typeof item.value === "number" &&
      Number.isFinite(item.value) &&
      item.value >= 0
  );

  const r2 =
    typeof regression?.r2 === "number" &&
    Number.isFinite(regression.r2)
      ? regression.r2
      : null;

  return (
    <div className="mt-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Model Performance Visualizations
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Metrics returned by the backend evaluation endpoint.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Classification Performance"
          description="Accuracy and macro-averaged precision, recall and F1-score."
        >
          {classificationData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={classificationData}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toFixed(2)}%`,
                    "Score",
                  ]}
                />
                <Bar
                  dataKey="value"
                  name="Score"
                  fill="#0d9488"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard
          title="Regression Error"
          description="MAE and RMSE on the synthetic regression target. Lower is generally better."
        >
          {regressionErrorData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={regressionErrorData}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    Number(value).toFixed(4),
                    "Error",
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="value"
                  name="Error"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="Regression R² Score"
        description="R² compares the model against a baseline that predicts the target mean."
      >
        {r2 !== null ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[{ name: "R²", value: r2 }]}
              margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ReferenceLine y={0} stroke="#64748b" />
              <Tooltip
                formatter={(value) => [
                  Number(value).toFixed(4),
                  "R² score",
                ]}
              />
              <Bar
                dataKey="value"
                name="R² score"
                fill="#7c3aed"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <strong>Research limitation:</strong> These metrics describe
        performance on synthetic demonstration data only. They do not
        establish diagnostic accuracy, medicine effectiveness, or
        suitability for clinical use. Regression errors are expressed
        in the target variable's units.
      </div>
    </div>
  );
}
