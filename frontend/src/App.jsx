
import { useEffect, useState } from "react";
import {
  Activity,
  BrainCircuit,
  ChartNoAxesCombined,
  Pill,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import ModelPerformanceCharts from "./components/ModelPerformanceCharts";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const symptomOptions = [
  { key: "fever", label: "Fever" },
  { key: "cough", label: "Cough" },
  { key: "runny_nose", label: "Runny nose" },
  { key: "headache", label: "Headache" },
  { key: "stomach_pain", label: "Stomach pain" },
  { key: "nausea", label: "Nausea" },
  { key: "sore_throat", label: "Sore throat" },
  { key: "fatigue", label: "Fatigue" },
];

function Stat({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value ?? "—"}</p>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function MedicineResults({ medicines }) {
  if (!medicines || medicines.length === 0) {
    return (
      <div className="mt-4 rounded-xl bg-slate-50 p-4">
        <p className="font-medium text-slate-800">
          No validated medicine matches available
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          The current model predicts synthetic symptom categories only.
          It does not have a validated clinical mapping from symptoms to
          medicines. No medicine or dosage has been recommended.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {medicines.map((medicine, index) => (
        <article
          key={medicine.medicine_id || medicine.generic_name || index}
          className="rounded-xl border border-slate-200 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-semibold text-slate-900">
              {medicine.generic_name}
            </h4>

            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-900">
              Reference only
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-700">
            <strong>Recorded use:</strong>{" "}
            {medicine.approved_use || "Not established"}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-700">
            <strong>Contraindications:</strong>{" "}
            {medicine.contraindications || "Not established"}
          </p>

          <p className="mt-2 text-sm text-slate-700">
            <strong>Dosage:</strong>{" "}
            {medicine.dosage || "Not established"}
          </p>

          {medicine.source_url && (
            <a
              href={medicine.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm text-teal-700 underline"
            >
              View source
            </a>
          )}
        </article>
      ))}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("assistant");
  const [metrics, setMetrics] = useState(null);
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/analysis`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Training metrics unavailable. Check the backend.");
        }
        return response.json();
      })
      .then(setMetrics)
      .catch((err) => setError(err.message));
  }, []);

  function toggleSymptom(key) {
    setSelected((previous) =>
      previous.includes(key)
        ? previous.filter((symptom) => symptom !== key)
        : [...previous, key]
    );

    setResult(null);
    setError("");
  }

  async function assess() {
    if (selected.length === 0) {
      setError("Please select at least one symptom.");
      return;
    }

    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/assess`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symptoms: selected,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Assessment failed. Check your selected symptoms."
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err.message || "Could not connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  function clearSymptoms() {
    setSelected([]);
    setResult(null);
    setError("");
  }

  const classification = metrics?.classification;
  const regression = metrics?.regression;

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      {/* Sidebar */}
      <aside className="bg-slate-950 p-5 text-white md:min-h-screen md:w-64">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-500 p-2">
            <Activity size={24} />
          </div>

          <div>
            <h1 className="font-bold">MediInsight</h1>
            <p className="text-xs text-slate-400">
              Data Science Lab
            </p>
          </div>
        </div>

        <p className="mb-3 mt-10 text-xs uppercase tracking-widest text-slate-500">
          Workspace
        </p>

        <nav className="space-y-2">
          <button
            onClick={() => setPage("assistant")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${
              page === "assistant"
                ? "bg-teal-500 text-slate-950"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Stethoscope size={18} />
            Symptom Assessment
          </button>

          <button
            onClick={() => setPage("analysis")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${
              page === "analysis"
                ? "bg-teal-500 text-slate-950"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <ChartNoAxesCombined size={18} />
            Model Analysis
          </button>
        </nav>

        <div className="mt-10 rounded-xl border border-amber-700/50 bg-amber-950/40 p-3 text-xs leading-5 text-amber-200">
          Educational simulation only. Not for diagnosis or prescribing.
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 p-5 md:p-9">
        <header className="mb-8">
          <p className="text-sm font-medium text-teal-700">
            HEALTHCARE DATA SCIENCE
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-900">
            {page === "assistant"
              ? "Symptom Assessment"
              : "Model Analysis"}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {page === "assistant"
              ? "Explore the demonstration model and its assessment results."
              : "Evaluation results from your generated educational dataset."}
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            {error}
          </div>
        )}

        {/* Model analysis page */}
        {page === "analysis" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                label="Synthetic records"
                value={metrics?.records?.toLocaleString()}
                description="Generated educational examples"
              />

              <Stat
                label="Classification accuracy"
                value={
                  classification
                    ? `${(classification.accuracy * 100).toFixed(1)}%`
                    : "—"
                }
                description="Held-out synthetic test set"
              />

              <Stat
                label="Macro F1-score"
                value={
                  classification?.macro_f1 != null
                    ? classification.macro_f1.toFixed(3)
                    : "—"
                }
                description="Average across demo categories"
              />

              <Stat
                label="Regression MAE"
                value={
                  regression?.mae != null
                    ? regression.mae.toFixed(3)
                    : "—"
                }
                description="Error on artificial target"
              />
            </div>
            <ModelPerformanceCharts metrics={metrics} />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold">
                  Classification metrics
                </h3>

                <p className="mt-4 text-sm">
                  Macro precision:{" "}
                  {classification?.macro_precision?.toFixed(3) ?? "—"}
                </p>

                <p className="mt-2 text-sm">
                  Macro recall:{" "}
                  {classification?.macro_recall?.toFixed(3) ?? "—"}
                </p>

                <p className="mt-2 text-sm">
                  Macro F1:{" "}
                  {classification?.macro_f1?.toFixed(3) ?? "—"}
                </p>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold">
                  Regression metrics
                </h3>

                <p className="mt-4 text-sm">
                  MAE: {regression?.mae?.toFixed(3) ?? "—"}
                </p>

                <p className="mt-2 text-sm">
                  RMSE: {regression?.rmse?.toFixed(3) ?? "—"}
                </p>

                <p className="mt-2 text-sm">
                  R²: {regression?.r2?.toFixed(3) ?? "—"}
                </p>
              </section>
            </div>

            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              These metrics measure performance on synthetic data only.
              They do not establish diagnostic accuracy, treatment
              efficacy, or drug-relevance percentages.
            </div>
          </>
        ) : (
          <>
            {/* Symptom selection */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7">
              <div className="flex items-center gap-3">
                <BrainCircuit className="text-teal-700" size={25} />

                <div>
                  <h3 className="font-semibold">
                    Select symptoms
                  </h3>

                  <p className="text-sm text-slate-500">
                    Select the symptoms you want to use in the
                    educational model.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {symptomOptions.map((symptom) => (
                  <label
                    key={symptom.key}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
                      selected.includes(symptom.key)
                        ? "border-teal-600 bg-teal-50"
                        : "border-slate-200 hover:border-teal-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(symptom.key)}
                      onChange={() => toggleSymptom(symptom.key)}
                      className="accent-teal-700"
                    />

                    <span className="text-sm font-medium">
                      {symptom.label}
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={assess}
                  disabled={loading || selected.length === 0}
                  className="rounded-xl bg-teal-700 px-6 py-3 font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? "Running model..." : "Run demo assessment"}
                </button>

                <button
                  onClick={clearSymptoms}
                  disabled={loading || selected.length === 0}
                  className="rounded-xl border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  Clear selection
                </button>
              </div>
            </section>

            {/* Results only appear after assessment */}
            {result && (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 md:p-7">
                <h3 className="text-xl font-bold">
                  Assessment Results
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Demonstration category:{" "}
                  <strong>
                    {String(
                      result.predicted_demo_category || "Not available"
                    ).replaceAll("_", " ")}
                  </strong>
                </p>

                {/* Synthetic model output */}
                <h4 className="mt-6 font-semibold">
                  Model Output
                </h4>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  These percentages are model scores for synthetic
                  categories, not medicine relevance or effectiveness.
                </p>

                <div className="mt-4 space-y-4">
                  {(result.category_scores || []).map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-slate-700">
                          {item.label.replaceAll("_", " ")}
                        </span>

                        <span className="shrink-0 font-medium text-slate-700">
                          {(item.model_score * 100).toFixed(1)}% model score
                        </span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-teal-600"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, item.model_score * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Medicine references tied to the API assessment */}
                <section className="mt-6 rounded-xl bg-slate-50 p-5">
                  <div className="flex items-center gap-2">
                    <Pill size={20} className="text-teal-700" />

                    <h4 className="font-semibold">
                      Relevant Medicine References
                    </h4>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Only reference records returned by the assessment
                    endpoint are shown here. The current synthetic model
                    does not establish which medicine is appropriate
                    for the selected symptoms.
                  </p>

                  <MedicineResults
                    medicines={result.medicine_references}
                  />

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    No drug-relevance percentage or dosage is inferred
                    from the model scores. A medicine reference is not
                    a prescription.
                  </p>
                </section>

                {/* Safety information */}
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 font-semibold text-amber-950">
                    <ShieldAlert size={20} />
                    Safety and Limitations
                  </div>

                  <p className="mt-2 text-sm leading-6 text-amber-950">
                    {result.explanation}
                  </p>

                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-950">
                    {(result.warnings || []).map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
