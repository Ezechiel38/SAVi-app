import { useState, useEffect, useRef } from "react";

/* ==================================================================== *
 *  RELEVÉ POUR DEVIS — module SAVi
 *
 *  Parcours : équipement → composant → champs → panier → PDF
 *  Le PDF est un document interne transmis au service commercial.
 *
 *  Styles inline, comme le reste de SAVi. Accent du module : émeraude
 *  (l'ambre est pris par l'Assistance IA, le cyan par la Documentation).
 * ==================================================================== */

const T = {
  bg: "#020617",
  panel: "rgba(15,23,42,.5)",
  border: "#1e293b",
  borderFort: "#334155",
  champ: "rgba(30,41,59,.5)",
  texte: "#f1f5f9",
  doux: "#94a3b8",
  faible: "#64748b",
  tresFaible: "#475569",
  accent: "#06b6d4",
  accentClair: "#67e8f9",
  accentFond: "rgba(6,182,212,.1)",
  accentBord: "rgba(6,182,212,.3)",
  ambre: "#f59e0b",
  ambreClair: "#fcd34d",
  ambreFond: "rgba(245,158,11,.1)",
  ambreBord: "rgba(245,158,11,.3)",
  rouge: "#fca5a5",
};

const S = {
  header: {
    borderBottom: "1px solid " + T.border,
    background: "rgba(15,23,42,.8)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  headerInner: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "14px 20px",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 10,
    background: "none",
    border: "none",
    color: T.doux,
    fontSize: 18,
    cursor: "pointer",
  },
  content: { maxWidth: 800, margin: "0 auto", padding: "24px 20px 120px" },
  panel: {
    background: T.panel,
    border: "1px solid " + T.border,
    borderRadius: 18,
    padding: 22,
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: T.faible,
    fontWeight: 600,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    background: T.champ,
    border: "1px solid " + T.borderFort,
    color: T.texte,
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
  },
  btnPrimary: {
    width: "100%",
    padding: 14,
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: T.accent,
    color: T.bg,
    fontWeight: 700,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnSecondaire: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    cursor: "pointer",
    background: "rgba(30,41,59,.3)",
    border: "1px solid " + T.borderFort,
    color: T.doux,
    fontWeight: 600,
    fontSize: 13,
    fontFamily: "inherit",
  },
  barreBasse: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    borderTop: "1px solid " + T.border,
    background: "rgba(2,6,23,.95)",
    backdropFilter: "blur(12px)",
    zIndex: 20,
  },
};

const MARQUES = [
  "Came", "Nice", "FAAC", "BFT", "Somfy", "Ditec", "Beninca", "Roger Technology",
  "Hörmann", "Novoferm", "Crawford", "Ryterna", "Sothoferm",
  "Maviflex", "Nergeco", "Efaflex", "ASSA ABLOY Entrance", "Dynaco", "Campisa",
  "Record", "dormakaba", "Portalp", "Tormax", "Besam", "Label",
  "Doitrand", "Safir", "La Toulousaine", "Rolflex",
  "Rite-Hite", "Stertil", "Loading Systems",
  "Urmet", "Comelit", "Aiphone", "Intratone", "Automatic Systems",
  "Autre",
];

const ETATS = ["Bon", "Usé", "HS", "Absent"];

