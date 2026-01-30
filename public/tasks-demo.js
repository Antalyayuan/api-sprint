// We use relative URLs so the browser calls the SAME origin (http://127.0.0.1:8000)
// This avoids CORS headaches.
const API_BASE = "/api/tasks";

const titleInput = document.getElementById("titleInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const statusLine = document.getElementById("statusLine");
const errorBox = document.getElementById("errorBox");
const listCard = document.getElementById("listCard");

// Helper: show/hide errors
function showError(message) {
    errorBox.style.display = "block";
    errorBox.textContent = message;
}
function clearError() {
    errorBox.style.display = "none";
    errorBox.textContent = "";
}

// Helper: HTTP wrapper (keeps fetch code clean)
async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            "Accept": "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {}),
        },
    });

    // If Laravel returns 204 No Content, there's no body to parse
    if (res.status === 204) return { ok: true, status: res.status, data: null };

    let data = null;
    const text = await res.text();
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    if (!res.ok) {
        // Common Laravel validation error format: { message, errors: { field: [...] } }
        const message =
            (data && data.message) ? data.message :
                `Request failed with status ${res.status}`;
        throw { status: res.status, data, message };
    }

    return { ok: true, status: res.status, data };
}

function renderTasks(tasks) {
    taskList.innerHTML = "";

    if (!tasks.length) {
        statusLine.textContent = "No tasks yet. Add one above 👆";
        if (listCard) listCard.style.display = "none";
        taskList.style.display = "none";
        return;
    }

    if (listCard) listCard.style.display = "block";
    taskList.style.display = "block";

    statusLine.textContent = `Loaded ${tasks.length} task(s).`;

    for (const task of tasks) {
        const li = document.createElement("li");

        // Done toggle
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !!task.done;
        checkbox.addEventListener("change", () => toggleDone(task.id, checkbox.checked));

        // Title
        const span = document.createElement("span");
        span.textContent = task.title;
        if (task.done) span.classList.add("done");

        // ID badge
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = `#${task.id}`;

        // Delete button
        const delBtn = document.createElement("button");
        delBtn.classList.add("danger");

        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", () => deleteTask(task.id));


        // Edit button
        const edtBtn = document.createElement("button");
        edtBtn.textContent = "Edit";
        edtBtn.addEventListener("click", () => editTitle(task.id, task.title));


        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(badge);
        li.appendChild(delBtn);
        li.appendChild(edtBtn);

        taskList.appendChild(li);
    }
}

async function loadTasks() {
    clearError();
    statusLine.textContent = "Loading...";

    try {
        // Your controller returns a pagination object: { data: [...], meta, links }
        const { data } = await apiFetch(API_BASE);
        renderTasks((data && data.data) ? data.data : []);
    } catch (err) {
        showError(formatError(err));
        statusLine.textContent = "Failed to load tasks.";
    }
}

async function createTask() {
    clearError();
    const title = titleInput.value.trim();

    if (!title) {
        showError("Please enter a task title.");
        return;
    }

    addBtn.disabled = true;
    addBtn.textContent = "Adding...";

    try {
        await apiFetch(API_BASE, {
            method: "POST",
            body: JSON.stringify({ title }),
        });

        titleInput.value = "";
        await loadTasks();
    } catch (err) {
        showError(formatError(err));
    } finally {
        addBtn.disabled = false;
        addBtn.textContent = "Add";
    }
}

async function toggleDone(id, done) {
    clearError();
    try {
        await apiFetch(`${API_BASE}/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ done }),
        });
        await loadTasks();
    } catch (err) {
        showError(formatError(err));
        await loadTasks(); // re-sync UI
    }
}



async function  editTitle(id, currentTitle) {
    clearError();
    const newTitle = prompt("Edit task title: ", currentTitle);
    if(newTitle === null) return;

    const title = newTitle.trim();

    if(!title){
        showError("Title cannot be empty.");
        return;
    }

    try {
        await apiFetch(`${API_BASE}/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ title }),
        });
        await loadTasks();
    } catch (err) {
        showError(formatError(err));
    }
}

async function deleteTask(id) {
    clearError();
    try {
        await apiFetch(`${API_BASE}/${id}`, { method: "DELETE" });
        await loadTasks();
    } catch (err) {
        showError(formatError(err));
    }
}




function formatError(err) {
    // Show Laravel validation details if present
    if (err && err.data && err.data.errors) {
        const lines = [err.message || "Validation error"];
        for (const [field, msgs] of Object.entries(err.data.errors)) {
            lines.push(`${field}: ${msgs.join(", ")}`);
        }
        return lines.join("\n");
    }
    return (err && err.message) ? err.message : String(err);
}

// Wire up UI
addBtn.addEventListener("click", createTask);
titleInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") createTask();
});

// Initial load
loadTasks();
