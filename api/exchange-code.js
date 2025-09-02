import fetch from "node-fetch";

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Kein Code angegeben" });

  try {
    const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(
          process.env.DROPBOX_APP_KEY + ":" + process.env.DROPBOX_APP_SECRET
        ).toString("base64")
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: "https://mr-mrs-kappl.vercel.app/callback"
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