const CATALOGUE = {
  sectionnelle: {
    label: "Porte sectionnelle",
    sousTitre: "Industrielle ou résidentielle",
    photo: "/img/equipements/sectionnelle.jpg",
    composants: [
      {
        id: "dimensions",
        label: "Dimensions générales",
        champs: [
          { id: "larg_passage", label: "Largeur passage libre", type: "num", unite: "mm", requis: true },
          { id: "haut_passage", label: "Hauteur passage libre", type: "num", unite: "mm", requis: true },
          { id: "larg_baie", label: "Largeur de baie", type: "num", unite: "mm" },
          { id: "haut_baie", label: "Hauteur de baie", type: "num", unite: "mm" },
        ],
      },
      {
        id: "moteur",
        label: "Moteur",
        champs: [
          { id: "type", label: "Type de motorisation", type: "select", options: ["Axial", "Plafonnier", "Tubulaire", "Manuel"], requis: true },
          { id: "marque", label: "Marque", type: "select", options: MARQUES, requis: true },
          { id: "modele", label: "Modèle", type: "text", requis: true },
          { id: "serie", label: "N° de série", type: "text" },
          { id: "tension", label: "Tension d'alimentation", type: "select", options: ["230 V mono", "400 V tri", "24 V DC", "48 V DC"], requis: true },
          { id: "puissance", label: "Puissance", type: "num", unite: "W" },
          { id: "position", label: "Position", type: "select", options: ["Droite", "Gauche", "Plafond"] },
          { id: "secours", label: "Débrayage de secours", type: "select", options: ["Chaînette", "Manivelle", "Déverrouillage rapide", "Aucun"] },
        ],
      },
      {
        id: "coffret",
        label: "Coffret de commande",
        champs: [
          { id: "marque", label: "Marque", type: "select", options: MARQUES },
          { id: "modele", label: "Modèle", type: "text", requis: true },
          { id: "commande", label: "Type de commande", type: "select", options: ["Homme mort", "Impulsion", "Automatique / temporisée"], requis: true },
          { id: "fdc", label: "Fin de course", type: "select", options: ["Mécanique", "Électronique", "Encodeur"] },
          { id: "radio", label: "Nb de canaux radio", type: "num" },
          { id: "frequence", label: "Fréquence radio", type: "select", options: ["433 MHz", "868 MHz", "Autre", "Inconnue"] },
        ],
      },
      {
        id: "axe",
        label: "Axe & ressorts",
        champs: [
          { id: "diam_axe", label: "Ø axe", type: "num", unite: "mm", requis: true },
          { id: "nb_ressorts", label: "Nb de ressorts", type: "num", requis: true },
          { id: "diam_fil", label: "Ø fil", type: "num", unite: "mm", requis: true },
          { id: "diam_int", label: "Ø intérieur ressort", type: "num", unite: "mm", requis: true },
          { id: "long_ressort", label: "Longueur ressort", type: "num", unite: "mm", requis: true },
          { id: "sens", label: "Sens d'enroulement", type: "select", options: ["Droite", "Gauche", "Une de chaque"], requis: true },
          { id: "tours", label: "Nb de tours de tension", type: "num" },
        ],
      },
      {
        id: "tablier",
        label: "Tablier",
        champs: [
          { id: "nb_panneaux", label: "Nb de panneaux", type: "num", requis: true },
          { id: "haut_panneau", label: "Hauteur d'un panneau", type: "num", unite: "mm", requis: true },
          { id: "epaisseur", label: "Épaisseur", type: "select", options: ["40 mm", "45 mm", "60 mm", "80 mm"], requis: true },
          { id: "nature", label: "Nature", type: "select", options: ["Isolé double paroi", "Simple paroi", "Vitré / vision", "Grillagé"], requis: true },
          { id: "nervure", label: "Nervure", type: "select", options: ["Large", "Micro-nervurée", "Lisse", "Cassette"] },
          { id: "ral", label: "Coloris RAL", type: "text" },
        ],
      },
      {
        id: "hublot",
        label: "Hublot",
        champs: [
          { id: "nb", label: "Nombre", type: "num", requis: true },
          { id: "forme", label: "Forme", type: "select", options: ["Rectangulaire", "Rond", "Losange", "Ovale"], requis: true },
          { id: "dim", label: "Dimensions (L × H)", type: "text", requis: true },
          { id: "panneau", label: "N° du panneau", type: "num" },
          { id: "vitrage", label: "Vitrage", type: "select", options: ["Simple", "Double", "Alvéolaire", "Sécurit"] },
        ],
      },
      {
        id: "portillon",
        label: "Portillon",
        champs: [
          { id: "larg", label: "Largeur passage", type: "num", unite: "mm", requis: true },
          { id: "haut", label: "Hauteur passage", type: "num", unite: "mm", requis: true },
          { id: "sens", label: "Sens d'ouverture", type: "select", options: ["Poussant droit", "Poussant gauche", "Tirant droit", "Tirant gauche"], requis: true },
          { id: "seuil", label: "Seuil", type: "select", options: ["Plat", "Surélevé", "Sans seuil"] },
          { id: "ferme_porte", label: "Ferme-porte", type: "bool" },
          { id: "contact", label: "Contact de sécurité portillon", type: "bool" },
        ],
      },
      {
        id: "rails",
        label: "Rails & coulisses",
        champs: [
          { id: "montage", label: "Type de montage", type: "select", options: ["Standard (N)", "Relevé (HL)", "Bas linteau (LHF)", "Suivant pente", "Vertical"], requis: true },
          { id: "linteau", label: "Retombée de linteau", type: "num", unite: "mm", requis: true },
          { id: "ecoincon_g", label: "Écoinçon gauche", type: "num", unite: "mm", requis: true },
          { id: "ecoincon_d", label: "Écoinçon droit", type: "num", unite: "mm", requis: true },
          { id: "profondeur", label: "Profondeur disponible", type: "num", unite: "mm", requis: true },
        ],
      },
      {
        id: "cables",
        label: "Câbles & galets",
        champs: [
          { id: "long_cable", label: "Longueur de câble", type: "num", unite: "mm" },
          { id: "diam_cable", label: "Ø câble", type: "num", unite: "mm" },
          { id: "nb_galets", label: "Nb de galets", type: "num" },
          { id: "tige", label: "Type de tige", type: "select", options: ["Courte", "Longue", "Réglable"] },
        ],
      },
      {
        id: "securites",
        label: "Sécurités",
        champs: [
          { id: "cellules", label: "Cellules photo", type: "bool" },
          { id: "cellules_ref", label: "Marque / modèle cellules", type: "text" },
          { id: "palpeuse", label: "Barre palpeuse", type: "bool" },
          { id: "parachute", label: "Parachute anti-chute", type: "bool" },
          { id: "feu", label: "Feu orange", type: "bool" },
          { id: "conformite", label: "Conforme EN 13241", type: "select", options: ["Oui", "Non", "À vérifier"] },
        ],
      },
    ],
  },

  portail: {
    label: "Portail",
    sousTitre: "Coulissant, battant, enterré",
    photo: "/img/equipements/portail.jpg",
    composants: [
      {
        id: "motorisation",
        label: "Motorisation",
        champs: [
          { id: "type", label: "Type", type: "select", options: ["Coulissant", "Battant à vérin", "Battant à bras", "Enterré", "Manuel"], requis: true },
          { id: "marque", label: "Marque", type: "select", options: MARQUES, requis: true },
          { id: "modele", label: "Modèle", type: "text", requis: true },
          { id: "serie", label: "N° de série", type: "text" },
          { id: "tension", label: "Tension d'alimentation", type: "select", options: ["230 V mono", "400 V tri", "24 V DC"], requis: true },
          { id: "debrayage", label: "Débrayage", type: "select", options: ["À clé", "Levier", "Aucun"] },
        ],
      },
      {
        id: "armoire",
        label: "Armoire de commande",
        champs: [
          { id: "marque", label: "Marque", type: "select", options: MARQUES },
          { id: "modele", label: "Modèle", type: "text", requis: true },
          { id: "alim", label: "Alimentation disponible", type: "select", options: ["230 V mono", "400 V tri", "Aucune"], requis: true },
          { id: "sorties", label: "Nb de sorties accessoires", type: "num" },
        ],
      },
      {
        id: "vantail",
        label: "Vantail",
        champs: [
          { id: "nb", label: "Nb de vantaux", type: "num", requis: true },
          { id: "larg", label: "Largeur (par vantail)", type: "num", unite: "mm", requis: true },
          { id: "haut", label: "Hauteur", type: "num", unite: "mm", requis: true },
          { id: "materiau", label: "Matériau", type: "select", options: ["Aluminium", "Acier", "PVC", "Bois", "Composite"], requis: true },
          { id: "remplissage", label: "Remplissage", type: "select", options: ["Plein", "Ajouré", "Semi-ajouré", "Barreaudé"] },
          { id: "poids", label: "Poids estimé", type: "num", unite: "kg", requis: true },
        ],
      },
      {
        id: "rail",
        label: "Rail & galets (coulissant)",
        champs: [
          { id: "long_rail", label: "Longueur de rail", type: "num", unite: "m", requis: true },
          { id: "type_rail", label: "Type de rail", type: "select", options: ["Au sol", "Autoportant", "Suspendu"], requis: true },
          { id: "nb_galets", label: "Nb de galets", type: "num" },
          { id: "scellement", label: "État du scellement", type: "select", options: ETATS },
        ],
      },
      {
        id: "cremaillere",
        label: "Crémaillère",
        champs: [
          { id: "materiau", label: "Matériau", type: "select", options: ["Nylon", "Acier galvanisé", "Acier zingué"], requis: true },
          { id: "module", label: "Module", type: "select", options: ["M4", "M6", "Autre"] },
          { id: "longueur", label: "Longueur totale", type: "num", unite: "m", requis: true },
          { id: "fixations", label: "Nb de fixations", type: "num" },
        ],
      },
      {
        id: "piliers",
        label: "Poteaux & piliers",
        champs: [
          { id: "materiau", label: "Matériau", type: "select", options: ["Maçonnerie", "Béton", "Acier", "Aluminium"] },
          { id: "section", label: "Section", type: "text" },
          { id: "hauteur", label: "Hauteur", type: "num", unite: "mm" },
          { id: "butee", label: "Butée d'arrêt présente", type: "bool" },
        ],
      },
      {
        id: "verrouillage",
        label: "Verrouillage",
        champs: [
          { id: "type", label: "Type", type: "select", options: ["Électroserrure", "Serrure mécanique", "Verrou au sol", "Aucun"] },
          { id: "gache", label: "Gâche", type: "text" },
        ],
      },
      {
        id: "accessoires",
        label: "Sécurités & accessoires",
        champs: [
          { id: "cellules", label: "Cellules photo", type: "bool" },
          { id: "feu", label: "Feu clignotant", type: "bool" },
          { id: "antenne", label: "Antenne déportée", type: "bool" },
          { id: "clavier", label: "Clavier à code", type: "bool" },
          { id: "badge", label: "Lecteur de badge", type: "bool" },
          { id: "interphone", label: "Interphone / portier", type: "bool" },
          { id: "nb_telec", label: "Nb de télécommandes", type: "num" },
          { id: "boucle", label: "Boucle magnétique", type: "bool" },
        ],
      },
    ],
  },

  pietonne: {
    label: "Porte piétonne",
    sousTitre: "Issue de secours, service, coupe-feu",
    photo: "/img/equipements/pietonne.jpg",
    composants: [
      {
        id: "vantail",
        label: "Vantail & huisserie",
        champs: [
          { id: "larg", label: "Largeur passage", type: "num", unite: "mm", requis: true },
          { id: "haut", label: "Hauteur passage", type: "num", unite: "mm", requis: true },
          { id: "nb", label: "Nb de vantaux", type: "select", options: ["1", "2"], requis: true },
          { id: "sens", label: "Sens d'ouverture", type: "select", options: ["Poussant droit", "Poussant gauche", "Tirant droit", "Tirant gauche"], requis: true },
          { id: "materiau", label: "Matériau", type: "select", options: ["Acier", "Aluminium", "Bois", "Vitrée"], requis: true },
          { id: "cf", label: "Degré coupe-feu", type: "select", options: ["Aucun", "EI30", "EI60", "EI120"] },
          { id: "huisserie", label: "Type d'huisserie", type: "text" },
        ],
      },
      {
        id: "ferme_porte",
        label: "Ferme-porte",
        champs: [
          { id: "marque", label: "Marque", type: "text", requis: true },
          { id: "modele", label: "Modèle", type: "text", requis: true },
          { id: "type", label: "Type", type: "select", options: ["À bras compas", "À glissière", "Encastré au sol", "Intégré"], requis: true },
          { id: "force", label: "Force (EN 1154)", type: "select", options: ["EN 1", "EN 2", "EN 3", "EN 4", "EN 5", "EN 6", "EN 7", "Réglable"] },
          { id: "arret", label: "Arrêt maintenu", type: "bool" },
        ],
      },
      {
        id: "serrure",
        label: "Serrure & cylindre",
        champs: [
          { id: "type", label: "Type de serrure", type: "select", options: ["À encastrer", "En applique", "Multipoints", "Bec-de-cane"], requis: true },
          { id: "entraxe", label: "Entraxe", type: "num", unite: "mm", requis: true },
          { id: "axe", label: "Axe (têtière → cylindre)", type: "num", unite: "mm", requis: true },
          { id: "cylindre", label: "Type de cylindre", type: "select", options: ["Européen", "Rond", "Suisse", "Sans"] },
          { id: "long_cyl", label: "Longueur cylindre (A × B)", type: "text" },
          { id: "nb_cles", label: "Nb de clés", type: "num" },
          { id: "organigramme", label: "Sur organigramme", type: "bool" },
        ],
      },
      {
        id: "bequillage",
        label: "Béquillage",
        champs: [
          { id: "type", label: "Type", type: "select", options: ["Béquille double", "Béquille / plaque", "Bouton fixe", "Poignée bâton"], requis: true },
          { id: "finition", label: "Finition", type: "select", options: ["Inox", "Alu", "Noir", "Laiton"] },
        ],
      },
      {
        id: "paumelles",
        label: "Paumelles & pivots",
        champs: [
          { id: "type", label: "Type", type: "select", options: ["Paumelles", "Pivot", "Fiches", "Charnières"], requis: true },
          { id: "nb", label: "Nombre", type: "num", requis: true },
          { id: "diam", label: "Ø / dimensions", type: "text" },
          { id: "reglable", label: "Réglable", type: "bool" },
        ],
      },
      {
        id: "anti_panique",
        label: "Anti-panique",
        champs: [
          { id: "type", label: "Type", type: "select", options: ["Barre à pousser", "Touch bar", "Béquille anti-panique", "Aucun"], requis: true },
          { id: "points", label: "Nb de points", type: "select", options: ["1 point", "3 points"] },
          { id: "marque", label: "Marque", type: "text" },
        ],
      },
      {
        id: "controle_acces",
        label: "Contrôle d'accès",
        champs: [
          { id: "ventouse", label: "Ventouse électromagnétique", type: "bool" },
          { id: "force", label: "Force ventouse", type: "num", unite: "daN" },
          { id: "gache", label: "Gâche électrique", type: "bool" },
          { id: "lecteur", label: "Lecteur de badge", type: "bool" },
          { id: "digicode", label: "Digicode", type: "bool" },
          { id: "bouton_sortie", label: "Bouton de sortie", type: "bool" },
          { id: "dmv", label: "Déclencheur manuel vert", type: "bool" },
        ],
      },
      {
        id: "ferrures",
        label: "Ferrures & joints",
        champs: [
          { id: "joint", label: "Joint isophonique", type: "bool" },
          { id: "seuil", label: "Seuil", type: "select", options: ["Plat", "Suisse", "À bascule", "Sans"] },
          { id: "butoir", label: "Butoir", type: "bool" },
          { id: "selecteur", label: "Sélecteur de vantaux", type: "bool" },
        ],
      },
    ],
  },

  nivelleur: {
    label: "Nivelleur de quai",
    sousTitre: "Quai de chargement",
    photo: "/img/equipements/nivelleur.jpg",
    composants: [
      {
        id: "structure",
        label: "Structure & tablier",
        champs: [
          { id: "type", label: "Type", type: "select", options: ["Lèvre rabattable", "Lèvre télescopique", "Rampe mobile"], requis: true },
          { id: "long", label: "Longueur", type: "num", unite: "mm", requis: true },
          { id: "larg", label: "Largeur", type: "num", unite: "mm", requis: true },
          { id: "capacite", label: "Capacité", type: "num", unite: "t", requis: true },
          { id: "course_h", label: "Course haute", type: "num", unite: "mm" },
          { id: "course_b", label: "Course basse", type: "num", unite: "mm" },
        ],
      },
      {
        id: "levre",
        label: "Lèvre / bavette",
        champs: [
          { id: "type", label: "Type", type: "select", options: ["Rabattable", "Télescopique"], requis: true },
          { id: "long", label: "Longueur", type: "num", unite: "mm", requis: true },
          { id: "epaisseur", label: "Épaisseur", type: "num", unite: "mm" },
          { id: "etat", label: "État", type: "select", options: ETATS, requis: true },
        ],
      },
      {
        id: "verin",
        label: "Vérin hydraulique",
        champs: [
          { id: "nb", label: "Nb de vérins", type: "num", requis: true },
          { id: "diam_tige", label: "Ø tige", type: "num", unite: "mm", requis: true },
          { id: "course", label: "Course", type: "num", unite: "mm", requis: true },
          { id: "marque", label: "Marque", type: "text" },
          { id: "ref", label: "Référence", type: "text" },
        ],
      },
      {
        id: "centrale",
        label: "Centrale hydraulique",
        champs: [
          { id: "marque", label: "Marque", type: "text", requis: true },
          { id: "modele", label: "Modèle", type: "text", requis: true },
          { id: "tension", label: "Tension", type: "select", options: ["230 V mono", "400 V tri"], requis: true },
          { id: "puissance", label: "Puissance moteur", type: "num", unite: "kW" },
          { id: "pression", label: "Pression de tarage", type: "num", unite: "bar" },
        ],
      },
      {
        id: "coffret",
        label: "Coffret de commande",
        champs: [
          { id: "marque", label: "Marque", type: "text" },
          { id: "modele", label: "Modèle", type: "text", requis: true },
          { id: "commande", label: "Type de commande", type: "select", options: ["Homme mort", "Automatique"], requis: true },
          { id: "au", label: "Arrêt d'urgence", type: "bool" },
          { id: "position", label: "Position du coffret", type: "text" },
        ],
      },
      {
        id: "butoirs",
        label: "Butoirs",
        champs: [
          { id: "type", label: "Type", type: "select", options: ["Caoutchouc", "Polyuréthane", "Acier"], requis: true },
          { id: "dim", label: "Dimensions", type: "text", requis: true },
          { id: "nb", label: "Nombre", type: "num", requis: true },
          { id: "etat", label: "État", type: "select", options: ETATS },
        ],
      },
      {
        id: "sas",
        label: "Sas d'étanchéité",
        champs: [
          { id: "type", label: "Type", type: "select", options: ["Coussin gonflable", "Rideau souple", "Auvent", "Aucun"], requis: true },
          { id: "dim", label: "Dimensions", type: "text" },
          { id: "etat", label: "État", type: "select", options: ETATS },
        ],
      },
      {
        id: "securites",
        label: "Sécurités",
        champs: [
          { id: "bequille", label: "Béquille de sécurité", type: "bool" },
          { id: "barriere", label: "Barrière de sécurité", type: "bool" },
          { id: "feux", label: "Feux de quai", type: "bool" },
          { id: "marquage", label: "Marquage au sol", type: "bool" },
        ],
      },
    ],
  },

  rideau: {
    label: "Rideau métallique",
    sousTitre: "Lames pleines ou ajourées",
    photo: "/img/equipements/rideau.jpg",
    composants: [
      {
        id: "dimensions",
        label: "Dimensions générales",
        champs: [
          { id: "larg", label: "Largeur passage libre", type: "num", unite: "mm", requis: true },
          { id: "haut", label: "Hauteur passage libre", type: "num", unite: "mm", requis: true },
          { id: "linteau", label: "Retombée de linteau", type: "num", unite: "mm", requis: true },
          { id: "ecoincons", label: "Écoinçons G / D", type: "text", requis: true },
        ],
      },
      {
        id: "moteur",
        label: "Moteur",
        champs: [
          { id: "type", label: "Type", type: "select", options: ["Tubulaire", "Latéral", "Central", "Treuil manuel"], requis: true },
          { id: "marque", label: "Marque", type: "select", options: MARQUES, requis: true },
          { id: "modele", label: "Modèle", type: "text", requis: true },
          { id: "couple", label: "Couple", type: "num", unite: "Nm" },
          { id: "tension", label: "Tension", type: "select", options: ["230 V mono", "400 V tri"], requis: true },
          { id: "secours", label: "Manœuvre de secours", type: "select", options: ["Manivelle", "Chaînette", "Treuil", "Aucune"] },
        ],
      },
      {
        id: "axe",
        label: "Axe / tube",
        champs: [
          { id: "diam", label: "Ø tube", type: "num", unite: "mm", requis: true },
          { id: "long", label: "Longueur d'axe", type: "num", unite: "mm" },
          { id: "paliers", label: "Type de paliers", type: "text" },
        ],
      },
      {
        id: "tablier",
        label: "Tablier",
        champs: [
          { id: "type_lame", label: "Type de lame", type: "select", options: ["Pleine", "Micro-perforée", "Ajourée", "Grille"], requis: true },
          { id: "haut_lame", label: "Hauteur de lame", type: "num", unite: "mm", requis: true },
          { id: "epaisseur", label: "Épaisseur", type: "num", unite: "mm" },
          { id: "nb_lames", label: "Nb de lames", type: "num" },
          { id: "ral", label: "Coloris RAL", type: "text" },
        ],
      },
      {
        id: "coulisses",
        label: "Coulisses & lame finale",
        champs: [
          { id: "type_coulisse", label: "Type de coulisse", type: "text", requis: true },
          { id: "long_coulisse", label: "Longueur coulisse", type: "num", unite: "mm" },
          { id: "lame_finale", label: "Lame finale", type: "text" },
          { id: "verrou", label: "Verrouillage", type: "select", options: ["Serrure centrale", "Verrous latéraux", "Électro-frein", "Aucun"] },
        ],
      },
      {
        id: "securites",
        label: "Sécurités",
        champs: [
          { id: "parachute", label: "Parachute anti-chute", type: "bool" },
          { id: "palpeuse", label: "Barre palpeuse", type: "bool" },
          { id: "cellules", label: "Cellules photo", type: "bool" },
          { id: "feu", label: "Feu orange", type: "bool" },
        ],
      },
    ],
  },

  rapide: {
    label: "Porte rapide",
    sousTitre: "Souple, à enroulement",
    photo: "/img/equipements/rapide.jpg",
    composants: [
      {
        id: "dimensions",
        label: "Dimensions générales",
        champs: [
          { id: "larg", label: "Largeur passage libre", type: "num", unite: "mm", requis: true },
          { id: "haut", label: "Hauteur passage libre", type: "num", unite: "mm", requis: true },
          { id: "linteau", label: "Retombée de linteau", type: "num", unite: "mm", requis: true },
          { id: "ecoincons", label: "Écoinçons G / D", type: "text", requis: true },
        ],
      },
      {
        id: "moteur",
        label: "Motoréducteur",
        champs: [
          { id: "marque", label: "Marque", type: "select", options: MARQUES, requis: true },
          { id: "modele", label: "Modèle", type: "text", requis: true },
          { id: "tension", label: "Tension", type: "select", options: ["230 V mono", "400 V tri"], requis: true },
          { id: "puissance", label: "Puissance", type: "num", unite: "kW" },
          { id: "vitesse", label: "Vitesse d'ouverture", type: "num", unite: "m/s" },
        ],
      },
      {
        id: "variateur",
        label: "Variateur / armoire",
        champs: [
          { id: "marque", label: "Marque", type: "text", requis: true },
          { id: "modele", label: "Modèle", type: "text", requis: true },
          { id: "encodeur", label: "Type d'encodeur", type: "text" },
          { id: "ip", label: "Indice de protection", type: "text" },
        ],
      },
      {
        id: "tablier",
        label: "Tablier souple",
        champs: [
          { id: "matiere", label: "Matière", type: "select", options: ["Toile PVC", "PVC renforcé", "Isolé"], requis: true },
          { id: "grammage", label: "Grammage", type: "num", unite: "g/m²" },
          { id: "ral", label: "Coloris", type: "text", requis: true },
          { id: "hublot", label: "Bandes de vision", type: "text" },
          { id: "renforts", label: "Nb de renforts", type: "num" },
        ],
      },
      {
        id: "coulisses",
        label: "Coulisses & barre finale",
        champs: [
          { id: "type", label: "Type de coulisse", type: "select", options: ["Souple auto-réparable", "Rigide", "Zip"], requis: true },
          { id: "haut", label: "Hauteur coulisse", type: "num", unite: "mm" },
          { id: "barre", label: "Type de barre finale", type: "text" },
        ],
      },
      {
        id: "securites",
        label: "Détection & sécurités",
        champs: [
          { id: "cellules", label: "Cellules photo", type: "bool" },
          { id: "radar", label: "Radar / détecteur de mouvement", type: "bool" },
          { id: "boucle", label: "Boucle magnétique", type: "bool" },
          { id: "tirette", label: "Tirette / bouton", type: "bool" },
          { id: "feux", label: "Feux tricolores", type: "bool" },
        ],
      },
    ],
  },

  barriere: {
    label: "Barrière levante",
    sousTitre: "Contrôle d'accès véhicule",
    photo: "/img/equipements/barriere.jpg",
    composants: [
      {
        id: "armoire",
        label: "Armoire & moteur",
        champs: [
          { id: "marque", label: "Marque", type: "select", options: MARQUES, requis: true },
          { id: "modele", label: "Modèle", type: "text", requis: true },
          { id: "serie", label: "N° de série", type: "text" },
          { id: "tension", label: "Tension d'alimentation", type: "select", options: ["230 V mono", "24 V DC"], requis: true },
          { id: "intensif", label: "Usage intensif", type: "bool" },
          { id: "temps", label: "Temps d'ouverture", type: "num", unite: "s" },
        ],
      },
      {
        id: "lisse",
        label: "Lisse",
        champs: [
          { id: "long", label: "Longueur", type: "num", unite: "m", requis: true },
          { id: "type", label: "Type", type: "select", options: ["Ronde", "Rectangulaire", "Articulée"], requis: true },
          { id: "jupe", label: "Jupe / herse", type: "bool" },
          { id: "eclairage", label: "Lisse lumineuse", type: "bool" },
          { id: "appui", label: "Appui fixe / béquille", type: "bool" },
        ],
      },
      {
        id: "equilibrage",
        label: "Ressort d'équilibrage",
        champs: [
          { id: "ref", label: "Référence ressort", type: "text", requis: true },
          { id: "position", label: "Position d'accroche", type: "text" },
          { id: "etat", label: "État", type: "select", options: ETATS },
        ],
      },
      {
        id: "detection",
        label: "Détection",
        champs: [
          { id: "boucle", label: "Boucle magnétique", type: "bool" },
          { id: "nb_boucles", label: "Nb de boucles", type: "num" },
          { id: "detecteur", label: "Détecteur (marque / modèle)", type: "text" },
          { id: "cellules", label: "Cellules photo", type: "bool" },
        ],
      },
      {
        id: "accessoires",
        label: "Accessoires",
        champs: [
          { id: "feu", label: "Feu clignotant", type: "bool" },
          { id: "clavier", label: "Clavier à code", type: "bool" },
          { id: "badge", label: "Lecteur de badge", type: "bool" },
          { id: "interphone", label: "Interphone", type: "bool" },
          { id: "nb_telec", label: "Nb de télécommandes", type: "num" },
        ],
      },
    ],
  },
};

