
import { useState } from "react";
import "./App.css";

// Group repeated findings without changing risk scoring.
function groupFindings(findings) {
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

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleImageChange(event) {
    const file = event.target.files[0];

    if (!file) return;

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

      const response = await fetch(
        "http://127.0.0.1:8000/detect",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Detection failed");
      }

      setResult(data);
    } catch (err) {
      setError(
        "Backend connect nahi hua. FastAPI server check karo. " +
          err.message
      );
    } finally {
      setLoading(false);
    }
  }

  const groupedFindings = result
    ? groupFindings(result.risk_analysis.findings)
    : [];

  return (
    <div className="app">
      <header className="header">
        <div className="logo">S</div>

        <div>
          <h2>SiteGuard AI</h2>
          <p>Construction Safety Monitoring</p>
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <span className="tag">
            AI-POWERED SITE ANALYSIS
          </span>

          <h1>
            Construction Safety
            <br />
            Dashboard
          </h1>

          <p>
            Upload a construction site image to detect
            objects and review a prototype site risk
            assessment using our YOLO model.
          </p>
        </section>

        <section className="stats">
          <div className="stat">
            <span>Detection Model</span>
            <h2>YOLO</h2>
          </div>

          <div className="stat">
            <span>Risk Analysis</span>
            <h2>Rule-based</h2>
          </div>

          <div className="stat">
            <span>System</span>
            <h2>
              {loading
                ? "Analyzing..."
                : result
                  ? "Analysis complete"
                  : "Ready"}
            </h2>
          </div>
        </section>

        <section className="content">
          <div className="panel">
            <h2>01. Upload Site Image</h2>

            <label className="upload">
              {preview ? (
                <img
                  src={preview}
                  alt="Selected construction site"
                />
              ) : (
                <>
                  <span className="upload-icon">＋</span>

                  <strong>
                    Choose a construction site photo
                  </strong>

                  <span>JPG, PNG or WEBP</span>
                </>
              )}

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
              />
            </label>

            {image && <p>{image.name}</p>}

            <button
              onClick={analyzeSite}
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Analyze Site →"}
            </button>

            {error && (
              <p className="error">{error}</p>
            )}
          </div>

          <div className="panel">
            <h2>02. Detection &amp; Risk Results</h2>

            {!result && (
              <div className="empty">
                <span>⌕</span>
                <h3>Awaiting image analysis</h3>

                <p>
                  Upload an image and click Analyze Site.
                </p>
              </div>
            )}

            {result && (
              <div>
                <div className="risk-card">
                  <span>Prototype Risk Score</span>

                  <h2>
                    {result.risk_analysis.risk_score}/100
                  </h2>

                  <strong>
                    {result.risk_analysis.risk_level} Risk
                  </strong>
                </div>

                <p>
                  Detected objects: {result.count}
                </p>

                {result.detections.length === 0 ? (
                  <p>
                    No objects detected above the current
                    threshold.
                  </p>
                ) : (
                  result.detections.map((item, index) => (
                    <div
                      className="detection"
                      key={`${item.class}-${index}`}
                    >
                      <span>{item.class}</span>

                      <strong>
                        {(item.confidence * 100).toFixed(1)}%
                      </strong>
                    </div>
                  ))
                )}

                <h3>Annotated Image</h3>

                <img
                  className="result-image"
                  src={`http://127.0.0.1:8000${result.result_image}`}
                  alt="YOLO detection output"
                />

                <h3>Risk Findings</h3>

                {groupedFindings.length === 0 ? (
                  <p>
                    No risk findings were generated for this
                    image. This does not guarantee site safety.
                  </p>
                ) : (
                  groupedFindings.map((item, index) => (
                    <div
                      className="detection"
                      key={`${item.hazard}-${index}`}
                    >
                      <div>
                        <strong>{item.hazard}</strong>

                        <p>
                          Severity: {item.severity}
                        </p>

                        <p>
                          Detection count: {item.count}
                        </p>

                        <p>
                          Highest confidence:{" "}
                          {(
                            item.highestConfidence * 100
                          ).toFixed(1)}%
                        </p>

                        {item.recommendation && (
                          <p className="recommendation">
                            <strong>
                              Recommendation:
                            </strong>{" "}
                            {item.recommendation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}

                <p className="note">
                  {result.risk_analysis.note}
                </p>
              </div>
            )}
          </div>
        </section>

        <footer>
          SiteGuard AI · Construction Safety Monitoring Prototype
          <p>Not a certified safety assessment.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
