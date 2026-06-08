import careerLexicon from "../data/career-lexicon.json";

export type EvidenceCategory = "action" | "object" | "method" | "output" | "metric";

type DomainLexicon = {
  id: string;
  name: string;
  jobAliases: string[];
  coreSkills: string[];
  tools: string[];
  actionVerbs: string[];
  evidenceMarkers: string[];
  synonyms: Record<string, string[]>;
};

type CareerLexicon = {
  version: string;
  structureMarkers: string[];
  riskMarkers: string[];
  evidenceLexicon: Record<EvidenceCategory, string[]>;
  domains: DomainLexicon[];
};

export type SelectedLexicon = {
  domain: DomainLexicon;
  domains: DomainLexicon[];
  keywords: string[];
  structureMarkers: string[];
  riskMarkers: string[];
  evidenceLexicon: Record<EvidenceCategory, string[]>;
  synonyms: Record<string, string[]>;
};

const lexicon = careerLexicon as CareerLexicon;
const genericDomain: DomainLexicon = {
  id: "general",
  name: "通用求职",
  jobAliases: ["实习", "校招", "管培生", "目标岗位"],
  coreSkills: [],
  tools: [],
  actionVerbs: [],
  evidenceMarkers: [],
  synonyms: {}
};

export function selectCareerLexicon(jdText: string, jobTitle = ""): SelectedLexicon {
  const signalText = `${jobTitle}\n${jdText}`;
  const scoredDomains = lexicon.domains
    .map((domain) => ({ domain, score: scoreDomain(signalText, domain) }))
    .sort((a, b) => b.score - a.score);

  const topDomains = scoredDomains.filter((item) => item.score > 0).slice(0, 2).map((item) => item.domain);
  const domains = topDomains.length ? topDomains : [genericDomain, ...lexicon.domains.slice(0, 3)];
  const domain = domains[0];
  const synonyms = mergeSynonyms(domains);

  return {
    domain,
    domains,
    keywords: unique(domains.flatMap((item) => [...item.jobAliases, ...item.coreSkills, ...item.tools])),
    structureMarkers: lexicon.structureMarkers,
    riskMarkers: lexicon.riskMarkers,
    evidenceLexicon: mergeEvidenceLexicon(domains),
    synonyms
  };
}

export function extractJDKeywords(jdText: string, selected: SelectedLexicon) {
  const jdTerms = selected.keywords.filter((keyword) => includesLoose(jdText, keyword) || synonymMatches(jdText, keyword, selected.synonyms));
  const expanded = jdTerms.flatMap((term) => [term, ...(selected.synonyms[term] || [])]);
  return unique(expanded).slice(0, 36);
}

export function findMatchedKeywords(text: string, keywords: string[], synonyms: Record<string, string[]>) {
  return keywords.filter((keyword) => includesLoose(text, keyword) || synonymMatches(text, keyword, synonyms));
}

export function findMissingKeywords(text: string, keywords: string[], synonyms: Record<string, string[]>) {
  return keywords.filter((keyword) => !includesLoose(text, keyword) && !synonymMatches(text, keyword, synonyms));
}

export function scoreEvidenceChain(text: string, selected: SelectedLexicon) {
  const categories = Object.entries(selected.evidenceLexicon) as [EvidenceCategory, string[]][];
  const matchedByCategory = categories.reduce<Record<EvidenceCategory, string[]>>(
    (result, [category, terms]) => {
      result[category] = unique(terms.filter((term) => includesLoose(text, term)));
      return result;
    },
    { action: [], object: [], method: [], output: [], metric: [] }
  );

  const categoryCoverage = Object.values(matchedByCategory).filter((items) => items.length > 0).length;
  const richEvidenceBonus = hasEvidenceChain(matchedByCategory) ? 18 : 0;
  const numericBonus = /\d|%/.test(text) ? 12 : 0;
  const densityScore = Math.min(22, Object.values(matchedByCategory).reduce((sum, items) => sum + Math.min(items.length, 5), 0) * 2);

  return {
    score: clamp(34 + categoryCoverage * 7 + densityScore + richEvidenceBonus + numericBonus),
    matchedByCategory,
    hasChain: hasEvidenceChain(matchedByCategory)
  };
}

export function findRiskMarkers(text: string, selected: SelectedLexicon) {
  return selected.riskMarkers.filter((term) => includesLoose(text, term));
}

export function includesLoose(text: string, keyword: string) {
  return text.toLowerCase().includes(keyword.toLowerCase());
}

export function unique<T>(items: T[]) {
  return [...new Set(items.filter(Boolean))];
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function scoreDomain(text: string, domain: DomainLexicon) {
  const aliasScore = domain.jobAliases.filter((term) => includesLoose(text, term)).length * 5;
  const skillScore = domain.coreSkills.filter((term) => includesLoose(text, term)).length * 3;
  const toolScore = domain.tools.filter((term) => includesLoose(text, term)).length * 2;
  const synonymScore = Object.values(domain.synonyms).flat().filter((term) => includesLoose(text, term)).length * 2;
  return aliasScore + skillScore + toolScore + synonymScore;
}

function mergeEvidenceLexicon(domains: DomainLexicon[]) {
  return {
    action: unique([...lexicon.evidenceLexicon.action, ...domains.flatMap((domain) => domain.actionVerbs)]),
    object: lexicon.evidenceLexicon.object,
    method: lexicon.evidenceLexicon.method,
    output: lexicon.evidenceLexicon.output,
    metric: unique([...lexicon.evidenceLexicon.metric, ...domains.flatMap((domain) => domain.evidenceMarkers)])
  } satisfies Record<EvidenceCategory, string[]>;
}

function mergeSynonyms(domains: DomainLexicon[]) {
  return domains.reduce<Record<string, string[]>>((result, domain) => {
    for (const [key, values] of Object.entries(domain.synonyms)) {
      result[key] = unique([...(result[key] || []), ...values]);
      for (const value of values) {
        result[value] = unique([...(result[value] || []), key, ...values.filter((item) => item !== value)]);
      }
    }
    return result;
  }, {});
}

function synonymMatches(text: string, keyword: string, synonyms: Record<string, string[]>) {
  return (synonyms[keyword] || []).some((term) => includesLoose(text, term));
}

function hasEvidenceChain(matchedByCategory: Record<EvidenceCategory, string[]>) {
  return (
    matchedByCategory.action.length > 0 &&
    matchedByCategory.object.length > 0 &&
    (matchedByCategory.method.length > 0 || matchedByCategory.output.length > 0 || matchedByCategory.metric.length > 0)
  );
}
