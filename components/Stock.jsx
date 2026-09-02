import { useState, useEffect } from "react";

/* ==================================================================== *
 *  INVENTAIRE CAMION — SAVi
 *
 *  Trois vues :
 *    Stock      — ce que le technicien a dans son véhicule
 *    Sorties    — registre des pièces posées, avec le client concerné
 *    À commander — pièces passées sous leur seuil d'alerte
 *
 *  Le registre des sorties est la pièce qui compte : en cas de litige
 *  de garantie, c'est lui qui prouve quelle référence a été posée, quand,
 *  chez qui et par qui.
 *
 *  ⚠ STOCKAGE LOCAL À L'APPAREIL (IndexedDB)
 *  Un camion = un appareil = un stock. Pour un stock partagé entre
 *  véhicules, il faudra remplacer le bloc STOCKAGE par une base
 *  centralisée.
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
  cyanFond: "rgba(6,182,212,.1)",
  cyanBord: "rgba(6,182,212,.3)",
  rouge: "#f87171",
  rougeFond: "rgba(239,68,68,.1)",
};

const S = {
  header: { borderBottom: "1px solid " + T.border, background: "rgba(15,23,42,.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10 },
  headerInner: { maxWidth: 800, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 },
  content: { maxWidth: 800, margin: "0 auto", padding: "20px 20px 60px" },
  label: { fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: T.faible, fontWeight: 600, marginBottom: 8 },
  panel: { background: T.panel, border: "1px solid " + T.border, borderRadius: 18, padding: 18, marginBottom: 16 },
  input: { width: "100%", padding: "11px 14px", borderRadius: 10, background: T.champ, border: "1px solid " + T.borderFort, color: T.texte, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  btn: { width: "100%", padding: 14, borderRadius: 10, border: "none", cursor: "pointer", background: T.ambre, color: "#020617", fontWeight: 700, fontSize: 14, fontFamily: "inherit" },
  btnSec: { padding: 13, borderRadius: 10, border: "1px solid " + T.borderFort, background: "rgba(30,41,59,.3)", color: T.doux, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
};

const FAMILLES = [
  "Motorisation", "Carte électronique", "Cellule / sécurité", "Télécommande / radio",
  "Ressort / équilibrage", "Galet / roulement", "Câble / chaîne", "Joint / étanchéité",
  "Serrurerie", "Visserie / fixation", "Consommable", "Autre",
];

/* ---------------------------- STOCKAGE ---------------------------- */

const DB_NOM = "savi-stock";
const V_PIECES = "pieces";
const V_MOUVEMENTS = "mouvements";