const CHAMPS_CHIFFRAGE = [
  { id: "technicien", label: "Technicien", type: "text", requis: true },
  { id: "commercial", label: "Commercial destinataire", type: "text" },
  {
    id: "type_demande",
    label: "Nature de la demande",
    type: "select",
    options: [
      "Remplacement de pièce",
      "Rénovation complète",
      "Mise en conformité",
      "Dépannage à chiffrer",
      "Contrat d'entretien",
      "Installation neuve",
    ],
    requis: true,
  },
  {
    id: "delai",
    label: "Délai souhaité",
    type: "select",
    options: ["Urgent — équipement à l'arrêt", "Sous 15 jours", "Sous 1 mois", "Non urgent"],
    requis: true,
  },
  { id: "temps_pose", label: "Temps de pose estimé", type: "num", unite: "h", requis: true },
  { id: "nb_intervenants", label: "Nb d'intervenants", type: "num", requis: true },
  {
    id: "moyens",
    label: "Moyens à prévoir",
    type: "select",
    options: [
      "Aucun",
      "Nacelle",
      "Échafaudage",
      "Chariot élévateur",
      "Consignation électrique",
      "Plusieurs — voir observation",
    ],
  },
  { id: "obs_generale", label: "Observation pour le commercial", type: "text" },
];

