import { useState, useEffect } from "react";

/* ==================================================================== *
 *  RELEVÉ D'HEURES — SAVi
 *
 *  Feuille hebdomadaire, saisie a posteriori, destinée à la paie et au
 *  récapitulatif transmis au bureau. Indépendante du module Relevé.
 *
 *  ⚠ STOCKAGE LOCAL À L'APPAREIL (IndexedDB)
 *  Les semaines saisies survivent au rafraîchissement et fonctionnent
 *  hors connexion, mais ne sont pas partagées. Pour centraliser, il
 *  suffit de remplacer les trois fonctions du bloc STOCKAGE.
 *
 *  ⚠ BASE HEBDOMADAIRE
 *  Le seuil de déclenchement des heures supplémentaires est réglable
 *  dans l'écran (35 h par défaut). La durée applicable dépend de la
 *  convention collective : vérifie la tienne avant de t'y fier.
 * ==================================================================== */

const T = {
  panel: "rgba(15,23,42,.5)",
  border: "#1e293b",
  borderFort: "#334155",
  champ: "rgba(30,41,59,.5)",
  texte: "#f1f5f9",
  doux: "#94a3b8",
  faible: "#64748b",
  tresFaible: "#475569",
  ambre: "#f59e0b",
  ambreClair: "#fbbf24",
  ambreFond: "rgba(245,158,11,.1)",
  ambreBord: "rgba(245,158,11,.3)",
  cyan: "#22d3ee",
  rouge: "#f87171",
};

const S = {
  header: { borderBottom: "1px solid " + T.border, background: "rgba(15,23,42,.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10 },
  headerInner: { maxWidth: 800, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 },
  content: { maxWidth: 800, margin: "0 auto", padding: "20px 20px 60px" },
  label: { fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: T.faible, fontWeight: 600, marginBottom: 8 },
  panel: { background: T.panel, border: "1px solid " + T.border, borderRadius: 18, padding: 18, marginBottom: 16 },
  input: { width: "100%", padding: "11px 14px", borderRadius: 10, background: T.champ, border: "1px solid " + T.borderFort, color: T.texte, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  btn: { width: "100%", padding: 14, borderRadius: 10, border: "none", cursor: "pointer", background: T.ambre, color: "#020617", fontWeight: 700, fontSize: 14, fontFamily: "inherit" },
};

const TYPES = [
  { id: "travail", label: "Travail", heures: true, couleur: T.ambre },
  { id: "astreinte", label: "Astreinte", heures: true, couleur: T.cyan },
  { id: "formation", label: "Formation", heures: true, couleur: T.cyan },
  { id: "conges", label: "Congé payé", heures: false, couleur: T.tresFaible },
  { id: "rtt", label: "RTT", heures: false, couleur: T.tresFaible },
  { id: "maladie", label: "Arrêt maladie", heures: false, couleur: T.tresFaible },
  { id: "ferie", label: "Férié", heures: false, couleur: T.tresFaible },
  { id: "repos", label: "Repos", heures: false, couleur: T.tresFaible },
];

const typeDe = (id) => TYPES.find((t) => t.id === id) || TYPES[TYPES.length - 1];
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

/* --------------------------- dates & calculs --------------------------- */

function lundiDe(date) {
  const d = new Date(date);
  const j = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - j);
  d.setHours(0, 0, 0, 0);
  return d;
}

const iso = (d) => d.toISOString().slice(0, 10);

function numeroSemaine(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const jour = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - jour);
  const debut = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - debut) / 86400000 + 1) / 7);
}

const cleSemaine = (lundi) => lundi.getFullYear() + "-S" + String(numeroSemaine(lundi)).padStart(2, "0");