function ouvrirBase() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NOM, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(V_PIECES)) db.createObjectStore(V_PIECES, { keyPath: "id" });
      if (!db.objectStoreNames.contains(V_MOUVEMENTS)) db.createObjectStore(V_MOUVEMENTS, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tout(magasin) {
  const db = await ouvrirBase();
  return new Promise((resolve, reject) => {
    const req = db.transaction(magasin, "readonly").objectStore(magasin).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function ecrire(magasin, objet) {
  const db = await ouvrirBase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(magasin, "readwrite");
    tx.objectStore(magasin).put(objet);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function effacer(magasin, id) {
  const db = await ouvrirBase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(magasin, "readwrite");
    tx.objectStore(magasin).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ------------------ compteur pour l'écran d'accueil ------------------ */

export async function compteurStock() {
  try {
    const pieces = await tout(V_PIECES);
    return {
      references: pieces.length,
      ruptures: pieces.filter((p) => p.quantite === 0).length,
      basses: pieces.filter((p) => p.quantite > 0 && p.quantite <= p.seuil).length,
    };
  } catch {
    return null;
  }
}

/* ----------------------------- utilitaires ----------------------------- */

const idUnique = () => Date.now() + "-" + Math.random().toString(36).slice(2, 8);
const dateFr = (iso) => new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

const PIECE_VIDE = { ref: "", designation: "", marque: "", famille: "", quantite: 1, seuil: 1, emplacement: "" };

/* ------------------------------ composant ------------------------------ */

export default function Stock({ onBack }) {
  const [pieces, setPieces] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [onglet, setOnglet] = useState("stock");
  const [recherche, setRecherche] = useState("");
  const [edition, setEdition] = useState(null);   // pièce en cours de création/modification
  const [pose, setPose] = useState(null);         // sortie en cours
  const [technicien, setTechnicien] = useState("");
  const [impression, setImpression] = useState(false);
  const [alerte, setAlerte] = useState(null);

  useEffect(() => {
    Promise.all([tout(V_PIECES), tout(V_MOUVEMENTS)])
      .then(([p, m]) => {
        setPieces(p.sort((a, b) => a.designation.localeCompare(b.designation)));
        setMouvements(m.sort((a, b) => b.date.localeCompare(a.date)));
      })
      .catch(() => {});
  }, []);

  const enregistrerPiece = async () => {
    const e = edition;
    if (!e.designation.trim()) return;
    const piece = {
      ...e,
      id: e.id || idUnique(),
      designation: e.designation.trim(),
      ref: e.ref.trim(),
      quantite: Math.max(0, Number(e.quantite) || 0),
      seuil: Math.max(0, Number(e.seuil) || 0),
    };
    await ecrire(V_PIECES, piece);
    setPieces((l) => {
      const autres = l.filter((x) => x.id !== piece.id);
      return [...autres, piece].sort((a, b) => a.designation.localeCompare(b.designation));
    });
    setEdition(null);
  };

  const ajuster = async (piece, delta) => {
    const maj = { ...piece, quantite: Math.max(0, piece.quantite + delta) };
    await ecrire(V_PIECES, maj);
    setPieces((l) => l.map((p) => (p.id === maj.id ? maj : p)));
  };

  const supprimerPiece = async (id) => {
    await effacer(V_PIECES, id);
    setPieces((l) => l.filter((p) => p.id !== id));
    setEdition(null);
  };

  const validerPose = async () => {
    const p = pose;
    const qte = Math.max(1, Number(p.quantite) || 1);
    if (!p.client.trim()) return;
    if (qte > p.piece.quantite) return;

    const mouvement = {
      id: idUnique(),
      date: new Date().toISOString(),
      pieceId: p.piece.id,
      ref: p.piece.ref,
      designation: p.piece.designation,
      marque: p.piece.marque,
      quantite: qte,
      client: p.client.trim(),
      site: p.site.trim(),
      equipement: p.equipement.trim(),
      technicien: technicien.trim(),
      note: p.note.trim(),
    };
    const maj = { ...p.piece, quantite: Math.max(0, p.piece.quantite - qte) };

    await ecrire(V_MOUVEMENTS, mouvement);
    await ecrire(V_PIECES, maj);
    setMouvements((l) => [mouvement, ...l]);
    setPieces((l) => l.map((x) => (x.id === maj.id ? maj : x)));
    setPose(null);
    if (maj.quantite === 0) {
      setAlerte({
        niveau: "epuise",
        texte: "Stock épuisé : " + maj.designation + (maj.ref ? " (" + maj.ref + ")" : "") + ". C'était la dernière, pense à réapprovisionner.",
      });
    } else if (maj.quantite <= maj.seuil) {
      setAlerte({
        niveau: "bas",
        texte: "Il ne reste que " + maj.quantite + " × " + maj.designation + ". Passe au seuil d'alerte.",
      });
    }
    setOnglet("sorties");
  };

  const q = recherche.toLowerCase();
  const filtrees = pieces.filter(
    (p) =>
      !q ||
      p.designation.toLowerCase().includes(q) ||
      (p.ref || "").toLowerCase().includes(q) ||
      (p.marque || "").toLowerCase().includes(q) ||
      (p.emplacement || "").toLowerCase().includes(q)
  );
  const epuisees = pieces.filter((p) => p.quantite === 0);
  const basses = pieces.filter((p) => p.quantite > 0 && p.quantite <= p.seuil);
  const sousSeuil = [...epuisees, ...basses];
  const totalPieces = pieces.reduce((s, p) => s + p.quantite, 0);

  /* ---------------------- formulaire pièce ---------------------- */

  if (edition) {
    const e = edition;
    const maj = (patch) => setEdition({ ...e, ...patch });
    return (
      <div>
        <div style={S.header}>
          <div style={S.headerInner}>
            <button onClick={() => setEdition(null)} style={{ padding: 8, borderRadius: 10, background: "none", border: "none", color: T.doux, fontSize: 18, cursor: "pointer" }}>←</button>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.texte }}>{e.id ? "Modifier la pièce" : "Nouvelle pièce"}</div>
              <div style={{ fontSize: 11, color: T.faible }}>Inventaire camion</div>
            </div>
          </div>
        </div>

        <div style={S.content}>
          <div style={S.panel}>
            <div style={S.label}>Désignation</div>
            <input value={e.designation} onChange={(ev) => maj({ designation: ev.target.value })} placeholder="Ex : Cellule photo émetteur/récepteur" style={{ ...S.input, marginBottom: 14 }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div>
                <div style={S.label}>Référence</div>
                <input value={e.ref} onChange={(ev) => maj({ ref: ev.target.value })} placeholder="Ex : XP20D" style={S.input} />
              </div>
              <div>
                <div style={S.label}>Marque</div>
                <input value={e.marque} onChange={(ev) => maj({ marque: ev.target.value })} placeholder="Ex : Came" style={S.input} />
              </div>
            </div>

            <div style={S.label}>Famille</div>
            <select value={e.famille} onChange={(ev) => maj({ famille: ev.target.value })} style={{ ...S.input, appearance: "auto", marginBottom: 14 }}>
              <option value="">—</option>
              {FAMILLES.map((f) => <option key={f}>{f}</option>)}
            </select>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <div style={S.label}>Quantité</div>
                <input type="number" inputMode="numeric" value={e.quantite} onChange={(ev) => maj({ quantite: ev.target.value })} style={S.input} />
              </div>
              <div>
                <div style={S.label}>Seuil</div>
                <input type="number" inputMode="numeric" value={e.seuil} onChange={(ev) => maj({ seuil: ev.target.value })} style={S.input} />
              </div>
              <div>
                <div style={S.label}>Bac</div>
                <input value={e.emplacement} onChange={(ev) => maj({ emplacement: ev.target.value })} placeholder="B3" style={S.input} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: T.tresFaible, marginTop: 8, lineHeight: 1.5 }}>
              Le seuil déclenche l'alerte de réapprovisionnement. Le bac indique où la pièce est rangée dans le véhicule.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {e.id && (
              <button onClick={() => supprimerPiece(e.id)} style={{ ...S.btnSec, flex: 1 }}>Supprimer</button>
            )}
            <button onClick={enregistrerPiece} style={{ ...S.btn, flex: 2, width: "auto" }}>Enregistrer</button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------- formulaire de pose ---------------------- */

  if (pose) {
    const p = pose;
    const maj = (patch) => setPose({ ...p, ...patch });
    const qte = Math.max(1, Number(p.quantite) || 1);
    const trop = qte > p.piece.quantite;

    return (
      <div>
        <div style={S.header}>
          <div style={S.headerInner}>
            <button onClick={() => setPose(null)} style={{ padding: 8, borderRadius: 10, background: "none", border: "none", color: T.doux, fontSize: 18, cursor: "pointer" }}>←</button>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.texte, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Pose sur site</div>
              <div style={{ fontSize: 11, color: T.faible }}>{p.piece.designation}</div>
            </div>
          </div>
        </div>

        <div style={S.content}>
          <div style={{ ...S.panel, borderColor: T.cyanBord, background: T.cyanFond }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.texte }}>{p.piece.designation}</div>
            <div style={{ fontSize: 11.5, color: T.doux, marginTop: 3 }}>
              {p.piece.ref ? "Réf. " + p.piece.ref + " · " : ""}{p.piece.marque || "sans marque"} · {p.piece.quantite} en stock
            </div>
          </div>

          <div style={S.panel}>
            <div style={S.label}>Quantité posée</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <button onClick={() => maj({ quantite: Math.max(1, qte - 1) })} style={{ width: 44, height: 44, borderRadius: 10, border: "1px solid " + T.borderFort, background: "rgba(30,41,59,.3)", color: T.doux, fontSize: 20, cursor: "pointer" }}>−</button>
              <div style={{ flex: 1, textAlign: "center", fontSize: 26, fontWeight: 800, color: trop ? T.rouge : T.texte }}>{qte}</div>
              <button onClick={() => maj({ quantite: qte + 1 })} style={{ width: 44, height: 44, borderRadius: 10, border: "1px solid " + T.borderFort, background: "rgba(30,41,59,.3)", color: T.doux, fontSize: 20, cursor: "pointer" }}>+</button>
            </div>
            {trop && (
              <div style={{ padding: 12, borderRadius: 10, background: T.rougeFond, border: "1px solid rgba(239,68,68,.25)", color: T.rouge, fontSize: 12.5, marginBottom: 4 }}>
                ⚠ Tu n'as que {p.piece.quantite} pièce{p.piece.quantite > 1 ? "s" : ""} en stock.
              </div>
            )}
          </div>

          <div style={S.panel}>
            <div style={S.label}>Client <span style={{ color: T.ambreClair }}>obligatoire</span></div>
            <input value={p.client} onChange={(ev) => maj({ client: ev.target.value })} placeholder="Nom du client ou du syndic" style={{ ...S.input, marginBottom: 14 }} />

            <div style={S.label}>Site / adresse</div>
            <input value={p.site} onChange={(ev) => maj({ site: ev.target.value })} placeholder="Bâtiment, adresse, repère" style={{ ...S.input, marginBottom: 14 }} />

            <div style={S.label}>Équipement concerné</div>
            <input value={p.equipement} onChange={(ev) => maj({ equipement: ev.target.value })} placeholder="Ex : portail coulissant FAAC 745, n° série…" style={{ ...S.input, marginBottom: 14 }} />

            <div style={S.label}>Observation</div>
            <textarea rows={2} value={p.note} onChange={(ev) => maj({ note: ev.target.value })} placeholder="Motif du remplacement, garantie…" style={{ ...S.input, resize: "vertical", lineHeight: 1.5 }} />
          </div>

          <button
            onClick={validerPose}
            disabled={!p.client.trim() || trop}
            style={{ ...S.btn, background: !p.client.trim() || trop ? "#1e293b" : T.ambre, color: !p.client.trim() || trop ? T.tresFaible : "#020617", cursor: !p.client.trim() || trop ? "not-allowed" : "pointer" }}
          >
            Valider la pose et décrémenter
          </button>
          <div style={{ fontSize: 11, color: T.tresFaible, textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
            La sortie sera datée et enregistrée au registre de traçabilité.
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------- registre imprimable ---------------------- */

  if (impression) {
    return (
      <div className="apercu" style={{ minHeight: "100vh", background: "#020617" }}>
        <style>{`
          @page { size: A4 landscape; margin: 14mm; }
          @media print {
            .sans-impression { display: none !important; }
            .apercu { background: #fff !important; }
            .feuille { box-shadow: none !important; padding: 0 !important; }
          }
        `}</style>

        <div className="sans-impression" style={S.header}>
          <div style={S.headerInner}>
            <button onClick={() => setImpression(false)} style={{ padding: 8, borderRadius: 10, background: "none", border: "none", color: T.doux, fontSize: 18, cursor: "pointer" }}>←</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.texte }}>Registre de traçabilité</div>
              <div style={{ fontSize: 11, color: T.faible }}>{mouvements.length} sortie{mouvements.length > 1 ? "s" : ""}</div>
            </div>
            <button onClick={() => window.print()} style={{ padding: "11px 18px", borderRadius: 10, border: "none", background: T.ambre, color: "#020617", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>🖨 Enregistrer</button>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 60px" }}>
          <div className="feuille" style={{ background: "#fff", color: "#0f172a", padding: 34, borderRadius: 4, boxShadow: "0 10px 40px rgba(0,0,0,.4)", fontSize: 12 }}>
            <div style={{ borderBottom: "2px solid #0f172a", paddingBottom: 12, marginBottom: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: T.ambre, fontWeight: 700 }}>
                SAV<span style={{ color: "#0891b2" }}>i</span>
              </div>
              <h2 style={{ margin: "6px 0 2px", fontSize: 21, fontWeight: 800 }}>Registre de traçabilité des pièces</h2>
              <div style={{ fontSize: 11.5, color: "#475569" }}>
                {technicien ? "Technicien : " + technicien + " · " : ""}Édité le {new Date().toLocaleDateString("fr-FR")}
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #0f172a", textAlign: "left" }}>
                  {["Date", "Référence", "Désignation", "Qté", "Client", "Site", "Équipement"].map((h) => (
                    <th key={h} style={{ padding: "5px 6px 5px 0", fontSize: 9.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mouvements.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "5px 6px 5px 0", whiteSpace: "nowrap" }}>{dateFr(m.date)}</td>
                    <td style={{ padding: "5px 6px 5px 0", fontWeight: 600 }}>{m.ref || "—"}</td>
                    <td style={{ padding: "5px 6px 5px 0" }}>{m.designation}</td>
                    <td style={{ padding: "5px 6px 5px 0", fontWeight: 600 }}>{m.quantite}</td>
                    <td style={{ padding: "5px 6px 5px 0" }}>{m.client}</td>
                    <td style={{ padding: "5px 6px 5px 0", color: "#475569" }}>{m.site || "—"}</td>
                    <td style={{ padding: "5px 6px 5px 0", color: "#475569" }}>{m.equipement || "—"}</td>
                  </tr>
                ))}
                {mouvements.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontStyle: "italic" }}>Aucune sortie enregistrée.</td></tr>
                )}
              </tbody>
            </table>

            <div style={{ marginTop: 20, fontSize: 9.5, color: "#94a3b8", textAlign: "center" }}>
              Document interne — registre déclaratif des pièces posées, à conserver pour le suivi de garantie.
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ vue principale ------------------------------ */

  const puce = (actif) => ({
    padding: "8px 14px",
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    border: "1px solid " + (actif ? T.ambreBord : T.borderFort),
    background: actif ? T.ambreFond : "rgba(30,41,59,.3)",
    color: actif ? T.ambreClair : T.faible,
  });

  return (
    <div>
      <div style={S.header}>
        <div style={S.headerInner}>
          <button onClick={onBack} style={{ padding: 8, borderRadius: 10, background: "none", border: "none", color: T.doux, fontSize: 18, cursor: "pointer" }}>←</button>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: T.ambreFond, border: "1px solid " + T.ambreBord, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📦</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: T.texte }}>Inventaire camion</div>
            <div style={{ fontSize: 11, color: T.faible }}>{totalPieces} pièce{totalPieces > 1 ? "s" : ""} · {pieces.length} référence{pieces.length > 1 ? "s" : ""}</div>
          </div>
        </div>
      </div>

      <div style={S.content}>
        {alerte && (
          <div
            style={{
              display: "flex", alignItems: "flex-start", gap: 10, padding: 14, marginBottom: 16, borderRadius: 14,
              background: alerte.niveau === "epuise" ? T.rougeFond : T.ambreFond,
              border: "1px solid " + (alerte.niveau === "epuise" ? "rgba(239,68,68,.3)" : T.ambreBord),
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1.2 }}>{alerte.niveau === "epuise" ? "🛑" : "⚠"}</span>
            <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, color: alerte.niveau === "epuise" ? T.rouge : T.ambreClair }}>
              {alerte.texte}
            </span>
            <button onClick={() => setAlerte(null)} style={{ background: "none", border: "none", color: T.faible, fontSize: 15, cursor: "pointer", padding: 0, lineHeight: 1 }} aria-label="Fermer">✕</button>
          </div>
        )}

        {epuisees.length > 0 && onglet !== "commander" && (
          <button
            onClick={() => setOnglet("commander")}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10, padding: 14, marginBottom: 16,
              borderRadius: 14, background: T.rougeFond, border: "1px solid rgba(239,68,68,.3)",
              color: T.rouge, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
            }}
          >
            <span style={{ fontSize: 16 }}>🛑</span>
            <span style={{ flex: 1 }}>
              {epuisees.length} référence{epuisees.length > 1 ? "s" : ""} en rupture — {epuisees.slice(0, 2).map((p) => p.designation).join(", ")}
              {epuisees.length > 2 ? " et " + (epuisees.length - 2) + " autre" + (epuisees.length > 3 ? "s" : "") : ""}
            </span>
            <span style={{ flexShrink: 0 }}>→</span>
          </button>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          <button onClick={() => setOnglet("stock")} style={puce(onglet === "stock")}>Stock</button>
          <button onClick={() => setOnglet("sorties")} style={puce(onglet === "sorties")}>Sorties</button>
          <button
            onClick={() => setOnglet("commander")}
            style={{
              ...puce(onglet === "commander"),
              borderColor: epuisees.length ? "rgba(239,68,68,.4)" : puce(onglet === "commander").border.split(" ").pop(),
            }}
          >
            À commander
            {epuisees.length > 0 && <span style={{ color: T.rouge, marginLeft: 6 }}>● {epuisees.length}</span>}
            {epuisees.length === 0 && basses.length > 0 && <span style={{ marginLeft: 6 }}>· {basses.length}</span>}
          </button>
        </div>

        {/* ---- STOCK ---- */}
        {onglet === "stock" && (
          <>
            <button onClick={() => setEdition({ ...PIECE_VIDE })} style={{ width: "100%", padding: 15, borderRadius: 12, border: "1px dashed " + T.borderFort, background: "rgba(30,41,59,.2)", color: T.doux, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 16 }}>
              ＋ Ajouter une pièce
            </button>

            {pieces.length > 0 && (
              <div style={{ position: "relative", marginBottom: 14 }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>🔍</span>
                <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Référence, désignation, bac…" style={{ ...S.input, paddingLeft: 40 }} />
              </div>
            )}

            {pieces.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, border: "1px dashed " + T.borderFort, borderRadius: 16, color: T.tresFaible, fontSize: 13, lineHeight: 1.6 }}>
                Ton camion est vide.<br />Ajoute les pièces que tu embarques habituellement.
              </div>
            )}

            {filtrees.map((p) => {
              const rupture = p.quantite === 0;
              const bas = !rupture && p.quantite <= p.seuil;
              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: 14, marginBottom: 8, borderRadius: 14,
                    border: "1px solid " + (rupture ? "rgba(239,68,68,.35)" : bas ? T.ambreBord : T.border),
                    background: rupture ? T.rougeFond : T.panel,
                  }}
                >
                  <button onClick={() => setEdition({ ...p })} style={{ flex: 1, minWidth: 0, background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: T.texte, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.designation}</span>
                      {rupture && (
                        <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: T.rouge, border: "1px solid rgba(239,68,68,.4)", borderRadius: 4, padding: "1px 5px" }}>Épuisé</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: T.faible, marginTop: 2 }}>
                      {p.ref ? p.ref + " · " : ""}{p.marque || "—"}{p.emplacement ? " · bac " + p.emplacement : ""}
                    </div>
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => ajuster(p, -1)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid " + T.borderFort, background: "rgba(30,41,59,.3)", color: T.doux, fontSize: 16, cursor: "pointer" }}>−</button>
                    <span style={{ minWidth: 26, textAlign: "center", fontSize: 16, fontWeight: 800, color: rupture ? T.rouge : bas ? T.ambreClair : T.texte }}>{p.quantite}</span>
                    <button onClick={() => ajuster(p, 1)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid " + T.borderFort, background: "rgba(30,41,59,.3)", color: T.doux, fontSize: 16, cursor: "pointer" }}>+</button>
                  </div>

                  <button
                    onClick={() => setPose({ piece: p, quantite: 1, client: "", site: "", equipement: "", note: "" })}
                    disabled={rupture}
                    style={{ flexShrink: 0, padding: "9px 12px", borderRadius: 9, border: "1px solid " + (rupture ? T.border : T.cyanBord), background: rupture ? "transparent" : T.cyanFond, color: rupture ? T.tresFaible : T.cyan, fontSize: 11.5, fontWeight: 700, cursor: rupture ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                  >
                    Poser
                  </button>
                </div>
              );
            })}
          </>
        )}

        {/* ---- SORTIES ---- */}
        {onglet === "sorties" && (
          <>
            {mouvements.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, border: "1px dashed " + T.borderFort, borderRadius: 16, color: T.tresFaible, fontSize: 13, lineHeight: 1.6 }}>
                Aucune pièce posée pour l'instant.
              </div>
            )}

            {mouvements.map((m) => (
              <div key={m.id} style={{ padding: 14, marginBottom: 8, borderRadius: 14, border: "1px solid " + T.border, background: T.panel }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: T.texte }}>{m.designation}</span>
                  <span style={{ fontSize: 12, color: T.cyan, fontWeight: 700, flexShrink: 0 }}>×{m.quantite}</span>
                </div>
                <div style={{ fontSize: 11, color: T.faible, marginTop: 3 }}>
                  {m.ref ? "Réf. " + m.ref + " · " : ""}{dateFr(m.date)}
                </div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid " + T.border, fontSize: 12, color: T.doux }}>
                  <div style={{ fontWeight: 600, color: T.texte }}>{m.client}</div>
                  {m.site && <div style={{ fontSize: 11.5, marginTop: 2 }}>{m.site}</div>}
                  {m.equipement && <div style={{ fontSize: 11.5, color: T.faible, marginTop: 2 }}>{m.equipement}</div>}
                  {m.note && <div style={{ fontSize: 11.5, fontStyle: "italic", color: T.faible, marginTop: 4 }}>{m.note}</div>}
                </div>
              </div>
            ))}

            {mouvements.length > 0 && (
              <button onClick={() => setImpression(true)} style={{ ...S.btn, marginTop: 8 }}>📄 Éditer le registre</button>
            )}
          </>
        )}

        {/* ---- À COMMANDER ---- */}
        {onglet === "commander" && (
          <>
            {sousSeuil.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, border: "1px dashed " + T.borderFort, borderRadius: 16, color: T.tresFaible, fontSize: 13, lineHeight: 1.6 }}>
                Rien à commander.<br />Toutes les pièces sont au-dessus de leur seuil.
              </div>
            )}

            {[
              { titre: "En rupture — à commander en priorité", liste: epuisees, rouge: true },
              { titre: "Sous le seuil d'alerte", liste: basses, rouge: false },
            ].map((section) =>
              section.liste.length === 0 ? null : (
                <div key={section.titre} style={{ marginBottom: 20 }}>
                  <div style={{ ...S.label, color: section.rouge ? T.rouge : T.faible, marginBottom: 10 }}>
                    {section.titre}
                  </div>
                  {section.liste.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: 14, marginBottom: 8, borderRadius: 14,
                        border: "1px solid " + (section.rouge ? "rgba(239,68,68,.35)" : T.ambreBord),
                        background: section.rouge ? T.rougeFond : T.ambreFond,
                      }}
                    >
                      <span style={{ width: 4, alignSelf: "stretch", borderRadius: 999, background: section.rouge ? T.rouge : T.ambre }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: T.texte }}>{p.designation}</div>
                        <div style={{ fontSize: 11, color: T.doux, marginTop: 2 }}>
                          {p.ref ? p.ref + " · " : ""}{p.marque || "—"}{p.emplacement ? " · bac " + p.emplacement : ""}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: section.rouge ? T.rouge : T.ambreClair }}>{p.quantite}</div>
                        <div style={{ fontSize: 10, color: T.faible }}>seuil {p.seuil}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {sousSeuil.length > 0 && (
              <div style={{ fontSize: 11.5, color: T.faible, lineHeight: 1.6, marginTop: 14, textAlign: "center" }}>
                Montre cet écran au magasin, ou fais une capture et envoie-la.
              </div>
            )}
          </>
        )}

        <div style={{ ...S.panel, marginTop: 20 }}>
          <div style={S.label}>Technicien</div>
          <input value={technicien} onChange={(e) => setTechnicien(e.target.value)} placeholder="Nom, pour le registre de traçabilité" style={S.input} />
        </div>

        <div style={{ ...S.panel, borderStyle: "dashed", marginBottom: 0 }}>
          <div style={{ fontSize: 11.5, color: T.faible, lineHeight: 1.6 }}>
            <strong style={{ color: T.doux }}>Un camion, un appareil.</strong> Le stock est enregistré
            localement sur ce téléphone. Chaque technicien gère le sien, et le registre des sorties reste
            sur son appareil — pense à éditer le registre régulièrement pour le transmettre au bureau.
          </div>
        </div>
      </div>
    </div>
  );
}
