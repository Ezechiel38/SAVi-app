import { useState } from "react";
import Head from "next/head";
import Releve from "../components/Releve";
import Dashboard from "../components/Dashboard";
import Documents from "../components/Documents";
import Heures from "../components/Heures";
import Stock from "../components/Stock";

const FAMILLES = [
  "Automatismes de portail",
  "Portes sectionnelles & industrielles",
  "Portes rapides",
  "Portes automatiques piétonnes",
  "Rideaux métalliques",
  "Quais & manutention",
  "Contrôle d'accès",
];

const BRANDS = [
  // ---- Automatismes de portail ----
  { name: "Came", color: "#E30613", famille: "Automatismes de portail", specialty: "Portails, portes de garage, bornes", website: "https://www.came.com/fr/fr",
    docs: [
      { title: "Came BX-74/78 — Manuel installateur", type: "Portail coulissant" },
      { title: "Came ATI — Notice technique", type: "Portail battant" },
      { title: "Came ZBX — Armoire de commande", type: "Électronique" },
      { title: "Came FROG — Motorisation enterrée", type: "Portail battant" },
    ]},
  { name: "Nice", color: "#0066B3", famille: "Automatismes de portail", specialty: "Automatismes portails & volets", website: "https://www.niceforyou.com/fr",
    docs: [
      { title: "Nice Robus 600/1000 — Guide rapide", type: "Portail coulissant" },
      { title: "Nice Wingo — Notice technique", type: "Portail battant" },
      { title: "Nice MC824H — Logique de commande", type: "Électronique" },
    ]},
  { name: "FAAC", color: "#003DA5", famille: "Automatismes de portail", specialty: "Automatismes & contrôle d'accès", website: "https://www.faac.fr",
    docs: [
      { title: "FAAC 740/741 — Manuel installation", type: "Portail coulissant" },
      { title: "FAAC 391 — Vérin portail battant", type: "Portail battant" },
      { title: "FAAC E124 — Armoire de commande", type: "Électronique" },
    ]},
  { name: "BFT", color: "#F39200", famille: "Automatismes de portail", specialty: "Automatismes résidentiels & industriels", website: "https://www.bft-automation.com/fr",
    docs: [
      { title: "BFT Deimos Ultra BT — Notice", type: "Portail coulissant" },
      { title: "BFT Phobos BT — Vérin", type: "Portail battant" },
      { title: "BFT Thalia — Centrale de commande", type: "Électronique" },
    ]},
  { name: "Somfy", color: "#FFCC00", famille: "Automatismes de portail", specialty: "Volets, stores, portails, domotique", website: "https://www.somfy.fr",
    docs: [
      { title: "Somfy Axovia Multipro — Portail battant", type: "Portail battant" },
      { title: "Somfy Elixo 500 3S — Portail coulissant", type: "Portail coulissant" },
      { title: "Somfy Dexxo Pro 1000 — Porte de garage", type: "Porte de garage" },
    ]},
  { name: "Beninca", color: "#64748b", famille: "Automatismes de portail", specialty: "Motorisations portails & barrières", website: "", docs: [] },
  { name: "Ditec", color: "#64748b", famille: "Automatismes de portail", specialty: "Automatismes portails, barrières, piétonnes", website: "", docs: [] },
  { name: "Roger Technology", color: "#64748b", famille: "Automatismes de portail", specialty: "Motorisations 24 V portails", website: "", docs: [] },
  { name: "Erreka", color: "#64748b", famille: "Automatismes de portail", specialty: "Automatismes portails & industriels", website: "", docs: [] },
  { name: "Proteco", color: "#64748b", famille: "Automatismes de portail", specialty: "Motorisations portails", website: "", docs: [] },

  // ---- Portes sectionnelles & industrielles ----
  { name: "Hörmann", color: "#003366", famille: "Portes sectionnelles & industrielles", specialty: "Portes de garage, portes industrielles", website: "https://www.hormann.fr",
    docs: [
      { title: "Hörmann SupraMatic E/P — Notice", type: "Porte de garage" },
      { title: "Hörmann WA 300 S4 — Porte industrielle", type: "Porte industrielle" },
      { title: "Hörmann LineaMatic P — Coulissant", type: "Portail coulissant" },
    ]},
  { name: "Novoferm", color: "#64748b", famille: "Portes sectionnelles & industrielles", specialty: "Sectionnelles, coupe-feu, quais", website: "https://www.novoferm.fr", docs: [] },
  { name: "Crawford", color: "#64748b", famille: "Portes sectionnelles & industrielles", specialty: "Portes industrielles (ASSA ABLOY)", website: "", docs: [] },
  { name: "Ryterna", color: "#64748b", famille: "Portes sectionnelles & industrielles", specialty: "Sectionnelles industrielles et résidentielles", website: "", docs: [] },
  { name: "Alpha Deuren", color: "#64748b", famille: "Portes sectionnelles & industrielles", specialty: "Sectionnelles industrielles sur mesure", website: "", docs: [] },
  { name: "Sothoferm", color: "#64748b", famille: "Portes sectionnelles & industrielles", specialty: "Fermetures industrielles françaises", website: "", docs: [] },

  // ---- Portes rapides ----
  { name: "Maviflex", color: "#64748b", famille: "Portes rapides", specialty: "Portes souples rapides, fabricant lyonnais", website: "https://www.maviflex.com", docs: [] },
  { name: "Nergeco", color: "#64748b", famille: "Portes rapides", specialty: "Portes rapides souples industrielles", website: "https://www.nergeco.com", docs: [] },
  { name: "Efaflex", color: "#64748b", famille: "Portes rapides", specialty: "Portes rapides spiralées et à enroulement", website: "https://www.efaflex.com", docs: [] },
  { name: "ASSA ABLOY Entrance", color: "#64748b", famille: "Portes rapides", specialty: "Portes rapides, quais, piétonnes (Albany, Besam)", website: "", docs: [] },
  { name: "Dynaco", color: "#64748b", famille: "Portes rapides", specialty: "Portes rapides à enroulement", website: "", docs: [] },
  { name: "Campisa", color: "#64748b", famille: "Portes rapides", specialty: "Portes rapides et équipements de quai", website: "", docs: [] },

  // ---- Portes automatiques piétonnes ----
  { name: "Record", color: "#64748b", famille: "Portes automatiques piétonnes", specialty: "Portes automatiques coulissantes et battantes", website: "", docs: [] },
  { name: "dormakaba", color: "#64748b", famille: "Portes automatiques piétonnes", specialty: "Portes automatiques, ferme-portes, contrôle d'accès", website: "", docs: [] },
  { name: "Portalp", color: "#64748b", famille: "Portes automatiques piétonnes", specialty: "Portes automatiques, fabricant français", website: "", docs: [] },
  { name: "Tormax", color: "#64748b", famille: "Portes automatiques piétonnes", specialty: "Motorisations portes automatiques", website: "", docs: [] },
  { name: "Besam", color: "#64748b", famille: "Portes automatiques piétonnes", specialty: "Portes automatiques (ASSA ABLOY)", website: "", docs: [] },
  { name: "Manusa", color: "#64748b", famille: "Portes automatiques piétonnes", specialty: "Portes automatiques coulissantes", website: "", docs: [] },
  { name: "Label", color: "#64748b", famille: "Portes automatiques piétonnes", specialty: "Automatismes de portes piétonnes", website: "", docs: [] },

  // ---- Rideaux métalliques ----
  { name: "Doitrand", color: "#64748b", famille: "Rideaux métalliques", specialty: "Rideaux métalliques, grilles, fabricant français", website: "", docs: [] },
  { name: "Safir", color: "#64748b", famille: "Rideaux métalliques", specialty: "Rideaux métalliques et grilles articulées", website: "", docs: [] },
  { name: "La Toulousaine", color: "#64748b", famille: "Rideaux métalliques", specialty: "Fermetures métalliques, portes de garage", website: "", docs: [] },
  { name: "Rolflex", color: "#64748b", famille: "Rideaux métalliques", specialty: "Portes repliables et rideaux", website: "", docs: [] },

  // ---- Quais & manutention ----
  { name: "Rite-Hite", color: "#64748b", famille: "Quais & manutention", specialty: "Niveleurs, sas, équipements de quai", website: "", docs: [] },
  { name: "Stertil", color: "#64748b", famille: "Quais & manutention", specialty: "Niveleurs de quai et systèmes de chargement", website: "", docs: [] },
  { name: "Loading Systems", color: "#64748b", famille: "Quais & manutention", specialty: "Équipements de quai complets", website: "", docs: [] },
  { name: "Hafa", color: "#64748b", famille: "Quais & manutention", specialty: "Niveleurs et sas d'étanchéité", website: "", docs: [] },

  // ---- Contrôle d'accès ----
  { name: "Urmet", color: "#64748b", famille: "Contrôle d'accès", specialty: "Interphonie, Vigik, contrôle d'accès", website: "", docs: [] },
  { name: "Comelit", color: "#64748b", famille: "Contrôle d'accès", specialty: "Interphonie et vidéophonie", website: "", docs: [] },
  { name: "Aiphone", color: "#64748b", famille: "Contrôle d'accès", specialty: "Portiers audio et vidéo", website: "", docs: [] },
  { name: "Intratone", color: "#64748b", famille: "Contrôle d'accès", specialty: "Interphonie GSM sans fil, copropriété", website: "", docs: [] },
  { name: "Noralsy", color: "#64748b", famille: "Contrôle d'accès", specialty: "Contrôle d'accès et Vigik", website: "", docs: [] },
  { name: "Automatic Systems", color: "#64748b", famille: "Contrôle d'accès", specialty: "Barrières levantes, tourniquets, sas", website: "", docs: [] },
];

