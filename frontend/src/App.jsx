
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:8080/api";

const APPLICATION_STATUSES = [
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
];

const TASK_CATEGORIES = [
  "Java",
  "DSA",
  "Aptitude",
  "Frontend",
  "Backend",
  "Core CS",
  "Projects",
  "Communication",
  "Other",
];

const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
};

const emptyApplication = () => ({
  companyName: "",
  jobRole: "",
  applicationDate: today(),
  status: "APPLIED",
  jobLink: "",
  notes: "",
});

const emptyTask = () => ({
  title: "",
  category: "Java",
  completed: false,
});

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      details || `Request failed (${response.status})`
    );
  }

  if (response.status === 204) return null;

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function App() {
  const [applications, setApplications] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [applicationForm, setApplicationForm] = useState(emptyApplication);
  const [taskForm, setTaskForm] = useState(emptyTask);

  const [editingApplicationId, setEditingApplicationId] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [applicationFilter, setApplicationFilter] = useState("ALL");
  const [taskFilter, setTaskFilter] = useState("ALL");
  const [taskCategoryFilter, setTaskCategoryFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [applicationData, taskData] = await Promise.all([
        request("/applications"),
        request("/tasks"),
      ]);

      setApplications(Array.isArray(applicationData) ? applicationData : []);
      setTasks(Array.isArray(taskData) ? taskData : []);
    } catch (err) {
      setError(
        "Could not load project data. Make sure Spring Boot and MySQL are running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function showMessage(text) {
    setMessage(text);
    setError("");
  }

  function showError(err) {
    setError(err.message || "Something went wrong.");
    setMessage("");
  }

  const applicationStats = useMemo(
    () => ({
      total: applications.length,
      applied: applications.filter((a) => a.status === "APPLIED").length,
      interviews: applications.filter((a) => a.status === "INTERVIEW").length,
      offers: applications.filter((a) => a.status === "OFFER").length,
    }),
    [applications]
  );

  const taskStats = useMemo(() => {
    const completed = tasks.filter((task) => task.completed).length;
    const total = tasks.length;

    return {
      total,
      completed,
      pending: total - completed,
      percentage: total ? Math.round((completed / total) * 100) : 0,
    };
  }, [tasks]);

  const filteredApplications = applications.filter(
    (application) =>
      applicationFilter === "ALL" ||
      application.status === applicationFilter
  );

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      taskFilter === "ALL" ||
      (taskFilter === "COMPLETED" && task.completed) ||
      (taskFilter === "PENDING" && !task.completed);

    const matchesCategory =
      taskCategoryFilter === "ALL" ||
      task.category === taskCategoryFilter;

    return matchesStatus && matchesCategory;
  });

  async function submitApplication(event) {
    event.preventDefault();
    setSaving(true);

    try {
      const isEditing = editingApplicationId !== null;

      await request(
        isEditing
          ? `/applications/${editingApplicationId}`
          : "/applications",
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify(applicationForm),
        }
      );

      setApplicationForm(emptyApplication());
      setEditingApplicationId(null);
      showMessage(isEditing ? "Application updated." : "Application added.");
      await loadData();
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  }

  function editApplication(application) {
    setEditingApplicationId(application.id);
    setApplicationForm({
      companyName: application.companyName ?? "",
      jobRole: application.jobRole ?? "",
      applicationDate: application.applicationDate ?? today(),
      status: application.status ?? "APPLIED",
      jobLink: application.jobLink ?? "",
      notes: application.notes ?? "",
    });

    document.getElementById("applications")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  async function deleteApplication(id) {
    if (!window.confirm("Delete this company application?")) return;

    try {
      await request(`/applications/${id}`, { method: "DELETE" });

      if (editingApplicationId === id) {
        setEditingApplicationId(null);
        setApplicationForm(emptyApplication());
      }

      showMessage("Application deleted.");
      await loadData();
    } catch (err) {
      showError(err);
    }
  }

  async function updateApplicationStatus(application, status) {
    try {
      await request(`/applications/${application.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...application, status }),
      });

      showMessage("Application status updated.");
      await loadData();
    } catch (err) {
      showError(err);
    }
  }

  async function submitTask(event) {
    event.preventDefault();
    setSaving(true);

    try {
      const isEditing = editingTaskId !== null;

      await request(
        isEditing ? `/tasks/${editingTaskId}` : "/tasks",
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify(taskForm),
        }
      );

      setTaskForm(emptyTask());
      setEditingTaskId(null);
      showMessage(isEditing ? "Task updated." : "Task added.");
      await loadData();
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  }

  function editTask(task) {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title ?? "",
      category: task.category ?? "Java",
      completed: Boolean(task.completed),
    });
  }

  async function toggleTask(task) {
    try {
      await request(`/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...task,
          completed: !task.completed,
        }),
      });

      showMessage(
        task.completed ? "Task marked as pending." : "Task completed!"
      );
      await loadData();
    } catch (err) {
      showError(err);
    }
  }

  async function deleteTask(id) {
    if (!window.confirm("Delete this preparation task?")) return;

    try {
      await request(`/tasks/${id}`, { method: "DELETE" });

      if (editingTaskId === id) {
        setEditingTaskId(null);
        setTaskForm(emptyTask());
      }

      showMessage("Task deleted.");
      await loadData();
    } catch (err) {
      showError(err);
    }
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">YOUR CAREER WORKSPACE</p>
        <h1>Placement Preparation Tracker</h1>
        <p>
          Prepare smarter, track your progress, and manage every job
          application in one place.
        </p>

        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <a href="#overview">Overview</a>
          <a href="#preparation">Preparation tasks</a>
          <a href="#applications">Applications</a>
        </nav>
      </header>

      {(message || error) && (
        <div
          className={`notice ${error ? "notice-error" : "notice-success"}`}
          role="status"
        >
          <span>{error || message}</span>
          <button
            type="button"
            className="notice-close"
            onClick={() => {
              setMessage("");
              setError("");
            }}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <section id="overview" className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR OVERVIEW</p>
            <h2>Dashboard</h2>
          </div>
          <button
            type="button"
            className="secondary"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh data"}
          </button>
        </div>

        <div className="stats">
          <article className="stat-card">
            <span>Preparation progress</span>
            <strong>{taskStats.percentage}%</strong>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Preparation progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={taskStats.percentage}
            >
              <div
                className="progress-fill"
                style={{ width: `${taskStats.percentage}%` }}
              />
            </div>
          </article>

          <article className="stat-card">
            <span>Tasks completed</span>
            <strong>{taskStats.completed}</strong>
            <small>Out of {taskStats.total} tasks</small>
          </article>

          <article className="stat-card">
            <span>Pending tasks</span>
            <strong>{taskStats.pending}</strong>
            <small>Keep making progress</small>
          </article>

          <article className="stat-card">
            <span>Total applications</span>
            <strong>{applicationStats.total}</strong>
            <small>{applicationStats.offers} offers received</small>
          </article>

          <article className="stat-card">
            <span>Interviews</span>
            <strong>{applicationStats.interviews}</strong>
            <small>{applicationStats.applied} applications submitted</small>
          </article>
        </div>
      </section>

      <section id="preparation" className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">BUILD YOUR SKILLS</p>
            <h2>Preparation tasks</h2>
            <p>Add your study goals and track each completed task.</p>
          </div>
        </div>

        <div className="panel">
          <h3>{editingTaskId !== null ? "Edit task" : "Add a preparation task"}</h3>

          <form className="application-form" onSubmit={submitTask}>
            <label>
              Task title *
              <input
                name="title"
                value={taskForm.title}
                onChange={(event) =>
                  setTaskForm({ ...taskForm, title: event.target.value })
                }
                placeholder="e.g. Practice Java Collections"
                maxLength={200}
                required
              />
            </label>

            <label>
              Category *
              <select
                value={taskForm.category}
                onChange={(event) =>
                  setTaskForm({ ...taskForm, category: event.target.value })
                }
              >
                {TASK_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-actions full-width">
              <button type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingTaskId !== null
                    ? "Save task"
                    : "Add task"}
              </button>

              {editingTaskId !== null && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setEditingTaskId(null);
                    setTaskForm(emptyTask());
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="panel">
          <div className="section-heading">
            <h3>Your study checklist</h3>
            <span className="result-count">
              {taskStats.completed}/{taskStats.total} completed
            </span>
          </div>

          <div className="filter-row">
            <label>
              Progress
              <select
                value={taskFilter}
                onChange={(event) => setTaskFilter(event.target.value)}
              >
                <option value="ALL">All tasks</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </label>

            <label>
              Category
              <select
                value={taskCategoryFilter}
                onChange={(event) =>
                  setTaskCategoryFilter(event.target.value)
                }
              >
                <option value="ALL">All categories</option>
                {TASK_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <p>Loading tasks...</p>
          ) : filteredTasks.length === 0 ? (
            <p className="empty-state">
              No tasks match these filters. Add a task above to get started.
            </p>
          ) : (
            <div className="task-list">
              {filteredTasks.map((task) => (
                <article
                  key={task.id}
                  className={`task-item ${task.completed ? "task-completed" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(task.completed)}
                    onChange={() => toggleTask(task)}
                    aria-label={`Mark ${task.title} as ${
                      task.completed ? "pending" : "completed"
                    }`}
                  />

                  <div className="task-details">
                    <strong>{task.title}</strong>
                    <span className="category-tag">{task.category}</span>
                  </div>

                  <span
                    className={`status-pill ${
                      task.completed ? "status-done" : "status-pending"
                    }`}
                  >
                    {task.completed ? "Completed" : "Pending"}
                  </span>

                  <div className="actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => editTask(task)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => deleteTask(task.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="applications" className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR JOB SEARCH</p>
            <h2>Company applications</h2>
            <p>Keep track of every opportunity from application to offer.</p>
          </div>
        </div>

        <div className="stats application-stats">
          <article className="stat-card">
            <span>Total applications</span>
            <strong>{applicationStats.total}</strong>
          </article>
          <article className="stat-card">
            <span>Applied</span>
            <strong>{applicationStats.applied}</strong>
          </article>
          <article className="stat-card">
            <span>Interviews</span>
            <strong>{applicationStats.interviews}</strong>
          </article>
          <article className="stat-card">
            <span>Offers</span>
            <strong>{applicationStats.offers}</strong>
          </article>
        </div>

        <div className="panel">
          <h3>
            {editingApplicationId !== null
              ? "Edit application"
              : "Add a company application"}
          </h3>

          <form className="application-form" onSubmit={submitApplication}>
            <label>
              Company name *
              <input
                name="companyName"
                value={applicationForm.companyName}
                onChange={(event) =>
                  setApplicationForm({
                    ...applicationForm,
                    companyName: event.target.value,
                  })
                }
                placeholder="e.g. TCS"
                maxLength={150}
                required
              />
            </label>

            <label>
              Job role *
              <input
                name="jobRole"
                value={applicationForm.jobRole}
                onChange={(event) =>
                  setApplicationForm({
                    ...applicationForm,
                    jobRole: event.target.value,
                  })
                }
                placeholder="e.g. Java Developer"
                maxLength={150}
                required
              />
            </label>

            <label>
              Application date
              <input
                type="date"
                name="applicationDate"
                value={applicationForm.applicationDate}
                onChange={(event) =>
                  setApplicationForm({
                    ...applicationForm,
                    applicationDate: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Status
              <select
                value={applicationForm.status}
                onChange={(event) =>
                  setApplicationForm({
                    ...applicationForm,
                    status: event.target.value,
                  })
                }
              >
                {APPLICATION_STATUSES.map((status) => (
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
                value={applicationForm.jobLink}
                onChange={(event) =>
                  setApplicationForm({
                    ...applicationForm,
                    jobLink: event.target.value,
                  })
                }
                placeholder="https://company.com/careers"
              />
            </label>

            <label className="full-width">
              Notes
              <textarea
                name="notes"
                value={applicationForm.notes}
                onChange={(event) =>
                  setApplicationForm({
                    ...applicationForm,
                    notes: event.target.value,
                  })
                }
                placeholder="Preparation notes, interview dates, next steps..."
                rows={3}
              />
            </label>

            <div className="form-actions full-width">
              <button type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingApplicationId !== null
                    ? "Save changes"
                    : "Add application"}
              </button>

              {editingApplicationId !== null && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setEditingApplicationId(null);
                    setApplicationForm(emptyApplication());
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="panel">
          <div className="section-heading">
            <h3>Your applications</h3>

            <label>
              Filter by status
              <select
                value={applicationFilter}
                onChange={(event) =>
                  setApplicationFilter(event.target.value)
                }
              >
                <option value="ALL">All statuses</option>
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <p>Loading applications...</p>
          ) : filteredApplications.length === 0 ? (
            <p className="empty-state">
              No applications found. Add your first application above.
            </p>
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
                  {filteredApplications.map((application) => (
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
                            Open job link
                          </a>
                        )}
                      </td>

                      <td>{application.applicationDate || "—"}</td>

                      <td>
                        <select
                          aria-label={`Status for ${application.companyName}`}
                          value={application.status}
                          onChange={(event) =>
                            updateApplicationStatus(
                              application,
                              event.target.value
                            )
                          }
                        >
                          {APPLICATION_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>{application.notes || "—"}</td>

                      <td>
                        <div className="actions">
                          <button
                            type="button"
                            onClick={() => editApplication(application)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() =>
                              deleteApplication(application.id)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <footer className="app-footer">
        <p>Placement Preparation Tracker · Learn, practice, and progress.</p>
      </footer>
    </main>
  );
}

export default App;
