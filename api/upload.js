// api/upload.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    // 1. Frisches Access Token vom Refresh Token holen
    const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
    const clientId = process.env.DROPBOX_APP_KEY;
    const clientSecret = process.env.DROPBOX_APP_SECRET;

    const tokenResponse = await fetch("https://api.dropbox.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) throw new Error("Kein Access Token erhalten.");

    // 2. Datei vom Client entgegennehmen
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    const filename = `LenaFranz_${Date.now()}.jpg`;

    // 3. Upload zu Dropbox
    const uploadResponse = await fetch("https://content.dropboxapi.com/2/files/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({
          path: "/" + filename,
          mode: "add",
          autorename: true,
          mute: false,
        }),
        "Content-Type": "application/octet-stream",
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      const err = await uploadResponse.text();
      throw new Error("Dropbox-Upload fehlgeschlagen: " + err);
    }

    res.status(200).json({ success: true, filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
