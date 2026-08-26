import { useState } from "react";

/* ==================================================================== *
 *  TABLEAU DE BORD DIRIGEANT — SAVi
 *
 *  La question à laquelle cet écran répond : où est-ce que l'argent
 *  est bloqué ? Un relevé fait mais pas chiffré, c'est du chiffre
 *  d'affaires à l'arrêt.
 *
 *  ⚠ DONNÉES DE DÉMONSTRATION
 *  Tout ce qui est dans DEMO ci-dessous est fictif. À remplacer par
 *  les requêtes réelles quand la base sera en place. Les fonctions de
 *  calcul, elles, sont déjà les bonnes.
 * ==================================================================== */

const T = {
  bg: "#020617",
  panel: "rgba(15,23,42,.5)",
  border: "#1e293b",
  borderFort: "#334155",
  texte: "#f1f5f9",
  doux: "#94a3b8",
  faible: "#64748b",
  tresFaible: "#475569",
  ambre: "#f59e0b",
  ambreClair: "#fbbf24",
  cyan: "#22d3ee",
  rouge: "#f87171",
};

const S = {
  content: { maxWidth: 900, margin: "0 auto", padding: "24px 20px 60px" },
  label: { fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: T.faible, fontWeight: 600, marginBottom: 10 },
  panel: { background: T.panel, border: "1px solid " + T.border, borderRadius: 18, padding: 20, marginBottom: 18 },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 22 },
  kpi: { background: T.panel, border: "1px solid " + T.border, borderRadius: 16, padding: 18 },
  kpiVal: { fontSize: 30, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, marginTop: 6 },
  kpiSub: { fontSize: 11, color: T.tresFaible, marginTop: 6, lineHeight: 1.4 },
};

/* ------------------------- données de démo ------------------------- */

const DEMO = {
  releves: [
    { id: 1, date: "2026-08-24", client: "Syndic Foncia — Villeurbanne", repere: "Sectionnelle parking S1", technicien: "Karim B.", equipement: "Porte sectionnelle", complet: true, jourschiffrage: null, montant: null },
    { id: 2, date: "2026-08-23", client: "Logistique Vrac 69", repere: "Quai 4", technicien: "Sophie L.", equipement: "Nivelleur de quai", complet: true, jourschiffrage: 2, montant: 4200 },
    { id: 3, date: "2026-08-21", client: "Carrosserie Meyzieu", repere: "Rideau atelier", technicien: "Karim B.", equipement: "Rideau métallique", complet: false, jourschiffrage: null, montant: null },
    { id: 4, date: "2026-08-20", client: "Résidence Les Tilleuls", repere: "Portail entrée", technicien: "Malik T.", equipement: "Portail", complet: true, jourschiffrage: 1, montant: 2850 },
    { id: 5, date: "2026-08-18", client: "Entrepôt Corbas Nord", repere: "Porte rapide B2", technicien: "Sophie L.", equipement: "Porte rapide", complet: true, jourschiffrage: null, montant: null },
    { id: 6, date: "2026-08-17", client: "Syndic Citya — Bron", repere: "Sectionnelle sous-sol", technicien: "Malik T.", equipement: "Porte sectionnelle", complet: true, jourschiffrage: 3, montant: 3100 },
    { id: 7, date: "2026-08-14", client: "Transports Rhodia", repere: "Quai 1 et 2", technicien: "Karim B.", equipement: "Nivelleur de quai", complet: true, jourschiffrage: 8, montant: 7600 },
    { id: 8, date: "2026-08-12", client: "Clinique Part-Dieu", repere: "Barrière parking", technicien: "Sophie L.", equipement: "Barrière levante", complet: false, jourschiffrage: null, montant: null },
    { id: 9, date: "2026-08-11", client: "Métal Concept Vénissieux", repere: "Sectionnelle expédition", technicien: "Malik T.", equipement: "Porte sectionnelle", complet: true, jourschiffrage: 2, montant: 5400 },
    { id: 10, date: "2026-08-08", client: "Syndic Nexity — Lyon 7", repere: "Portail livraison", technicien: "Karim B.", equipement: "Portail", complet: true, jourschiffrage: 4, montant: 1950 },
    { id: 11, date: "2026-08-06", client: "Froid Service Sud", repere: "Porte rapide chambre 3", technicien: "Sophie L.", equipement: "Porte rapide", complet: true, jourschiffrage: 1, montant: 6800 },
    { id: 12, date: "2026-08-04", client: "Copropriété Gerland", repere: "Sectionnelle box", technicien: "Malik T.", equipement: "Porte sectionnelle", complet: true, jourschiffrage: 5, montant: 2400 },
  ],
  aujourdhui: "2026-08-26",
};

