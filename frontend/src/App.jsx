
import { useState } from "react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import "./App.css";

const API = "http://127.0.0.1:8000";

function groupFindings(findings = []) {
  const grouped = {};

  findings.forEach((item) => {
    const key = item.hazard;

    if (!grouped[key]) {
      grouped[key] = {
        ...item,
        count: 0,
        highestConfidence: 0,
      };
    }

    grouped[key].count += 1;
    grouped[key].highestConfidence = Math.max(
      grouped[key].highestConfidence,
      item.confidence ?? 0
    );
  });

  return Object.values(grouped);
}

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();

    if (username === "admin" && password === "admin@123") {
      setError("");
      onLogin();
    } else {
      setError("Invalid ID or password.");
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="logo login-logo">S</div>

        <span className="tag">CONSTRUCTION SAFETY</span>

        <h1>Welcome to Suraksha</h1>

        <p className="login-description">
          Sign in to access your construction site monitoring dashboard.
        </p>

        <label className="environment-field">
          Admin ID
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter admin ID"
            autoComplete="username"
            required
          />
        </label>

        <label className="environment-field">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit">Sign In →</button>

        <p className="note">
          Development login for the current prototype.
        </p>
      </form>
    </div>
  );
}

function Sidebar({ onLogout }) {
  const links = [
    { to: "/", label: "Dashboard", icon: "▦" },
    { to: "/monitoring", label: "Site Monitoring", icon: "⌕" },
    { to: "/environment", label: "Environmental Assessment", icon: "◉" },
    { to: "/compliance", label: "Safety & Compliance", icon: "✓" },
    { to: "/reports", label: "Risk Reports", icon: "▤" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo">S</div>

        <div>
          <h2>Suraksha</h2>
          <p>Construction Safety</p>
        </div>
      </div>

      <p className="sidebar-label">WORKSPACE</p>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="admin-profile">
          <div className="avatar">A</div>

          <div className="admin-details">
            <strong>Administrator</strong>
            <p>Local prototype</p>
          </div>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={onLogout}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
            <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
          </svg>

          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}

function PageHeader({ title, subtitle }) {
  return (
    <header className="page-heading">
      <div className="page-heading-content">
        <span className="tag">SURAKSHA / WORKSPACE</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <span className="status-pill">● Prototype</span>
    </header>
  );
}

function StatCard({ label, value, detail }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <h2>{value}</h2>
      <p>{detail}</p>
    </div>
  );
}

function Dashboard({ result }) {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="An overview of site monitoring and safety assessments."
      />

      <section className="stats">
        <StatCard
          label="Monitoring System"
          value="Ready"
          detail="Object detection enabled"
        />

        <StatCard
          label="Detected Objects"
          value={result ? result.count : "—"}
          detail="Latest assessment"
        />

        <StatCard
          label="Risk Score"
          value={
            result
              ? `${result.risk_analysis?.risk_score ?? 0}/100`
              : "—"
          }
          detail={
            result?.risk_analysis?.risk_level ?? "Awaiting assessment"
          }
        />

        <StatCard
          label="Assessment Status"
          value={result ? "Completed" : "Ready"}
          detail="Current session"
        />
      </section>

      <section className="panel">
        <h2>Welcome to Suraksha</h2>

        <p>
          Monitor construction sites, review detected objects, assess
          environmental conditions and examine potential safety concerns
          from one workspace.
        </p>

        <p className="note">
          Risk scores are preliminary estimates. They are not certified
          safety decisions, and a low score does not confirm that a site
          is safe.
        </p>

        <div className="panel-action-row">
          <NavLink className="page-action" to="/monitoring">
            Open Site Monitoring →
          </NavLink>
        </div>
      </section>

      <section className="panel">
        <h2>Latest Assessment</h2>

        {result ? (
          <>
            <p>Detected objects: {result.count}</p>

            <p>
              Risk level:{" "}
              {result.risk_analysis?.risk_level ?? "Unavailable"}
            </p>

            <p>Assessment ID: {result.image_id ?? "Not provided"}</p>

            <div className="panel-action-row">
              <NavLink className="page-action" to="/reports">
                View Risk Reports →
              </NavLink>
            </div>
          </>
        ) : (
          <p>No assessment available in this session yet.</p>
        )}
      </section>
    </>
  );
}

