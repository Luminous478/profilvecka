const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const aiAdvice = document.getElementById("aiAdvice");
const focusBtn = document.getElementById("focusBtn");

// REPLACE THIS WITH YOUR ACTUAL API KEY
const API_KEY = localStorage.getItem("apiKey");
if(API_KEY==null){
  alert("This aint gonna work")
};
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

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
    .forEach((task, index) => {
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

// THE AI THINKING FUNCTION
async function getAIPlan(task) {
  aiAdvice.textContent = "AI tänker ut en plan... 🧠";
  
  const prompt = `Du är en studiecoach. Jag har en skoluppgift: 
    Kurs: ${task.course}
    Uppgift: ${task.title}
    Deadline: Om ${daysLeft(task.deadline)} dagar.
    Viktighet: ${task.importance} av 5.
    
    Ge mig en konkret, kortfattad (max 3 meningar) och peppande plan på svenska för hur jag ska dela upp arbetet för att bli klar i tid utan stress.`;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
  
      const data = await response.json();
  
      // Check if the API returned an error message
      if (data.error) {
          console.error("API Error Detail:", data.error.message);
          return `Ett fel uppstod: ${data.error.message}`;
      }
  
      // Check if candidates exists (this fixes your specific error)
      if (data.candidates && data.candidates[0]) {
          return data.candidates[0].content.parts[0].text;
      } else {
          console.warn("Oväntat svar från AI:", data);
          return "AI:n kunde inte generera ett svar just nu. Försök igen!";
      }
  
    } catch (error) {
      console.error("Nätverksfel:", error);
      return "Kunde inte ansluta till AI-tjänsten. Kontrollera din internetanslutning.";
    }
}

async function updateAdvice() {
  const activeTasks = tasks.filter((task) => !task.done);

  if (!activeTasks.length) {
    aiAdvice.textContent = "Alla uppgifter verkar klara. Bra jobbat!";
    return;
  }

  const topTask = activeTasks
    .slice()
    .sort((a, b) => getPriorityScore(b) - getPriorityScore(a))[0];

  const plan = await getAIPlan(topTask);
  aiAdvice.textContent = plan;
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
});

focusBtn.addEventListener("click", updateAdvice);
renderTasks();