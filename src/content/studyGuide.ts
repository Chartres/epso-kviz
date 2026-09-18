// Linear study guide for the EPSO/AD/430/26 Field 1 (AI) field-related MCQ.
// Synthesised from primary sources: Reg. (EU) 2024/1689 (AI Act) as amended by
// Reg. (EU) 2026/1744 (Digital Omnibus on AI), the Notice of Competition Annex II
// (OJ C/2026/4668), Commission policy documents, and standard ML engineering
// practice. Legal texts are public documents; binding wording is always in the
// regulations themselves. State of play: September 2026.

export interface LessonSource {
  label: string
  url: string
}
export interface Figure {
  img: string
  caption: string
}
export interface Lesson {
  id: string
  title: string
  html: string
  source: LessonSource
  figures?: Figure[]
}

const AI_ACT: LessonSource = {
  label: 'Regulation (EU) 2024/1689 (AI Act), consolidated',
  url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
}
const NOTICE: LessonSource = {
  label: 'Notice of Competition EPSO/AD/430/26 (OJ C/2026/4668)',
  url: 'https://eur-lex.europa.eu/eli/C/2026/4668/oj',
}
const AI_OFFICE: LessonSource = {
  label: 'European AI Office — Commission digital strategy',
  url: 'https://digital-strategy.ec.europa.eu/en/policies/ai-office',
}
const DIGITAL_STRATEGY: LessonSource = {
  label: 'EU digital strategy — shaping Europe’s digital future',
  url: 'https://digital-strategy.ec.europa.eu/en',
}