const styles = {
  page: { minHeight: "100vh", background: "#020617", color: "#f1f5f9", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  // HOME
  homeWrap: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "40px 20px" },
  grid: { position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "36px 36px", pointerEvents: "none" },
  blob1: { position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(245,158,11,.1)", filter: "blur(80px)" },
  blob2: { position: "absolute", bottom: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(6,182,212,.08)", filter: "blur(80px)" },
  badge: { display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 999, border: "1px solid rgba(245,158,11,.3)", background: "rgba(245,158,11,.05)", fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#fcd34d", marginBottom: 24 },
  dot: { width: 6, height: 6, borderRadius: "50%", background: "#fbbf24" },
  logo: { fontSize: "clamp(56px,14vw,96px)", fontWeight: 900, letterSpacing: -4, lineHeight: 1, marginBottom: 12 },
  sub: { color: "#94a3b8", fontSize: 15, maxWidth: 440, margin: "0 auto 48px", lineHeight: 1.6 },
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16, maxWidth: 700, width: "100%" },
  card: { position: "relative", padding: 28, borderRadius: 18, border: "1px solid #1e293b", background: "rgba(15,23,42,.5)", textAlign: "left", cursor: "pointer", color: "#f1f5f9", overflow: "hidden" },
  // HEADER
  header: { borderBottom: "1px solid #1e293b", background: "rgba(15,23,42,.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10 },
  headerInner: { maxWidth: 800, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 },
  backBtn: { padding: 8, borderRadius: 10, background: "none", border: "none", color: "#94a3b8", fontSize: 18, cursor: "pointer" },
  // FORM
  content: { maxWidth: 800, margin: "0 auto", padding: "24px 20px" },
  panel: { background: "rgba(15,23,42,.5)", border: "1px solid #1e293b", borderRadius: 18, padding: 22, marginBottom: 20 },
  label: { fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "#64748b", fontWeight: 600, marginBottom: 8 },
  input: { width: "100%", padding: "11px 14px", borderRadius: 10, background: "rgba(30,41,59,.5)", border: "1px solid #334155", color: "#f1f5f9", fontSize: 13, outline: "none", fontFamily: "inherit" },
  btnPrimary: { width: "100%", padding: 14, borderRadius: 10, border: "none", cursor: "pointer", background: "#f59e0b", color: "#020617", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  // ACCUEIL
  landing: { minHeight: "100vh", background: "radial-gradient(circle at 50% -10%, #0a1220 0%, #010206 55%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative", overflow: "hidden" },
  landingGrid: { position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "44px 44px", pointerEvents: "none" },
  dropBtn: { width: "100%", padding: "16px 18px", borderRadius: 14, border: "1px solid #1e293b", background: "rgba(15,23,42,.6)", color: "#f1f5f9", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, textAlign: "left" },
  dropPanel: { marginTop: 8, borderRadius: 14, border: "1px solid #1e293b", background: "rgba(2,6,23,.95)", overflow: "hidden" },
  dropItem: { width: "100%", padding: "15px 18px", background: "none", border: "none", borderTop: "1px solid #1e293b", color: "#f1f5f9", fontSize: 14, fontFamily: "inherit", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  soon: { fontSize: 9, textTransform: "uppercase", letterSpacing: 1.2, padding: "3px 8px", borderRadius: 999, border: "1px solid #334155", color: "#475569", whiteSpace: "nowrap" },
  glow: { position: "absolute", top: "-15%", left: "50%", transform: "translateX(-50%)", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,.09) 0%, transparent 65%)", pointerEvents: "none" },
  watermark: { position: "absolute", top: "50%", left: "50%", width: 620, height: 620, marginTop: -330, marginLeft: -310, opacity: 0.05, pointerEvents: "none", animation: "savi-spin-rev 120s linear infinite" },
  pill: { display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, border: "1px solid #1e293b", background: "rgba(15,23,42,.5)", fontSize: 11, color: "#64748b", whiteSpace: "nowrap" },
};

const SPECIALITES = [
  { id: "fermeture", label: "Fermeture & automatisme", detail: "Portails, sectionnelles, rideaux, quais", actif: true },
  { id: "electricite", label: "Électricité", detail: "Courants forts et faibles", actif: false },
  { id: "levage", label: "Levage & manutention", detail: "Monte-charges, tables élévatrices", actif: false },
  { id: "cvc", label: "CVC & climatisation", detail: "Chauffage, ventilation, froid", actif: false },
  { id: "incendie", label: "Sécurité incendie", detail: "Désenfumage, portes coupe-feu", actif: false },
];

function Header({ onBack, icon, accent, title, subtitle }) {
  const border = accent === "amber" ? "rgba(245,158,11,.3)" : accent === "emerald" ? "rgba(6,182,212,.3)" : "rgba(6,182,212,.3)";
  const bg = accent === "amber" ? "rgba(245,158,11,.1)" : accent === "emerald" ? "rgba(6,182,212,.1)" : "rgba(6,182,212,.1)";
  return (
    <div style={styles.header}>
      <div style={styles.headerInner}>
        <button onClick={onBack} style={styles.backBtn}>←</button>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, border: "1px solid " + border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icon}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}>{title}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

function LogoSAVi({ taille = 72 }) {
  const [erreur, setErreur] = useState(false);
  if (!erreur) {
    return (
      <img
        src="/img/savi-logo.svg"
        alt="SAVi"
        onError={() => setErreur(true)}
        style={{ width: taille, height: taille, objectFit: "contain" }}
      />
    );
  }
  return (
    <svg viewBox="0 0 48 48" width={taille} height={taille} fill="none">
      {/* denture du pignon, en rotation lente */}
      <g style={{ transformOrigin: "24px 24px", animation: "savi-spin 26s linear infinite" }}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <rect key={a} x="22.4" y="2.5" width="3.2" height="7" rx="1.2" fill="#334155" transform={"rotate(" + a + " 24 24)"} />
        ))}
        <circle cx="24" cy="24" r="17" stroke="#475569" strokeWidth="2.2" />
      </g>
      {/* empreinte six pans */}
      <path d="M32 24L28 30.93L20 30.93L16 24L20 17.07L28 17.07Z" stroke="#94a3b8" strokeWidth="2" strokeLinejoin="round" />
      {/* repère de mesure */}
      <circle cx="24" cy="24" r="2.6" fill="#fbbf24" />
    </svg>
  );
}

function Accueil({ go }) {
  const [ouvert, setOuvert] = useState(false);

  const tick = (pos) => ({
    position: "absolute",
    width: 14,
    height: 14,
    borderColor: "#1e293b",
    borderStyle: "solid",
    borderWidth: 0,
    ...pos,
  });

  return (
    <div style={styles.landing}>
      <style>{`
        @keyframes savi-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes savi-spin-rev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes savi-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) {
          [style*="savi-spin"], [style*="savi-in"] { animation: none !important; }
        }
      `}</style>

      <div style={styles.landingGrid} />
      <div style={styles.glow} />

      <svg viewBox="0 0 48 48" style={styles.watermark} fill="none" aria-hidden="true">
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
          <rect key={a} x="22.6" y="1.5" width="2.8" height="7" rx="1" fill="#94a3b8" transform={"rotate(" + a + " 24 24)"} />
        ))}
        <circle cx="24" cy="24" r="18" stroke="#94a3b8" strokeWidth="1.4" />
        <circle cx="24" cy="24" r="7" stroke="#94a3b8" strokeWidth="1.4" />
      </svg>

      <div style={{ position: "relative", width: "100%", maxWidth: 360, textAlign: "center", animation: "savi-in .5s ease-out" }}>
        <div style={tick({ top: -14, left: -14, borderLeftWidth: 1, borderTopWidth: 1 })} />
        <div style={tick({ top: -14, right: -14, borderRightWidth: 1, borderTopWidth: 1 })} />
        <div style={tick({ bottom: -14, left: -14, borderLeftWidth: 1, borderBottomWidth: 1 })} />
        <div style={tick({ bottom: -14, right: -14, borderRightWidth: 1, borderBottomWidth: 1 })} />

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <LogoSAVi taille={78} />
        </div>
        <h1 style={{ fontSize: 62, fontWeight: 900, letterSpacing: -3, lineHeight: 1, margin: "0 0 10px" }}>
          SAV<span style={{ color: "#fbbf24" }}>i</span>
        </h1>
        <p style={{ color: "#64748b", fontSize: 13.5, lineHeight: 1.6, margin: "0 auto 34px", maxWidth: 300 }}>
          L'assistant de maintenance qui diagnostique, documente et chiffre — depuis le terrain.
        </p>

        <div style={{ ...styles.label, textAlign: "left", marginBottom: 8 }}>Spécialité</div>
        <button onClick={() => setOuvert(!ouvert)} style={styles.dropBtn}>
          <span style={{ color: "#64748b", fontWeight: 500 }}>Choisir une spécialité</span>
          <span style={{ color: "#475569", transform: ouvert ? "rotate(180deg)" : "none", transition: "transform .15s" }}>▾</span>
        </button>

        {ouvert && (
          <div style={styles.dropPanel}>
            {SPECIALITES.map((sp, i) => (
              <button
                key={sp.id}
                onClick={() => sp.actif && go("home")}
                disabled={!sp.actif}
                style={{
                  ...styles.dropItem,
                  borderTop: i === 0 ? "none" : "1px solid #1e293b",
                  cursor: sp.actif ? "pointer" : "not-allowed",
                  opacity: sp.actif ? 1 : 0.45,
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 600, color: sp.actif ? "#f1f5f9" : "#64748b" }}>{sp.label}</span>
                  <span style={{ display: "block", fontSize: 11, color: "#475569", marginTop: 2 }}>{sp.detail}</span>
                </span>
                {sp.actif ? <span style={{ color: "#fbbf24", fontSize: 15 }}>→</span> : <span style={styles.soon}>Bientôt</span>}
              </button>
            ))}
          </div>
        )}

        {!ouvert && (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 28 }}>
            <span style={styles.pill}>✨ Diagnostic IA</span>
            <span style={styles.pill}>📘 6 marques</span>
            <span style={styles.pill}>📋 7 équipements</span>
          </div>
        )}

        <div style={{ marginTop: 40, fontSize: 10, color: "#1e293b", letterSpacing: 2, textTransform: "uppercase" }}>
          v1.6 · Assistant technicien
        </div>
      </div>
    </div>
  );
}

