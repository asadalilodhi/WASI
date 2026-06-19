export default async function handler(req, res) {
  try {
    const { path } = req.query;
    const targetUrl = "https://irregular-jailbreak-contort.ngrok-free.dev/api/" + (Array.isArray(path) ? path.join('/') : path);
    
    const options = {
      method: req.method,
      headers: {
        "ngrok-skip-browser-warning": "true",
        "Bypass-Tunnel-Reminder": "true",
        "Content-Type": "application/json"
      }
    };
    
    if (req.method !== "GET" && req.method !== "HEAD") {
      options.body = JSON.stringify(req.body);
    }
    
    const response = await fetch(targetUrl, options);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch from tunnel" });
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