function SiteMonitoring({ analysis }) {
  return (
    <>
      <PageHeader
        title="Site Monitoring"
        subtitle="Upload a construction site image to review detected objects."
      />

      <section className="panel">
        <h2>Construction Site Image</h2>

        <label className="upload">
          {analysis.preview ? (
            <img
              src={analysis.preview}
              alt="Selected construction site"
            />
          ) : (
            <>
              <span className="upload-icon">＋</span>
              <strong>Choose a construction site photo</strong>
              <span>JPG, PNG or WEBP</span>
            </>
          )}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={analysis.handleImageChange}
          />
        </label>

        {analysis.image && <p>Selected: {analysis.image.name}</p>}

        <div className="monitoring-action-row">
          <button
            type="button"
            className="monitoring-submit"
            onClick={analysis.analyzeSite}
            disabled={analysis.loading}
          >
            {analysis.loading ? "Processing image..." : "Access Site →"}
          </button>
        </div>

        {analysis.error && <p className="error">{analysis.error}</p>}
      </section>

      {analysis.result && (
        <section className="panel">
          <h2>Assessment Results</h2>

          <div className="risk-card">
            <span>Preliminary Risk Score</span>

            <h2>
              {analysis.result.risk_analysis?.risk_score ?? "—"}/100
            </h2>

            <strong>
              {analysis.result.risk_analysis?.risk_level ?? "Unknown"} Risk
            </strong>
          </div>

          <p>Objects detected: {analysis.result.count}</p>

          {analysis.result.detections?.length ? (
            analysis.result.detections.map((item, index) => (
              <div
                className="detection"
                key={`${item.class}-${index}`}
              >
                <span>{item.class}</span>

                <strong>
                  {((item.confidence ?? 0) * 100).toFixed(1)}%
                </strong>
              </div>
            ))
          ) : (
            <p>
              No objects were detected above the current detection
              threshold.
            </p>
          )}

          <h3>Processed Image</h3>

          {analysis.result.result_image && (
            <img
              className="result-image"
              src={`${API}${analysis.result.result_image}`}
              alt="Processed construction site image with detection annotations"
            />
          )}

          <p className="note">
            Detected objects are automated predictions and may be
            incorrect. Review the original image and actual site
            conditions before making safety decisions.
          </p>
        </section>
      )}
    </>
  );
}

