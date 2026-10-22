
import { useState } from "react";
import "./App.css";

// Group repeated findings without changing risk scoring.
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

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [rainfall, setRainfall] = useState("");
  const [windSpeed, setWindSpeed] = useState("");
  const [temperature, setTemperature] = useState("");

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

      if (rainfall.trim() !== "") {
        formData.append("rainfall_mm", rainfall);
      }

      if (windSpeed.trim() !== "") {
        formData.append("wind_speed_kmh", windSpeed);
      }

      if (temperature.trim() !== "") {
        formData.append("temperature_c", temperature);
      }

      const response = await fetch(
        "http://127.0.0.1:8000/detect",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map((item) => item.msg).join(", ")
          : data.detail;

        throw new Error(detail || "Detection failed.");
      }

      setResult(data);
    } catch (err) {
      setError(
        "Analysis failed. Check that the FastAPI server is running. " +
          err.message
      );
    } finally {
      setLoading(false);
    }
  }

  const groupedFindings = result
    ? groupFindings(result.risk_analysis?.findings)
    : [];

  const agent = result?.agent;
  const environmental = agent?.environmental_analysis;
  const combinedRisk = agent?.combined_risk;
  const compliance = result?.compliance;

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
            objects and review prototype site and
            environmental risk assessments.
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
                <img src={preview} alt="Selected site" />
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

            <h3>Environmental Conditions (Optional)</h3>

            <p>
              Enter available site measurements. Leave
              unknown values blank.
            </p>

            <label className="environment-field">
              Rainfall (mm)
              <input
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 25"
                value={rainfall}
                onChange={(event) =>
                  setRainfall(event.target.value)
                }
              />
            </label>

            <label className="environment-field">
              Wind Speed (km/h)
              <input
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 45"
                value={windSpeed}
                onChange={(event) =>
                  setWindSpeed(event.target.value)
                }
              />
            </label>

            <label className="environment-field">
              Temperature (°C)
              <input
                type="number"
                step="any"
                placeholder="e.g. 40"
                value={temperature}
                onChange={(event) =>
                  setTemperature(event.target.value)
                }
              />
            </label>

            <button
              onClick={analyzeSite}
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Analyze Site →"}
            </button>

            {error && <p className="error">{error}</p>}
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
                  <span>Object-Based Risk Score</span>
                  <h2>
                    {result.risk_analysis.risk_score}/100
                  </h2>
                  <strong>
                    {result.risk_analysis.risk_level} Risk
                  </strong>
                </div>

                {combinedRisk && (
                  <div className="risk-card">
                    <span>Combined Prototype Risk Score</span>
                    <h2>{combinedRisk.risk_score}/100</h2>
                    <strong>
                      {combinedRisk.risk_level} Risk
                    </strong>
                  </div>
                )}

                <p>Detected objects: {result.count}</p>

                <h3>Detected Objects</h3>

                {result.detections.length === 0 ? (
                  <p>
                    No objects detected above the current
                    threshold. This does not guarantee site safety.
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

                <h3>Compliance Agent Review</h3>

                {compliance ? (
                  <div className="detection">
                    <div>
                      <strong>{compliance.status}</strong>

                      <p>
                        Possible PPE concerns:{" "}
                        {compliance.possible_concerns?.length ?? 0}
                      </p>

                      {compliance.possible_concerns?.length > 0 ? (
                        compliance.possible_concerns.map(
                          (item, index) => (
                            <div key={`${item.class}-${index}`}>
                              <p>
                                <strong>{item.class}</strong>:{" "}
                                {item.message}
                              </p>
                              <p>
                                Confidence:{" "}
                                {(item.confidence * 100).toFixed(1)}%
                              </p>
                              <p>Human review required.</p>
                            </div>
                          )
                        )
                      ) : (
                        <p>
                          No possible missing-PPE labels were flagged.
                          This does not confirm full site compliance.
                        </p>
                      )}

                      {compliance.note && (
                        <p className="note">{compliance.note}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p>
                    Compliance review is not available for this result.
                  </p>
                )}

                <h3>Environmental Risk Findings</h3>

                {!environmental?.data_provided ? (
                  <p>
                    No environmental measurements were provided.
                  </p>
                ) : environmental.findings.length === 0 ? (
                  <p>
                    No environmental findings were triggered
                    by the current prototype thresholds.
                  </p>
                ) : (
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
                        <p className="recommendation">
                          <strong>Recommendation:</strong>{" "}
                          {item.recommendation}
                        </p>
                      </div>
                    </div>
                  ))
                )}

                {environmental && (
                  <p>
                    Environmental additional score:{" "}
                    {environmental.additional_score}
                  </p>
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
                    No object-based risk findings were generated.
                    This does not guarantee site safety.
                  </p>
                ) : (
                  groupedFindings.map((item, index) => (
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

                        {item.recommendation && (
                          <p className="recommendation">
                            <strong>Recommendation:</strong>{" "}
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

                {agent?.limitations?.length > 0 && (
                  <>
                    <h3>Prototype Limitations</h3>
                    <ul>
                      {agent.limitations.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}
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