/* ------------------------------ calculs ------------------------------ */

const jours = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

function mediane(valeurs) {
  if (!valeurs.length) return null;
  const t = [...valeurs].sort((x, y) => x - y);
  const m = Math.floor(t.length / 2);
  return t.length % 2 ? t[m] : Math.round((t[m - 1] + t[m]) * 10 / 2) / 10;
}

function calculer(releves, aujourdhui) {
  const chiffres = releves.filter((r) => r.jourschiffrage !== null);
  const attente = releves
    .filter((r) => r.jourschiffrage === null)
    .map((r) => ({ ...r, age: jours(r.date, aujourdhui) }))
    .sort((a, b) => b.age - a.age);
  const complets = releves.filter((r) => r.complet).length;

  const parTechnicien = {};
  releves.forEach((r) => {
    const t = (parTechnicien[r.technicien] = parTechnicien[r.technicien] || { nom: r.technicien, total: 0, complets: 0 });
    t.total += 1;
    if (r.complet) t.complets += 1;
  });

  const parEquipement = {};
  releves.forEach((r) => {
    parEquipement[r.equipement] = (parEquipement[r.equipement] || 0) + 1;
  });

  return {
    total: releves.length,
    delaiMedian: mediane(chiffres.map((r) => r.jourschiffrage)),
    tauxComplet: Math.round((complets / releves.length) * 100),
    incomplets: releves.length - complets,
    attente,
    enRetard: attente.filter((r) => r.age > 7),
    caChiffre: chiffres.reduce((s, r) => s + (r.montant || 0), 0),
    parTechnicien: Object.values(parTechnicien).sort((a, b) => b.total - a.total),
    parEquipement: Object.entries(parEquipement).sort((a, b) => b[1] - a[1]),
  };
}

/* ---------------------------- composants ---------------------------- */

function Kpi({ label, valeur, unite, sous, couleur }) {
  return (
    <div style={S.kpi}>
      <div style={{ ...S.label, marginBottom: 0 }}>{label}</div>
      <div style={{ ...S.kpiVal, color: couleur || T.texte }}>
        {valeur}
        {unite && <span style={{ fontSize: 15, fontWeight: 600, marginLeft: 4, color: T.faible }}>{unite}</span>}
      </div>
      <div style={S.kpiSub}>{sous}</div>
    </div>
  );
}

function Barre({ nom, valeur, max, detail, couleur }) {
  const pct = max ? Math.round((valeur / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: T.texte, fontWeight: 600 }}>{nom}</span>
        <span style={{ fontSize: 11, color: T.faible }}>{detail}</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "rgba(30,41,59,.6)", overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", borderRadius: 999, background: couleur || T.cyan }} />
      </div>
    </div>
  );
}

/* ------------------------------ écran ------------------------------ */

