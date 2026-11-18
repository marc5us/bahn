// Proxy zur bahn.de-Ortssuche. Läuft serverseitig bei Netlify, daher kein Browser-CORS-Problem.
exports.handler = async (event) => {
  const q = (event.queryStringParameters && event.queryStringParameters.suchbegriff) || "";
  if (!q.trim()) {
    return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "suchbegriff fehlt" }) };
  }
  const url = `https://www.bahn.de/web/api/reiseloesung/orte?suchbegriff=${encodeURIComponent(q)}&typ=ALL&limit=10`;
  try {
    const r = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "Mozilla/5.0",
        origin: "https://www.bahn.de",
        referer: "https://www.bahn.de/buchung/fahrplan/suche",
      },
    });
    const body = await r.text();
    return {
      statusCode: r.status,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body,
    };
  } catch (e) {
    return { statusCode: 502, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "bahn.de nicht erreichbar" }) };
  }
};