const CHAMPS_CONTEXTE = [
  { id: "client", label: "Client", type: "text", requis: true },
  { id: "site", label: "Site / bâtiment", type: "text", requis: true },
  { id: "adresse", label: "Adresse", type: "text" },
  { id: "contact", label: "Contact sur place", type: "text" },
  { id: "tel", label: "Téléphone", type: "text" },
  { id: "repere", label: "Repère de l'équipement", type: "text", requis: true },
  { id: "type_client", label: "Type de client", type: "select", options: ["Copropriété / syndic", "Industriel", "Tertiaire", "Logistique", "Particulier"] },
  { id: "acces", label: "Contrainte d'accès", type: "select", options: ["Aucune", "Nacelle nécessaire", "Échafaudage", "Horaires imposés", "Consignation électrique"] },
  { id: "urgence", label: "Équipement à l'arrêt", type: "bool" },
];

const cle = (eq, comp) => `${eq}::${comp}`;

function manquants(composant, valeurs) {
  if (!valeurs) return composant.champs.filter((c) => c.requis).map((c) => c.label);
  return composant.champs
    .filter((c) => c.requis)
    .filter((c) => {
      const v = valeurs[c.id];
      return v === undefined || v === "" || v === null;
    })
    .map((c) => c.label);
}

/* ------------------------------------------------------------------ *
 *  CHAMP
 * ------------------------------------------------------------------ */

/* ---------------------- pictogrammes équipements ---------------------- */

const traits = { fill: "none", stroke: T.faible, strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };

