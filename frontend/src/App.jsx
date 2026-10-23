
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8080/api/applications";

const emptyForm = {
  companyName: "",
  jobRole: "",
  applicationDate: new Date().toISOString().slice(0, 10),
  status: "APPLIED",
  jobLink: "",
  notes: "",
};

const statuses = [
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
];

function App() {
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadApplications() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Could not load applications");
      setApplications(await response.json());
    } catch (error) {
      setMessage(
        "Cannot connect to the backend. Make sure Spring Boot is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await fetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      if (!response.ok) {
        throw new Error("Could not save the application");
      }

      setForm(emptyForm);
      setEditingId(null);
      setMessage(editingId ? "Application updated!" : "Application added!");
      await loadApplications();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function startEdit(application) {
    setEditingId(application.id);
    setForm({
      companyName: application.companyName ?? "",
      jobRole: application.jobRole ?? "",
      applicationDate: application.applicationDate ?? "",
      status: application.status ?? "APPLIED",
      jobLink: application.jobLink ?? "",
      notes: application.notes ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteApplication(id) {
    if (!window.confirm("Delete this application?")) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Could not delete the application");
      setMessage("Application deleted.");
      await loadApplications();
    } catch (error) {
      setMessage(error.message);
    }
  }

  const counts = {
    total: applications.length,
    applied: applications.filter((a) => a.status === "APPLIED").length,
    interviews: applications.filter((a) => a.status === "INTERVIEW").length,
    offers: applications.filter((a) => a.status === "OFFER").length,
  };

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">PLACEMENT PREPARATION SYSTEM</p>
        <h1>Company Application Tracker</h1>
        <p>Track every application, assessment, interview and offer.</p>
      </header>

      <section className="stats">
        <article className="stat-card">
          <span>Total applications</span>
          <strong>{counts.total}</strong>
        </article>
        <article className="stat-card">
          <span>Applied</span>
          <strong>{counts.applied}</strong>
        </article>
        <article className="stat-card">
          <span>Interviews</span>
          <strong>{counts.interviews}</strong>
        </article>
        <article className="stat-card">
          <span>Offers</span>
          <strong>{counts.offers}</strong>
        </article>
      </section>

      <section className="panel">
        <h2>{editingId ? "Edit application" : "Add company application"}</h2>

        <form className="application-form" onSubmit={handleSubmit}>
          <label>
            Company name *
            <input
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              placeholder="e.g. TCS"
              required
              maxLength={150}
            />
          </label>

          <label>
            Job role *
            <input
              name="jobRole"
              value={form.jobRole}
              onChange={handleChange}
              placeholder="e.g. Java Developer"
              required
              maxLength={150}
            />
          </label>

          <label>
            Application date
            <input
              type="date"
              name="applicationDate"
              value={form.applicationDate}
              onChange={handleChange}
            />
          </label>

          <label>
            Application status
            <select name="status" value={form.status} onChange={handleChange}>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="full-width">
            Job link
            <input
              type="url"
              name="jobLink"
              value={form.jobLink}
              onChange={handleChange}
              placeholder="https://company.com/careers"
            />
          </label>

          <label className="full-width">
            Notes
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Recruiter details, preparation notes, next steps..."
              rows="3"
            />
          </label>

          <div className="form-actions full-width">
            <button type="submit">
              {editingId ? "Save changes" : "Add application"}
            </button>
            {editingId && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {message && <p className="message" role="status">{message}</p>}
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Your applications</h2>
          <button className="secondary" onClick={loadApplications}>
            Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading applications...</p>
        ) : applications.length === 0 ? (
          <p>No applications yet. Add your first company above.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Company / Role</th>
                  <th>Applied date</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <strong>{application.companyName}</strong>
                      <small>{application.jobRole}</small>
                      {application.jobLink && (
                        <a
                          href={application.jobLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Job link
                        </a>
                      )}
                    </td>
                    <td>{application.applicationDate || "—"}</td>
                    <td>
                      <select
                        aria-label={`Status for ${application.companyName}`}
                        value={application.status}
                        onChange={async (event) => {
                          try {
                            const response = await fetch(
                              `${API_URL}/${application.id}`,
                              {
                                method: "PUT",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  ...application,
                                  status: event.target.value,
                                }),
                              }
                            );
                            if (!response.ok) throw new Error("Update failed");
                            setMessage("Status updated!");
                            await loadApplications();
                          } catch (error) {
                            setMessage(error.message);
                          }
                        }}
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{application.notes || "—"}</td>
                    <td className="actions">
                      <button onClick={() => startEdit(application)}>
                        Edit
                      </button>
                      <button
                        className="danger"
                        onClick={() => deleteApplication(application.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
