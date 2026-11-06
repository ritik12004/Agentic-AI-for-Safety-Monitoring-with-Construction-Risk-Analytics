
import { useEffect, useState } from "react";
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
    const key = item.hazard || "Other finding";

    if (!grouped[key]) {
      grouped[key] = { ...item, count: 0, highestConfidence: 0 };
    }

    grouped[key].count += 1;
    grouped[key].highestConfidence = Math.max(
      grouped[key].highestConfidence,
      item.confidence ?? 0
    );
  });

  return Object.values(grouped);
}

/* ================================
   LOGIN
================================ */

function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/signup";

      const body =
        mode === "login"
          ? { username: username.trim(), password }
          : { name: name.trim(), email: username.trim(), password };

      const response = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map((item) => item.msg).join(", ")
          : data.detail;

        throw new Error(detail || "Request failed.");
      }

      if (mode === "signup") {
        setMode("login");
        setPassword("");
        setError("Account created. Please sign in.");
        return;
      }

      onLogin(data.access_token, data.user);
    } catch (err) {
      setError(err.message || "Could not connect to backend.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="logo login-logo">S</div>
        <span className="tag">CONSTRUCTION SAFETY</span>

        <h1>
          {mode === "login" ? "Welcome to Suraksha" : "Create your account"}
        </h1>

        <p className="login-description">
          {mode === "login"
            ? "Sign in to access your construction site monitoring dashboard."
            : "Create a user account to access Suraksha."}
        </p>

        {mode === "signup" && (
          <label className="environment-field">
            Full name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              autoComplete="name"
              maxLength={100}
              required
            />
          </label>
        )}

        <label className="environment-field">
          {mode === "login" ? "Username or email" : "Email"}
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username or email"
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
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            minLength={mode === "signup" ? 8 : 1}
            maxLength={128}
            required
          />
        </label>

        {error && (
          <p className={error.startsWith("Account created") ? "note" : "error"}>
            {error}
          </p>
        )}

        <button type="submit" disabled={busy}>
          {busy
            ? "Please wait..."
            : mode === "login"
              ? "Sign In →"
              : "Create Account →"}
        </button>

        <p className="note">
          {mode === "login" ? "New user? " : "Already have an account? "}
          <button
            type="button"
            className="logout-button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
              setPassword("");
            }}
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </form>
    </div>
  );
}

/* ================================
   SIDEBAR
================================ */