const PICTOS = {
  sectionnelle: (
    <svg viewBox="0 0 64 44" width="100%" height="100%" {...traits}>
      <path d="M8 40V14a6 6 0 0 1 6-6h30a6 6 0 0 1 6 6v4" />
      <path d="M50 18h8" stroke={T.accent} />
      <rect x="14" y="16" width="30" height="6" />
      <rect x="14" y="24" width="30" height="6" />
      <rect x="14" y="32" width="30" height="6" />
      <path d="M4 40h56" />
    </svg>
  ),
  portail: (
    <svg viewBox="0 0 64 44" width="100%" height="100%" {...traits}>
      <path d="M6 38V12M58 38V12" />
      <rect x="14" y="14" width="34" height="22" />
      <path d="M21 14v22M28 14v22M35 14v22M42 14v22" />
      <path d="M4 40h56" />
      <path d="M14 40H8" stroke={T.accent} />
    </svg>
  ),
  pietonne: (
    <svg viewBox="0 0 64 44" width="100%" height="100%" {...traits}>
      <rect x="18" y="6" width="28" height="34" />
      <rect x="22" y="10" width="20" height="26" />
      <rect x="26" y="14" width="12" height="8" />
      <circle cx="39" cy="27" r="1.4" fill={T.accent} stroke={T.accent} />
      <path d="M4 40h56" />
    </svg>
  ),
  nivelleur: (
    <svg viewBox="0 0 64 44" width="100%" height="100%" {...traits}>
      <path d="M6 34h22l16-10" />
      <path d="M44 24h12" stroke={T.accent} />
      <path d="M6 34v6h22v-6" />
      <path d="M48 18v18h12V18" />
    </svg>
  ),
  rideau: (
    <svg viewBox="0 0 64 44" width="100%" height="100%" {...traits}>
      <path d="M10 40V10h44v30" />
      <rect x="14" y="10" width="36" height="6" stroke={T.accent} />
      <path d="M14 20h36M14 25h36M14 30h36M14 35h36" />
      <path d="M4 40h56" />
    </svg>
  ),
  rapide: (
    <svg viewBox="0 0 64 44" width="100%" height="100%" {...traits}>
      <path d="M12 40V10M52 40V10" />
      <rect x="16" y="8" width="32" height="5" stroke={T.accent} />
      <path d="M16 16h32v20H16z" />
      <path d="M16 24h32" stroke={T.accent} />
      <path d="M4 40h56" />
    </svg>
  ),
  barriere: (
    <svg viewBox="0 0 64 44" width="100%" height="100%" {...traits}>
      <rect x="8" y="22" width="12" height="18" />
      <path d="M20 26L56 12" stroke={T.accent} />
      <path d="M28 23l2 4M36 20l2 4M44 17l2 4" />
      <path d="M4 40h56" />
    </svg>
  ),
};

function Visuel({ eqId, photo }) {
  const [erreur, setErreur] = useState(false);
  if (photo && !erreur) {
    return (
      <img
        src={photo}
        alt=""
        loading="lazy"
        onError={() => setErreur(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 12, background: "rgba(30,41,59,.35)" }}>
      {PICTOS[eqId] || null}
    </div>
  );
}

/* ---------------------------- photos ---------------------------- */

function compresserImage(fichier, maxLarg = 1400, qualite = 0.72) {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onerror = reject;
    lecteur.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const ratio = Math.min(1, maxLarg / img.width);
        const cv = document.createElement("canvas");
        cv.width = Math.round(img.width * ratio);
        cv.height = Math.round(img.height * ratio);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        resolve(cv.toDataURL("image/jpeg", qualite));
      };
      img.src = lecteur.result;
    };
    lecteur.readAsDataURL(fichier);
  });
}

function ZonePhotos({ photos = [], onChange, titre, aide }) {
  const [chargement, setChargement] = useState(false);
  const ref = useRef(null);

  const ajouter = async (e) => {
    const fichiers = Array.from(e.target.files || []);
    if (!fichiers.length) return;
    setChargement(true);
    try {
      const nouvelles = await Promise.all(
        fichiers.map(async (f) => ({
          id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
          src: await compresserImage(f),
          legende: "",
        }))
      );
      onChange([...photos, ...nouvelles]);
    } catch (err) {
      console.error(err);
    }
    setChargement(false);
    e.target.value = "";
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div style={{ ...S.label, marginBottom: 0 }}>{titre}</div>
        <div style={{ fontSize: 11, color: T.tresFaible }}>
          {photos.length} cliché{photos.length > 1 ? "s" : ""}
        </div>
      </div>
      {aide && <p style={{ fontSize: 12, color: T.faible, margin: "0 0 12px", lineHeight: 1.5 }}>{aide}</p>}

      {photos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          {photos.map((ph) => (
            <div key={ph.id} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid " + T.border, background: "rgba(30,41,59,.3)" }}>
              <div style={{ position: "relative" }}>
                <img src={ph.src} alt="" style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }} />
                <button
                  onClick={() => onChange(photos.filter((x) => x.id !== ph.id))}
                  style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: 999, border: "none", background: "rgba(2,6,23,.75)", color: T.texte, cursor: "pointer", fontSize: 13, lineHeight: 1 }}
                  aria-label="Supprimer la photo"
                >
                  ✕
                </button>
              </div>
              <input
                value={ph.legende}
                onChange={(e) =>
                  onChange(photos.map((x) => (x.id === ph.id ? { ...x, legende: e.target.value } : x)))
                }
                placeholder="Légende…"
                style={{ width: "100%", padding: "8px 10px", background: "transparent", border: "none", borderTop: "1px solid " + T.border, color: T.doux, fontSize: 11, outline: "none", fontFamily: "inherit" }}
              />
            </div>
          ))}
        </div>
      )}

      <input ref={ref} type="file" accept="image/*" capture="environment" multiple onChange={ajouter} style={{ display: "none" }} />
      <button
        onClick={() => ref.current && ref.current.click()}
        disabled={chargement}
        style={{ width: "100%", padding: 14, borderRadius: 10, border: "1px dashed " + T.borderFort, background: "rgba(30,41,59,.2)", color: chargement ? T.tresFaible : T.doux, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
      >
        {chargement ? "⏳ Traitement…" : "📷 Ajouter une photo"}
      </button>
    </div>
  );
}

/* ----------------------------- champ ----------------------------- */

