const attendanceTypes = ["Office", "WFH", "Holiday", "PTO"];
const colorMap = {
  "Office": "#8BC34A",
  "WFH": "#2196F3",
  "Holiday": "#BDBDBD",
  "PTO": "#FF9800"
};

function populateMonthSelector() {
  const monthSelect = document.getElementById("month");
  for (let i = 0; i < 12; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.text = new Date(0, i).toLocaleString('default', { month: 'long' });
    monthSelect.appendChild(option);
  }
  monthSelect.value = new Date().getMonth();
}

function generateCalendar() {
  const month = parseInt(document.getElementById("month").value);
  const year = parseInt(document.getElementById("year").value);
  const calendarDiv = document.getElementById("calendar");
  calendarDiv.innerHTML = "";

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();

  for (let i = 0; i < startDay; i++) {
    const emptyBox = document.createElement("div");
    calendarDiv.appendChild(emptyBox);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const key = `${year}-${month + 1}-${day}`;
    const saved = JSON.parse(localStorage.getItem(key)) || { type: "WFH", note: "" };

    const box = document.createElement("div");
    box.className = "day-box";
    box.style.backgroundColor = colorMap[saved.type];

    const label = document.createElement("strong");
    label.innerText = day;
    box.appendChild(label);

    const typeSelect = document.createElement("select");
    attendanceTypes.forEach(type => {
      const opt = document.createElement("option");
      opt.value = type;
      opt.text = type;
      if (type === saved.type) opt.selected = true;
      typeSelect.appendChild(opt);
    });
    typeSelect.onchange = () => {
      box.style.backgroundColor = colorMap[typeSelect.value];
      saveData(key, typeSelect.value, noteInput.value);
      updateSummary();
    };
    box.appendChild(typeSelect);

    const noteInput = document.createElement("input");
    noteInput.type = "text";
    noteInput.placeholder = "Note";
    noteInput.value = saved.note;
    noteInput.oninput = () => {
      saveData(key, typeSelect.value, noteInput.value);
    };
    box.appendChild(noteInput);

    calendarDiv.appendChild(box);
  }

  updateSummary();
}

function saveData(key, type, note) {
  localStorage.setItem(key, JSON.stringify({ type, note }));
}

function updateSummary() {
  const boxes = document.querySelectorAll(".day-box");
  let totalWorking = 0;
  let officeDays = 0;

  boxes.forEach(box => {
    const type = box.querySelector("select").value;
    if (type !== "Holiday" && type !== "PTO") totalWorking++;
    if (type === "Office") officeDays++;
  });

  const percent = totalWorking > 0 ? ((officeDays / totalWorking) * 100).toFixed(2) : 0;
  document.getElementById("summary").innerHTML = `
    <p>Total Working Days: ${totalWorking}</p>
    <p>Office Days: ${officeDays}</p>
    <p>Attendance %: ${percent}%</p>
    ${percent >= 60 ? "<p style='color:green;'>✅ Target Met!</p>" : "<p style='color:red;'>⚠️ Target Not Met</p>"}
  `;
}

function exportCSV() {
  const month = parseInt(document.getElementById("month").value);
  const year = parseInt(document.getElementById("year").value);
  const lastDay = new Date(year, month + 1, 0).getDate();
  let csv = "Date,Type,Note\n";

  for (let day = 1; day <= lastDay; day++) {
    const key = `${year}-${month + 1}-${day}`;
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved) {
      csv += `${key},${saved.type},${saved.note}\n`;
    }
  }

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Attendance_${year}_${month + 1}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

populateMonthSelector();
generateCalendar();