function Home({ go, onBack }) {
  return (
    <div style={styles.homeWrap}>
      <div style={styles.grid} />
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={{ position: "relative", maxWidth: 700, width: "100%", textAlign: "center" }}>
        <button
          onClick={onBack}
          style={{ ...styles.badge, cursor: "pointer", fontFamily: "inherit" }}
        >
          <div style={styles.dot} />← Fermeture &amp; automatisme
        </button>
        <h1 style={styles.logo}>SAV<span style={{ color: "#fbbf24" }}>i</span></h1>
        <p style={styles.sub}>L'assistant diagnostic intelligent pour techniciens de la fermeture industrielle & copro/syndic</p>
        <div style={styles.cards}>
          <button onClick={() => go("ia")} style={styles.card}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(245,158,11,.1)", filter: "blur(30px)" }} />
            <div style={{ position: "relative" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>✨</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Assistance IA</h2>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5, margin: 0 }}>Décrivez les symptômes, l'IA propose causes probables et vérifications.</p>
              <div style={{ marginTop: 18, fontSize: 13, fontWeight: 600, color: "#fbbf24" }}>Lancer un diagnostic →</div>
            </div>
          </button>
          <button onClick={() => go("doc")} style={styles.card}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(6,182,212,.1)", filter: "blur(30px)" }} />
            <div style={{ position: "relative" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(6,182,212,.1)", border: "1px solid rgba(6,182,212,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>📘</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Documentation technique</h2>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5, margin: 0 }}>Fiches et notices constructeurs par marque et modèle.</p>
              <div style={{ marginTop: 18, fontSize: 13, fontWeight: 600, color: "#22d3ee" }}>Parcourir la bibliothèque →</div>
            </div>
          </button>
          <button onClick={() => go("releve")} style={styles.card}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(6,182,212,.1)", filter: "blur(30px)" }} />
            <div style={{ position: "relative" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(6,182,212,.1)", border: "1px solid rgba(6,182,212,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>📋</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Relevé pour devis</h2>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5, margin: 0 }}>Prise de référence sur site, transmise au commercial pour chiffrage.</p>
              <div style={{ marginTop: 18, fontSize: 13, fontWeight: 600, color: "#22d3ee" }}>Démarrer un relevé →</div>
            </div>
          </button>
          <button onClick={() => go("dashboard")} style={styles.card}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(245,158,11,.1)", filter: "blur(30px)" }} />
            <div style={{ position: "relative" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>📊</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Tableau de bord</h2>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5, margin: 0 }}>Délais de chiffrage, fiches en attente, activité des équipes.</p>
              <div style={{ marginTop: 18, fontSize: 13, fontWeight: 600, color: "#fbbf24" }}>Voir l'activité →</div>
            </div>
          </button>
          <button onClick={() => go("heures")} style={styles.card}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(6,182,212,.1)", filter: "blur(30px)" }} />
            <div style={{ position: "relative" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(6,182,212,.1)", border: "1px solid rgba(6,182,212,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>⏱</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Relevé d'heures</h2>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5, margin: 0 }}>Feuille hebdomadaire, heures majorables et récapitulatif à transmettre.</p>
              <div style={{ marginTop: 18, fontSize: 13, fontWeight: 600, color: "#22d3ee" }}>Saisir mes heures →</div>
            </div>
          </button>
          <button onClick={() => go("stock")} style={styles.card}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(245,158,11,.1)", filter: "blur(30px)" }} />
            <div style={{ position: "relative" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>📦</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Inventaire camion</h2>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5, margin: 0 }}>Stock de pièces, sorties tracées par client, réapprovisionnement.</p>
              <div style={{ marginTop: 18, fontSize: 13, fontWeight: 600, color: "#fbbf24" }}>Ouvrir mon stock →</div>
            </div>
          </button>
        </div>
        <div style={{ marginTop: 48, fontSize: 10, color: "#334155", letterSpacing: 2, textTransform: "uppercase" }}>v1.1 · Fermeture industrielle & copro</div>
      </div>
    </div>
  );
}

function IA({ onBack }) {
  const [ctx, setCtx] = useState("copro");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = async () => {
    if (!symptoms.trim()) { setError("Décrivez les symptômes."); return; }
    setError(null); setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ctx, brand, model, symptoms }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Le serveur a répondu " + res.status);
      }
      if (!data.causes || !data.causes.length) {
        throw new Error("Réponse incomplète du serveur.");
      }
      setResult(data);
    } catch (e) {
      console.error("Diagnostic :", e);
      setError(e.message || "Erreur lors du diagnostic. Réessayez.");
    } finally { setLoading(false); }
  };

  const ps = p => p === "Élevée"
    ? { bg: "rgba(239,68,68,.15)", c: "#fca5a5", b: "rgba(239,68,68,.3)" }
    : p === "Moyenne"
    ? { bg: "rgba(245,158,11,.15)", c: "#fcd34d", b: "rgba(245,158,11,.3)" }
    : { bg: "rgba(100,116,139,.15)", c: "#cbd5e1", b: "rgba(100,116,139,.3)" };

  const chip = a => ({ padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "center", border: a ? "1px solid #f59e0b" : "1px solid #334155", background: a ? "rgba(245,158,11,.1)" : "rgba(30,41,59,.3)", color: a ? "#fcd34d" : "#94a3b8" });

  return (
    <div>
      <Header onBack={onBack} icon="✨" accent="amber" title="Assistance IA" subtitle="Diagnostic assisté" />
      <div style={styles.content}>
        <div style={styles.panel}>
          <div style={{ ...styles.label, marginBottom: 8 }}>Contexte</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
            <button onClick={() => setCtx("copro")} style={chip(ctx === "copro")}>Copro / Syndic</button>
            <button onClick={() => setCtx("industriel")} style={chip(ctx === "industriel")}>Site industriel</button>
          </div>
          <div style={{ ...styles.label, marginBottom: 8 }}>Équipement</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
            <select value={brand} onChange={e => setBrand(e.target.value)} style={{ ...styles.input, appearance: "auto" }}>
              <option value="">— Marque —</option>
              {FAMILLES.map(f => (
                <optgroup key={f} label={f}>
                  {BRANDS.filter(b => b.famille === f).map(b => <option key={b.name}>{b.name}</option>)}
                </optgroup>
              ))}
              <option>Autre</option>
            </select>
            <input value={model} onChange={e => setModel(e.target.value)} placeholder="Modèle..." style={styles.input} />
          </div>
          <div style={{ ...styles.label, marginBottom: 8 }}>Symptômes <span style={{ color: "#fbbf24" }}>*</span></div>
          <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} rows={4}
            placeholder="Ex: Le portail coulissant ne répond plus à la télécommande. LED rouge clignotante..."
            style={{ ...styles.input, resize: "vertical", minHeight: 100, lineHeight: 1.5, marginBottom: 16 }} />
          {error && <div style={{ padding: 12, borderRadius: 10, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", color: "#fca5a5", fontSize: 13, marginBottom: 14 }}>⚠ {error}</div>}
          <button onClick={run} disabled={loading} style={{ ...styles.btnPrimary, background: loading ? "#334155" : "#f59e0b", color: loading ? "#64748b" : "#020617", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "⏳ Analyse en cours..." : "🚀 Lancer le diagnostic"}
          </button>
        </div>

        {result && (
          <div>
            <div style={{ background: "linear-gradient(135deg,rgba(245,158,11,.1),transparent)", border: "1px solid rgba(245,158,11,.25)", borderRadius: 18, padding: 20, marginBottom: 14 }}>
              <div style={{ ...styles.label, color: "#fcd34d", marginBottom: 8 }}>✨ Synthèse</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{result.synthese}</p>
            </div>
            {result.securite && (
              <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 18, padding: 18, marginBottom: 14 }}>
                <div style={{ ...styles.label, color: "#fca5a5", marginBottom: 8 }}>⚠ Sécurité</div>
                <p style={{ fontSize: 13, lineHeight: 1.5, color: "#fecaca", margin: 0 }}>{result.securite}</p>
              </div>
            )}
            {result.precisions && result.precisions.length > 0 && (
              <div style={{ background: "rgba(6,182,212,.08)", border: "1px solid rgba(6,182,212,.25)", borderRadius: 18, padding: 18, marginBottom: 14 }}>
                <div style={{ ...styles.label, color: "#67e8f9", marginBottom: 8 }}>À préciser sur place</div>
                {result.precisions.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#cbd5e1", marginBottom: 5 }}>
                    <span style={{ color: "#22d3ee", fontWeight: 700 }}>?</span><span>{p}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ ...styles.label, marginBottom: 12 }}>Causes probables</div>
            {result.causes.map((c, i) => {
              const s = ps(c.probabilite);
              return (
                <div key={i} style={{ background: "rgba(15,23,42,.5)", border: "1px solid #1e293b", borderRadius: 18, padding: 18, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#94a3b8" }}>{i + 1}</div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{c.cause}</div>
                    </div>
                    <span style={{ background: s.bg, color: s.c, border: "1px solid " + s.b, fontSize: 10, padding: "3px 10px", borderRadius: 999, fontWeight: 600, whiteSpace: "nowrap" }}>{c.probabilite}</span>
                  </div>
                  <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>{c.explication}</p>
                  <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: "#475569", fontWeight: 600, marginBottom: 6 }}>Vérifications</div>
                  {c.verifications.map((v, j) => (
                    <div key={j} style={{ display: "flex", gap: 8, fontSize: 13, color: "#cbd5e1", marginBottom: 5 }}>
                      <span style={{ color: "#22d3ee", fontWeight: 700 }}>✓</span><span>{v}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Doc({ onBack }) {
  const [sel, setSel] = useState(null);
  const [q, setQ] = useState("");
  const [onglet, setOnglet] = useState("constructeurs");
  const [famille, setFamille] = useState(null);
  const brand = sel ? BRANDS.find(b => b.name === sel) : null;
  const all = brand
    ? brand.docs.map(d => ({ ...d, brand: brand.name }))
    : BRANDS.filter(b => !famille || b.famille === famille).flatMap(b => b.docs.map(d => ({ ...d, brand: b.name })));
  const filtered = all.filter(d => d.title.toLowerCase().includes(q.toLowerCase()) || d.type.toLowerCase().includes(q.toLowerCase()));
  const bc = a => ({ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", border: a ? "1px solid #06b6d4" : "1px solid #334155", background: a ? "rgba(6,182,212,.1)" : "rgba(30,41,59,.3)", color: a ? "#67e8f9" : "#94a3b8" });

  return (
    <div>
      <Header onBack={onBack} icon="📘" accent="cyan" title="Documentation technique" subtitle={onglet === "perso" ? "Mes documents" : brand ? brand.name : "6 marques"} />
      <div style={styles.content}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[
            { id: "constructeurs", l: "Constructeurs" },
            { id: "perso", l: "Mes documents" },
          ].map((o) => (
            <button key={o.id} onClick={() => setOnglet(o.id)} style={bc(onglet === o.id)}>{o.l}</button>
          ))}
        </div>

        {onglet === "perso" && <Documents />}

        {onglet === "constructeurs" && (
        <>
        <div style={{ position: "relative", marginBottom: 20 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher..." style={{ ...styles.input, paddingLeft: 40, padding: "13px 14px 13px 40px", borderRadius: 12, background: "rgba(15,23,42,.5)", border: "1px solid #1e293b" }} />
        </div>
        <div style={{ ...styles.label, marginBottom: 10 }}>Type d'équipement</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
          <button onClick={() => { setFamille(null); setSel(null); }} style={bc(!famille)}>Tous</button>
          {FAMILLES.map(f => (
            <button key={f} onClick={() => { setFamille(f); setSel(null); }} style={bc(famille === f)}>{f}</button>
          ))}
        </div>

        <div style={{ ...styles.label, marginBottom: 10 }}>
          Marques ({BRANDS.filter(b => !famille || b.famille === famille).length})
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
          <button onClick={() => setSel(null)} style={bc(!sel)}>Toutes</button>
          {BRANDS.filter(b => !famille || b.famille === famille).map(b => (
            <button key={b.name} onClick={() => setSel(b.name)} style={bc(sel === b.name)}>{b.name}</button>
          ))}
        </div>
        {brand && (
          <div style={{ background: "rgba(15,23,42,.5)", border: "1px solid #1e293b", borderRadius: 16, padding: 18, marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: brand.color }} />{brand.name}
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>{brand.specialty}</div>
            </div>
            {brand.website
              ? <a href={brand.website} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(6,182,212,.3)", background: "rgba(6,182,212,.05)", color: "#67e8f9", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>Site constructeur ↗</a>
              : <span style={{ fontSize: 11.5, color: "#475569" }}>Lien constructeur à renseigner</span>}
          </div>
        )}
        <div style={{ ...styles.label, marginBottom: 10 }}>Documents ({filtered.length})</div>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 34, border: "1px dashed #334155", borderRadius: 16, color: "#475569", fontSize: 13, lineHeight: 1.6 }}>
            Aucun document pour cette sélection.<br />
            Consulte le site constructeur, ou importe tes propres fiches dans l'onglet « Mes documents ».
          </div>
        )}
        {filtered.map((d, i) => (
          <div key={i} style={{ background: "rgba(15,23,42,.5)", border: "1px solid #1e293b", borderRadius: 12, padding: 14, display: "flex", alignItems: "center", gap: 14, marginBottom: 6, cursor: "pointer" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>📄</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{!sel ? d.brand + " • " : ""}{d.type}</div>
            </div>
            <span style={{ color: "#334155", fontSize: 14 }}>↗</span>
          </div>
        ))}
        </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [s, setS] = useState("accueil");
  return (
    <div style={styles.page}>
      <Head>
        <title>SAVi — Assistant diagnostic</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#020617" />
      </Head>
      {s === "ia" ? <IA onBack={() => setS("home")} />
        : s === "doc" ? <Doc onBack={() => setS("home")} />
        : s === "releve" ? <Releve onBack={() => setS("home")} />
        : s === "dashboard" ? <Dashboard onBack={() => setS("home")} />
        : s === "heures" ? <Heures onBack={() => setS("home")} />
        : s === "stock" ? <Stock onBack={() => setS("home")} />
        : s === "home" ? <Home go={setS} onBack={() => setS("accueil")} />
        : <Accueil go={setS} />}
    </div>
  );
}
