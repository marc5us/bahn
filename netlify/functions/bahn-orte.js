// Bahnhofssuche über infranode. Stadt wird aus dem ersten Wort des Namens abgeleitet,
// z. B. "Nürnberg Hbf" -> Stadt "nuernberg".
const INFRA = "https://infranode.dev/api/v1";

const json = (statusCode, obj) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(obj),
});

const toSlug = (s) =>
  s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9-]/g, "");

exports.handler = async (event) => {
  const q = ((event.queryStringParameters && event.queryStringParameters.suchbegriff) || "").trim();
  if (!q) return json(400, { error: "suchbegriff fehlt" });

  const city = toSlug(q.split(/[\s(]/)[0]);
  if (!city) return json(400, { error: "kein Stadtname erkennbar" });

  try {
    const r = await fetch(`${INFRA}/cities/${city}/stations?q=${encodeURIComponent(q)}&limit=20`, {
      headers: { accept: "application/json" },
    });
    const j = await r.json();
    const d = j.data || {};
    if (d.source_status === "disabled") return json(502, { error: "infranode: Quelle deaktiviert (Zugangsdaten?)" });

    const p = d.payload || {};
    const list = p.stations || p.items || Object.values(p).find(Array.isArray) || [];
    // Format, das die Seite erwartet: name und extId (= EVA)
    return json(200, list.map((s) => ({ name: s.name, extId: String(s.eva), type: "ST" })));
  } catch (e) {
    return json(502, { error: "infranode nicht erreichbar" });
  }
};
