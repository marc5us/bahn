// Proxy zur bahn.de-Ortssuche. Holt sich vorab Session-Cookies wie ein Browser.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

exports.handler = async (event) => {
  const q = (event.queryStringParameters && event.queryStringParameters.suchbegriff) || "";
  if (!q.trim()) {
    return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "suchbegriff fehlt" }) };
  }
  const base = { "user-agent": UA, "accept-language": "de-DE,de;q=0.9" };

  // Schritt 1: Startseite aufrufen, um Cookies zu erhalten
  let cookie = "";
  try {
    const home = await fetch("https://www.bahn.de/", { headers: { ...base, accept: "text/html" }, redirect: "follow" });
    const sc = typeof home.headers.getSetCookie === "function" ? home.headers.getSetCookie() : [home.headers.get("set-cookie") || ""];
    cookie = sc.filter(Boolean).map((c) => c.split(";")[0]).join("; ");
  } catch (e) {
    // ohne Cookies weitermachen
  }

  // Schritt 2: eigentliche Suche
  const url = `https://www.bahn.de/web/api/reiseloesung/orte?suchbegriff=${encodeURIComponent(q)}&typ=ALL&limit=10`;
  try {
    const r = await fetch(url, {
      headers: {
        ...base,
        accept: "application/json",
        origin: "https://www.bahn.de",
        referer: "https://www.bahn.de/buchung/fahrplan/suche",
        ...(cookie ? { cookie } : {}),
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
