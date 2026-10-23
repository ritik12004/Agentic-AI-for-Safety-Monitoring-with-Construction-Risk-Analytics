import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API = "http://127.0.0.1:8000";

const LEVEL = {
  High: "bg-red-600 text-white",
  Medium: "bg-amber-400 text-stone-900",
  Low: "bg-emerald-600 text-white",
};

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [env, setEnv] = useState({ rainfall_mm: "", wind_speed_kmh: "", temperature_c: "" });
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API}/assessments`);
      setHistory(await res.json());
    } catch {
      setError("Cannot reach the backend. Start it with: python -m uvicorn app:app --reload");
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    Object.entries(env).forEach(([k, v]) => v !== "" && form.append(k, v));
    try {
      const res = await fetch(`${API}/detect`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Analysis failed");
      setLatest(data);
      loadHistory();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const risk = latest?.agent?.combined_risk;
  const findings = latest?.agent?.risk_analysis?.findings ?? [];
  const envFindings = latest?.agent?.environmental_analysis?.findings ?? [];
  const concerns = latest?.compliance?.possible_concerns ?? [];

  const trend = [...history].reverse().map((h, i) => ({
    n: i + 1,
    score: h.combined_score,
  }));

  const classCounts = Object.entries(
    (latest?.detections ?? []).reduce((acc, d) => {
      acc[d.class] = (acc[d.class] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count }));

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="border-b-8 border-amber-400 bg-stone-900 px-6 py-5 text-stone-50">
        <h1 className="text-2xl font-bold">Site Risk Dashboard</h1>
        <p className="text-sm text-stone-300">
          Upload a site photo, add weather readings if you have them, and review the risk findings.
        </p>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-3">
        {/* Input */}
        <section className="space-y-3 rounded border border-stone-300 bg-white p-4">
          <h2 className="font-semibold">New assessment</h2>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm"
          />
          {[
            ["rainfall_mm", "Rainfall (mm)"],
            ["wind_speed_kmh", "Wind speed (km/h)"],
            ["temperature_c", "Temperature (°C)"],
          ].map(([key, label]) => (
            <label key={key} className="block text-sm">
              {label}
              <input
                type="number"
                value={env[key]}
                onChange={(e) => setEnv({ ...env, [key]: e.target.value })}
                className="mt-1 w-full rounded border border-stone-300 px-2 py-1"
              />
            </label>
          ))}
          <button
            onClick={analyze}
            disabled={!file || loading}
            className="w-full rounded bg-amber-400 py-2 font-semibold text-stone-900 hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-900 disabled:opacity-50"
          >
            {loading ? "Analyzing…" : "Analyze image"}
          </button>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </section>

        {/* Result */}
        <section className="space-y-4 lg:col-span-2">
          {!latest ? (
            <div className="rounded border border-dashed border-stone-400 bg-white p-10 text-center text-stone-500">
              No assessment yet. Upload an image to see detections and the risk score.
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded border border-stone-300 bg-white p-4">
                  <p className="text-sm text-stone-500">Combined risk score</p>
                  <p className="text-5xl font-bold">{risk.risk_score}</p>
                  <span className={`mt-2 inline-block rounded px-2 py-0.5 text-sm font-semibold ${LEVEL[risk.risk_level]}`}>
                    {risk.risk_level}
                  </span>
                </div>
                <div className="rounded border border-stone-300 bg-white p-4">
                  <p className="text-sm text-stone-500">Detections</p>
                  <p className="text-5xl font-bold">{latest.count}</p>
                  <p className="mt-2 text-sm">
                    Image score: {latest.risk_analysis.risk_score}
                  </p>
                </div>
                <div className="rounded border border-stone-300 bg-white p-4">
                  <p className="text-sm text-stone-500">PPE compliance</p>
                  <p className="text-xl font-bold">{latest.compliance.status}</p>
                  <p className="mt-2 text-sm">{concerns.length} concern(s) to review</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <img
                  src={`${API}${latest.result_image}`}
                  alt="Annotated site image with detected objects"
                  className="w-full rounded border border-stone-300 bg-white"
                />
                <div className="rounded border border-stone-300 bg-white p-4">
                  <h3 className="mb-2 font-semibold">Detected classes</h3>
                  {classCounts.length === 0 ? (
                    <p className="text-sm text-stone-500">Nothing detected above 25% confidence.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={classCounts} layout="vertical" margin={{ left: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="rounded border border-stone-300 bg-white p-4">
                <h3 className="mb-2 font-semibold">Findings to review</h3>
                <ul className="space-y-2 text-sm">
                  {[...envFindings.map((f) => ({ title: f.risk, tag: "Environment", text: f.recommendation })),
                    ...findings.map((f) => ({ title: f.hazard, tag: f.severity, text: f.recommendation }))]
                    .map((f, i) => (
                      <li key={i} className="border-l-4 border-amber-400 pl-3">
                        <span className="font-medium">{f.title}</span>{" "}
                        <span className="text-stone-500">({f.tag})</span>
                        <br />
                        {f.text}
                      </li>
                    ))}
                </ul>
                <p className="mt-3 text-xs text-stone-500">
                  Prototype score, not a certified safety assessment. A person must review the image before any safety action.
                </p>
              </div>
            </>
          )}

          {/* History */}
          <div className="rounded border border-stone-300 bg-white p-4">
            <h3 className="mb-2 font-semibold">Risk score over time</h3>
            {trend.length < 2 ? (
              <p className="text-sm text-stone-500">Run at least two assessments to see a trend.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="n" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line dataKey="score" stroke="#b45309" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-1">Time</th>
                    <th>Score</th>
                    <th>Level</th>
                    <th>Rain</th>
                    <th>Wind</th>
                    <th>Temp</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 10).map((h) => (
                    <tr key={h.image_id} className="border-b last:border-0">
                      <td className="py-1">{new Date(h.created_at).toLocaleString()}</td>
                      <td>{h.combined_score}</td>
                      <td>{h.risk_level}</td>
                      <td>{h.rainfall_mm ?? "–"}</td>
                      <td>{h.wind_speed_kmh ?? "–"}</td>
                      <td>{h.temperature_c ?? "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
