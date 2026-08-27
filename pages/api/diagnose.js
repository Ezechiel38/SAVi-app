/* ==================================================================== *
 *  /api/diagnose — SAVi
 *
 *  Trois changements par rapport à la version précédente :
 *
 *  1. SORTIE STRUCTURÉE PAR OUTIL
 *     Fini le JSON.parse() sur du texte nettoyé au regex. Le schéma est
 *     imposé au modèle, qui ne peut plus renvoyer de préambule ni de
 *     backticks. C'est la cause principale des diagnostics qui plantent.
 *
 *  2. PROMPT MÉTIER
 *     Ordre de vérification réel du dépanneur, sécurité systématique,
 *     interdiction de deviner quand les symptômes sont insuffisants.
 *
 *  3. MODÈLE À JOUR + GARDE-FOUS
 *     Délai maximum, messages d'erreur exploitables, limites de saisie.
 *
 *  ⚠ À FAIRE : remplace les trois cas d'exemple dans EXEMPLES par des
 *  pannes que TU as réellement traitées. C'est ce qui fera le plus
 *  progresser la qualité — bien plus que le choix du modèle.
 * ==================================================================== */

export const config = { maxDuration: 30 };

const MODELE = "claude-sonnet-5";
const DELAI_MS = 25000;

/* ---------------------------------------------------------------- *
 *  Exemples réels — à remplacer par les tiens.
 *  Format : symptôme tel que le client le décrit → cause réelle →
 *  ce que tu as vérifié pour y arriver.
 * ---------------------------------------------------------------- */

const EXEMPLES = `
Exemple 1 — Portail coulissant, copropriété
Symptôme rapporté : "le portail s'ouvre mais se referme tout seul juste après"
Cause réelle : cellule photoélectrique désalignée par un choc, le portail
réouvre en sécurité puis retente la fermeture en boucle.
Démarche : test des cellules en masquant le faisceau, contrôle de
l'alignement émetteur/récepteur, vérification de la LED de réception avant
toute intervention sur l'armoire.

Exemple 2 — Porte sectionnelle industrielle
Symptôme rapporté : "la porte monte de 30 cm et redescend"
Cause réelle : ressort de torsion détendu, l'effort dépasse le seuil de
l'ampèremétrique qui inverse le mouvement.
Démarche : manœuvre manuelle après consignation pour évaluer l'équilibrage,
comptage des tours de tension, contrôle visuel des câbles avant de toucher
au réglage électronique.

Exemple 3 — Rideau métallique, commerce
Symptôme rapporté : "plus rien ne répond, ni télécommande ni bouton"
Cause réelle : parachute déclenché suite à une rupture de lame finale, le
contact de sécurité coupe toute la commande.
Démarche : contrôle de la présence secteur, puis de la chaîne de sécurité
avant de suspecter la carte — l'absence totale de réaction oriente vers une
coupure de sécurité, pas vers une panne électronique.
`;

const SYSTEM = `Tu es un dépanneur senior en fermeture industrielle et copropriété, dix ans de terrain. Tu assistes un technicien SAV en intervention, sur son téléphone, souvent debout devant l'équipement.

MÉTHODE DE DIAGNOSTIC — respecte cet ordre, c'est celui du terrain :
1. Alimentation et coupure secteur
2. Chaîne de sécurité : cellules, palpeuse, parachute, contacts de portillon, arrêts d'urgence
3. Fins de course et réglages d'effort
4. Organes mécaniques : ressorts, câbles, galets, crémaillère, paliers
5. Carte électronique et radio — EN DERNIER

Ne propose jamais le remplacement d'une carte avant d'avoir écarté les niveaux 1 à 4.

RÈGLES ABSOLUES :
- Si les symptômes sont trop vagues pour discriminer entre plusieurs causes, dis-le franchement dans la synthèse et remplis "precisions" avec les questions à poser ou les mesures à relever. Ne comble jamais un manque d'information par une supposition présentée comme probable.
- Chaque vérification doit être exécutable sur place, avec les outils d'un technicien : un multimètre, une clé, les yeux. Pas de "contacter le constructeur" comme étape de diagnostic.
- Sécurité : renseigne le champ "securite" dès qu'il y a un ressort sous tension, un tablier en hauteur, une intervention sous tension, un parachute, ou un équipement en zone de passage. Rappelle la consignation. Laisse null uniquement si l'intervention est réellement sans risque particulier.
- Vocabulaire métier français : fin de course, palpeuse, écoinçon, coulisse, armoire de commande, ampèremétrique, débrayage. Jamais de traduction approximative.
- Sois bref. Le technicien lit sur un écran de téléphone, parfois avec des gants.

EXEMPLES DE DIAGNOSTICS RÉUSSIS :
${EXEMPLES}`;