function Sidebar({ onLogout, user, unreadCount }) {
  const links = [
    { to: "/", label: "Dashboard", icon: "▦" },
    { to: "/monitoring", label: "Site Monitoring", icon: "⌕" },
    { to: "/alerts", label: "Smart Alert Center", icon: "🔔" },
    { to: "/compliance", label: "Safety & Compliance", icon: "✓" },
    { to: "/reports", label: "Assessment Results", icon: "▤" },
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

            {link.to === "/alerts" && unreadCount > 0 && (
              <span className="alert-count">{unreadCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="admin-profile">
          <div className="avatar">
            {(user?.name || user?.role || "U").charAt(0).toUpperCase()}
          </div>

          <div className="admin-details">
            <strong>{user?.name || user?.email || "User"}</strong>
            <p>
              {user?.role === "admin" ? "Administrator" : "Standard user"}
            </p>
          </div>
        </div>

        <button type="button" className="logout-button" onClick={onLogout}>
          <span>↪</span>
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}

/* ================================
   COMMON COMPONENTS
================================ */

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

/* ================================
   DASHBOARD
================================ */

function Dashboard({ result, unreadCount }) {
  const workflow = result?.day3_safety_workflow;

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
            result ? `${result.risk_analysis?.risk_score ?? 0}/100` : "—"
          }
          detail={result?.risk_analysis?.risk_level ?? "Awaiting assessment"}
        />

        <StatCard
          label="Unread Alerts"
          value={unreadCount}
          detail="Awaiting safety review"
        />
      </section>

      <section className="panel">
        <h2>Welcome to Suraksha</h2>

        <p>
          Monitor construction sites, detect potential hazards, review
          protective equipment concerns and track safety alerts from one
          workspace.
        </p>

        <p className="note">
          Automated predictions are preliminary. They are not certified safety
          decisions, and a low score does not confirm that a site is safe.
        </p>

        <div className="panel-action-row">
          <NavLink className="page-action" to="/monitoring">
            Open Site Monitoring →
          </NavLink>

          <NavLink className="page-action" to="/alerts">
            Open Smart Alert Center →
          </NavLink>
        </div>
      </section>

      <section className="panel">
        <h2>Latest Assessment</h2>

        {result ? (
          <>
            <p>Detected objects: {result.count}</p>
            <p>
              Risk level: {result.risk_analysis?.risk_level ?? "Unavailable"}
            </p>
            <p>Assessment ID: {result.image_id}</p>
            <p>
              Safety workflow:{" "}
              {workflow?.decision?.replaceAll("_", " ") || "Unavailable"}
            </p>

            <NavLink className="page-action" to="/reports">
              View Assessment Results →
            </NavLink>
          </>
        ) : (
          <>
            <p>No assessment available in this session yet.</p>
            <NavLink className="page-action" to="/monitoring">
              Start Site Monitoring →
            </NavLink>
          </>
        )}
      </section>
    </>
  );
}

/* ================================
   SITE MONITORING
================================ */

function SiteMonitoring({ analysis }) {
  return (
    <>
      <PageHeader
        title="Site Monitoring"
        subtitle="Upload a construction site image to start an AI-powered assessment."
      />

      <section className="panel">
        <h2>Upload Site Image</h2>

        <p>
          Select a construction site image. Suraksha will analyze the image and
          display the complete assessment on the Assessment Results page.
        </p>

        <label className="upload">
          {analysis.preview ? (
            <img src={analysis.preview} alt="Selected construction site" />
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

        {analysis.image && <p>Selected image: {analysis.image.name}</p>}

        <div className="monitoring-action-row">
          <button
            type="button"
            className="monitoring-submit"
            onClick={analysis.analyzeSite}
            disabled={analysis.loading || !analysis.image}
          >
            {analysis.loading ? "Analyzing Site..." : "Analyze Image →"}
          </button>
        </div>

        {analysis.error && <p className="error">{analysis.error}</p>}

        {analysis.loading && (
          <p className="note">
            Please wait. The Safety Agent and Risk Analysis are processing your
            image. You will be redirected to Assessment Results automatically.
          </p>
        )}
      </section>
    </>
  );
}

/* ================================
   SAFETY AND COMPLIANCE
================================ */

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
                <div className="detection" key={`${item.class}-${index}`}>
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
              <p>No possible missing protective equipment labels were flagged.</p>
            )}

            {compliance.note && <p className="note">{compliance.note}</p>}
          </>
        ) : (
          <p>Compliance results are unavailable.</p>
        )}
      </section>

      <section className="panel">
        <h2>Risk Findings</h2>

        {!result ? (
          <p>No assessment available.</p>
        ) : findings.length ? (
          findings.map((item, index) => (
            <div className="detection" key={`${item.hazard}-${index}`}>
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

/* ================================
   SMART ALERT CENTER
================================ */

function AlertCenter({ alerts, unreadCount, refreshAlerts, token }) {
  const [updatingId, setUpdatingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function handleRefresh() {
    setRefreshing(true);
    setError("");

    try {
      await refreshAlerts();
    } catch (err) {
      setError(err.message || "Could not refresh alerts.");
    } finally {
      setRefreshing(false);
    }
  }

  async function updateAlert(id, status) {
    setUpdatingId(id);
    setError("");

    try {
      const response = await fetch(`${API}/alerts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not update alert.");
      }

      await refreshAlerts();
    } catch (err) {
      setError(err.message || "Could not update alert.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Smart Alert Center"
        subtitle="Review possible safety concerns generated by the Safety Agent."
      />

      <section className="stats">
        <StatCard
          label="Total Alerts"
          value={alerts.length}
          detail="Saved safety alerts"
        />

        <StatCard
          label="Unread"
          value={unreadCount}
          detail="Awaiting review"
        />

        <StatCard
          label="Acknowledged"
          value={alerts.filter((a) => a.status === "Acknowledged").length}
          detail="Review started"
        />

        <StatCard
          label="Resolved"
          value={alerts.filter((a) => a.status === "Resolved").length}
          detail="Marked resolved"
        />
      </section>

      <section className="panel">
        <div className="panel-action-row">
          <h2>Safety Notifications</h2>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        {alerts.length === 0 ? (
          <p>No alerts found. New Safety Agent alerts will appear here.</p>
        ) : (
          alerts.map((alert) => (
            <div className="detection" key={alert.id}>
              <div>
                <strong>{alert.title}</strong>
                <p>{alert.message}</p>
                <p>
                  Severity: <strong>{alert.severity}</strong>
                </p>
                <p>
                  Confidence:{" "}
                  {((alert.confidence ?? 0) * 100).toFixed(1)}%
                </p>
                <p>Assessment ID: {alert.image_id}</p>
                <p>
                  Status: <strong>{alert.status}</strong>
                </p>
                <p>
                  {alert.created_at
                    ? new Date(alert.created_at).toLocaleString()
                    : "Date unavailable"}
                </p>

                {alert.status === "Unread" && (
                  <button
                    type="button"
                    disabled={updatingId === alert.id}
                    onClick={() => updateAlert(alert.id, "Acknowledged")}
                  >
                    {updatingId === alert.id
                      ? "Updating..."
                      : "Acknowledge"}
                  </button>
                )}

                {alert.status !== "Resolved" && (
                  <button
                    type="button"
                    disabled={updatingId === alert.id}
                    onClick={() => updateAlert(alert.id, "Resolved")}
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        <p className="note">
          These are prototype alerts based on automated PPE predictions.
          They do not confirm an actual violation or identify individual
          workers. Human review is required.
        </p>
      </section>
    </>
  );
}

/* ================================
   SAFETY WORKFLOW
================================ */

function SafetyWorkflow({ result }) {
  const workflow = result?.day3_safety_workflow;

  return (
    <section className="panel">
      <h2>Safety Agent & LangGraph Workflow</h2>

      {!workflow ? (
        <p>Day 3 workflow information is not available.</p>
      ) : (
        <>
          <div className="risk-card">
            <span>LangGraph Final Decision</span>
            <h2>
              {workflow.decision?.replaceAll("_", " ") || "Unavailable"}
            </h2>

            <strong>
              {workflow.decision === "pending_safety_review"
                ? "Safety Review Required"
                : workflow.decision === "no_violation_detected"
                  ? "No Findings Reported"
                  : "Workflow Status"}
            </strong>
          </div>

          <div className="detection">
            <div>
              <strong>YOLOv8 Prediction</strong>
              <p>Image detection results received.</p>
            </div>
            <strong>Completed</strong>
          </div>

          <div className="detection">
            <div>
              <strong>Safety Agent Analysis</strong>
              <p>Safety findings processed.</p>
            </div>
            <strong>Completed</strong>
          </div>

          <div className="detection">
            <div>
              <strong>LangGraph Conditional Routing</strong>
              <p>
                {workflow.decision === "pending_safety_review"
                  ? "Findings returned for safety review."
                  : "No findings returned by the workflow."}
              </p>
            </div>

            <strong>
              {workflow.decision === "pending_safety_review"
                ? "Alert Route"
                : "No-Finding Route"}
            </strong>
          </div>

          <h3>Safety Agent Findings</h3>

          {workflow.findings?.length ? (
            workflow.findings.map((item, index) => (
              <div className="detection" key={index}>
                <div>
                  <strong>
                    {typeof item === "string"
                      ? item
                      : item.hazard ||
                        item.class ||
                        item.message ||
                        `Finding ${index + 1}`}
                  </strong>

                  {typeof item === "object" && item !== null && (
                    <>
                      {item.message && <p>{item.message}</p>}
                      {item.recommendation && <p>{item.recommendation}</p>}
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p>No findings were returned by the Safety Agent.</p>
          )}
        </>
      )}

      <p className="note">
        Automated detections are preliminary and require human review.
      </p>
    </section>
  );
}

/* ================================
   ASSESSMENT RESULTS
================================ */

function ReportsPage({ result, processedImage }) {
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
        title="Assessment Results"
        subtitle="Review the complete results of your construction site assessment."
      />

      {!result ? (
        <section className="panel">
          <h2>No Assessment Available</h2>
          <p>
            Upload a construction site image from Site Monitoring to generate
            assessment results.
          </p>

          <NavLink className="page-action" to="/monitoring">
            Go to Site Monitoring →
          </NavLink>
        </section>
      ) : (
        <>
          <section className="panel">
            <h2>Processed Site Image</h2>

            {processedImage ? (
              <img
                className="result-image"
                src={processedImage}
                alt="Processed construction site with detection annotations"
              />
            ) : (
              <p>Processed image is not available.</p>
            )}

            <p className="note">
              The displayed image contains automated object detection
              predictions. Please verify the observations manually.
            </p>
          </section>

          <section className="panel">
            <h2>Assessment Summary</h2>

            <div className="stats">
              <StatCard
                label="Detected Objects"
                value={result.count ?? 0}
                detail="Objects identified"
              />

              <StatCard
                label="Risk Score"
                value={`${result.risk_analysis?.risk_score ?? "—"}/100`}
                detail="Preliminary score"
              />

              <StatCard
                label="Risk Level"
                value={result.risk_analysis?.risk_level ?? "Unknown"}
                detail="Site risk assessment"
              />

              <StatCard
                label="Assessment ID"
                value={result.image_id ?? "—"}
                detail="Current assessment"
              />
            </div>

            {result.risk_analysis?.note && (
              <p className="note">{result.risk_analysis.note}</p>
            )}
          </section>

          <section className="panel">
            <h2>Detected Objects</h2>

            {result.detections?.length ? (
              result.detections.map((item, index) => (
                <div className="detection" key={`${item.class}-${index}`}>
                  <div>
                    <strong>{item.class}</strong>
                  </div>

                  <strong>
                    {((item.confidence ?? 0) * 100).toFixed(1)}%
                  </strong>
                </div>
              ))
            ) : (
              <p>
                No objects were detected above the current detection threshold.
              </p>
            )}
          </section>

          <SafetyWorkflow result={result} />

          <section className="panel">
            <h2>Risk Findings</h2>

            {groupFindings(result.risk_analysis?.findings).length ? (
              groupFindings(result.risk_analysis?.findings).map(
                (item, index) => (
                  <div className="detection" key={`${item.hazard}-${index}`}>
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
                )
              )
            ) : (
              <p>No object-based risk findings were generated.</p>
            )}
          </section>

          <section className="panel">
            <h2>Assessment Explanation</h2>

            {explanation ? (
              <div className="ai-explanation">
                <p>{explanation}</p>
              </div>
            ) : (
              <p>No additional explanation was returned.</p>
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
              Assessment findings may be incomplete or incorrect and require
              human review. This is a prototype assessment, not a certified
              safety decision.
            </p>
          </section>
        </>
      )}
    </>
  );
}

/* ================================
   MAIN APP
================================ */

function App() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("suraksha_token") || ""
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("suraksha_user") || "null");
    } catch {
      return null;
    }
  });

  const loggedIn = Boolean(token && user);

  const [processedImage, setProcessedImage] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();

  /* Load and refresh alerts */

  async function refreshAlerts() {
    if (!token) {
      throw new Error("Please sign in again to load alerts.");
    }

    const response = await fetch(`${API}/alerts`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Could not load alerts. Please try again."
      );
    }

    setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
    setUnreadCount(data.unread_count ?? 0);

    return data;
  }

  useEffect(() => {
    if (token) {
      refreshAlerts().catch((err) => {
        console.error("Alert loading error:", err);
      });
    }
  }, [token]);

  /* Image selection */

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (preview) URL.revokeObjectURL(preview);
    if (processedImage) URL.revokeObjectURL(processedImage);

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setProcessedImage("");
    setResult(null);
    setError("");
  }

  /* Run assessment */

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

      const response = await fetch(`${API}/detect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

      if (data.result_image) {
        const imageResponse = await fetch(`${API}${data.result_image}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob();
          const imageUrl = URL.createObjectURL(imageBlob);
          setProcessedImage(imageUrl);
        } else {
          setProcessedImage("");
        }
      } else {
        setProcessedImage("");
      }

      await refreshAlerts();

      navigate("/reports");
    } catch (err) {
      setError(
        "Assessment failed. Check that the backend is running. " + err.message
      );
    } finally {
      setLoading(false);
    }
  }

  /* Logout */

  function logout() {
    sessionStorage.removeItem("suraksha_token");
    sessionStorage.removeItem("suraksha_user");

    if (preview) URL.revokeObjectURL(preview);
    if (processedImage) URL.revokeObjectURL(processedImage);

    setToken("");
    setUser(null);
    setResult(null);
    setImage(null);
    setPreview("");
    setProcessedImage("");
    setAlerts([]);
    setUnreadCount(0);

    navigate("/");
  }

  /* Login */

  function handleLogin(accessToken, account) {
    sessionStorage.setItem("suraksha_token", accessToken);
    sessionStorage.setItem("suraksha_user", JSON.stringify(account));

    setToken(accessToken);
    setUser(account);
  }

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const analysis = {
    image,
    preview,
    loading,
    error,
    handleImageChange,
    analyzeSite,
  };

  return (
    <div className="app-shell">
      <Sidebar
        onLogout={logout}
        user={user}
        unreadCount={unreadCount}
      />

      <main className="workspace">
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                result={result}
                unreadCount={unreadCount}
              />
            }
          />

          <Route
            path="/monitoring"
            element={<SiteMonitoring analysis={analysis} />}
          />

          <Route
            path="/alerts"
            element={
              <AlertCenter
                alerts={alerts}
                unreadCount={unreadCount}
                refreshAlerts={refreshAlerts}
                token={token}
              />
            }
          />

          <Route
            path="/compliance"
            element={<CompliancePage result={result} />}
          />

          <Route
            path="/reports"
            element={
              <ReportsPage
                result={result}
                processedImage={processedImage}
              />
            }
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
