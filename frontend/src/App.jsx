
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8080/api/tasks";

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Java");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTasks() {
    try {
      setError("");
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Could not load tasks.");
      }

      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError("Cannot connect to the backend. Please check Spring Boot.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function addTask(event) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    try {
      setError("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          category,
          completed: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not add task.");
      }

      const newTask = await response.json();
      setTasks((previousTasks) => [...previousTasks, newTask]);
      setTitle("");
      setCategory("Java");
    } catch (err) {
      setError("Task could not be added. Please try again.");
    }
  }

  async function toggleTask(task) {
    try {
      setError("");

      const response = await fetch(`${API_URL}/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: task.title,
          category: task.category,
          completed: !task.completed,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not update task.");
      }

      const updatedTask = await response.json();

      setTasks((previousTasks) =>
        previousTasks.map((item) =>
          item.id === updatedTask.id ? updatedTask : item
        )
      );
    } catch (err) {
      setError("Task status could not be updated.");
    }
  }

  async function deleteTask(id) {
    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not delete task.");
      }

      setTasks((previousTasks) =>
        previousTasks.filter((task) => task.id !== id)
      );
    } catch (err) {
      setError("Task could not be deleted.");
    }
  }

  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.length - completedCount;

  return (
    <main className="app">
      <header className="app-header">
        <p className="eyebrow">YOUR PLACEMENT JOURNEY</p>
        <h1>Placement Preparation Tracker</h1>
        <p>Build skills. Track progress. Get placement-ready.</p>
      </header>

      <section className="dashboard">
        <div className="stat-card">
          <span>Total Tasks</span>
          <strong>{tasks.length}</strong>
        </div>

        <div className="stat-card">
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </div>

        <div className="stat-card">
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </div>
      </section>

      <section className="tasks-section">
        <h2>Add a Preparation Task</h2>

        <form className="task-form" onSubmit={addTask}>
          <input
            type="text"
            placeholder="Enter a task, e.g. Arrays in Java"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option>Java</option>
            <option>DSA</option>
            <option>Aptitude</option>
            <option>Frontend</option>
            <option>Backend</option>
            <option>DBMS</option>
            <option>Operating Systems</option>
            <option>Computer Networks</option>
            <option>Communication</option>
          </select>

          <button type="submit">+ Add Task</button>
        </form>

        {error && <p className="error">{error}</p>}

        <h2>Your Preparation Tasks</h2>

        {loading ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p>No tasks yet. Add your first preparation task above!</p>
        ) : (
          tasks.map((task) => (
            <article className="task-card" key={task.id}>
              <div className="task-info">
                <h3>{task.title}</h3>
                <p>{task.category}</p>
              </div>

              <div className="task-actions">
                <button
                  className={task.completed ? "completed" : "pending"}
                  onClick={() => toggleTask(task)}
                >
                  {task.completed ? "Completed" : "Mark Complete"}
                </button>

                <button
                  className="delete-button"
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

export default App;
