import { useState, useEffect, useRef } from "react";

/* ==================================================================== *
 *  MES DOCUMENTS — SAVi
 *
 *  Permet à l'utilisateur d'importer ses propres documents techniques
 *  (procédures internes, fiches de pannes, schémas, notices dont il
 *  détient les droits) et de les retrouver sur le terrain.
 *
 *  ⚠ STOCKAGE LOCAL À L'APPAREIL
 *  Les fichiers sont enregistrés dans IndexedDB, c'est-à-dire dans le
 *  navigateur du téléphone. Ils survivent au rafraîchissement et
 *  fonctionnent hors connexion, mais ils ne sont PAS partagés entre
 *  les techniciens.
 *
 *  Pour passer en bibliothèque partagée, il suffit de remplacer les
 *  quatre fonctions du bloc STOCKAGE ci-dessous par des appels à
 *  Supabase Storage. Le reste du composant ne bouge pas.
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
  cyan: "#22d3ee",
  cyanFond: "rgba(6,182,212,.1)",
  cyanBord: "rgba(6,182,212,.3)",
  ambre: "#fbbf24",
  rouge: "#f87171",
};

const S = {
  label: { fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: T.faible, fontWeight: 600, marginBottom: 8 },
  input: { width: "100%", padding: "11px 14px", borderRadius: 10, background: T.champ, border: "1px solid " + T.borderFort, color: T.texte, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  panel: { background: T.panel, border: "1px solid " + T.border, borderRadius: 18, padding: 18, marginBottom: 16 },
};

const MARQUES = [
  "Came", "Nice", "FAAC", "BFT", "Somfy", "Ditec", "Beninca",
  "Hörmann", "Novoferm", "Crawford", "Ryterna",
  "Maviflex", "Nergeco", "Efaflex", "ASSA ABLOY Entrance", "Dynaco",
  "Record", "dormakaba", "Portalp", "Tormax", "Besam",
  "Doitrand", "Safir", "La Toulousaine",
  "Rite-Hite", "Stertil",
  "Urmet", "Comelit", "Aiphone", "Intratone",
  "Générique", "Autre",
];
const TYPES = ["Notice constructeur", "Procédure interne", "Fiche de panne", "Schéma électrique", "Nomenclature pièces", "Fiche de sécurité", "Autre"];

/* -------------------------- STOCKAGE (IndexedDB) -------------------------- */

const DB_NOM = "savi-documents";
const MAGASIN = "docs";