const OUTIL = {
  name: "diagnostic",
  description: "Restitue le diagnostic structuré au technicien.",
  input_schema: {
    type: "object",
    properties: {
      synthese: {
        type: "string",
        description:
          "2 à 3 phrases : ce que les symptômes indiquent et par où commencer. Si l'information est insuffisante, le dire ici.",
      },
      causes: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        description: "Causes probables, classées de la plus probable à la moins probable.",
        items: {
          type: "object",
          properties: {
            cause: { type: "string", description: "Nom court de la cause, 6 mots maximum." },
            probabilite: { type: "string", enum: ["Élevée", "Moyenne", "Faible"] },
            explication: { type: "string", description: "Pourquoi cette cause produit ces symptômes. 2 phrases." },
            verifications: {
              type: "array",
              minItems: 1,
              maxItems: 4,
              items: { type: "string" },
              description: "Vérifications concrètes réalisables sur place, dans l'ordre.",
            },
          },
          required: ["cause", "probabilite", "explication", "verifications"],
        },
      },
      securite: {
        type: ["string", "null"],
        description: "Consignes de sécurité propres à cette intervention, ou null si aucun risque particulier.",
      },
      precisions: {
        type: "array",
        items: { type: "string" },
        description:
          "Questions ou mesures à relever si les symptômes sont insuffisants pour trancher. Tableau vide sinon.",
      },
    },
    required: ["synthese", "causes", "securite", "precisions"],
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { ctx, brand, model, symptoms } = req.body || {};

  if (!symptoms || !symptoms.trim()) {
    return res.status(400).json({ error: "Décrivez les symptômes." });
  }
  if (symptoms.length > 4000) {
    return res.status(400).json({ error: "Description trop longue (4000 caractères maximum)." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Configuration serveur incomplète." });
  }

  const userMessage = `Contexte : ${ctx === "copro" ? "Copropriété / syndic" : "Site industriel"}
Marque : ${brand || "non précisée"}
Modèle : ${model || "non précisé"}

Symptômes relevés sur place :
${symptoms.trim()}`;

  const controleur = new AbortController();
  const minuterie = setTimeout(() => controleur.abort(), DELAI_MS);

  try {
    const reponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controleur.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 2000,
        system: SYSTEM,
        tools: [OUTIL],
        tool_choice: { type: "tool", name: "diagnostic" },
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    clearTimeout(minuterie);
    const data = await reponse.json();

    if (!reponse.ok || data.error) {
      const detail = data.error ? data.error.message : "statut " + reponse.status;
      console.error("Erreur API Anthropic :", detail);
      if (reponse.status === 429) {
        return res.status(429).json({ error: "Trop de diagnostics en cours. Réessayez dans un instant." });
      }
      return res.status(502).json({ error: "Le service de diagnostic est momentanément indisponible." });
    }

    const bloc = (data.content || []).find((b) => b.type === "tool_use");
    if (!bloc || !bloc.input) {
      console.error("Pas de bloc tool_use :", JSON.stringify(data).slice(0, 500));
      return res.status(502).json({ error: "Réponse inexploitable. Reformulez les symptômes." });
    }

    return res.status(200).json({
      synthese: bloc.input.synthese,
      causes: bloc.input.causes || [],
      securite: bloc.input.securite || null,
      precisions: bloc.input.precisions || [],
    });
  } catch (erreur) {
    clearTimeout(minuterie);
    if (erreur.name === "AbortError") {
      console.error("Délai dépassé sur le diagnostic");
      return res.status(504).json({ error: "Le diagnostic a pris trop de temps. Réessayez." });
    }
    console.error("Erreur diagnostic :", erreur.message || erreur);
    return res.status(500).json({ error: "Erreur technique. Réessayez dans un instant." });
  }
}
