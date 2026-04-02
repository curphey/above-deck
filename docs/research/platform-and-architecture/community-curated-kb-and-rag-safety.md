# Community-Curated Knowledge Base and RAG Safety

**Date:** 2026-03-31
**Status:** Research Complete
**Scope:** Analysis of community-curated KB models, RAG data quality risks, content trust tiers, and safety-critical content handling for a marine platform

---

## Table of Contents

1. [How Successful Community KBs Work](#1-how-successful-community-kbs-work)
2. [RAG Data Quality and Poisoning Risks](#2-rag-data-quality-and-poisoning-risks)
3. [Content Trust and Quality Tiers](#3-content-trust-and-quality-tiers)
4. [Safety-Critical Content Handling](#4-safety-critical-content-handling)
5. [Content Moderation at Scale](#5-content-moderation-at-scale)
6. [RAG-Specific Quality Controls](#6-rag-specific-quality-controls)
7. [Seeding Strategy](#7-seeding-strategy)
8. [Incentive Design](#8-incentive-design)
9. [Comparison: Editorial vs Community vs Hybrid](#9-comparison-editorial-vs-community-vs-hybrid)
10. [Recommendation for Above Deck](#10-recommendation-for-above-deck)

---

## 1. How Successful Community KBs Work

### Wikipedia

Wikipedia is the canonical example of community-curated knowledge at scale. Its editing model is instructive for both what works and what goes wrong.

**Editing Model:** Anyone can edit, but edits are not equal. Wikipedia uses a tiered quality assessment system with seven grades: Stub, Start, C, B, Good Article (GA), A, and Featured Article (FA). Most grades are assessed by individual editors, but GA requires review by an independent editor against six criteria (well-written, accurate and verifiable, broad, neutral, stable, illustrated). FA requires review by several editors at [WP:Featured article candidates](https://en.wikipedia.org/wiki/Wikipedia:Featured_article_criteria). This creates a quality ladder that content climbs through community effort.

**Vandalism Detection:** Wikipedia deploys automated bots (ClueBot NG) that use machine learning classifiers to detect and revert vandalism in near-real-time. The "abuse filter" uses regular expressions to catch common vandalism patterns. Huggle provides a fast diff browser that sorts edits by predicted vandalism level. Research shows combining natural language features, metadata features, and reputation features achieves strong detection accuracy ([Adler et al., 2011](https://www.researchgate.net/publication/51527727_Wikipedia_Vandalism_Detection_Combining_Natural_Language_Metadata_and_Reputation_Features)).

**Citation Requirements:** Wikipedia's "verifiability" policy requires that material challenged or likely to be challenged must be attributed to a reliable, published source. This is directly relevant to a marine KB where claims about tidal calculations or electrical safety need to trace back to authoritative sources (NOAA, RYA, ABYC standards).

**What works:** The quality ladder (Stub through FA) lets content start rough and improve. The citation requirement enforces factual grounding. The bot layer catches the most egregious vandalism.

**What doesn't work for us:** Wikipedia's model assumes massive scale (thousands of active editors per topic area). A niche marine KB will never have that density, so vandalism detection by sheer volume of eyeballs is not viable.

### Stack Overflow / Stack Exchange

Stack Overflow's model is fundamentally different from a wiki. It uses a Q&A format with a sophisticated reputation and privilege system.

**Reputation-Gated Privileges:** Users earn reputation through upvotes and accepted answers. Privileges unlock progressively: flag posts (15 rep), review new user posts (500), edit any post (2,000), cast close/open votes (3,000), access moderation dashboard (10,000). This [graduated trust model](https://stackoverflow.blog/2009/05/18/a-theory-of-moderation/) means new users cannot damage the knowledge base, and the most experienced users have the most power over content quality.

**Quality Signals:** Every answer has a visible vote count. The question asker can mark one answer as "accepted." This combination of community voting and asker verification creates a strong quality signal. [Harvard research](https://d3.harvard.edu/platform-digit/submission/stack-overflow-quality-through-community-control/) found that Stack Overflow generates high-quality content specifically because of this reputation-gated editing system.

**Relevance to RAG:** Stack Overflow's vote count and accepted-answer status are excellent metadata for RAG confidence scoring. A highly-voted, accepted answer is far more trustworthy than a zero-vote answer. This model maps well to confidence tiers in a vector store.

**Failure modes:** Stack Overflow has struggled with hostility toward newcomers and "fastest gun in the west" dynamics where speed trumps quality. The gamification of reputation can incentivize volume over depth.

### MDN Web Docs

MDN moved to a [GitHub-based contribution model](https://developer.mozilla.org/en-US/docs/MDN/Community/Pull_requests) where all content changes are submitted as pull requests. This is the closest analogue to what Above Deck might build.

**PR-Based Workflow:** Contributors fork the `mdn/content` repository, make changes, and submit PRs. Reviewers are automatically assigned via CODEOWNERS. Large PRs go through two phases: technical review and editorial review. This separation ensures both accuracy and readability.

**Editorial Standards:** MDN has [explicit contributing guidelines](https://github.com/mdn/content/blob/main/CONTRIBUTING.md) and [review criteria](https://github.com/mdn/content/blob/main/REVIEWING.md). Content must be accurate, well-structured, and follow the style guide. This level of formalization is essential for maintaining quality at scale.

**Relevance:** MDN's model works well for Above Deck because: (1) the sailing community has many technically capable contributors, (2) Git-based workflows create full audit trails, (3) PR review is a natural checkpoint before content enters production (and RAG). The main downside is the friction of Git for non-technical contributors.

### Arch Wiki

The Arch Wiki is widely regarded as the gold standard of community-maintained technical documentation, despite having no strictly enforced rules about content creation. Its success comes from three principles documented in its [contributing guidelines](https://wiki.archlinux.org/title/ArchWiki:Contributing):

1. **DRY (Don't Repeat Yourself):** Each topic exists in one place. This prevents contradictory information, which is directly relevant to RAG (contradictory chunks confuse the model).
2. **Simple but not stupid:** Documentation is concise and precise. No hand-holding, no excessive prose.
3. **Scope discipline:** Only content that works on Arch as-is is hosted. This narrow focus maintains quality. For a marine KB, the equivalent would be: only content relevant to recreational sailing/cruising, not commercial shipping or powerboat racing.

The Arch Wiki's success is attributed to a self-selecting community: the kind of person who runs Arch Linux is predisposed to writing precise technical documentation. Similarly, cruising sailors who maintain their own boats tend to be detail-oriented and technically rigorous.

### OpenStreetMap

OSM is directly relevant because it involves community-contributed geospatial data where errors have real-world consequences (wrong road data, missing hazards).

**Vandalism Detection:** OSM uses both changeset-focused detection (scanning edits for suspicious metadata) and user-focused detection (profiling editing behavior). [Research by Tempelmeier et al. (2022)](https://arxiv.org/abs/2201.10406) introduced attention-based methods using neural architectures to detect vandalism from changeset features. [User embedding approaches](https://dl.acm.org/doi/10.1145/3459637.3482213) create vector representations of editor behavior to flag anomalies.

**Community Validation:** Minor vandalism is handled by local community members who know the area. This "local expertise" model is analogous to having experienced sailors review marine-specific content.

**Limits of Scale-Based Detection:** OSM's vandalism detection assumes that errors will eventually be noticed and corrected by other contributors. In less-mapped areas (the "long tail"), errors can persist for years. A marine KB will have many topics that are niche enough that only a few people are qualified to verify them (e.g., tidal harmonics for a specific port, wiring standards for a specific boat brand).

### Marine-Specific Community Knowledge Sharing

**ActiveCaptain (Garmin):** Founded in 2007, acquired by Garmin in 2017, ActiveCaptain has 166,000+ independent reviews of marinas, anchorages, hazards, and facilities. Users submit reviews and edits, but new markers and updates are [reviewed by staff before inclusion](https://panbo.com/garmins-new-activecaptain-community-site-whats-good-and-whats-not/). This hybrid model (community contribution + editorial review) is the closest existing model to what Above Deck needs. ActiveCaptain's weakness is that Garmin's acquisition turned it into a walled garden tied to Garmin hardware.

**Noonsite:** Created by Jimmy Cornell, now owned by World Cruising Club. Provides cruising formalities, port guides, and safety information for 25+ years. The editorial team [verifies every report](https://www.noonsite.com/). This editorial-first model produces high-trust content but is slow to update and doesn't scale. When pandemic regulations changed rapidly, Noonsite struggled to keep up without community contributions channeled through partner organizations like the Ocean Cruising Club.

**Cruisers Forum:** A traditional vBulletin forum with hundreds of thousands of posts on every conceivable sailing topic. The content is invaluable but essentially unsearchable, unstructured, and unverified. Forum posts mix excellent advice from experienced circumnavigators with dangerous misinformation from armchair sailors. This is exactly the kind of content that should NOT enter RAG without significant curation.

**CruisersWiki:** A MediaWiki instance for cruising information. Smaller community, less active, but structured as a wiki rather than a forum, making content more retrievable.

**Key Pattern:** The marine community has strong knowledge-sharing culture but fragmented across forums, Facebook groups, WhatsApp, and personal blogs. There is no single authoritative, open, community-curated source. This is the opportunity.

---

## 2. RAG Data Quality and Poisoning Risks

### What is RAG Poisoning?

RAG poisoning is an attack where malicious or incorrect content is injected into the knowledge database that an LLM retrieves from when generating answers. Because RAG systems treat retrieved content as authoritative context, poisoned chunks directly influence the model's output.

**PoisonedRAG (Zou et al., USENIX Security 2025):** This [seminal paper](https://arxiv.org/abs/2402.07867) demonstrated that injecting just 5 malicious texts per target question into a knowledge database containing millions of texts could achieve a 90%+ attack success rate. The attacker crafts texts that are semantically similar to the target question (ensuring retrieval) but contain the attacker's chosen answer. Even with expanded retrieval (k=50 retrieved chunks), the attack still achieved 41-43% success. Existing defenses including paraphrasing, perplexity-based detection, and duplicate filtering were found insufficient.

**Implications for a community KB:** If community members can contribute content that enters the RAG pipeline, a malicious actor could craft KB articles or edits designed to be retrieved for specific safety-critical queries and return dangerous answers. The attack surface is the submission pipeline itself.

### How Current RAG Systems Handle Quality

**Perplexity / ChatGPT with Browsing / Copilot:** These systems retrieve from the open web and use source credibility signals (domain authority, publication type) as implicit quality weighting. They also use the LLM itself to assess consistency across retrieved chunks. When contradictions are found, they typically present both perspectives or hedge with phrases like "sources disagree."

**Enterprise RAG systems:** Production systems typically implement relevance thresholds (chunks below a similarity score are excluded), context filtering (removing low-relevance retrieved documents), and context compression (shortening passages to the most relevant parts). Some prioritize recent or high-confidence context over older material.

### Contradictory Information

When RAG returns contradictory chunks from different sources, LLMs typically:
1. Present the majority view if most chunks agree
2. Hedge or present both sides if chunks are evenly split
3. Hallucinate a synthesis that may not represent either source accurately

For safety-critical marine content, option 3 is dangerous. An agent might synthesize contradictory tidal advice into something that sounds authoritative but is wrong. The correct behavior is to present the highest-confidence source and flag the contradiction.

### Marine-Specific Risks

The consequences of RAG returning incorrect information in a marine context are not abstract:

| Topic | Risk if Wrong | Severity |
|-------|--------------|----------|
| Tidal heights/times | Grounding, stranding, hull damage | High |
| Tidal gates/streams | Caught in dangerous currents, capsizing | Critical |
| Electrical wiring (12V/24V) | Fire, electrocution | Critical |
| Gas systems (LPG) | Explosion | Critical |
| VHF DSC procedures | Delayed emergency response | Critical |
| COLREGs (navigation rules) | Collision | Critical |
| MOB procedures | Death | Critical |
| Anchoring technique | Dragging onto rocks/shore | High |
| Weather interpretation | Caught in storm | High |
| Diesel engine troubleshooting | Engine failure at sea | Medium-High |
| Provisioning/water | Inconvenience, illness | Medium |
| Marina reviews | Financial loss, inconvenience | Low |

Content in the "Critical" category should never come from unverified community sources in the RAG pipeline. Content in the "Low" category is safe for community contribution with minimal review.

### Medical RAG as an Analogue

Healthcare RAG systems face similar safety constraints. [Research published in PMC (2025)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12059965/) shows that medical RAG deployments use LLM-RAG as a "support tool rather than an autonomous decision-maker, ensuring that a qualified clinician reviews all recommendations." Self-reflective RAG architectures reduced hallucinations to 5.8% in clinical settings. The key architectural pattern is human-in-the-loop: the RAG system suggests, a qualified human approves.

For marine AI agents, the equivalent is: the agent retrieves and presents information, but for safety-critical topics it should explicitly flag uncertainty, cite sources with their trust tier, and in some cases refuse to give specific advice ("consult your pilot book / local harbor master / qualified electrician").

---

## 3. Content Trust and Quality Tiers

### Proposed Three-Tier Model

#### Tier 1: Editorial / Official

- **Source:** Written or reviewed by project editors, domain experts, or derived from official publications (NOAA, RYA, USCG, ABYC, IMO, ITU)
- **Quality bar:** Fact-checked against primary sources, reviewed by at least one domain expert, formatted to style guide, citations required for all factual claims
- **RAG confidence:** Highest. These chunks get a `trust_score: 1.0` in the vector store metadata
- **Visual indicator on website:** Verified badge, "Reviewed by [Expert Name]" attribution
- **Update process:** Any edit requires editorial review before publishing
- **Examples:** COLREGs interpretation, VHF DSC procedures, electrical wiring standards, tidal prediction methodology

#### Tier 2: Verified Community

- **Source:** Contributed by community members with established reputation, reviewed by at least one peer or editor
- **Quality bar:** Passes automated quality checks (see Section 5), reviewed for factual accuracy by at least one reviewer with relevant expertise, citations encouraged but not mandatory for experiential content
- **RAG confidence:** High. `trust_score: 0.7` in metadata
- **Visual indicator:** "Community Verified" badge with contributor attribution
- **Update process:** Edits by verified contributors auto-publish; edits by new contributors require review
- **Promotion path:** Tier 2 content that accumulates positive community signals (upvotes, citations, editor endorsement) can be promoted to Tier 1 through editorial review
- **Examples:** How-to guides for specific equipment, cruising area guides, boat-specific maintenance procedures, comparison articles

#### Tier 3: Community Draft

- **Source:** New contributions from any registered user, not yet reviewed
- **Quality bar:** Passes automated quality checks only (formatting, minimum length, no spam)
- **RAG confidence:** Low or excluded. `trust_score: 0.3` or `rag_eligible: false`
- **Visual indicator:** "Draft — Not Yet Verified" label, visually distinct (muted styling, info banner)
- **Update process:** Any registered user can edit. Edits to Tier 3 content do not require review
- **Promotion path:** When a Tier 3 article receives a peer review, it can be promoted to Tier 2
- **Examples:** Trip reports, personal experiences, product reviews, tips and tricks

### Flowing Tiers into RAG Confidence Scoring

The trust tier should be embedded directly into the vector store metadata for each chunk:

```
{
  "chunk_id": "tidal-prediction-basics-section-3",
  "source_article": "tidal-prediction-basics",
  "trust_tier": 1,
  "trust_score": 1.0,
  "verification_status": "editorial_reviewed",
  "last_verified": "2026-03-15",
  "verified_by": "editor:mark",
  "safety_critical": true,
  "citations": ["NOAA_CO-OPS_handbook", "RYA_tidal_theory"],
  "contributor_reputation": null,  // editorial content
  "community_votes": 0,           // not applicable
  "content_age_days": 16
}
```

For community content:

```
{
  "chunk_id": "solar-sizing-guide-section-5",
  "source_article": "solar-sizing-guide",
  "trust_tier": 2,
  "trust_score": 0.7,
  "verification_status": "peer_reviewed",
  "last_verified": "2026-02-20",
  "verified_by": "user:experienced_cruiser_42",
  "safety_critical": false,
  "citations": ["victron_mppt_manual"],
  "contributor_reputation": 850,
  "community_votes": 23,
  "content_age_days": 39
}
```

The agent's retrieval pipeline should:
1. Retrieve top-k chunks as normal
2. Apply a trust-weighted re-ranking: multiply the similarity score by the trust_score
3. For safety-critical queries (detected via the query itself or the `safety_critical` metadata on retrieved chunks), filter out Tier 3 content entirely
4. Include trust metadata in the prompt context so the agent can attribute its answers appropriately

### Reputation System Design

Contributor reputation should be a composite score based on:

| Signal | Weight | Rationale |
|--------|--------|-----------|
| Articles contributed | Medium | Shows effort, but volume alone is not quality |
| Peer reviews given | High | Reviewing others' work demonstrates expertise |
| Upvotes received on content | High | Community validation of quality |
| Edits accepted by editors | High | Editor endorsement is a strong signal |
| Account age | Low | Time alone means little |
| Verified credentials (optional) | High | RYA Yachtmaster, marine electrician, etc. |
| Corrections accepted | Medium | Finding and fixing errors shows expertise |
| Content later promoted to Tier 1 | Very High | The strongest signal of quality |

Reputation unlocks privileges (borrowing from Stack Overflow's graduated trust model):

| Reputation | Privilege |
|------------|-----------|
| 0 (new) | Can submit Tier 3 drafts, subject to review |
| 50 | Can submit without pre-moderation |
| 200 | Can peer-review other Tier 3 content |
| 500 | Can edit Tier 2 content (changes still reviewed) |
| 1000 | Can promote Tier 3 to Tier 2 (as reviewer) |
| 2000 | Can flag content for editorial review (Tier 1 promotion) |

### Version Control and Audit Trail

Every content change must be tracked:

- **Who** changed it (user ID, reputation at time of edit)
- **What** changed (full diff)
- **When** it changed (timestamp)
- **Why** it changed (edit summary, required for all non-trivial edits)
- **Review status** after the change (did it maintain its tier, or drop back to draft?)

For Git-based content (MDX in the repo), this audit trail is automatic. For database-stored content, a `content_revisions` table with full diffs is required. Every revision should be restorable (rollback capability).

---

## 4. Safety-Critical Content Handling

### Identifying Safety-Critical Topics

Safety-critical topics are those where incorrect information could directly lead to injury, death, property damage, or legal liability. In the marine domain, these include:

**Navigation Safety:**
- COLREGs (International Regulations for Preventing Collisions at Sea)
- Navigation in restricted visibility
- Traffic separation schemes
- Bridge and lock procedures

**Emergency Procedures:**
- Man Overboard (MOB) procedures
- Distress signaling (VHF DSC, EPIRB, flares)
- Abandon ship procedures
- Fire fighting
- Flooding/damage control

**Electrical and Mechanical:**
- AC and DC wiring standards (ABYC E-11)
- Battery installation and ventilation
- Shore power connections
- LPG/CNG gas systems
- Carbon monoxide risks

**Environmental Hazards:**
- Tidal heights and streams (for pilotage decisions)
- Weather interpretation (storm warnings, bar crossings)
- Hazardous cargo regulations

**Communications:**
- VHF radio procedures (ITU Radio Regulations)
- DSC distress calling procedures
- GMDSS requirements

### Editorial-Only vs Expert-Reviewed Community Content

There are two viable approaches for safety-critical content:

**Option A: Editorial-Only (Locked Content)**
Safety-critical articles are written by editors or domain experts and cannot be edited by the community. Community members can suggest corrections via a "Report an Issue" mechanism that creates a review ticket for editors.

- Pros: Maximum control, maximum confidence, clear liability boundary
- Cons: Single point of failure (editor availability), content gets stale if editors are inactive, doesn't leverage community expertise

**Option B: Expert-Reviewed Community Edits (Recommended)**
Community members can propose edits to safety-critical content, but all changes are held in a review queue and require approval by a designated expert reviewer before publication. The current verified version remains live until the edit is approved.

- Pros: Leverages community expertise (experienced Yachtmasters, marine electricians, coast guard veterans), content stays current, more eyes on important content
- Cons: Requires a pool of qualified reviewers, risk of review queue bottleneck

**Recommendation: Option B with guardrails.** Safety-critical content should be community-editable but with mandatory expert review. The key guardrails:

1. **Explicit tagging:** Every article or section has a `safety_critical: true/false` flag in its frontmatter/metadata
2. **Review queue:** Edits to safety-critical content enter a separate review queue with higher priority
3. **Qualified reviewers:** Reviewers for safety-critical content must have verified domain expertise (e.g., RYA Yachtmaster, USCG license, marine surveyor, ABYC-certified electrician)
4. **Dual review:** Changes to safety-critical content require two reviewers (one for technical accuracy, one for editorial clarity)
5. **Source citation mandatory:** Every factual claim in safety-critical content must cite an authoritative source
6. **Staleness alerts:** Safety-critical content not reviewed within 12 months is flagged for re-verification
7. **Canonical sources override:** When community content contradicts official sources (IMO, USCG, RYA, ABYC), the official source wins. The article must either align with the official source or explicitly note the divergence and explain why

### Handling Contradictions with Official Sources

When community-contributed content contradicts official publications:

1. **Official source wins by default.** The article should present the official position as primary
2. **Practical divergences are noted, not suppressed.** If experienced sailors commonly deviate from textbook procedure (e.g., anchoring techniques that differ from RYA training), the article should say: "The RYA recommends X. In practice, many experienced cruisers use Y because Z. The official recommendation is the safer starting point."
3. **The RAG pipeline should always surface the official position first** for safety-critical queries, even if community content has more upvotes
4. **Contradictions should be flagged for editorial review** automatically when detected (e.g., an article on MOB procedure that contradicts the ISAF/World Sailing guidelines)

### Data Model for Safety Classification

```typescript
// In the content schema
safetyCritical: z.boolean().default(false),
safetyCategory: z.enum([
  'navigation',
  'emergency',
  'electrical',
  'mechanical',
  'gas_systems',
  'communications',
  'environmental',
  'none'
]).default('none'),
officialSources: z.array(z.object({
  authority: z.string(),         // "RYA", "USCG", "IMO", "ABYC"
  publication: z.string(),       // "RYA Training Almanac 2026"
  section: z.string().optional() // "Chapter 5: COLREGs"
})).optional(),
lastExpertReview: z.coerce.date().optional(),
expertReviewer: z.string().optional(),  // verified expert who reviewed
```

---

## 5. Content Moderation at Scale

### Automated Quality Checks (Pre-Submission Gate)

Before a contribution enters the review queue, automated checks should validate:

| Check | Implementation | Blocks Submission? |
|-------|---------------|-------------------|
| Minimum length | Reject articles < 200 words | Yes |
| Maximum length per section | Warn if section > 2000 words | No (warning) |
| Spelling/grammar | Language model or LanguageTool API | No (warning) |
| Formatting compliance | Lint MDX structure (headings, lists) | Yes |
| Broken links | Check all URLs resolve | No (warning) |
| Duplicate detection | Similarity search against existing articles | No (flag for review) |
| Plagiarism detection | Similarity against known sources, check for verbatim copying | Flag for review |
| Required frontmatter | All schema fields populated | Yes |
| Image alt text | All images have alt text | Yes |
| Safety-critical keyword detection | Flag articles touching safety topics for expert review queue | N/A (routing) |

### Community Moderation

Community moderation scales with the community itself:

**Flagging:** Any registered user can flag content as inaccurate, outdated, dangerous, spam, or needing expert review. Flags with a brief explanation go into a moderation queue.

**Voting:** Upvotes and downvotes on articles and specific sections. Sections with net negative votes are visually flagged and prioritized for review. Articles with consistently negative votes are candidates for removal or major revision.

**Peer Review:** Users above a reputation threshold can formally review Tier 3 content and either approve (promote to Tier 2), request changes, or reject. This is the primary path for content quality improvement.

**Talk Pages / Discussion:** Each article should have an associated discussion thread where users can raise concerns, suggest improvements, or debate accuracy without editing the article itself. This mirrors Wikipedia's talk page model and keeps disputes out of the main content.

### Expert Review

For safety-critical content, expert reviewers are the final quality gate:

- **Expert pool:** Maintain a roster of verified domain experts who have agreed to review content. Distribute review requests based on expertise area (navigation, electrical, communications)
- **Review SLA:** Safety-critical content in the review queue for > 7 days should be escalated
- **Review checklist:** Experts review against: factual accuracy, completeness, source citations, clarity, safety of recommendations
- **Expert disagreement:** If two expert reviewers disagree, escalate to editorial decision

### AI-Assisted Moderation

Claude (or another LLM) can assist with moderation tasks, but should not be the sole arbiter:

**Suitable for AI review:**
- Formatting and structure compliance
- Detecting unsupported claims ("this wire size is always safe" without citation)
- Flagging potential safety issues ("this section discusses electrical wiring but has no safety warnings")
- Identifying content that may contradict existing KB articles
- Summarizing changes for human reviewers
- Detecting tone issues (marketing language, non-neutral POV)

**Not suitable for AI-only review:**
- Factual accuracy of technical marine content (the AI may not know whether a specific tidal gate timing is correct)
- Determining whether safety advice meets current regulations
- Resolving expert disagreements
- Final approval for safety-critical content

The AI review step should produce a structured report that accompanies the submission into the human review queue, saving reviewer time but not replacing their judgment.

### Vandalism Detection

For a small-to-medium community, the vandalism threat is lower than Wikipedia but not zero. Key detection patterns:

- **Rapid bulk changes:** User edits 10+ articles in quick succession (bot or vandalism)
- **Removal of safety warnings:** Any edit that removes text containing "warning," "danger," "caution," "never," "always" in safety-critical articles should be flagged
- **New account + safety-critical edit:** First contribution targets safety-critical content (suspicious)
- **Rollback frequency:** If an article is edited and rolled back multiple times, flag for editorial review
- **Content replacement:** Replacing more than 80% of an article's content in a single edit

All edits should be reversible with a single-click rollback to any previous revision.

---

## 6. RAG-Specific Quality Controls

### What Enters RAG

Not all KB content should enter the RAG vector store:

| Content Tier | Enters RAG? | Confidence | Agent Behavior |
|--------------|-------------|------------|----------------|
| Tier 1 (Editorial) | Yes, always | High (1.0) | Cite without qualification |
| Tier 2 (Verified Community) | Yes | Medium-High (0.7) | Cite with attribution to community |
| Tier 3 (Community Draft) | No, by default | N/A | Not retrieved |
| Tier 3 with 5+ upvotes | Yes, with low weight | Low (0.3) | Cite with explicit caveat |
| Flagged content | No | N/A | Excluded from index |
| Content older than 24 months without re-verification | Reduced weight | Decayed (original * 0.5) | Cite with staleness warning |

### Confidence Metadata on RAG Chunks

Every chunk in the vector store should carry metadata that the agent can use at generation time:

```
metadata = {
  // Source identification
  "article_id": "understanding-12v-systems",
  "chunk_index": 3,
  "section_title": "Wire Sizing for 12V Systems",

  // Trust signals
  "trust_tier": 1,
  "trust_score": 1.0,
  "safety_critical": true,
  "safety_category": "electrical",
  "verification_status": "editorial_reviewed",
  "last_verified_date": "2026-02-01",
  "verified_by_role": "abyc_certified_electrician",

  // Community signals
  "upvotes": 47,
  "downvotes": 2,
  "times_cited_by_other_articles": 8,
  "contributor_reputation": null,  // editorial

  // Freshness
  "created_date": "2025-11-15",
  "last_modified_date": "2026-02-01",
  "content_age_days": 58,

  // Source citations within the chunk
  "cites_authorities": ["ABYC_E-11", "Nigel_Calder_Boatowners_Mechanical"],
}
```

### Agent Behavior by Trust Tier

Agents should be instructed (via system prompt or retrieval-augmented context) to handle content differently by tier:

**Tier 1 responses:**
> "According to ABYC E-11 standards, wire sizing for a 12V DC circuit drawing 30A over a 20-foot run requires..."

**Tier 2 responses:**
> "Based on the Above Deck knowledge base (community-verified): Solar panel sizing for a 40-foot catamaran typically requires..."

**Tier 3 responses (if included at all):**
> "Note: The following is based on community-contributed content that has not been formally verified. [Content]. For safety-critical decisions, consult a qualified marine electrician."

**Safety-critical with no high-confidence source:**
> "I don't have verified information on this specific topic. For [topic], please consult [relevant authority: your local harbor master / RYA training materials / ABYC standards / a qualified marine electrician]."

The agent should NEVER present unverified content as authoritative for safety-critical topics. It is better to say "I don't know" than to give potentially dangerous advice.

### Periodic RAG Audits

**Contradiction Detection:** Periodically (weekly or at each re-index), run automated checks:
1. For each safety-critical topic cluster, retrieve all chunks and check for contradictory claims
2. Flag contradictions for editorial review
3. Until resolved, the most recently verified chunk takes precedence

**Staleness Detection:**
1. Flag chunks where `last_verified_date` is > 12 months old
2. For safety-critical chunks, flag at > 6 months
3. Stale chunks get reduced trust scores, not removal (the content may still be correct, just unverified)

**Coverage Gaps:**
1. Track which topics agents are asked about but cannot answer (no relevant chunks retrieved)
2. These gaps should feed back into the KB seeding and community contribution priorities

**Feedback Loop:**
1. When users interact with agents, provide thumbs-up/thumbs-down on answers
2. Track which chunks are associated with negative feedback
3. Chunks with high negative feedback rates are flagged for review

### Human-in-the-Loop for Uncertain Answers

For safety-critical queries where the agent's confidence is low (few relevant chunks, low trust scores, contradictory information), the agent should:

1. Provide the best available answer with explicit caveats
2. Log the query and response for human review
3. Optionally: surface the query to a community expert queue ("A user asked about [topic] and I wasn't confident in my answer. Can an expert verify?")
4. After expert verification, the response can be used to seed new KB content (closing the feedback loop)

---

## 7. Seeding Strategy

### The Empty Wiki Problem

Community-curated knowledge bases face a chicken-and-egg problem: contributors don't want to write for an empty wiki, and the wiki stays empty without contributors. Research on forum communities (see existing [community platform patterns research](../ux-and-design/community-platform-patterns.md)) consistently shows that platforms need a critical mass of content before community contributions feel natural.

### Minimum Viable KB: Day-One Content

The KB should launch with editorial content (Tier 1) covering the most common and most safety-critical topics. Based on the existing content in `packages/site/src/content/knowledge/`, the seed content should include:

**Safety-Critical (Must Have, Tier 1):**
1. Understanding 12V electrical systems (already drafted)
2. NMEA 2000 explained (already drafted)
3. AIS explained (already drafted)
4. VHF radio procedures and DSC (not yet drafted)
5. COLREGs overview (not yet drafted)
6. MOB procedures (not yet drafted)
7. Basic fire safety on boats (not yet drafted)
8. LPG safety on boats (not yet drafted)

**High-Value Reference (Should Have, Tier 1):**
1. Tidal prediction basics (already drafted)
2. Understanding electronic charts (already drafted)
3. Weather data sources (already drafted)
4. Passage planning guide (already drafted)
5. Solar sizing guide (already drafted)
6. Choosing a boat computer (already drafted)
7. Marine software landscape (already drafted)

**Community-Friendly Seed Content (Tier 2 starter):**
1. Diesel engine maintenance (already drafted)
2. Safety equipment checklist (already drafted)
3. Provisioning for passages (already drafted)
4. Watermaker basics (already drafted)
5. Caribbean cruising guide (already drafted)

This gives a starting KB of ~20 articles covering the core topics. That is enough to demonstrate the KB's structure, set quality expectations, and give community contributors models to follow.

### Using Existing Open-Source Content

Several sources of open content could accelerate seeding:

| Source | License | Usable? | Notes |
|--------|---------|---------|-------|
| NOAA publications (Coast Pilot, Tide Tables methodology) | Public domain (US gov) | Yes | Excellent for tidal, weather, navigation content |
| ITU Radio Regulations (VHF procedures) | Copyrighted | Summaries only | Can reference but not reproduce |
| OpenCPN documentation | GPL | Yes, with attribution | Navigation software docs |
| SignalK documentation | Apache 2.0 | Yes | NMEA/marine data protocol docs |
| Wikipedia marine articles | CC BY-SA 4.0 | Yes, with attribution and same license | Good starting point, needs marine-specific review |
| RYA training materials | Copyrighted | No | Can reference but not reproduce |
| ABYC standards | Copyrighted | No | Can reference but not reproduce |
| USCG Navigation Rules | Public domain (US gov) | Yes | Full COLREGs text for US waters |

**Key licensing consideration:** If the KB uses CC BY-SA content (from Wikipedia), the KB itself must be CC BY-SA licensed, which is compatible with open source but requires attribution and share-alike for derived works. If the project wants maximum flexibility, avoid CC BY-SA and use only public domain, Apache 2.0, or MIT-licensed sources, plus original content.

### AI-Generated Seed Content

Using Claude to draft initial articles from the project's extensive research documents (30+ research docs totaling ~10,000 lines) is a viable seeding strategy with important guardrails:

1. **Draft only:** AI-generated content should never go directly to Tier 1. It starts as Tier 3 (draft) and is promoted through human review
2. **Research-grounded:** Drafts should be generated from specific research documents and cite their sources, not from the LLM's general knowledge
3. **Human review required:** Every AI-drafted article must be reviewed by a human editor for accuracy, tone, and completeness before promotion to Tier 2 or Tier 1
4. **Disclosure:** AI-drafted articles should disclose their origin (e.g., "Initial draft generated with AI assistance, reviewed and edited by [editor]")
5. **Safety-critical exclusion:** AI should NOT draft safety-critical content. Those articles should be written by qualified humans from the start

### Target: 30-50 Articles Before Community Launch

Based on patterns from successful community wikis, the KB should have 30-50 articles across major categories before opening to community contributions. This provides:
- Enough content that the KB feels useful on its own
- Clear examples of expected quality, structure, and tone
- Coverage of the most common questions (reducing the chance that early community contributions duplicate existing content)
- A functioning search experience (Pagefind needs content to index)

---

## 8. Incentive Design

### What Motivates Marine Community Contributors

The sailing community has specific motivations that differ from general open-source contributors:

**Reciprocity:** Cruisers share knowledge because they have benefited from others' shared knowledge. The "pay it forward" culture is deeply ingrained in long-distance sailing communities. Noonsite, Cruisers Forum, and countless WhatsApp groups thrive on this ethic.

**Expertise recognition:** Experienced sailors value being recognized as knowledgeable. An RYA Yachtmaster who has crossed the Atlantic wants that expertise acknowledged. A marine electrician who has rewired 50 boats wants credit for their knowledge.

**Community identity:** Contributing to a shared resource strengthens membership in the cruising community. This is an intrinsic motivation that no gamification can replicate.

**Practical self-interest:** By contributing knowledge about an anchorage, a contributor improves the resource they themselves will use. ActiveCaptain thrives on this dynamic.

### Recognition Mechanisms

**Contributor profiles:** Each contributor has a profile showing their articles, reviews, reputation score, verified credentials, and contribution history. This is their public record of expertise.

**Attribution on articles:** Every article shows its contributors, not just the original author. "Written by [author]. Reviewed by [reviewer]. Contributions from [list]." This mirrors academic citation culture.

**Domain expert badges:** Verified credentials (Yachtmaster, marine surveyor, ABYC certified) are displayed as badges. These are not gamification; they are trust signals that help readers assess the author's qualifications.

**"Top contributors" recognition:** Monthly or quarterly recognition of most active quality contributors (measured by community upvotes, not volume). Featured on the site.

**Nautical miles of knowledge:** A single vanity metric that estimates the "reach" of a contributor's content (articles * readers). This is optional and should be understated.

### What NOT to Do

**Volume-based gamification:** Points for number of edits, badges for editing streaks, leaderboards ranked by edit count. These incentivize low-quality, high-volume contributions and are the primary failure mode of gamified knowledge bases. Stack Overflow's ["fastest gun in the west"](https://meta.stackexchange.com/questions/9731/fastest-gun-in-the-west-problem) problem is a direct consequence of rewarding speed over quality.

**Monetary rewards:** Paying for contributions creates perverse incentives (gaming the system for pay) and is unsustainable for an open-source project. The marine community contributes out of reciprocity and identity, not money.

**Artificial scarcity:** "Only 5 people can have the Expert badge" or "Limited edition contributor badge." This creates competition rather than collaboration.

**Public shaming:** Never publicly identify low-quality contributors or display rejection rates. Private feedback and mentoring are more effective.

### Existing Marine Community Patterns

**ActiveCaptain model:** Users contribute reviews and updates because they directly benefit from others' contributions. The content is practical and experiential (marina reviews, anchorage reports). This works because the feedback loop is immediate: you contribute a marina review, and the next sailor benefits.

**Cruisers Forum model:** Knowledge sharing through forum posts. The motivation is community membership and reciprocity. The problem is that knowledge is locked in forum threads and is not structured, searchable, or verifiable. A KB that extracts and structures the best forum knowledge would be enormously valuable.

**Noonsite model:** Editorial with community reports. The [Ocean Cruising Club partnership](https://www.noonsite.com/) channels community knowledge through a trusted intermediary. This is a good model for safety-critical content: community reports are filtered through an editorial process.

---

## 9. Comparison: Editorial vs Community vs Hybrid

| Dimension | Pure Editorial | Pure Community | Hybrid (Recommended) |
|-----------|---------------|---------------|---------------------|
| **Content quality** | Consistently high | Variable, from excellent to dangerous | High floor (editorial for critical), diverse (community for practical) |
| **Scalability** | Limited by editor bandwidth | Scales with community size | Scales, with editorial bottleneck only on safety-critical content |
| **Coverage breadth** | Narrow (editors can't know everything) | Broad (collective knowledge) | Broad with quality gradient |
| **Freshness** | Often stale (editor backlog) | Often current (many contributors) | Current for community topics, editorial refresh cycles for critical content |
| **RAG safety** | Highest (all content is verified) | Lowest (unverified content in vector store) | High (tier-based RAG filtering) |
| **Vandalism risk** | None (no public editing) | High | Manageable (tiered permissions, review queues) |
| **Community engagement** | Low (passive consumption) | High (active participation) | High (participation with quality incentives) |
| **Liability** | Clear (editorial responsibility) | Unclear (who is responsible for community advice?) | Clear (tiers + disclaimers + source attribution) |
| **Solo builder feasibility** | Bottleneck on one person | Needs critical mass of contributors | Viable with editorial focus on safety-critical, community for everything else |
| **Examples** | Noonsite, Apple Docs, Stripe Docs | Early Wikipedia, Cruisers Forum | MDN, Stack Overflow, ActiveCaptain, Arch Wiki |

### Why Hybrid is Right for Above Deck

1. **Solo builder reality:** A single editor cannot create and maintain a comprehensive marine KB. Community contributions are not optional; they are necessary for breadth and freshness
2. **Safety-critical domain:** Pure community is unacceptable when wrong content could ground a boat or cause a fire. The editorial layer for safety-critical content is non-negotiable
3. **RAG integration:** The tiered model maps cleanly to RAG confidence scoring. The agent can distinguish between verified and unverified content and adjust its behavior accordingly
4. **Marine community culture:** Sailors already share knowledge freely. The barrier is not motivation but platform and structure. A well-organized KB with clear contribution paths will attract contributors
5. **Open source values:** Community curation aligns with the project's open-source identity. Editorial-only feels closed; community-only feels reckless. Hybrid feels trustworthy

---

## 10. Recommendation for Above Deck

### Architecture Summary

```
                    ┌──────────────────────────────────────────────┐
                    │              KB Content Pipeline              │
                    └──────────────────────────────────────────────┘

  ┌─────────────┐     ┌───────────────┐     ┌──────────────────┐
  │  Community   │────▶│  Auto Quality  │────▶│   Review Queue   │
  │ Submission   │     │   Checks       │     │  (Tier 3 Draft)  │
  └─────────────┘     └───────────────┘     └──────────────────┘
                                                      │
                            ┌─────────────────────────┼──────────────────┐
                            ▼                         ▼                  ▼
                    ┌──────────────┐         ┌──────────────┐   ┌──────────────┐
                    │  Peer Review  │         │Expert Review  │   │ AI-Assisted  │
                    │ (non-safety)  │         │(safety-crit)  │   │   Review     │
                    └──────────────┘         └──────────────┘   └──────────────┘
                            │                         │
                            ▼                         ▼
                    ┌──────────────┐         ┌──────────────┐
                    │   Tier 2     │         │   Tier 1     │
                    │  Published   │         │  Published   │
                    └──────────────┘         └──────────────┘
                            │                         │
                            ▼                         ▼
                    ┌──────────────────────────────────────────┐
                    │         Vector Store (RAG Index)          │
                    │  Chunks with trust metadata per tier      │
                    └──────────────────────────────────────────┘
                                        │
                                        ▼
                    ┌──────────────────────────────────────────┐
                    │            AI Agents (6 crew)            │
                    │  Trust-aware retrieval + generation       │
                    │  Safety disclaimers for unverified content│
                    └──────────────────────────────────────────┘
```

### Implementation Phases

**Phase 1: Editorial Foundation (Months 1-2)**
- Publish 30-50 seed articles as Tier 1 editorial content in MDX
- All safety-critical topics covered editorially
- Deploy Pagefind for search
- Index Tier 1 content into vector store with trust metadata
- AI agents retrieve from Tier 1 only
- No community contributions yet

**Phase 2: Community Contributions (Months 3-4)**
- Open KB to community contributions via GitHub PRs (MDX in repo)
- Implement automated quality checks (CI pipeline on PRs)
- Implement Tier 3 (draft) and Tier 2 (verified) workflow
- Add community voting (upvotes) on articles
- Begin indexing Tier 2 content into RAG with appropriate metadata
- Recruit 3-5 domain experts as volunteer reviewers for safety-critical content

**Phase 3: Scaled Community (Months 5-6)**
- Build web-based editor for non-Git contributors (lower friction)
- Implement reputation system
- Deploy AI-assisted moderation (Claude reviews submissions)
- Implement contradiction detection in RAG index
- Add agent feedback loop (user ratings feed back to content quality scores)
- Begin RAG audits (staleness, coverage gaps, contradictions)

### Key Design Decisions

1. **Content format:** MDX in the Git repository. This gives version control, audit trail, PR-based review, and CI checks for free. The web-based editor in Phase 3 generates MDX commits behind the scenes.

2. **RAG indexing trigger:** Re-index on every merge to main. Only Tier 1 and Tier 2 content is indexed. Tier 3 (draft) content is excluded from RAG until promoted.

3. **Safety-critical default:** New articles are NOT safety-critical by default. Safety-critical tagging is a deliberate editorial decision. But automated detection should flag articles that touch safety-related keywords for editorial classification.

4. **Agent refusal:** Agents must be able to say "I don't have verified information on this topic" rather than extrapolating from low-confidence content. This is a system prompt instruction, not a content issue.

5. **License:** CC BY-SA 4.0 for all KB content. This is compatible with Wikipedia content re-use, encourages sharing, and requires attribution. Contributors agree to this license on submission.

6. **Liability disclaimer:** The KB and agents should display a standing disclaimer: "This content is for informational purposes only. It is not a substitute for proper training, official publications, or professional advice. Always verify safety-critical information against official sources."

### Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Community never materializes (empty wiki) | Medium | High | Extensive seed content, warm-start with existing sailing community contacts |
| Poisoned content enters RAG | Low | Critical | Tier-based RAG filtering, safety-critical content excluded from community RAG, trust metadata |
| Expert reviewer burnout | Medium | High | Keep expert review scope narrow (safety-critical only), recognize reviewers publicly, rotate review load |
| AI agent gives dangerous advice | Low | Critical | Trust-aware prompting, safety disclaimers, refusal for low-confidence safety topics, human feedback loop |
| Content quality degrades over time | Medium | Medium | Staleness detection, periodic audits, community voting surfaces quality issues |
| Vandalism | Low (niche community) | Medium | Automated detection, rollback capability, new-user moderation |
| Legal liability for incorrect advice | Low | High | Standing disclaimers, source attribution, safety-critical expert review, community vs editorial distinction |

### Success Metrics

- **Content volume:** 100+ articles within 6 months (30-50 editorial + community contributions)
- **Content quality:** >80% of Tier 2 articles promoted without major revisions
- **Community engagement:** 10+ active contributors within 6 months
- **RAG accuracy:** <5% negative feedback rate on agent answers sourced from KB
- **Safety coverage:** 100% of safety-critical topics covered by Tier 1 editorial content
- **Review latency:** Safety-critical review queue < 7 days average

---

## Sources

### RAG Security and Poisoning
- [PoisonedRAG: Knowledge Corruption Attacks (USENIX Security 2025)](https://arxiv.org/abs/2402.07867)
- [Lakera: Introduction to Data Poisoning (2026)](https://www.lakera.ai/blog/training-data-poisoning)
- [Exploring Knowledge Poisoning Attacks to RAG](https://www.sciencedirect.com/science/article/abs/pii/S1566253525009625)
- [RAG Security: Formalizing the Threat Model](https://arxiv.org/pdf/2509.20324)
- [Medical LLMs Vulnerable to Data-Poisoning (Nature Medicine)](https://www.nature.com/articles/s41591-024-03445-1)
- [Understanding Data Poisoning Attacks for RAG (OpenReview)](https://openreview.net/forum?id=2aL6gcFX7q)

### RAG Evaluation and Quality
- [Evidently AI: Complete Guide to RAG Evaluation](https://www.evidentlyai.com/llm-guide/rag-evaluation)
- [Metadata-Driven RAG for Financial QA](https://arxiv.org/html/2510.24402v1)
- [RAG Evaluation Metrics (Confident AI)](https://www.confident-ai.com/blog/rag-evaluation-metrics-answer-relevancy-faithfulness-and-more)
- [RAG Survey (Gao et al.)](https://arxiv.org/pdf/2312.10997)

### Medical RAG Safety
- [RAG in Healthcare: Comprehensive Review (MDPI)](https://www.mdpi.com/2673-2688/6/9/226)
- [Enhancing Medical AI with RAG (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12059965/)
- [RAG in Clinical AI: Safe Deployment (iatroX)](https://www.iatrox.com/blog/rag-in-healthcare-benefits-evidence-safe-deployment-guide)

### Community KB Models
- [Wikipedia: Content Assessment](https://en.wikipedia.org/wiki/Wikipedia:Content_assessment)
- [Wikipedia: Featured Article Criteria](https://en.wikipedia.org/wiki/Wikipedia:Featured_article_criteria)
- [Wikipedia: Vandalism Detection Tools](https://en.wikipedia.org/wiki/Wikipedia:Cleaning_up_vandalism/Tools)
- [Stack Overflow: A Theory of Moderation](https://stackoverflow.blog/2009/05/18/a-theory-of-moderation/)
- [Stack Overflow: Quality Through Community Control (Harvard)](https://d3.harvard.edu/platform-digit/submission/stack-overflow-quality-through-community-control/)
- [MDN: Pull Request Submission and Reviews](https://developer.mozilla.org/en-US/docs/MDN/Community/Pull_requests)
- [MDN: Editorial Strategy and Community Participation](https://hacks.mozilla.org/2020/10/mdn-web-docs-editorial-strategy-and-community-participation/)
- [ArchWiki: Contributing Guidelines](https://wiki.archlinux.org/title/ArchWiki:Contributing)
- [Arch Shares Wiki Strategy with Debian (LWN)](https://lwn.net/SubscriberLink/1032604/73596e0c3ed1945a/)

### Vandalism Detection
- [Attention-Based Vandalism Detection in OSM (ACM 2022)](https://dl.acm.org/doi/10.1145/3485447.3512224)
- [Vandalism Detection via User Embeddings (ACM 2021)](https://dl.acm.org/doi/10.1145/3459637.3482213)
- [Wikipedia Vandalism Detection: NL, Metadata, Reputation Features](https://www.researchgate.net/publication/51527727_Wikipedia_Vandalism_Detection_Combining_Natural_Language_Metadata_and_Reputation_Features)
- [Automated Quality Assessment of Wikipedia Articles (ACM Computing Surveys)](https://dl.acm.org/doi/10.1145/3625286)

### Marine Community Knowledge
- [ActiveCaptain Community (Garmin)](https://activecaptain.garmin.com/)
- [ActiveCaptain Review (Panbo)](https://panbo.com/garmins-new-activecaptain-community-site-whats-good-and-whats-not/)
- [Noonsite: The Ultimate Cruisers' Planning Tool](https://www.noonsite.com/)
- [Cruisers Forum](https://www.cruisersforum.com/)
- [CruisersWiki](https://www.cruiserswiki.org/)

### Open Source Community Engagement
- [Community Engagement Strategies in Open Source (DEV Community)](https://dev.to/vitalisorenko/community-engagement-strategies-in-open-source-projects-a-comprehensive-guide-2m83)
- [Better Keep the Twenty Dollars: Incentivizing (HBS Working Paper)](https://www.hbs.edu/ris/download.aspx?name=24-014.pdf)
- [Encouraging Contributions to Open Source Documentation (GitBook)](https://gitbook.com/docs/guides/docs-best-practices/how-to-encourage-contributions-to-your-open-source-documentation)