export default function Dashboard({ onBack, releves = DEMO.releves, aujourdhui = DEMO.aujourdhui }) {
  const [periode, setPeriode] = useState("30j");
  const d = calculer(releves, aujourdhui);

  const puce = (actif) => ({
    padding: "7px 14px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    border: "1px solid " + (actif ? "rgba(245,158,11,.3)" : T.borderFort),
    background: actif ? "rgba(245,158,11,.1)" : "rgba(30,41,59,.3)",
    color: actif ? T.ambreClair : T.faible,
  });

  return (
    <div>
      <div style={{ borderBottom: "1px solid " + T.border, background: "rgba(15,23,42,.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ padding: 8, borderRadius: 10, background: "none", border: "none", color: T.doux, fontSize: 18, cursor: "pointer" }}>←</button>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📊</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: T.texte }}>Tableau de bord</div>
            <div style={{ fontSize: 11, color: T.faible }}>Activité relevés & chiffrage</div>
          </div>
        </div>
      </div>

      <div style={S.content}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["30j", "90j", "Année"].map((p) => (
            <button key={p} onClick={() => setPeriode(p)} style={puce(periode === p)}>{p}</button>
          ))}
        </div>

        <div style={S.kpiGrid}>
          <Kpi
            label="Relevés"
            valeur={d.total}
            sous="Fiches créées sur la période"
          />
          <Kpi
            label="Délai de chiffrage"
            valeur={d.delaiMedian ?? "—"}
            unite="j"
            sous="Médiane entre le relevé et le devis"
            couleur={d.delaiMedian !== null && d.delaiMedian <= 3 ? T.cyan : T.ambreClair}
          />
          <Kpi
            label="Fiches complètes"
            valeur={d.tauxComplet}
            unite="%"
            sous={d.incomplets + " fiche" + (d.incomplets > 1 ? "s" : "") + " à compléter"}
            couleur={d.tauxComplet >= 90 ? T.cyan : T.ambreClair}
          />
          <Kpi
            label="En attente de devis"
            valeur={d.attente.length}
            sous={d.enRetard.length + " au-delà de 7 jours"}
            couleur={d.enRetard.length ? T.rouge : T.texte}
          />
        </div>

        {d.attente.length > 0 && (
          <div style={S.panel}>
            <div style={S.label}>À chiffrer — les plus anciens d'abord</div>
            {d.attente.map((r) => {
              const critique = r.age > 7;
              return (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid " + T.border }}>
                  <span style={{ width: 4, alignSelf: "stretch", borderRadius: 999, background: critique ? T.rouge : T.ambre }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.texte, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.client}</div>
                    <div style={{ fontSize: 11, color: T.faible, marginTop: 2 }}>
                      {r.repere} · {r.technicien}
                      {!r.complet && <span style={{ color: T.ambreClair }}> · fiche incomplète</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: critique ? T.rouge : T.doux }}>{r.age} j</div>
                    <div style={{ fontSize: 10, color: T.tresFaible }}>d'attente</div>
                  </div>
                </div>
              );
            })}
            <p style={{ fontSize: 11.5, color: T.faible, lineHeight: 1.6, margin: "14px 0 0" }}>
              Chaque jour d'attente est un jour où le client peut appeler un concurrent.
            </p>
          </div>
        )}

        <div style={S.panel}>
          <div style={S.label}>Activité par technicien</div>
          {d.parTechnicien.map((t) => (
            <Barre
              key={t.nom}
              nom={t.nom}
              valeur={t.total}
              max={d.parTechnicien[0].total}
              detail={t.total + " relevés · " + Math.round((t.complets / t.total) * 100) + "% complets"}
              couleur={t.complets === t.total ? T.cyan : T.ambre}
            />
          ))}
        </div>

        <div style={S.panel}>
          <div style={S.label}>Parc relevé par type</div>
          {d.parEquipement.map(([nom, n]) => (
            <Barre
              key={nom}
              nom={nom}
              valeur={n}
              max={d.parEquipement[0][1]}
              detail={n + " relevé" + (n > 1 ? "s" : "")}
              couleur={T.cyan}
            />
          ))}
          <p style={{ fontSize: 11.5, color: T.faible, lineHeight: 1.6, margin: "10px 0 0" }}>
            Utile pour ajuster le stock de pièces et cibler la formation des équipes.
          </p>
        </div>

        <div style={{ ...S.panel, borderStyle: "dashed", marginBottom: 0 }}>
          <div style={{ fontSize: 12, color: T.faible, lineHeight: 1.6 }}>
            <strong style={{ color: T.doux }}>Données de démonstration.</strong> Les chiffres affichés
            sont fictifs. Les calculs, eux, sont ceux qui tourneront sur les vraies données une fois
            la base de données en place.
          </div>
        </div>
      </div>
    </div>
  );
}