function EnvironmentPage({ analysis }) {
  const environmental = analysis.result?.agent?.environmental_analysis;

  return (
    <>
      <PageHeader
        title="Environmental Assessment"
        subtitle="Record available weather measurements for site assessment."
      />

      <section className="panel">
        <h2>Environmental Conditions</h2>
        <p>Leave unknown measurements blank.</p>

        <label className="environment-field">
          Rainfall (mm)
          <input
            type="number"
            min="0"
            step="any"
            value={analysis.rainfall}
            onChange={(e) => analysis.setRainfall(e.target.value)}
            placeholder="e.g. 25"
          />
        </label>

        <label className="environment-field">
          Wind Speed (km/h)
          <input
            type="number"
            min="0"
            step="any"
            value={analysis.windSpeed}
            onChange={(e) => analysis.setWindSpeed(e.target.value)}
            placeholder="e.g. 45"
          />
        </label>

        <label className="environment-field">
          Temperature (°C)
          <input
            type="number"
            step="any"
            value={analysis.temperature}
            onChange={(e) => analysis.setTemperature(e.target.value)}
            placeholder="e.g. 35"
          />
        </label>

        <p className="note">
          Rainfall, wind speed and temperature are connected to the
          existing assessment service. Visibility and ground condition
          are not currently connected.
        </p>

        <NavLink className="page-action" to="/monitoring">
          Select an Image and Assess →
        </NavLink>
      </section>

      {analysis.result && (
        <section className="panel">
          <h2>Environmental Findings</h2>

          {environmental?.data_provided ? (
            <>
              <p>
                Additional risk score: {environmental.additional_score}
              </p>

              {environmental.findings?.length ? (
                environmental.findings.map((item, index) => (
                  <div
                    className="detection"
                    key={`${item.risk}-${index}`}
                  >
                    <div>
                      <strong>{item.risk}</strong>
                      <p>
                        Measured value: {item.value} {item.unit}
                      </p>
                      <p>{item.recommendation}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p>
                  No findings were triggered by the current assessment
                  thresholds.
                </p>
              )}
            </>
          ) : (
            <p>
              No environmental measurements were included in the
              latest assessment.
            </p>
          )}
        </section>
      )}
    </>
  );
}

function CompliancePage({ result }) {
  const compliance = result?.compliance;
  const findings = groupFindings(result?.risk_analysis?.findings);

  return (
    <>
      <PageHeader
        title="Safety & Compliance"
        subtitle="Review possible protective equipment concerns and risk findings."
      />

      <section className="panel">
        <h2>Safety Compliance Review</h2>

        {!result ? (
          <p>Assess a site image to view compliance findings.</p>
        ) : compliance ? (
          <>
            <h3>{compliance.status}</h3>

            <p>
              Possible protective equipment concerns:{" "}
              {compliance.possible_concerns?.length ?? 0}
            </p>

            {compliance.possible_concerns?.length ? (
              compliance.possible_concerns.map((item, index) => (
                <div
                  className="detection"
                  key={`${item.class}-${index}`}
                >
                  <div>
                    <strong>{item.class}</strong>
                    <p>{item.message}</p>
                    <p>
                      Detection confidence:{" "}
                      {((item.confidence ?? 0) * 100).toFixed(1)}%
                    </p>
                    <p>Manual review required.</p>
                  </div>
                </div>
              ))
            ) : (
              <p>
                No possible missing protective equipment labels were
                flagged by the detection system.
              </p>
            )}

            {compliance.note && <p className="note">{compliance.note}</p>}
          </>
        ) : (
          <p>Compliance results are unavailable for this assessment.</p>
        )}
      </section>

      <section className="panel">
        <h2>Risk Findings</h2>

        {!result ? (
          <p>No assessment available.</p>
        ) : findings.length ? (
          findings.map((item, index) => (
            <div
              className="detection"
              key={`${item.hazard}-${index}`}
            >
              <div>
                <strong>{item.hazard}</strong>
                <p>Severity: {item.severity}</p>
                <p>Detection count: {item.count}</p>
                <p>
                  Highest confidence:{" "}
                  {(item.highestConfidence * 100).toFixed(1)}%
                </p>
                {item.recommendation && <p>{item.recommendation}</p>}
              </div>
            </div>
          ))
        ) : (
          <p>No object-based risk findings were generated.</p>
        )}
      </section>
    </>
  );
}

function ReportsPage({ result }) {
  const details = result?.gemini_analysis;

  const explanation =
    typeof details === "string"
      ? details
      : details?.explanation ?? details?.message ?? "";

  const recommendations = Array.isArray(details?.recommendations)
    ? details.recommendations
    : [];

  return (
    <>
      <PageHeader
        title="Risk Reports"
        subtitle="Review the latest assessment, findings and recommendations."
      />

      {!result ? (
        <section className="panel">
          <h2>No Report Available</h2>
          <p>Assess a construction site image to generate a report.</p>

          <NavLink className="page-action" to="/monitoring">
            Go to Site Monitoring →
          </NavLink>
        </section>
      ) : (
        <>
          <section className="panel">
            <h2>Assessment Summary</h2>

            <div className="risk-card">
              <span>Preliminary Risk Score</span>
              <h2>{result.risk_analysis?.risk_score ?? "—"}/100</h2>
              <strong>
                {result.risk_analysis?.risk_level ?? "Unknown"} Risk
              </strong>
            </div>

            {result.agent?.combined_risk && (
              <div className="risk-card">
                <span>Combined Assessment Score</span>
                <h2>{result.agent.combined_risk.risk_score}/100</h2>
                <strong>{result.agent.combined_risk.risk_level} Risk</strong>
              </div>
            )}

            <p>Detected objects: {result.count}</p>

            {result.risk_analysis?.note && (
              <p>{result.risk_analysis.note}</p>
            )}
          </section>

          <section className="panel">
            <h2>Assessment Explanation</h2>

            {explanation ? (
              <div className="ai-explanation">
                <p>{explanation}</p>
              </div>
            ) : (
              <p>
                No additional explanation was returned for this assessment.
              </p>
            )}

            {recommendations.length > 0 && (
              <>
                <h3>Recommendations</h3>
                <ul>
                  {recommendations.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </>
            )}

            <p className="note">
              Assessment findings may be incomplete or incorrect and
              require human review. This page displays the latest result
              held in the current browser session, not the complete
              database history.
            </p>
          </section>
        </>
      )}
    </>
  );
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rainfall, setRainfall] = useState("");
  const [windSpeed, setWindSpeed] = useState("");
  const [temperature, setTemperature] = useState("");

  const navigate = useNavigate();

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
  }

  async function analyzeSite() {
    if (!image) {
      setError("Please select a site image first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", image);

      if (rainfall.trim() !== "") {
        formData.append("rainfall_mm", rainfall);
      }

      if (windSpeed.trim() !== "") {
        formData.append("wind_speed_kmh", windSpeed);
      }

      if (temperature.trim() !== "") {
        formData.append("temperature_c", temperature);
      }

      const response = await fetch(`${API}/detect`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map((item) => item.msg).join(", ")
          : data.detail;

        throw new Error(detail || "Site assessment failed.");
      }

      setResult(data);
      navigate("/reports");
    } catch (err) {
      setError(
        "Assessment failed. Check that the backend server is running. " +
          err.message
      );
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setLoggedIn(false);
    navigate("/");
  }

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  const analysis = {
    image,
    preview,
    result,
    loading,
    error,
    rainfall,
    windSpeed,
    temperature,
    setRainfall,
    setWindSpeed,
    setTemperature,
    handleImageChange,
    analyzeSite,
  };

  return (
    <div className="app-shell">
      <Sidebar onLogout={logout} />

      <main className="workspace">
        <Routes>
          <Route path="/" element={<Dashboard result={result} />} />

          <Route
            path="/monitoring"
            element={<SiteMonitoring analysis={analysis} />}
          />

          <Route
            path="/environment"
            element={<EnvironmentPage analysis={analysis} />}
          />

          <Route
            path="/compliance"
            element={<CompliancePage result={result} />}
          />

          <Route
            path="/reports"
            element={<ReportsPage result={result} />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <footer className="workspace-footer">
          Suraksha · Construction Safety & Risk Monitoring
          <p>Not a certified safety assessment.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
