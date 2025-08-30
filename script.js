document.addEventListener("DOMContentLoaded", () => {
  console.log("Script loaded");

  // ✅ Supabase Initialization
  const supabase = window.supabase.createClient(
    "https://walivuqpkngksvuaosfv.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhbGl2dXFwa25na3N2dWFvc2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NTAwNjksImV4cCI6MjA3MjEyNjA2OX0.QhmBTMRITyc-uMj0FJzYWABEY6Yg2Fp9jECv811Z-PI"
  );

  // 🔐 GitHub Login Button
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

  // 🔓 Logout Button
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
    } else {
      document.getElementById("user-info").innerText = "";
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
    }
  });

  // 🔍 Initial Session Check
  supabase.auth.getSession().then(({ data }) => {
    const session = data.session;
    console.log("Initial session:", session);
    if (session && session.user) {
      document.getElementById("user-info").innerText = `Signed in as ${session.user.email}`;
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
    }
  });
});