function minutesDe(hhmm) {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

function dureeJour(j) {
  if (!j || !typeDe(j.type).heures) return 0;
  const d = minutesDe(j.debut);
  const f = minutesDe(j.fin);
  if (d === null || f === null) return 0;
  let total = f - d;
  if (total < 0) total += 24 * 60; // journée à cheval sur minuit
  total -= Number(j.pause || 0);
  return Math.max(0, total);
}

function enHeures(minutes) {
  if (!minutes) return "0h00";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h + "h" + String(m).padStart(2, "0");
}

/* ---------------------------- STOCKAGE ---------------------------- */

const DB_NOM = "savi-heures";
const MAGASIN = "semaines";

function ouvrirBase() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NOM, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(MAGASIN)) db.createObjectStore(MAGASIN, { keyPath: "cle" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function lireSemaine(cle) {
  const db = await ouvrirBase();
  return new Promise((resolve, reject) => {
    const req = db.transaction(MAGASIN, "readonly").objectStore(MAGASIN).get(cle);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function ecrireSemaine(enregistrement) {
  const db = await ouvrirBase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MAGASIN, "readwrite");
    tx.objectStore(MAGASIN).put(enregistrement);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ------------------------------ composant ------------------------------ */

export default function Heures({ onBack }) {
  const [lundi, setLundi] = useState(() => lundiDe(new Date()));
  const [jours, setJours] = useState({});
  const [technicien, setTechnicien] = useState("");
  const [base, setBase] = useState(35);
  const [edition, setEdition] = useState(null);
  const [vue, setVue] = useState("semaine");
  const [charge, setCharge] = useState(false);

  const cle = cleSemaine(lundi);

  useEffect(() => {
    let annule = false;
    setCharge(false);
    lireSemaine(cle)
      .then((r) => {
        if (annule) return;
        setJours(r ? r.jours || {} : {});
        if (r && r.technicien) setTechnicien(r.technicien);
        if (r && r.base) setBase(r.base);
      })
      .catch(() => {})
      .finally(() => !annule && setCharge(true));
    return () => { annule = true; };
  }, [cle]);

  const sauver = (nouveauxJours, opts = {}) => {
    const maj = { cle, jours: nouveauxJours, technicien: opts.technicien ?? technicien, base: opts.base ?? base };
    setJours(nouveauxJours);
    ecrireSemaine(maj).catch(() => {});
  };

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lundi);
    d.setDate(d.getDate() + i);
    return d;
  });

  const totalMinutes = dates.reduce((s, d) => s + dureeJour(jours[iso(d)]), 0);
  const seuil = base * 60;
  const supp = Math.max(0, totalMinutes - seuil);
  const joursAstreinte = dates.filter((d) => jours[iso(d)] && jours[iso(d)].type === "astreinte").length;
  const joursAbsence = dates.filter((d) => {
    const j = jours[iso(d)];
    return j && !typeDe(j.type).heures && j.type !== "repos";
  }).length;

  const decaler = (n) => {
    const d = new Date(lundi);
    d.setDate(d.getDate() + n * 7);
    setLundi(d);
  };

  const libelleSemaine =
    "Semaine " + numeroSemaine(lundi) + " · " +
    lundi.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) + " au " +
    dates[6].toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  /* ----------------------- édition d'une journée ----------------------- */

  if (edition) {
    const d = edition;
    const k = iso(d);
    const j = jours[k] || { type: "travail", debut: "08:00", fin: "17:00", pause: 60, note: "" };
    const t = typeDe(j.type);

    const maj = (patch) => {
      const suivant = { ...jours, [k]: { ...j, ...patch } };
      sauver(suivant);
    };

    return (
      <div>
        <div style={S.header}>
          <div style={S.headerInner}>
            <button onClick={() => setEdition(null)} style={{ padding: 8, borderRadius: 10, background: "none", border: "none", color: T.doux, fontSize: 18, cursor: "pointer" }}>←</button>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.texte }}>
                {JOURS[(d.getDay() + 6) % 7]} {d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })}
              </div>
              <div style={{ fontSize: 11, color: T.faible }}>{enHeures(dureeJour(jours[k]))} comptabilisées</div>
            </div>
          </div>
        </div>

        <div style={S.content}>
          <div style={S.panel}>
            <div style={S.label}>Type de journée</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TYPES.map((o) => {
                const actif = j.type === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => maj({ type: o.id })}
                    style={{ padding: "8px 13px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "1px solid " + (actif ? T.ambreBord : T.borderFort), background: actif ? T.ambreFond : "rgba(30,41,59,.3)", color: actif ? T.ambreClair : T.faible }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {t.heures && (
            <div style={S.panel}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={S.label}>Début</div>
                  <input type="time" value={j.debut || ""} onChange={(e) => maj({ debut: e.target.value })} style={S.input} />
                </div>
                <div>
                  <div style={S.label}>Fin</div>
                  <input type="time" value={j.fin || ""} onChange={(e) => maj({ fin: e.target.value })} style={S.input} />
                </div>
              </div>

              <div style={S.label}>Pause déjeuner</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                {[0, 30, 45, 60, 90].map((m) => {
                  const actif = Number(j.pause || 0) === m;
                  return (
                    <button
                      key={m}
                      onClick={() => maj({ pause: m })}
                      style={{ flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "1px solid " + (actif ? T.ambreBord : T.borderFort), background: actif ? T.ambreFond : "rgba(30,41,59,.3)", color: actif ? T.ambreClair : T.faible }}
                    >
                      {m === 0 ? "—" : m + "'"}
                    </button>
                  );
                })}
              </div>

              <div style={{ padding: 14, borderRadius: 12, background: "rgba(30,41,59,.4)", border: "1px solid " + T.border, textAlign: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: T.ambreClair, letterSpacing: -1 }}>{enHeures(dureeJour({ ...j }))}</div>
                <div style={{ fontSize: 11, color: T.faible, marginTop: 2 }}>temps comptabilisé</div>
              </div>
            </div>
          )}

          <div style={S.panel}>
            <div style={S.label}>Observation</div>
            <textarea
              rows={2}
              value={j.note || ""}
              onChange={(e) => maj({ note: e.target.value })}
              placeholder="Déplacement long, intervention de nuit, astreinte déclenchée…"
              style={{ ...S.input, resize: "vertical", lineHeight: 1.5 }}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => {
                const suivant = { ...jours };
                delete suivant[k];
                sauver(suivant);
                setEdition(null);
              }}
              style={{ flex: 1, padding: 13, borderRadius: 10, border: "1px solid " + T.borderFort, background: "rgba(30,41,59,.3)", color: T.doux, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
            >
              Effacer le jour
            </button>
            <button onClick={() => setEdition(null)} style={{ ...S.btn, flex: 2, width: "auto" }}>Valider</button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------- récapitulatif papier ------------------------- */

  if (vue === "recap") {
    return (
      <div className="apercu" style={{ minHeight: "100vh", background: "#020617" }}>
        <style>{`
          @page { size: A4; margin: 16mm; }
          @media print {
            .sans-impression { display: none !important; }
            .apercu { background: #fff !important; padding: 0 !important; }
            .feuille { box-shadow: none !important; padding: 0 !important; }
          }
        `}</style>

        <div className="sans-impression" style={S.header}>
          <div style={S.headerInner}>
            <button onClick={() => setVue("semaine")} style={{ padding: 8, borderRadius: 10, background: "none", border: "none", color: T.doux, fontSize: 18, cursor: "pointer" }}>←</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.texte }}>Récapitulatif</div>
              <div style={{ fontSize: 11, color: T.faible }}>{libelleSemaine}</div>
            </div>
            <button onClick={() => window.print()} style={{ padding: "11px 18px", borderRadius: 10, border: "none", background: T.ambre, color: "#020617", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              🖨 Enregistrer
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px 60px" }}>
          <div className="feuille" style={{ background: "#fff", color: "#0f172a", padding: 36, borderRadius: 4, boxShadow: "0 10px 40px rgba(0,0,0,.4)", fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #0f172a", paddingBottom: 12, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: T.ambre, fontWeight: 700 }}>
                  SAV<span style={{ color: "#0891b2" }}>i</span>
                </div>
                <h2 style={{ margin: "6px 0 2px", fontSize: 22, fontWeight: 800 }}>Relevé d'heures</h2>
                <div style={{ fontSize: 12, color: "#475569" }}>{libelleSemaine}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Technicien</div>
                <div style={{ fontWeight: 600 }}>{technicien || "—"}</div>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 20 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #0f172a", textAlign: "left" }}>
                  <th style={{ padding: "5px 0", fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>Jour</th>
                  <th style={{ padding: "5px 0", fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>Type</th>
                  <th style={{ padding: "5px 0", fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>Début</th>
                  <th style={{ padding: "5px 0", fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>Fin</th>
                  <th style={{ padding: "5px 0", fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>Pause</th>
                  <th style={{ padding: "5px 0", textAlign: "right", fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {dates.map((d, i) => {
                  const j = jours[iso(d)];
                  const t = j ? typeDe(j.type) : null;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "5px 0", fontWeight: 600 }}>
                        {JOURS[i].slice(0, 3)} {d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                      </td>
                      <td style={{ padding: "5px 0", color: "#475569" }}>{t ? t.label : "—"}</td>
                      <td style={{ padding: "5px 0", color: "#475569" }}>{j && t.heures ? j.debut : "—"}</td>
                      <td style={{ padding: "5px 0", color: "#475569" }}>{j && t.heures ? j.fin : "—"}</td>
                      <td style={{ padding: "5px 0", color: "#475569" }}>{j && t.heures && j.pause ? j.pause + " min" : "—"}</td>
                      <td style={{ padding: "5px 0", textAlign: "right", fontWeight: 600 }}>{enHeures(dureeJour(j))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, borderTop: "2px solid #0f172a", paddingTop: 14 }}>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#94a3b8", fontWeight: 700 }}>Total semaine</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{enHeures(totalMinutes)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#94a3b8", fontWeight: 700 }}>Dont majorables</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: supp ? "#b45309" : "#0f172a" }}>{enHeures(supp)}</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>au-delà de {base} h</div>
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#94a3b8", fontWeight: 700 }}>Astreintes</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{joursAstreinte}</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>jour{joursAstreinte > 1 ? "s" : ""}</div>
              </div>
            </div>

            {dates.some((d) => jours[iso(d)] && jours[iso(d)].note) && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#94a3b8", fontWeight: 700, marginBottom: 6 }}>Observations</div>
                {dates.map((d, i) => {
                  const j = jours[iso(d)];
                  if (!j || !j.note) return null;
                  return (
                    <div key={i} style={{ fontSize: 11.5, marginBottom: 3 }}>
                      <strong>{JOURS[i].slice(0, 3)} :</strong> {j.note}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginTop: 34, borderTop: "1px solid #cbd5e1", paddingTop: 18 }}>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#94a3b8", fontWeight: 700, marginBottom: 26 }}>Signature technicien</div>
                <div style={{ borderTop: "1px solid #94a3b8" }} />
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#94a3b8", fontWeight: 700, marginBottom: 26 }}>Visa responsable</div>
                <div style={{ borderTop: "1px solid #94a3b8" }} />
              </div>
            </div>

            <div style={{ marginTop: 16, textAlign: "center", fontSize: 9.5, color: "#94a3b8" }}>
              Déclaratif du technicien — à contrôler par le service paie.
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* --------------------------- vue semaine --------------------------- */

  return (
    <div>
      <div style={S.header}>
        <div style={S.headerInner}>
          <button onClick={onBack} style={{ padding: 8, borderRadius: 10, background: "none", border: "none", color: T.doux, fontSize: 18, cursor: "pointer" }}>←</button>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: T.ambreFond, border: "1px solid " + T.ambreBord, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⏱</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: T.texte }}>Relevé d'heures</div>
            <div style={{ fontSize: 11, color: T.faible }}>Feuille hebdomadaire</div>
          </div>
        </div>
      </div>

      <div style={S.content}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <button onClick={() => decaler(-1)} style={{ width: 42, height: 42, borderRadius: 10, border: "1px solid " + T.borderFort, background: "rgba(30,41,59,.3)", color: T.doux, fontSize: 16, cursor: "pointer" }}>←</button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.texte }}>Semaine {numeroSemaine(lundi)}</div>
            <div style={{ fontSize: 11, color: T.faible }}>
              {lundi.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} — {dates[6].toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
            </div>
          </div>
          <button onClick={() => decaler(1)} style={{ width: 42, height: 42, borderRadius: 10, border: "1px solid " + T.borderFort, background: "rgba(30,41,59,.3)", color: T.doux, fontSize: 16, cursor: "pointer" }}>→</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <div style={{ background: T.panel, border: "1px solid " + T.border, borderRadius: 16, padding: 16 }}>
            <div style={{ ...S.label, marginBottom: 4 }}>Total semaine</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.texte, letterSpacing: -1 }}>{enHeures(totalMinutes)}</div>
          </div>
          <div style={{ background: T.panel, border: "1px solid " + (supp ? T.ambreBord : T.border), borderRadius: 16, padding: 16 }}>
            <div style={{ ...S.label, marginBottom: 4 }}>Au-delà de {base} h</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: supp ? T.ambreClair : T.tresFaible, letterSpacing: -1 }}>{enHeures(supp)}</div>
          </div>
        </div>

        {dates.map((d, i) => {
          const j = jours[iso(d)];
          const t = j ? typeDe(j.type) : null;
          const minutes = dureeJour(j);
          const weekend = i >= 5;
          return (
            <button
              key={i}
              onClick={() => setEdition(d)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 14, marginBottom: 8, borderRadius: 14, border: "1px solid " + T.border, background: j ? T.panel : "rgba(15,23,42,.25)", color: T.texte, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
            >
              <span style={{ width: 4, alignSelf: "stretch", borderRadius: 999, background: t ? t.couleur : "transparent" }} />
              <span style={{ width: 52, flexShrink: 0 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: weekend && !j ? T.tresFaible : T.texte }}>{JOURS[i].slice(0, 3)}</span>
                <span style={{ display: "block", fontSize: 11, color: T.faible }}>{d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}</span>
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                {j ? (
                  <>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 600 }}>{t.label}</span>
                    <span style={{ display: "block", fontSize: 11, color: T.faible, marginTop: 1 }}>
                      {t.heures ? j.debut + " – " + j.fin + (j.pause ? " · pause " + j.pause + " min" : "") : "Journée non travaillée"}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: 12, color: T.tresFaible }}>Non saisi</span>
                )}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: minutes ? T.texte : T.tresFaible, flexShrink: 0 }}>
                {minutes ? enHeures(minutes) : "—"}
              </span>
            </button>
          );
        })}

        <div style={{ ...S.panel, marginTop: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <div>
              <div style={S.label}>Technicien</div>
              <input
                value={technicien}
                onChange={(e) => { setTechnicien(e.target.value); sauver(jours, { technicien: e.target.value }); }}
                placeholder="Nom et prénom"
                style={S.input}
              />
            </div>
            <div>
              <div style={S.label}>Base hebdo</div>
              <input
                type="number"
                value={base}
                onChange={(e) => { const b = Number(e.target.value) || 0; setBase(b); sauver(jours, { base: b }); }}
                style={S.input}
              />
            </div>
          </div>
          {joursAbsence > 0 && (
            <div style={{ fontSize: 11.5, color: T.faible, marginTop: 12 }}>
              {joursAbsence} jour{joursAbsence > 1 ? "s" : ""} d'absence déclaré{joursAbsence > 1 ? "s" : ""} cette semaine.
            </div>
          )}
        </div>

        <button onClick={() => setVue("recap")} style={S.btn}>📄 Récapitulatif de la semaine</button>

        <div style={{ ...S.panel, borderStyle: "dashed", marginTop: 18, marginBottom: 0 }}>
          <div style={{ fontSize: 11.5, color: T.faible, lineHeight: 1.6 }}>
            <strong style={{ color: T.doux }}>Déclaratif et local.</strong> Ces heures sont saisies par
            le technicien et stockées sur cet appareil. Elles ne remplacent pas le décompte officiel de
            l'employeur et ne sont pas partagées automatiquement. La base hebdomadaire dépend de ta
            convention collective — vérifie-la avant de t'appuyer sur le calcul des heures majorables.
          </div>
        </div>
      </div>
    </div>
  );
}