function ouvrirBase() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NOM, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(MAGASIN)) {
        db.createObjectStore(MAGASIN, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function listerDocs() {
  const db = await ouvrirBase();
  return new Promise((resolve, reject) => {
    const req = db.transaction(MAGASIN, "readonly").objectStore(MAGASIN).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function ajouterDoc(doc) {
  const db = await ouvrirBase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MAGASIN, "readwrite");
    tx.objectStore(MAGASIN).put(doc);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function supprimerDoc(id) {
  const db = await ouvrirBase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MAGASIN, "readwrite");
    tx.objectStore(MAGASIN).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ------------------------------ utilitaires ------------------------------ */

const poids = (o) => (o < 1024 * 1024 ? Math.round(o / 1024) + " Ko" : (o / 1048576).toFixed(1) + " Mo");

const icone = (mime) => {
  if (!mime) return "📄";
  if (mime.includes("pdf")) return "📕";
  if (mime.startsWith("image")) return "🖼";
  return "📄";
};

/* ------------------------------ composant ------------------------------ */

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState(null);
  const [enAttente, setEnAttente] = useState(null); // fichier choisi, métadonnées à saisir
  const champFichier = useRef(null);

  useEffect(() => {
    listerDocs()
      .then((r) => setDocs(r.sort((a, b) => b.date.localeCompare(a.date))))
      .catch(() => setErreur("Impossible d'ouvrir le stockage local de cet appareil."))
      .finally(() => setChargement(false));
  }, []);

  const choisirFichier = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) {
      setErreur("Fichier trop volumineux (25 Mo maximum).");
      return;
    }
    setErreur(null);
    setEnAttente({
      fichier: f,
      titre: f.name.replace(/\.[^.]+$/, ""),
      marque: "",
      modele: "",
      type: "",
    });
  };

  const enregistrer = async () => {
    const a = enAttente;
    if (!a.titre.trim()) {
      setErreur("Donne un titre au document.");
      return;
    }
    const doc = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      titre: a.titre.trim(),
      marque: a.marque || "Générique",
      modele: a.modele.trim(),
      type: a.type || "Autre",
      nomFichier: a.fichier.name,
      mime: a.fichier.type,
      taille: a.fichier.size,
      date: new Date().toISOString(),
      blob: a.fichier,
    };
    try {
      await ajouterDoc(doc);
      setDocs((d) => [doc, ...d]);
      setEnAttente(null);
      setErreur(null);
    } catch {
      setErreur("Échec de l'enregistrement. Espace de stockage insuffisant ?");
    }
  };

  const ouvrir = (doc) => {
    const url = URL.createObjectURL(doc.blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const retirer = async (id) => {
    await supprimerDoc(id);
    setDocs((d) => d.filter((x) => x.id !== id));
  };

  const marquesPresentes = [...new Set(docs.map((d) => d.marque))].sort();
  const q = recherche.toLowerCase();
  const filtres = docs
    .filter((d) => !filtre || d.marque === filtre)
    .filter((d) =>
      !q ||
      d.titre.toLowerCase().includes(q) ||
      d.modele.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q)
    );
  const total = docs.reduce((s, d) => s + d.taille, 0);

  const puce = (actif) => ({
    padding: "7px 14px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    border: "1px solid " + (actif ? "#06b6d4" : T.borderFort),
    background: actif ? T.cyanFond : "rgba(30,41,59,.3)",
    color: actif ? "#67e8f9" : T.faible,
  });

  /* ----- écran de saisie des métadonnées ----- */
  if (enAttente) {
    return (
      <div>
        <div style={S.panel}>
          <div style={S.label}>Fichier sélectionné</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: "rgba(30,41,59,.4)", border: "1px solid " + T.border, marginBottom: 18 }}>
            <span style={{ fontSize: 22 }}>{icone(enAttente.fichier.type)}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, color: T.texte, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{enAttente.fichier.name}</div>
              <div style={{ fontSize: 11, color: T.faible }}>{poids(enAttente.fichier.size)}</div>
            </div>
          </div>

          <div style={S.label}>Titre</div>
          <input
            value={enAttente.titre}
            onChange={(e) => setEnAttente({ ...enAttente, titre: e.target.value })}
            style={{ ...S.input, marginBottom: 14 }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <div style={S.label}>Marque</div>
              <select value={enAttente.marque} onChange={(e) => setEnAttente({ ...enAttente, marque: e.target.value })} style={{ ...S.input, appearance: "auto" }}>
                <option value="">—</option>
                {MARQUES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <div style={S.label}>Modèle</div>
              <input value={enAttente.modele} onChange={(e) => setEnAttente({ ...enAttente, modele: e.target.value })} placeholder="Ex : BX-74" style={S.input} />
            </div>
          </div>

          <div style={S.label}>Type de document</div>
          <select value={enAttente.type} onChange={(e) => setEnAttente({ ...enAttente, type: e.target.value })} style={{ ...S.input, appearance: "auto", marginBottom: 18 }}>
            <option value="">—</option>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>

          {erreur && (
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", color: T.rouge, fontSize: 12.5, marginBottom: 14 }}>⚠ {erreur}</div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setEnAttente(null); setErreur(null); }} style={{ flex: 1, padding: 13, borderRadius: 10, border: "1px solid " + T.borderFort, background: "rgba(30,41,59,.3)", color: T.doux, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              Annuler
            </button>
            <button onClick={enregistrer} style={{ flex: 2, padding: 13, borderRadius: 10, border: "none", background: "#06b6d4", color: "#020617", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ----- bibliothèque ----- */
  return (
    <div>
      <input ref={champFichier} type="file" accept=".pdf,image/*" onChange={choisirFichier} style={{ display: "none" }} />
      <button
        onClick={() => champFichier.current && champFichier.current.click()}
        style={{ width: "100%", padding: 16, borderRadius: 14, border: "1px dashed " + T.borderFort, background: "rgba(30,41,59,.2)", color: T.doux, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 16 }}
      >
        ⬆ Importer un document
      </button>

      {erreur && !enAttente && (
        <div style={{ padding: 12, borderRadius: 10, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", color: T.rouge, fontSize: 12.5, marginBottom: 14 }}>⚠ {erreur}</div>
      )}

      {docs.length > 0 && (
        <>
          <div style={{ position: "relative", marginBottom: 14 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>🔍</span>
            <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher…" style={{ ...S.input, paddingLeft: 40 }} />
          </div>

          {marquesPresentes.length > 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              <button onClick={() => setFiltre(null)} style={puce(!filtre)}>Toutes</button>
              {marquesPresentes.map((m) => (
                <button key={m} onClick={() => setFiltre(m)} style={puce(filtre === m)}>{m}</button>
              ))}
            </div>
          )}
        </>
      )}

      {chargement && <div style={{ textAlign: "center", padding: 30, color: T.tresFaible, fontSize: 13 }}>Chargement…</div>}

      {!chargement && docs.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, border: "1px dashed " + T.borderFort, borderRadius: 16, color: T.tresFaible, fontSize: 13, lineHeight: 1.6 }}>
          Aucun document importé.<br />
          Procédures internes, fiches de pannes, schémas — tout ce que tu veux retrouver sur site.
        </div>
      )}

      {filtres.map((d) => (
        <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, marginBottom: 8, borderRadius: 12, border: "1px solid " + T.border, background: T.panel }}>
          <button onClick={() => ouvrir(d)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{icone(d.mime)}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.texte, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.titre}</span>
              <span style={{ display: "block", fontSize: 11, color: T.faible, marginTop: 2 }}>
                {d.marque}{d.modele ? " " + d.modele : ""} · {d.type} · {poids(d.taille)}
              </span>
            </span>
          </button>
          <button onClick={() => retirer(d.id)} style={{ background: "none", border: "none", color: T.tresFaible, fontSize: 15, cursor: "pointer", flexShrink: 0 }} aria-label="Supprimer">🗑</button>
        </div>
      ))}

      {docs.length > 0 && (
        <div style={{ fontSize: 11, color: T.tresFaible, textAlign: "center", marginTop: 16 }}>
          {docs.length} document{docs.length > 1 ? "s" : ""} · {poids(total)} sur cet appareil
        </div>
      )}

      <div style={{ ...S.panel, borderStyle: "dashed", marginTop: 18, marginBottom: 0 }}>
        <div style={{ fontSize: 11.5, color: T.faible, lineHeight: 1.6 }}>
          <strong style={{ color: T.doux }}>Stockage local.</strong> Ces documents sont enregistrés
          sur cet appareil uniquement. Ils fonctionnent hors connexion mais ne sont pas partagés avec
          les autres techniciens, et ils disparaissent si les données du navigateur sont effacées.
          <br /><br />
          <strong style={{ color: T.ambre }}>Droits d'auteur.</strong> N'importe que des documents
          dont tu détiens les droits ou dont la diffusion t'a été autorisée par le constructeur.
        </div>
      </div>
    </div>
  );
}