export const LESSONS: Lesson[] = [
  {
    id: 'exam',
    title: '1 · The exam itself — what you are training for',
    source: NOTICE,
    html: `
<p>The field-related MCQ is <strong>30 questions in 40 minutes, in English, scored 0–30</strong>. Pass mark 15/30 — but passing is not the point: it is the <strong>only test that ranks you</strong>. Reasoning tests (in Slovak) and the EU essay are pass/fail gates. Eligibility files are checked only for roughly the top <strong>1.5 × 240 ≈ 360</strong> candidates in Field 1, in descending MCQ order.</p>
<ul>
<li><strong>~80 seconds per question.</strong> Train elimination speed, not just knowledge: two options are usually clearly wrong; the last two differ on one precise fact.</li>
<li><strong>The syllabus is Annex II</strong> of the notice — three duty categories: (1) engineering end-to-end AI solutions, (2) compliant and defensible AI use (the AI Act by name), (3) AI policy. This trainer's three categories mirror them.</li>
<li>Questions in specialist competitions mix <strong>factual recall with short scenarios</strong> ("a deployer notices…", "a provider must…"). Distractors are plausible-but-subtly-wrong, not obscure.</li>
<li><strong>No negative marking</strong> — never leave a blank. No appeal on results; only a faulty-question complaint within 3 days of sitting.</li>
<li>Remote proctored: run the system check ≥48 h ahead, quiet room, report any incident <em>in the proctor chat</em> — complaints routed elsewhere are refused.</li>
</ul>
<p><strong>Daily routine (10–15 min):</strong> read one lesson (3–4 min), then one 12-question daily drill. Twice a week, replace the drill with a timed 30-question mock. Reasoning practice in Slovak (EU Training) is separate — light, but do not arrive cold.</p>`,
  },
  {
    id: 'act-basics',
    title: '2 · AI Act — identity card and the risk pyramid',
    source: AI_ACT,
    html: `
<p><strong>Regulation (EU) 2024/1689</strong>, adopted 13 Jun 2024, in force <strong>1 Aug 2024</strong>. Legal basis Art 114 TFEU (+ Art 16 for biometrics): it is <strong>risk-based product regulation</strong>, not a rights charter. The Art 3(1) definition of "AI system" (machine-based, varying autonomy, may adapt, <em>infers</em> from input how to generate outputs influencing environments) is aligned with the <strong>OECD</strong> definition.</p>
<ul>
<li><strong>Extraterritorial:</strong> covers providers placing systems on the EU market wherever established, and cases where the system's <strong>output is used in the EU</strong> (Art 2).</li>
<li><strong>Excluded:</strong> military/defence/national security, pure scientific R&D, personal non-professional use.</li>
</ul>
<p><strong>The pyramid:</strong></p>
<ul>
<li><strong>Unacceptable</strong> → banned (Art 5): social scoring, workplace emotion recognition…</li>
<li><strong>High-risk</strong> → allowed under Arts 8–15 + conformity assessment: CV screening, credit scoring, exam proctoring, border-control risk tools.</li>
<li><strong>Transparency</strong> (Art 50): chatbots disclose, synthetic content machine-readably marked, deepfakes labelled.</li>
<li><strong>Minimal</strong> → no obligations, voluntary codes (Art 95): spam filters, game AI.</li>
</ul>
<p><strong>GPAI models are a parallel track</strong> (Chapter V), not a tier: the model carries its own duties; a system built on it gets its own tier. Keep "model vs system" straight — it is a favourite trap.</p>`,
  },
  {
    id: 'prohibited',
    title: '3 · Prohibited practices — the list of eight (plus one)',
    source: AI_ACT,
    html: `
<p>Art 5, applicable since <strong>2 Feb 2025</strong> (with Art 4 AI literacy — rewritten by the Omnibus as an obligation of effort: take measures supporting AI literacy, no guaranteed level). Memorise as a list:</p>
<ol>
<li><strong>(a) Subliminal / manipulative techniques</strong> materially distorting behaviour, causing significant harm.</li>
<li><strong>(b) Exploiting vulnerabilities</strong> (age, disability, social/economic situation).</li>
<li><strong>(c) Social scoring</strong> → unjustified/disproportionate or context-unrelated detrimental treatment — public <em>and</em> private actors.</li>
<li><strong>(d) Predicting individual crime risk solely from profiling/personality traits</strong> (supporting a human assessment based on objective facts stays legal).</li>
<li><strong>(e) Untargeted scraping of facial images</strong> (internet/CCTV) for face-recognition databases.</li>
<li><strong>(f) Emotion recognition in workplaces and education</strong> (medical/safety excepted).</li>
<li><strong>(g) Biometric categorisation inferring sensitive attributes</strong> (race, religion, orientation…).</li>
<li><strong>(h) Real-time remote biometric identification (RBI) in public spaces for law enforcement</strong> — three narrow exceptions (victims/missing persons; specific imminent threat incl. terrorism; suspects of serious offences), each needing <strong>prior judicial or independent administrative authorisation</strong>.</li>
<li><strong>Omnibus 2026 addition:</strong> systems for generating <strong>non-consensual intimate imagery / CSAM</strong> — transition until 2 Dec 2026.</li>
</ol>
<p><strong>Traps:</strong> <em>post</em> (retrospective) RBI is high-risk, not banned. Emotion recognition outside work/education is high-risk + disclosure, not banned. Penalty for Art 5 breaches: <strong>€35 m / 7 %</strong> — the top bracket.</p>`,
  },
  {
    id: 'high-risk',
    title: '4 · High-risk systems — classification and duties',
    source: AI_ACT,
    html: `
<p><strong>Two routes in (Art 6):</strong> (1) safety component of an Annex I regulated product (machinery, toys, medical devices, vehicles); (2) stand-alone system in an <strong>Annex III</strong> area. The <strong>Art 6(3) filter</strong> exempts narrow procedural/preparatory tasks — but <strong>profiling of natural persons is always high-risk</strong>, and the filter claim must be documented and registered.</p>
<p><strong>Annex III — eight areas:</strong> biometrics · critical infrastructure · education · employment · essential services (benefits, <strong>credit scoring</strong>, life/health insurance pricing, emergency dispatch) · law enforcement · migration/asylum/border · justice & democratic processes.</p>
<p><strong>System requirements (Arts 8–15):</strong> risk management (9) · <strong>data governance</strong> (10). Sensitive data for bias detection and correction now sits in <strong>Art 4a</strong> — the Omnibus deleted Art 10(5) and widened the gateway to providers and deployers, under strict-necessity safeguards · technical documentation (11) · logging (12) · transparency to deployers (13) · <strong>human oversight</strong> (14; biometric ID needs two-person verification) · accuracy, robustness, <strong>cybersecurity</strong> incl. resistance to data poisoning and adversarial examples (15).</p>
<p><strong>Provider path to market:</strong> conformity assessment (Art 43, default <strong>internal control</strong>; notified body only for biometrics without harmonised standards) → EU declaration of conformity (47) → <strong>CE marking</strong> (48) → registration in the EU database (49/71). Harmonised standards give <strong>presumption of conformity</strong> (40). Keep documentation <strong>10 years</strong>; report serious incidents within <strong>15 days</strong> (2 days for critical infrastructure).</p>
<p><strong>Deployers (Art 26):</strong> follow instructions, competent human oversight, monitor and suspend on risk, keep logs <strong>≥6 months</strong>, inform workers, verify registration (public bodies). <strong>Art 27 FRIA</strong> before first use — public bodies, private providers of public services, credit/insurance-pricing deployers; may build on a GDPR DPIA. <strong>Art 86:</strong> affected persons get an explanation of the AI's role in decisions. <strong>Art 25:</strong> rebrand, substantially modify, or repurpose a system → you <em>become</em> the provider.</p>`,
  },
  {
    id: 'gpai',
    title: '5 · GPAI models — Chapter V',
    source: AI_ACT,
    html: `
<p>Applicable since <strong>2 Aug 2025</strong>; enforced <strong>exclusively by the Commission's AI Office</strong> (fines €15 m / 3 %). Definition (Art 3(63)): trained at scale, <strong>significant generality</strong>, wide task competence, integrable downstream.</p>
<ul>
<li><strong>All providers (Art 53):</strong> technical documentation (Annex XI) · info to downstream providers (Annex XII) · <strong>copyright policy</strong> respecting the DSM Directive Art 4(3) TDM opt-out · <strong>public "sufficiently detailed summary" of training content</strong> (AI Office template, Jul 2025).</li>
<li><strong>Open-source exemption:</strong> free, open-licence models with public weights skip the two documentation duties — <strong>never</strong> the copyright policy or training summary, and the exemption dies at systemic-risk scale.</li>
<li><strong>Systemic risk (Art 51):</strong> presumed above <strong>10<sup>25</sup> FLOPs</strong> cumulative training compute, or by Commission designation (scientific-panel alerts). Notify the Commission <strong>within 2 weeks</strong> (Art 52).</li>
<li><strong>Extra duties (Art 55):</strong> state-of-the-art evaluations incl. <strong>adversarial testing/red-teaming</strong> · systemic-risk mitigation · serious-incident reporting to the AI Office · <strong>cybersecurity</strong> of model and infrastructure.</li>
<li><strong>GPAI Code of Practice</strong> (10 Jul 2025; chapters <strong>Transparency, Copyright, Safety & Security</strong>): voluntary; confirmed by Commission and Member States as an adequate compliance vehicle. Some major providers signed; Meta notably declined. Full Commission enforcement powers apply from <strong>2 Aug 2026</strong>.</li>
<li>Legacy models (on market before 2 Aug 2025): comply by <strong>2 Aug 2027</strong>.</li>
</ul>`,
  },
  {
    id: 'governance-bodies',
    title: '6 · Governance bodies, penalties, timeline',
    source: AI_OFFICE,
    html: `
<p><strong>Who does what:</strong></p>
<ul>
<li><strong>AI Office</strong> (in DG CNECT; six units since the 2025/26 reorganisation, spanning regulation and compliance, AI safety, excellence in AI and robotics, innovation and policy coordination, AI for societal good, and AI in health and life sciences) — GPAI enforcement, codes of practice, Union expertise.</li>
<li><strong>European AI Board</strong> (Art 65) — one representative per Member State; coordinates national implementation.</li>
<li><strong>Advisory Forum</strong> (Art 67) — stakeholders. <strong>Scientific Panel</strong> (Art 68; established 1 Jun 2026, up to 60 experts) — supports the AI Office, issues <strong>qualified alerts</strong> on GPAI systemic risk.</li>
<li><strong>National authorities</strong> (Art 70): ≥1 notifying authority + ≥1 market surveillance authority per Member State (deadline 2 Aug 2025 — widely missed). Market surveillance runs under Reg. 2019/1020. <strong>EDPS</strong> supervises (and fines) EU institutions themselves.</li>
</ul>
<p><strong>Penalties (Art 99):</strong> prohibited practices <strong>€35 m/7 %</strong> · most operator duties <strong>€15 m/3 %</strong> · misleading info to authorities <strong>€7.5 m/1 %</strong> · SMEs (and now small mid-caps): the <em>lower</em> amount applies · GPAI (Art 101, Commission) €15 m/3 % · EU institutions (Art 100, EDPS) up to €1.5 m.</p>
<p><strong>Timeline after the Digital Omnibus (Reg. (EU) 2026/1744, in force 27 Jul 2026):</strong></p>
<ul>
<li>2 Feb 2025 — prohibitions + AI literacy ✓</li>
<li>2 Aug 2025 — GPAI, governance, penalties ✓</li>
<li>2 Aug 2026 — Art 50 transparency ✓ (pre-existing generative systems: marking grace to 2 Dec 2026); Commission enforcement powers over GPAI ✓</li>
<li>2 Dec 2026 — new Art 5 prohibitions on NCII/CSAM generation</li>
<li><strong>2 Aug 2027 — national sandboxes</strong> (moved from Aug 2026) plus a Union-level sandbox at the AI Office; legacy GPAI models</li>
<li><strong>2 Dec 2027 — Annex III stand-alone high-risk</strong> (deferred from Aug 2026)</li>
<li><strong>2 Aug 2028 — Annex I embedded high-risk</strong>; public-authority legacy high-risk by 2030.</li>
</ul>
<p><strong>Top trap:</strong> pre-Omnibus material says high-risk applies from Aug 2026 — outdated. Transparency stayed on schedule; high-risk moved.</p>`,
  },
  {
    id: 'interplay',
    title: '7 · Interplay — AI Act next to the rest of EU law',
    source: AI_ACT,
    html: `
<p>One-liners that decide close MCQ options:</p>
<ul>
<li><strong>GDPR:</strong> applies in parallel wherever personal data flows; AI Act = product safety, GDPR = lawfulness of processing. Art 22 GDPR restricts solely-automated significant decisions; FRIA may build on a DPIA; Art 4a AI Act (ex Art 10(5)) opens a narrow gate for sensitive data in bias detection and correction. <strong>EU institutions are not under the GDPR</strong> but under Reg. (EU) 2018/1725, supervised by the EDPS. EDPB Opinion 28/2024: a model is anonymous only on a case-by-case showing that extraction is not reasonably likely; legitimate interest for training turns on reasonable expectations and mitigations. Calling a US-hosted model API with personal data is a Chapter V transfer.</li>
<li><strong>DSA:</strong> platforms and intermediaries (VLOPs >45 m EU users: systemic-risk duties, audits; ChatGPT designated a VLOSE). AI Act regulates the system itself regardless of platform.</li>
<li><strong>DMA:</strong> ex-ante conduct rules for seven designated <strong>gatekeepers</strong> (Alphabet, Amazon, Apple, Booking.com, ByteDance, Meta, Microsoft); reaches AI features embedded in core platform services.</li>
<li><strong>NIS2</strong> (directive; transposition due 17 Oct 2024 — CJEU referrals of several Member States in Jul 2026): <em>organisation-level</em> cybersecurity for essential/important entities. AI Act Art 15 is <em>product-level</em>. <strong>CRA</strong> (fully applicable 11 Dec 2027): products with digital elements; supports Art 15 conformity.</li>
<li><strong>Copyright:</strong> no AI-copyright regulation exists — the DSM Directive's TDM exception + opt-out (Arts 3–4) carries training legality; Art 53 adds policy + training-content summary.</li>
<li><strong>Liability:</strong> new <strong>Product Liability Directive (2024)</strong> treats software/AI as a product (strict liability); the AI Liability Directive proposal was <strong>withdrawn</strong> (announced Feb 2025, formally completed in the OJ 6 Oct 2025).</li>
<li><strong>Data Act</strong> (applicable 12 Sep 2025): connected-product data access, cloud switching. <strong>DGA:</strong> public-sector data re-use, data intermediaries, data altruism. <strong>EHDS</strong> (Reg. 2025/327): first sectoral data space, phased to ~2029/2031.</li>
<li><strong>Council of Europe Framework Convention on AI:</strong> international human-rights treaty (signed by the EU, US and UK; approved by the EU in 2026; not yet in force — five ratifications incl. three CoE states needed) — principles, not product rules; binds only Parties that ratified.</li>
</ul>`,
  },
  {
    id: 'mlops',
    title: '8 · MLOps — the production lifecycle',
    source: NOTICE,
    html: `
<p>Annex II category 1 is your day job, but the exam wants it <em>exam-shaped</em> — precise vocabulary:</p>
<ul>
<li><strong>Lifecycle:</strong> data → features → training → validation → deployment → monitoring → retraining. ML CI/CD versions <strong>code + data + models</strong>, with validation gates and controlled promotion (registry stages).</li>
<li><strong>Feature store:</strong> one feature definition served identically offline and online → kills <strong>training-serving skew</strong> (differing preprocessing between training and inference).</li>
<li><strong>Drift:</strong> <em>data drift</em> = P(X) changes; <em>concept drift</em> = P(y|X) changes. Monitoring + automated retraining triggers, gated by golden-set validation before promotion.</li>
<li><strong>Rollout patterns:</strong> <em>shadow</em> (challenger sees traffic, output unserved) → <em>canary</em> (small share) → <em>A/B</em> (measured comparison) → full. Blue-green = instant switch with standby.</li>
<li><strong>Data readiness:</strong> quality dimensions (accuracy, completeness, consistency, timeliness, validity, uniqueness) · <strong>lineage</strong> (source→transform→consumption traceability) · orchestrated pipelines (DAGs, retries, backfills — tasks must be <strong>idempotent</strong>) · ELT loads raw first, transforms in-platform.</li>
<li><strong>Architectures:</strong> lakehouse = lake storage + warehouse ACID/schema. Data mesh = domain-owned data products + federated governance.</li>
<li><strong>Cost/latency levers:</strong> quantisation (precision↓ → memory/cost↓), distillation (teacher→student), KV cache, semantic + prompt caching, and <strong>model routing/cascades</strong> (small model default, big model for hard cases).</li>
<li><strong>Metrics:</strong> accuracy misleads under class imbalance — precision (of predicted positives, how many real) vs recall (of real positives, how many found), tuned by threshold; PR-AUC for rare positives.</li>
<li><strong>Build vs buy:</strong> buy commodity, build what differentiates on proprietary data/integration; weigh TCO, lock-in, time-to-value.</li>
</ul>`,
  },
  {
    id: 'genai',
    title: '9 · GenAI architectures — RAG, agents, MCP',
    source: NOTICE,
    html: `
<p>Annex II names "generative AI models, APIs, cloud, AI interoperability, <strong>RAG, MCP, agentic AI</strong>" explicitly.</p>
<ul>
<li><strong>LLM training recipe:</strong> self-supervised <em>pre-training</em> (capability) → <em>instruction tuning</em> (following tasks) → <em>preference alignment</em> (RLHF/DPO). Transformer core = parallel <strong>self-attention</strong>. <strong>PEFT/LoRA</strong> trains small adapters on a frozen base.</li>
<li><strong>RAG:</strong> retrieve at query time, generate grounded in retrieved context — fresh, auditable knowledge without retraining. Pipeline: chunking (small = precise but context-poor; large = the reverse) → embeddings → <strong>ANN vector search</strong> (HNSW-style) → optional <strong>hybrid</strong> (dense + BM25, rank fusion) → <strong>cross-encoder reranking</strong> of top candidates.</li>
<li><strong>Evaluate stages separately:</strong> retrieval (context recall/precision) vs generation (faithfulness/groundedness). Hallucination = fluent, unsupported output; mitigate with grounding, citations, abstention paths — never "eliminated".</li>
<li><strong>Fine-tune vs RAG:</strong> fine-tune for style/format/task behaviour; RAG for volatile or auditable facts.</li>
<li><strong>Agents:</strong> loop of plan → tool call → observe → next step. <strong>Function calling</strong>: the model emits structured intent; the application executes — validation and authorisation live at that boundary. <strong>MCP</strong> standardises how AI applications connect to tools and data sources (interoperable clients/servers).</li>
<li><strong>Agent risk management:</strong> tiered autonomy — autonomous for low-risk reversible steps, <strong>human approval gates for consequential/irreversible actions</strong> (this is what AI Act Art 14 oversight means operationally), least-privilege tools, isolation of untrusted content.</li>
</ul>`,
  },
  {
    id: 'eval-security',
    title: '10 · Evaluation, safety and AI security',
    source: NOTICE,
    html: `
<p>Annex II category 2 includes "tools, methodologies and <strong>benchmarks for evaluating model capabilities and risks</strong>" — plus trustworthiness vocabulary.</p>
<ul>
<li><strong>Golden sets:</strong> fixed inputs + reference outputs; every prompt/model/retrieval change regression-tests against them. <strong>LLM-as-judge:</strong> scalable scoring, but calibrate against humans — known position, verbosity and self-preference biases.</li>
<li><strong>Benchmarks:</strong> public leaderboards suffer <strong>contamination</strong> (test data in training) and domain mismatch — select models on <em>your</em> held-out task eval, weighing quality vs latency vs cost.</li>
<li><strong>Red-teaming:</strong> adversarial probing for unsafe behaviour, pre- and post-deployment; mandatory flavour for systemic-risk GPAI (Art 55). <strong>Guardrails:</strong> input/output controls around the model (filters, schema validation, PII redaction) — defence-in-depth, independent of model alignment.</li>
<li><strong>Attack taxonomy:</strong> <em>prompt injection</em> (direct or indirect via retrieved content — OWASP LLM #1; mitigate by privilege separation and treating retrieved text as data) · <em>data/model poisoning</em> (Art 15 names it) · <em>evasion/adversarial examples</em> · <em>membership inference</em> and <em>model extraction</em> (model-level) · <strong>supply chain:</strong> malicious pre-trained models, unsafe serialisation (pickle) — use safe formats, signing, provenance.</li>
<li><strong>Privacy tech:</strong> differential privacy = provable per-record bounds via calibrated noise (de-identification is not that). Federated learning = updates move, raw data stays local.</li>
<li><strong>Explainability:</strong> SHAP/LIME = post-hoc feature attribution. Model cards / datasheets = the transparency documentation the AI Act's Annex IV/XI builds on.</li>
<li><strong>Fairness:</strong> demographic parity, equalised odds — mutually incompatible in general; the duty is a documented, context-justified choice, and the law names no metric.</li>
</ul>`,
  },
  {
    id: 'policy-map',
    title: '11 · The EU digital acquis — one map',
    source: DIGITAL_STRATEGY,
    html: `
<p>Category 3 is the thin one for most engineers — this map is the highest-yield page in the guide.</p>
<ul>
<li><strong>AI Act</strong> — AI systems + GPAI models (product regulation).</li>
<li><strong>GDPR</strong> — personal data, horizontal.</li>
<li><strong>DSA</strong> — platform duties, moderation, VLOP systemic risk (45 m users).</li>
<li><strong>DMA</strong> — gatekeeper contestability (7 gatekeepers).</li>
<li><strong>Data Act</strong> (12 Sep 2025) — connected-product data access, B2B sharing terms, cloud switching.</li>
<li><strong>DGA</strong> — public-sector data re-use, notified data intermediaries, data altruism → trust layer for <strong>common European data spaces</strong> (EHDS first in law).</li>
<li><strong>NIS2</strong> (directive) — organisational cybersecurity, essential/important entities. <strong>CRA</strong> — product cybersecurity, CE-marked, fully applicable 11 Dec 2027. <strong>Cybersecurity Act</strong> — ENISA mandate + certification schemes.</li>
<li><strong>eIDAS 2.0</strong> — European Digital Identity Wallet in every Member State. <strong>Interoperable Europe Act</strong> — public-sector interoperability.</li>
<li><strong>Digital Decade 2030 targets:</strong> 20 m ICT specialists · 80 % adults with basic digital skills · <strong>75 % of companies using cloud/AI/big data</strong> · gigabit for all · 100 % key public services online.</li>
</ul>
<p><strong>Institutional mechanics:</strong> regulations apply directly; directives need transposition (hence NIS2 infringements, while "AI Act transposition" is a trap). Ordinary legislative procedure: Commission proposes, Parliament + Council co-legislate. Annex III evolves by <strong>delegated acts</strong> (Art 7).</p>`,
  },
  {
    id: 'ai-strategy',
    title: '12 · EU AI strategy — compute, adoption, money',
    source: DIGITAL_STRATEGY,
    html: `
<p>The 2025–26 strategy stack, newest first — freshness here separates you from stale prep books:</p>
<ul>
<li><strong>AI Continent Action Plan</strong> (9 Apr 2025): compute (AI Factories → Gigafactories), data, skills, adoption, simplification.</li>
<li><strong>AI Factories:</strong> 19 AI-optimised EuroHPC supercomputing hubs across 16 Member States, plus 13 AI Factory Antennas, with services for startups/SMEs/science. <strong>AI Gigafactories:</strong> sites several times larger than today's best AI Factory, for frontier-scale training (InvestAI spoke of ~100,000 advanced chips); EuroHPC JU mandate extended by Council Reg. (EU) 2026/150, official call <strong>30 Jul 2026</strong>.</li>
<li><strong>InvestAI:</strong> mobilise <strong>€200 bn</strong> total, incl. a <strong>€20 bn</strong> public-private gigafactory fund (announced at the Feb 2025 Paris AI Action Summit).</li>
<li><strong>Apply AI Strategy</strong> (COM(2025) 723, 8 Oct 2025): sectoral + public-sector adoption, "AI first" push, ~<strong>€1 bn</strong> mobilised. Sister <strong>AI in Science strategy</strong>: <strong>RAISE</strong> pilot — virtual European institute pooling compute/data/talent for AI in research.</li>
<li><strong>Funding instruments:</strong> Digital Europe Programme (deployment: testing facilities, EDIHs, skills, data spaces) · Horizon Europe (research) · <strong>EDIHs</strong> = ~150 one-stop shops for SME/public-sector adoption. <strong>Chips Act:</strong> 20 % global semiconductor share ambition by 2030.</li>
<li><strong>Coordinated Plan on AI</strong> (2018, rev. 2021): Commission–Member State alignment, €20 bn/yr investment ambition; most Member States have national AI strategies.</li>
<li><strong>International:</strong> AI Office represents the EU in the safety-institute network; G7 Hiroshima Process code of conduct; OECD hosts the shared definitions. The EU's distinctiveness: <strong>binding</strong> GPAI-model rules where most other regimes still rely mainly on voluntary commitments — the US has no cross-cutting federal statute (executive orders; state laws such as California SB 53), the UK no AI Act, while China binds generative-AI <em>services</em> through departmental measures ("Brussels effect").</li>
<li><strong>The 2026 policy narrative:</strong> simplification (Omnibus deferrals, SME/small-mid-cap relief) as the answer to competitiveness critique (Draghi report) — prohibitions and transparency untouched. Frame essay answers with the twin transition (digital + green) and digital sovereignty (reduce chip/cloud/model dependencies while staying open).</li>
</ul>`,
  },
]