function Champ({ champ, valeur, onChange }) {
  const vide = valeur === undefined || valeur === "" || valeur === null;
  const alerte = champ.requis && vide;
  const bordure = alerte ? T.ambreBord : T.borderFort;

  if (champ.type === "bool") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid " + T.border }}>
        <span style={{ fontSize: 13, color: T.doux }}>{champ.label}</span>
        <div style={{ display: "flex", gap: 6 }}>
          {["Oui", "Non"].map((opt) => {
            const actif = valeur === opt;
            return (
              <button
                key={opt}
                onClick={() => onChange(actif ? "" : opt)}
                style={{ padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "1px solid " + (actif ? T.accentBord : T.borderFort), background: actif ? T.accentFond : "rgba(30,41,59,.3)", color: actif ? T.accentClair : T.faible }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "10px 0" }}>
      <div style={{ ...S.label, marginBottom: 6, display: "flex", gap: 8, alignItems: "center" }}>
        {champ.label}
        {champ.requis && <span style={{ color: T.ambreClair, letterSpacing: 1 }}>obligatoire</span>}
      </div>
      {champ.type === "select" ? (
        <select
          value={valeur || ""}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...S.input, appearance: "auto", borderColor: bordure }}
        >
          <option value="">—</option>
          {champ.options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <div style={{ position: "relative" }}>
          <input
            type={champ.type === "num" ? "number" : "text"}
            inputMode={champ.type === "num" ? "decimal" : "text"}
            value={valeur || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="—"
            style={{ ...S.input, borderColor: bordure, paddingRight: champ.unite ? 52 : 14 }}
          />
          {champ.unite && (
            <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: T.tresFaible }}>
              {champ.unite}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------- STOCKAGE ----------------------------
 *  La fiche en cours est enregistrée dans IndexedDB à chaque
 *  modification, avec un léger différé pour ne pas écrire à chaque
 *  frappe. Un technicien qui ferme l'onglet en plein relevé retrouve
 *  sa saisie, photos comprises.
 * ------------------------------------------------------------------ */

const DB_NOM = "savi-releve";
const MAGASIN = "fiches";
const CLE_COURANTE = "courant";

function ouvrirBase() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NOM, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(MAGASIN)) db.createObjectStore(MAGASIN, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function lireFiche() {
  const db = await ouvrirBase();
  return new Promise((resolve, reject) => {
    const req = db.transaction(MAGASIN, "readonly").objectStore(MAGASIN).get(CLE_COURANTE);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function ecrireFiche(fiche) {
  const db = await ouvrirBase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MAGASIN, "readwrite");
    tx.objectStore(MAGASIN).put({ ...fiche, id: CLE_COURANTE });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function effacerFiche() {
  const db = await ouvrirBase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MAGASIN, "readwrite");
    tx.objectStore(MAGASIN).delete(CLE_COURANTE);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ----------------------------- module ----------------------------- */

export default function Releve({ onBack }) {
  const [vue, setVue] = useState("equipements");
  const [equipement, setEquipement] = useState(null);
  const [composant, setComposant] = useState(null);
  const [contexte, setContexte] = useState({});
  const [releve, setReleve] = useState({});
  const [photosLibres, setPhotosLibres] = useState([]);
  const [pdfOpts, setPdfOpts] = useState({ seulementDevis: false, masquerVides: true, avecPhotos: true });
  const [pret, setPret] = useState(false);
  const [enregistre, setEnregistre] = useState(null);

  // relecture de la fiche en cours au démarrage
  useEffect(() => {
    let vivant = true;
    lireFiche()
      .then((f) => {
        if (!vivant || !f) return;
        setContexte(f.contexte || {});
        setReleve(f.releve || {});
        setPhotosLibres(f.photosLibres || []);
        setEnregistre(f.maj || null);
      })
      .catch(() => {})
      .finally(() => vivant && setPret(true));
    return () => { vivant = false; };
  }, []);

  // sauvegarde différée à chaque modification
  useEffect(() => {
    if (!pret) return;
    const minuterie = setTimeout(() => {
      const maj = new Date().toISOString();
      ecrireFiche({ contexte, releve, photosLibres, maj })
        .then(() => setEnregistre(maj))
        .catch(() => {});
    }, 600);
    return () => clearTimeout(minuterie);
  }, [pret, contexte, releve, photosLibres]);

  const nouvelleFiche = () => {
    if (!window.confirm("Effacer la fiche en cours et repartir de zéro ? Cette action est définitive.")) return;
    effacerFiche().catch(() => {});
    setContexte({});
    setReleve({});
    setPhotosLibres([]);
    setEnregistre(null);
    setEquipement(null);
    setComposant(null);
    setVue("equipements");
  };

  const lignes = Object.entries(releve).map(([k, v]) => {
    const [eqId, compId] = k.split("::");
    const eq = CATALOGUE[eqId];
    return { k, eqId, compId, eq, comp: eq.composants.find((c) => c.id === compId), ...v };
  });

  const incompletes = lignes.filter((l) => manquants(l.comp, l.valeurs).length > 0);
  const nbPhotos = lignes.reduce((n, l) => n + (l.photos || []).length, 0) + photosLibres.length;

  const enregistrer = (patch) => {
    const k = cle(equipement, composant.id);
    setReleve((r) => ({
      ...r,
      [k]: { valeurs: {}, quantite: 1, aChiffrer: true, note: "", photos: [], ...r[k], ...patch },
    }));
  };

  const Entete = ({ titre, sousTitre, retour }) => (
    <div style={S.header}>
      <div style={S.headerInner}>
        <button onClick={retour} style={S.backBtn}>←</button>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: T.accentFond, border: "1px solid " + T.accentBord, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📋</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: T.texte, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{titre}</div>
          <div style={{ fontSize: 11, color: T.faible }}>{sousTitre}</div>
        </div>
      </div>
    </div>
  );

  const BarreBasse = () => (
    <div style={S.barreBasse}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: T.texte, fontWeight: 600 }}>
            {lignes.length} élément{lignes.length > 1 ? "s" : ""}
            {nbPhotos > 0 ? " · " + nbPhotos + " photo" + (nbPhotos > 1 ? "s" : "") : ""}
          </div>
          {incompletes.length > 0 && (
            <div style={{ fontSize: 11, color: T.ambreClair }}>
              ⚠ {incompletes.length} incomplet{incompletes.length > 1 ? "s" : ""}
            </div>
          )}
        </div>
        <button
          onClick={() => setVue("releve")}
          disabled={lignes.length === 0}
          style={{ padding: "12px 20px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 13, fontFamily: "inherit", cursor: lignes.length ? "pointer" : "not-allowed", background: lignes.length ? T.accent : "#1e293b", color: lignes.length ? T.bg : T.tresFaible }}
        >
          Voir le relevé
        </button>
      </div>
    </div>
  );

  /* ---------- 1. équipements ---------- */
  if (vue === "equipements") {
    return (
      <div>
        <Entete titre="Relevé pour devis" sousTitre="Prise de référence sur site" retour={onBack} />
        <div style={S.content}>
          <button
            onClick={() => setVue("contexte")}
            style={{ width: "100%", textAlign: "left", padding: 18, borderRadius: 16, border: "1px solid " + T.border, background: T.panel, color: T.texte, cursor: "pointer", marginBottom: 22, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 12 }}
          >
            <span style={{ fontSize: 18 }}>📍</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ ...S.label, display: "block", marginBottom: 2 }}>Chantier</span>
              <span style={{ display: "block", fontSize: 13, color: contexte.client ? T.texte : T.faible, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {contexte.client
                  ? contexte.client + (contexte.repere ? " · " + contexte.repere : "")
                  : "Non renseigné"}
              </span>
            </span>
            <span style={{ color: T.tresFaible }}>→</span>
          </button>

          {enregistre && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 11.5, color: T.faible }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, flexShrink: 0 }} />
              Fiche enregistrée sur cet appareil ·{" "}
              {new Date(enregistre).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </div>
          )}

          <div style={{ ...S.label, marginBottom: 12 }}>Type d'équipement</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12 }}>
            {Object.entries(CATALOGUE).map(([id, eq]) => {
              const n = lignes.filter((l) => l.eqId === id).length;
              return (
                <button
                  key={id}
                  onClick={() => { setEquipement(id); setVue("composants"); }}
                  style={{ padding: 0, borderRadius: 16, overflow: "hidden", border: "1px solid " + (n ? T.accentBord : T.border), background: T.panel, color: T.texte, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                >
                  <div style={{ position: "relative", height: 84, borderBottom: "1px solid " + T.border }}>
                    <Visuel eqId={id} photo={eq.photo} />
                    {n > 0 && (
                      <span style={{ position: "absolute", top: 8, right: 8, background: T.accent, color: T.bg, borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{n}</span>
                    )}
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{eq.label}</div>
                    <div style={{ fontSize: 11, color: T.faible, marginTop: 3 }}>{eq.sousTitre}</div>
                    <div style={{ fontSize: 11, marginTop: 10, color: n ? T.accentClair : T.tresFaible }}>
                      {n > 0 ? n + " relevé" + (n > 1 ? "s" : "") : eq.composants.length + " composants"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <BarreBasse />
      </div>
    );
  }

  /* ---------- 2. chantier ---------- */
  if (vue === "contexte") {
    return (
      <div>
        <Entete titre="Chantier" sousTitre="Contexte de l'intervention" retour={() => setVue("equipements")} />
        <div style={S.content}>
          <div style={{ ...S.label, marginBottom: 10 }}>Identification</div>
          <div style={S.panel}>
            {CHAMPS_CONTEXTE.map((c) => (
              <Champ key={c.id} champ={c} valeur={contexte[c.id]} onChange={(v) => setContexte((x) => ({ ...x, [c.id]: v }))} />
            ))}
          </div>
          <div style={{ ...S.label, marginBottom: 4 }}>Pour le chiffrage</div>
          <p style={{ fontSize: 12, color: T.faible, margin: "0 0 10px", lineHeight: 1.5 }}>
            Ce que le commercial ne peut pas deviner depuis le bureau.
          </p>
          <div style={S.panel}>
            {CHAMPS_CHIFFRAGE.map((c) => (
              <Champ key={c.id} champ={c} valeur={contexte[c.id]} onChange={(v) => setContexte((x) => ({ ...x, [c.id]: v }))} />
            ))}
          </div>
          <button onClick={() => setVue("equipements")} style={S.btnPrimary}>Continuer</button>
        </div>
      </div>
    );
  }

  const eq = CATALOGUE[equipement];

  /* ---------- 3. composants ---------- */
  if (vue === "composants") {
    return (
      <div>
        <Entete titre={eq.label} sousTitre="Choisir un composant" retour={() => setVue("equipements")} />
        <div style={S.content}>
          {eq.composants.map((c) => {
            const ligne = releve[cle(equipement, c.id)];
            const m = ligne ? manquants(c, ligne.valeurs) : null;
            const couleur = !ligne ? T.borderFort : m.length ? T.ambre : T.accent;
            return (
              <button
                key={c.id}
                onClick={() => { setComposant(c); setVue("saisie"); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: 16, marginBottom: 8, borderRadius: 14, border: "1px solid " + T.border, background: T.panel, color: T.texte, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
              >
                <span style={{ width: 4, height: 34, borderRadius: 999, background: couleur, flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 600, fontSize: 14 }}>{c.label}</span>
                  <span style={{ display: "block", fontSize: 11, color: m && m.length ? T.ambreClair : T.faible, marginTop: 2 }}>
                    {!ligne
                      ? c.champs.length + " champs"
                      : m.length
                      ? m.length + " champ" + (m.length > 1 ? "s" : "") + " manquant" + (m.length > 1 ? "s" : "")
                      : "Complet · ×" + ligne.quantite}
                  </span>
                </span>
                {ligne && !m.length && <span style={{ color: T.accentClair, fontSize: 14 }}>✓</span>}
                <span style={{ color: T.tresFaible }}>→</span>
              </button>
            );
          })}
        </div>
        <BarreBasse />
      </div>
    );
  }

  /* ---------- 4. saisie ---------- */
  if (vue === "saisie") {
    const k = cle(equipement, composant.id);
    const ligne = releve[k] || { valeurs: {}, quantite: 1, aChiffrer: true, note: "", photos: [] };
    const m = manquants(composant, ligne.valeurs);

    return (
      <div>
        <Entete titre={composant.label} sousTitre={eq.label} retour={() => setVue("composants")} />
        <div style={S.content}>
          {m.length > 0 && (
            <div style={{ padding: 14, borderRadius: 12, background: T.ambreFond, border: "1px solid " + T.ambreBord, color: T.ambreClair, fontSize: 12.5, lineHeight: 1.5, marginBottom: 18 }}>
              ⚠ À renseigner avant de quitter le site : {m.join(", ")}.
            </div>
          )}

          <div style={S.panel}>
            {composant.champs.map((c) => (
              <Champ key={c.id} champ={c} valeur={ligne.valeurs[c.id]} onChange={(v) => enregistrer({ valeurs: { ...ligne.valeurs, [c.id]: v } })} />
            ))}
          </div>

          <div style={S.panel}>
            <div style={S.label}>Chiffrage</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid " + T.border }}>
              <span style={{ fontSize: 13, color: T.doux }}>Quantité</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => enregistrer({ quantite: Math.max(1, (ligne.quantite || 1) - 1) })} style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid " + T.borderFort, background: "rgba(30,41,59,.3)", color: T.doux, fontSize: 18, cursor: "pointer" }}>−</button>
                <span style={{ minWidth: 26, textAlign: "center", fontSize: 16, fontWeight: 700 }}>{ligne.quantite || 1}</span>
                <button onClick={() => enregistrer({ quantite: (ligne.quantite || 1) + 1 })} style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid " + T.borderFort, background: "rgba(30,41,59,.3)", color: T.doux, fontSize: 18, cursor: "pointer" }}>+</button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid " + T.border }}>
              <span style={{ fontSize: 13, color: T.doux }}>Porter au devis</span>
              <div style={{ display: "flex", gap: 6 }}>
                {[{ v: true, l: "Oui" }, { v: false, l: "Relevé seul" }].map((o) => {
                  const actif = ligne.aChiffrer === o.v;
                  return (
                    <button key={o.l} onClick={() => enregistrer({ aChiffrer: o.v })} style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "1px solid " + (actif ? T.accentBord : T.borderFort), background: actif ? T.accentFond : "rgba(30,41,59,.3)", color: actif ? T.accentClair : T.faible }}>
                      {o.l}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ paddingTop: 12 }}>
              <div style={S.label}>Observation</div>
              <textarea
                rows={3}
                value={ligne.note}
                onChange={(e) => enregistrer({ note: e.target.value })}
                placeholder="Contrainte de pose, état constaté, pièce à commander…"
                style={{ ...S.input, resize: "vertical", lineHeight: 1.5 }}
              />
            </div>
          </div>

          <div style={S.panel}>
            <ZonePhotos
              titre="Photos du composant"
              aide="Plaque signalétique, vue d'ensemble, détail de l'usure."
              photos={ligne.photos || []}
              onChange={(photos) => enregistrer({ photos })}
            />
          </div>

          <button onClick={() => setVue("composants")} style={S.btnPrimary}>Valider le composant</button>
        </div>
      </div>
    );
  }

  /* ---------- 6. document PDF ---------- */
  if (vue === "pdf") {
    const lignesPdf = pdfOpts.seulementDevis ? lignes.filter((l) => l.aChiffrer) : lignes;
    const groupes = {};
    lignesPdf.forEach((l) => { (groupes[l.eqId] = groupes[l.eqId] || []).push(l); });
    const aujourdhui = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

    const P = {
      encre: "#0f172a",
      doux: "#475569",
      pale: "#94a3b8",
      ligne: "#e2e8f0",
    };
    const cellule = { display: "flex", justifyContent: "space-between", gap: 12, padding: "3px 0", borderBottom: "1px solid " + P.ligne };

    return (
      <div className="apercu" style={{ minHeight: "100vh", background: T.bg }}>
        <style>{`
          @page { size: A4; margin: 14mm; }
          @media print {
            .sans-impression { display: none !important; }
            .apercu { background: #fff !important; padding: 0 !important; }
            .feuille { box-shadow: none !important; margin: 0 !important; padding: 0 !important; max-width: none !important; }
            .insecable { break-inside: avoid; page-break-inside: avoid; }
            img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}</style>

        <div className="sans-impression" style={S.header}>
          <div style={S.headerInner}>
            <button onClick={() => setVue("releve")} style={S.backBtn}>←</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.texte }}>Aperçu du PDF</div>
              <div style={{ fontSize: 11, color: T.faible }}>
                {lignesPdf.length} élément{lignesPdf.length > 1 ? "s" : ""}
                {pdfOpts.avecPhotos && nbPhotos > 0 ? " · " + nbPhotos + " photo" + (nbPhotos > 1 ? "s" : "") : ""}
              </div>
            </div>
            <button onClick={() => window.print()} style={{ padding: "11px 18px", borderRadius: 10, border: "none", background: T.accent, color: T.bg, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              🖨 Enregistrer
            </button>
          </div>
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px 12px", display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { cle: "seulementDevis", on: "À chiffrer seulement", off: "Tout le relevé" },
              { cle: "masquerVides", on: "Champs vides masqués", off: "Tous les champs" },
              { cle: "avecPhotos", on: "Avec les photos", off: "Sans les photos" },
            ].map((o) => {
              const actif = pdfOpts[o.cle];
              return (
                <button key={o.cle} onClick={() => setPdfOpts((x) => ({ ...x, [o.cle]: !x[o.cle] }))} style={{ padding: "6px 12px", borderRadius: 999, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "1px solid " + (actif ? T.accentBord : T.borderFort), background: actif ? T.accentFond : "rgba(30,41,59,.3)", color: actif ? T.accentClair : T.faible }}>
                  {actif ? o.on : o.off}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px 60px" }}>
          <div className="feuille" style={{ background: "#fff", color: P.encre, padding: 40, borderRadius: 4, boxShadow: "0 10px 40px rgba(0,0,0,.4)", fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid " + P.encre, paddingBottom: 14, marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: T.ambre, fontWeight: 700 }}>
                  SAV<span style={{ color: T.accent }}>i</span>
                </div>
                <h2 style={{ margin: "6px 0 2px", fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>Relevé technique</h2>
                <div style={{ fontSize: 12, color: P.doux }}>Transmission au service commercial pour chiffrage</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: P.pale, textTransform: "uppercase", letterSpacing: 1 }}>Date du relevé</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{aujourdhui}</div>
              </div>
            </div>

            <div className="insecable" style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: P.pale, fontWeight: 700, marginBottom: 8 }}>Chantier</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 32 }}>
                {CHAMPS_CONTEXTE.filter((c) => contexte[c.id]).map((c) => (
                  <div key={c.id} style={cellule}>
                    <span style={{ color: P.doux, fontSize: 12 }}>{c.label}</span>
                    <span style={{ fontWeight: 600, fontSize: 12, textAlign: "right" }}>{contexte[c.id]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="insecable" style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: P.pale, fontWeight: 700, marginBottom: 8 }}>Pour le chiffrage</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 32 }}>
                {CHAMPS_CHIFFRAGE.filter((c) => contexte[c.id] && c.id !== "obs_generale").map((c) => (
                  <div key={c.id} style={cellule}>
                    <span style={{ color: P.doux, fontSize: 12 }}>{c.label}</span>
                    <span style={{ fontWeight: 600, fontSize: 12, textAlign: "right" }}>
                      {contexte[c.id]}{c.unite ? " " + c.unite : ""}
                    </span>
                  </div>
                ))}
              </div>
              {contexte.obs_generale && (
                <p style={{ margin: "10px 0 0", paddingLeft: 12, borderLeft: "3px solid " + T.accent, fontSize: 12.5, lineHeight: 1.5 }}>
                  {contexte.obs_generale}
                </p>
              )}
            </div>

            {lignesPdf.some((l) => l.aChiffrer) && (
              <div className="insecable" style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: P.pale, fontWeight: 700, marginBottom: 8 }}>Récapitulatif à chiffrer</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid " + P.encre, textAlign: "left" }}>
                      <th style={{ padding: "4px 0", width: 28, fontSize: 10, color: P.pale, fontWeight: 600 }}>#</th>
                      <th style={{ padding: "4px 0", fontSize: 10, color: P.pale, fontWeight: 600 }}>Équipement</th>
                      <th style={{ padding: "4px 0", fontSize: 10, color: P.pale, fontWeight: 600 }}>Élément</th>
                      <th style={{ padding: "4px 0", width: 40, textAlign: "right", fontSize: 10, color: P.pale, fontWeight: 600 }}>Qté</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignesPdf.filter((l) => l.aChiffrer).map((l, i) => (
                      <tr key={l.k} style={{ borderBottom: "1px solid " + P.ligne }}>
                        <td style={{ padding: "4px 0", color: P.pale }}>{String(i + 1).padStart(2, "0")}</td>
                        <td style={{ padding: "4px 0", color: P.doux }}>{CATALOGUE[l.eqId].label}</td>
                        <td style={{ padding: "4px 0", fontWeight: 600 }}>{l.comp.label}</td>
                        <td style={{ padding: "4px 0", textAlign: "right", fontWeight: 600 }}>{l.quantite}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {Object.entries(groupes).map(([eqId, items]) => (
              <div key={eqId} style={{ marginBottom: 24 }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid #cbd5e1", paddingBottom: 4 }}>
                  {CATALOGUE[eqId].label}
                </h3>
                {items.map((li) => {
                  const m = manquants(li.comp, li.valeurs);
                  const champs = pdfOpts.masquerVides
                    ? li.comp.champs.filter((c) => {
                        const v = li.valeurs[c.id];
                        return v !== undefined && v !== "" && v !== null;
                      })
                    : li.comp.champs;
                  return (
                    <div key={li.k} className="insecable" style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700 }}>{li.comp.label}</span>
                        <span style={{ fontSize: 11, color: P.doux }}>×{li.quantite}</span>
                        {li.aChiffrer && (
                          <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, border: "1px solid " + T.accent, color: "#0e7490", borderRadius: 3, padding: "1px 5px" }}>à chiffrer</span>
                        )}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 32 }}>
                        {champs.map((c) => {
                          const v = li.valeurs[c.id];
                          const vide = v === undefined || v === "" || v === null;
                          return (
                            <div key={c.id} style={cellule}>
                              <span style={{ color: P.doux, fontSize: 11 }}>{c.label}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, textAlign: "right", color: vide ? "#cbd5e1" : P.encre }}>
                                {vide ? "—" : v + (c.unite ? " " + c.unite : "")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {li.note && <p style={{ margin: "6px 0 0", fontSize: 11.5, fontStyle: "italic", color: P.doux }}>Observation : {li.note}</p>}
                      {m.length > 0 && <p style={{ margin: "4px 0 0", fontSize: 11, color: P.pale }}>Non relevé : {m.join(", ")}</p>}
                      {pdfOpts.avecPhotos && (li.photos || []).length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
                          {li.photos.map((ph) => (
                            <figure key={ph.id} className="insecable" style={{ margin: 0 }}>
                              <img src={ph.src} alt="" style={{ width: "100%", height: 90, objectFit: "cover", border: "1px solid " + P.ligne, borderRadius: 3, display: "block" }} />
                              {ph.legende && <figcaption style={{ fontSize: 9, color: P.doux, marginTop: 2, lineHeight: 1.3 }}>{ph.legende}</figcaption>}
                            </figure>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {pdfOpts.avecPhotos && photosLibres.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid #cbd5e1", paddingBottom: 4 }}>
                  Photos complémentaires
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {photosLibres.map((ph) => (
                    <figure key={ph.id} className="insecable" style={{ margin: 0 }}>
                      <img src={ph.src} alt="" style={{ width: "100%", border: "1px solid " + P.ligne, borderRadius: 3, display: "block" }} />
                      {ph.legende && <figcaption style={{ fontSize: 11, color: P.doux, marginTop: 4 }}>{ph.legende}</figcaption>}
                    </figure>
                  ))}
                </div>
              </div>
            )}

            <div className="insecable" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, borderTop: "1px solid #cbd5e1", paddingTop: 20, marginTop: 32 }}>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: P.pale, fontWeight: 700 }}>Relevé effectué par</div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{contexte.technicien || "—"}</div>
                <div style={{ fontSize: 11, color: P.doux }}>{aujourdhui}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: P.pale, fontWeight: 700 }}>Transmis à</div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{contexte.commercial || "—"}</div>
                <div style={{ fontSize: 11, color: P.doux }}>Service commercial</div>
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: "center", fontSize: 9.5, color: P.pale, letterSpacing: 0.5 }}>
              Document interne — relevé technique, ne pas transmettre au client.
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- 5. relevé ---------- */
  const parEq = {};
  lignes.forEach((l) => { (parEq[l.eqId] = parEq[l.eqId] || []).push(l); });

  return (
    <div>
      <Entete titre="Relevé" sousTitre={lignes.length + " éléments · " + lignes.filter((l) => l.aChiffrer).length + " au devis"} retour={() => setVue("equipements")} />
      <div style={S.content}>
        {incompletes.length > 0 && (
          <div style={{ padding: 14, borderRadius: 12, background: T.ambreFond, border: "1px solid " + T.ambreBord, color: T.ambreClair, fontSize: 12.5, lineHeight: 1.5, marginBottom: 18 }}>
            ⚠ {incompletes.length} élément{incompletes.length > 1 ? "s" : ""} incomplet{incompletes.length > 1 ? "s" : ""}. Complète avant de partir, sinon c'est un second déplacement.
          </div>
        )}

        {Object.entries(parEq).map(([eqId, items]) => (
          <div key={eqId} style={{ marginBottom: 22 }}>
            <div style={{ ...S.label, marginBottom: 10 }}>{CATALOGUE[eqId].label}</div>
            {items.map((li) => {
              const m = manquants(li.comp, li.valeurs);
              const renseignes = li.comp.champs.filter((c) => {
                const v = li.valeurs[c.id];
                return v !== undefined && v !== "" && v !== null;
              });
              return (
                <div key={li.k} style={{ display: "flex", gap: 12, padding: 16, marginBottom: 8, borderRadius: 14, border: "1px solid " + T.border, background: T.panel }}>
                  <span style={{ width: 4, borderRadius: 999, background: m.length ? T.ambre : T.accent, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{li.comp.label}</span>
                      <span style={{ fontSize: 11, color: T.faible }}>×{li.quantite}</span>
                      {li.aChiffrer && (
                        <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, padding: "2px 7px", borderRadius: 999, background: T.accentFond, color: T.accentClair, border: "1px solid " + T.accentBord }}>devis</span>
                      )}
                      {(li.photos || []).length > 0 && (
                        <span style={{ fontSize: 11, color: T.faible }}>📷 {li.photos.length}</span>
                      )}
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: 11.5, color: T.doux, lineHeight: 1.5 }}>
                      {renseignes.map((c) => c.label + " " + li.valeurs[c.id] + (c.unite ? " " + c.unite : "")).join("  ·  ") || "Aucune valeur saisie"}
                    </p>
                    {li.note && <p style={{ margin: "4px 0 0", fontSize: 11.5, fontStyle: "italic", color: T.faible }}>{li.note}</p>}
                    {m.length > 0 && <p style={{ margin: "4px 0 0", fontSize: 11, color: T.ambreClair }}>Manquant : {m.join(", ")}</p>}
                  </div>
                  <button
                    onClick={() => setReleve((r) => { const c = { ...r }; delete c[li.k]; return c; })}
                    style={{ background: "none", border: "none", color: T.tresFaible, cursor: "pointer", fontSize: 15, alignSelf: "flex-start" }}
                    aria-label="Retirer"
                  >
                    🗑
                  </button>
                </div>
              );
            })}
          </div>
        ))}

        {lignes.length === 0 && (
          <div style={{ textAlign: "center", padding: 48, color: T.tresFaible, fontSize: 14, border: "1px dashed " + T.borderFort, borderRadius: 16, marginBottom: 20 }}>
            Aucun élément relevé.<br />Choisis un équipement pour commencer.
          </div>
        )}

        <div style={S.panel}>
          <ZonePhotos
            titre="Photos complémentaires"
            aide="Environnement, accès, contraintes de pose — tout ce qui ne se rattache pas à un composant."
            photos={photosLibres}
            onChange={setPhotosLibres}
          />
        </div>

        {lignes.length > 0 && (
          <button onClick={() => setVue("pdf")} style={S.btnPrimary}>📄 Générer le PDF</button>
        )}

        {(lignes.length > 0 || Object.keys(contexte).length > 0) && (
          <button
            onClick={nouvelleFiche}
            style={{ width: "100%", marginTop: 12, padding: 13, borderRadius: 10, border: "1px solid " + T.borderFort, background: "rgba(30,41,59,.3)", color: T.doux, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
          >
            Nouvelle fiche
          </button>
        )}

        <div style={{ fontSize: 11, color: T.tresFaible, textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>
          La fiche en cours est enregistrée sur cet appareil. Génère le PDF avant de repartir de zéro.
        </div>
      </div>
    </div>
  );
}
