export type Lang = 'ru' | 'en';
export type Dimension = 'backing' | 'redemption' | 'technology' | 'governance' | 'market' | 'transparency';
export type Mechanism = 'fiat' | 'crypto' | 'synthetic' | 'unknown';
export type Profile = 'economy' | 'balanced' | 'intensive';
export type Bilingual = {ru: string; en: string};
export type Evidence = {
  id: string; url: string; title: string; kind: 'reserve_attestation'|'financial_audit'|'code_audit'|'whitepaper'|'terms'|'market'|'disclosure';
  quote: string; document_hash: string; reporting_date: string | null; retrieved_at: string; page: number | null;
  asset_id: string; chain?: string; contract?: string; document_id?: string;
};
export type DimensionResult = {
  score: number | null; explanation: Bilingual; evidence_ids: string[];
  verified: boolean; relevant_until: string | null; conflict: boolean;
};
export type Assessment = {
  id: string; asset_id: string; created_at: string; methodology_version: string;
  dimensions: Record<Dimension, DimensionResult>; evidence: Evidence[];
  critical: 'none'|'suspected'|'confirmed'; critical_reason: Bilingual;
  score: number | null; completeness: number; status: 'insufficient'|'evaluated'|'critical'|'needs_review';
  explanation: Bilingual; model: string; reviewed_at?: string;
};
export type Asset = {
  id: string; symbol: string; name: string; issuer: string; mechanism: Mechanism;
  website: string; source_urls: string[]; color: string; description: Bilingual;
  versions: {chain: string; contract: string; status: 'unassessed'|'assessed'; bridged: boolean|null}[];
  market_cap: number | null; price: number | null; market_checked_at: string | null; market_source?: string;
  assessment: Assessment | null; review_alert?: boolean;
};
export type Settings = { profile: Profile; monthly_budget_usd: number; automation_enabled: boolean; last_market_at: string|null; last_documents_at: string|null; last_search_at: string|null };
export type Job = {id: string; asset_id: string|null; kind: string; status: string; stage: string; error: string|null; created_at: string; updated_at: string};
