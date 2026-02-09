const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const aiAdvice = document.getElementById("aiAdvice");
const focusBtn = document.getElementById("focusBtn");

const tasks = [];

function daysLeft(deadline) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  const diff = due - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getPriorityScore(task) {
  const urgency = Math.max(0, 14 - daysLeft(task.deadline));
  return task.importance * 3 + urgency;
}

function renderTasks() {
  taskList.innerHTML = "";

  if (!tasks.length) {
    taskList.innerHTML = "<li>Inga uppgifter än – börja med att lägga till en.</li>";
    return;
  }

  tasks
    .slice()
    .sort((a, b) => getPriorityScore(b) - getPriorityScore(a))
    .forEach((task) => {
      const li = document.createElement("li");
      li.className = `task-item ${task.done ? "done" : ""}`;
      li.innerHTML = `
        <strong>${task.course}: ${task.title}</strong>
        <div class="badges">
          <span class="badge">Viktighet ${task.importance}/5</span>
          <span class="badge ${daysLeft(task.deadline) <= 3 ? "urgent" : ""}">Deadline om ${daysLeft(task.deadline)} dagar</span>
        </div>
      `;

      li.addEventListener("click", () => {
        task.done = !task.done;
        renderTasks();
      });

      taskList.appendChild(li);
    });
}

function createStudyPlan(task) {
  const deadlineInDays = daysLeft(task.deadline);

  if (deadlineInDays <= 1) {
    return `Börja nu med ${task.title}. Gör en 45-minuters sprint, lämna in en första version idag och förbättra efter feedback.`;
  }

  if (deadlineInDays <= 4) {
    return `Fokusera på ${task.title}. Dela upp i tre block: planera (20 min), producera (2 pass), repetera/korrekturläs (1 pass).`;
  }

  return `Bra framförhållning! Lägg ${task.title} i en veckoplan med 25 min per dag så blir arbetet jämnt och mindre stressigt.`;
}

function updateAdvice() {
  const activeTasks = tasks.filter((task) => !task.done);

  if (!activeTasks.length) {
    aiAdvice.textContent =
      "Alla uppgifter verkar klara. Lägg till nya mål för veckan för att behålla rytmen!";
    return;
  }

  const topTask = activeTasks
    .slice()
    .sort((a, b) => getPriorityScore(b) - getPriorityScore(a))[0];

  aiAdvice.textContent = `Prioritera ${topTask.course} – ${topTask.title}. ${createStudyPlan(topTask)}`;
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const task = {
    course: document.getElementById("courseInput").value.trim(),
    title: document.getElementById("taskInput").value.trim(),
    deadline: document.getElementById("deadlineInput").value,
    importance: Number(document.getElementById("importanceInput").value),
    done: false,
  };

  tasks.push(task);
  taskForm.reset();
  document.getElementById("importanceInput").value = 3;

  renderTasks();
  updateAdvice();
});

focusBtn.addEventListener("click", updateAdvice);

renderTasks();