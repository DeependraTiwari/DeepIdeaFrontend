import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./login";
import Signup from "./SignUp";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [tasks, setTasks] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [undoTask, setUndoTask] = useState(null);
  const [showUndo, setShowUndo] = useState(false);
  const [stats, setStats] = useState({ total: 0, completed: 0 });

  const fetchTasks = async (token) => {
    const response = await fetch("https://deepideabackend.onrender.com/tasks", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setTasks(Array.isArray(data) ? data : data.tasks || []);
  };

  const fetchStats = async () => {
    const res = await fetch(
      "https://deepideabackend.onrender.com/tasks/analytics/stats",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    setStats(data);
  };

  useEffect(() => {
    if (token) {
      fetchTasks(token);
      fetchStats();
    }
  }, [token]);

  const logout = () => {
    setToken("");
    localStorage.removeItem("token");
    setTasks([]);
  };

  const addTask = async (text, dueDate, category) => {
    const response = await fetch("https://deepideabackend.onrender.com/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text,
        status: "pending",
        priority: "medium",
        dueDate,
        category,
      }),
    });
    const newTask = await response.json();
    setTasks([...tasks, newTask]);
    fetchStats();
  };

  const deleteTask = async (id) => {
    const taskToDelete = tasks.find((t) => t._id === id);
    setUndoTask(taskToDelete);
    setShowUndo(true);
    setTasks(tasks.filter((task) => task._id !== id));
    await fetch(`https://deepideabackend.onrender.com/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchStats();
  };

  const undoDelete = async () => {
    if (!undoTask) return;
    await addTask(undoTask.text, undoTask.dueDate, undoTask.category);
    setUndoTask(null);
    setShowUndo(false);
  };

  const updateTaskField = async (id, fields) => {
    const response = await fetch(
      `https://deepideabackend.onrender.com/tasks/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fields),
      }
    );
    const updatedTask = await response.json();
    setTasks(tasks.map((task) => (task._id === id ? updatedTask : task)));
    fetchStats();
  };

  const updateTaskStatus = (id, currentStatus) => {
    const newStatus = currentStatus === "pending" ? "completed" : "pending";
    updateTaskField(id, { status: newStatus });
  };

  const updateTaskPriority = (id, newPriority) => {
    updateTaskField(id, { priority: newPriority });
  };

  const filteredTasks = tasks.filter(
    (task) =>
      (filterStatus === "all" || task.status === filterStatus) &&
      (filterPriority === "all" || task.priority === filterPriority)
  );

  useEffect(() => {
    const now = new Date();
    const dueSoonTasks = tasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) - now < 3600000 &&
        t.status === "pending"
    );
    if (dueSoonTasks.length) {
      alert("Reminder: You have tasks due within the next hour!");
    }
  }, [tasks]);

  const MainApp = () => (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      <nav className="bg-blue-500 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <ul className="flex space-x-4">
          <li>
            <a
              href="#"
              className="px-4 py-2 rounded-full font-semibold transition-colors duration-200 hover:bg-blue-600 hover:text-white focus:bg-blue-700 focus:outline-none bg-blue-100 text-blue-700 shadow-sm"
            >
              Home
            </a>
          </li>
        </ul>
        <button
          onClick={logout}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-full shadow transition-colors duration-200"
        >
          Logout
        </button>
      </nav>
      <main className="flex-1 p-6">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-4">
          Deep To-Do List
        </h2>

        <div className="mb-4">
          <p className="text-center font-semibold">
            Completed: {stats.completed}/{stats.total}
          </p>
          <div className="h-2 w-full bg-blue-100 rounded">
            <div
              className="h-2 bg-blue-500 rounded"
              style={{
                width: `${(stats.completed / (stats.total || 1)) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const text = e.target.text.value;
            const dueDate = e.target.dueDate.value;
            const category = e.target.category.value;
            addTask(text, dueDate, category);
            e.target.reset();
          }}
          className="flex flex-col md:flex-row gap-2 mb-6 justify-center"
        >
          <input
            name="text"
            type="text"
            required
            placeholder="Task description"
            className="p-2 border rounded w-full"
          />
          <input
            name="dueDate"
            type="datetime-local"
            className="p-2 border rounded"
          />
          <input
            name="category"
            type="text"
            placeholder="Category"
            className="p-2 border rounded"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </form>

        <div className="flex gap-2 justify-center mb-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 rounded border"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="p-2 rounded border"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center text-gray-500">
            No tasks found. You're all caught up!
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredTasks.map((task) => (
              <li
                key={task._id}
                className="p-4 bg-white rounded shadow flex justify-between items-center"
              >
                <div className="flex-1">
                  <p className="text-lg font-semibold text-blue-800">
                    {task.text}
                  </p>
                  <p className="text-sm text-gray-500">
                    {task.category && `#${task.category}`}{" "}
                    {task.dueDate &&
                      ` | Due: ${new Date(task.dueDate).toLocaleString()}`}
                  </p>
                  <span
                    className={`inline-block px-2 py-1 rounded text-sm mt-1 ${
                      task.priority === "high"
                        ? "bg-red-200 text-red-800"
                        : task.priority === "medium"
                        ? "bg-yellow-200 text-yellow-800"
                        : "bg-green-200 text-green-800"
                    }`}
                  >
                    {task.priority.toUpperCase()}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => updateTaskStatus(task._id, task.status)}
                    className={`px-3 py-1 rounded-full font-semibold transition-colors duration-200 ${
                      task.status === "pending"
                        ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-500"
                        : "bg-green-400 text-green-900 hover:bg-green-500"
                     }`}
                  >
                    {task.status === "pending" ? "Mark Complete" : "Mark Pending"}
                  </button>
                  <select
                    value={task.priority}
                    onChange={(e) => updateTaskPriority(task._id, e.target.value)}
                    className="p-2 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <button
                    onClick={() => deleteTask(task._id)}
                    className="flex items-center gap-1 px-3 py-1 bg-red-500 hover:bg-red-700 text-white font-semibold rounded-full transition-colors duration-200 ml-2"
                    title="Delete Task"
                  >
                    <i className="fas fa-trash" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {showUndo && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded shadow-md flex gap-4">
            Task deleted
            <button onClick={undoDelete} className="underline">
              Undo
            </button>
          </div>
        )}
      </main>
      <footer className="bg-blue-500 text-white text-center p-3">
        © 2025 Deep To-Do List Website
      </footer>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={token ? <MainApp /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
