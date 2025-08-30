document.addEventListener("DOMContentLoaded", () => {
  console.log("Script loaded");

  // ✅ Supabase Initialization
  const supabase = window.supabase.createClient(
    "https://walivuqpkngksvuaosfv.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhbGl2dXFwa25na3N2dWFvc2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NTAwNjksImV4cCI6MjA3MjEyNjA2OX0.QhmBTMRITyc-uMj0FJzYWABEY6Yg2Fp9jECv811Z-PI"
  );

  const attendanceTypes = ["Office", "WFH", "Holiday", "PTO"];
  const colorMap = {
    Office: "#8BC34A",
    WFH: "#2196F3",
    Holiday: "#BDBDBD",
    PTO: "#FF9800"
  };

  // 🔐 GitHub Login
  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) {
    loginBtn.onclick = async () => {
      console.log("Login button clicked");
      alert("Redirecting to GitHub...");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: "https://finallamppost.github.io/attendance-tracker/"
        }
      });
      if (error) console.error("Login error:", error);
    };
  }

  // 🔓 Logout
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      await supabase.auth.signOut();
      location.reload();
    };
  }

  // 👤 Auth State Listener
  supabase.auth.onAuthStateChange((_event, session) => {
    console.log("Auth state changed:", session);
    if (session && session.user) {
      document.getElementById("user-info").innerText = `Signed in as ${session.user.email}`;
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
      document.getElementById("calendar-controls").style.display = "block";
      populateMonthSelector();
      generateCalendar();
    } else {
      document.getElementById("user-info").innerText = "";
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
      document.getElementById("calendar-controls").style.display = "none";
    }
  });

  // 🔍 Initial Session Check + 🌐 IP Logging
  supabase.auth.getSession().then(({ data }) => {
    const session = data.session;
    console.log("Initial session:", session);
    if (session && session.user) {
      console.log("User is authenticated:", session.user.email);
      document.getElementById("user-info").innerText = `Signed in as ${session.user.email}`;
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
      document.getElementById("calendar-controls").style.display = "block";
      populateMonthSelector();
      generateCalendar();

      // 🌐 IP Logging
      fetch("https://api.ipify.org?format=json")
        .then(res => res.json())
        .then(data => {
          console.log("User IP:", data.ip);
          supabase.from("login_logs").insert([
            {
              user_id: session.user.id,
              email: session.user.email,
              ip: data.ip,
              timestamp: new Date()
            }
          ]).then(({ error }) => {
            if (error) {
              console.error("Insert error:", error.message);
            } else {
              console.log("✅ Login log inserted successfully");
            }
          });
        });
    } else {
      console.log("No active session found");
      document.getElementById("calendar-controls").style.display = "none";
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
      document.getElementById("user-info").innerText = "";
    }
  });

  // 📝 Save Attendance
  async function saveData(key, type, note) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("attendance").upsert([{ date: key, type, note, user_id: user.id }]);
  }

  // 📥 Load Attendance
  async function loadData(key) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { type: "WFH", note: "" };
    const { data } = await supabase.from("attendance").select("*").eq("date", key).eq("user_id", user.id);
    return data.length > 0 ? data[0] : { type: "WFH", note: "" };
  }

  // 📅 Month Selector
  function populateMonthSelector() {
    const monthSelect = document.getElementById("month");
    monthSelect.innerHTML = "";
    for (let i = 0; i < 12; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.text = new Date(0, i).toLocaleString("default", { month: "long" });
      monthSelect.appendChild(option);
    }
    monthSelect.value = new Date().getMonth();
  }

  // 🧮 Calendar Generator
  async function generateCalendar() {
    const month = parseInt(document.getElementById("month").value);
    const year = parseInt(document.getElementById("year").value);
    const calendarDiv = document.getElementById("calendar");
    calendarDiv.innerHTML = "";

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();

    for (let i = 0; i < startDay; i++) {
      calendarDiv.appendChild(document.createElement("div"));
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const key = `${year}-${month + 1}-${day}`;
      const saved = await loadData(key);

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
      box.appendChild(typeSelect);

      const noteInput = document.createElement("input");
      noteInput.type = "text";
      noteInput.placeholder = "Note";
      noteInput.value = saved.note;
      box.appendChild(noteInput);

      typeSelect.onchange = () => {
        box.style.backgroundColor = colorMap[typeSelect.value];
        saveData(key, typeSelect.value, noteInput.value);
        updateSummary();
      };

      noteInput.oninput = () => {
        saveData(key, typeSelect.value, noteInput.value);
      };

      calendarDiv.appendChild(box);
    }

    updateSummary();
  }

  // 📊 Monthly Summary
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
      <p>Attendance = ${percent}%</p>
      ${
        percent >= 80
          ? '<p style="color:green;">✅ Target Met</p>'
          : '<p style="color:red;">⚠️ Target Not Met</p>'
      }
    `;
  }

  // 📤 Export CSV
  async function exportCSV() {
    const month = parseInt(document.getElementById("month").value);
    const year = parseInt(document.getElementById("year").value);
    const lastDay = new Date(year, month + 1, 0).getDate();
    let csv = "Date,Type,Note\n";

    for (let day = 1; day <= lastDay; day++) {
      const key = `${year}-${month + 1}-${day}`;
      const saved = await loadData(key);
      if (saved)
