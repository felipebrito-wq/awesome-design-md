# Validation: red team R (recommendations R1–R8)

Validator: R (red team, logic and recommendations) · Date: 2026-10-11 · Input: `plan-room.html` R00 (G-0, A-3, A-4, P-1 to P-5), `claims.md` §R.
Stance: a skeptical construction-tech COO of a small Florida custom homebuilder (~100 houses on the books [INF], one superintendent per several jobs, BT already paid for).

Verdict scale for this file, as the brief asked: **HOLDS** / **MODIFY** (with the change) / **DROP**. Mapping to the README scale: HOLDS ≈ CONFIRMED, MODIFY ≈ CORRECTED, DROP ≈ REFUTED. Inferences are tagged `[INF]`. Web sources are registered below as `W-*` and should be copied into `sources.md` by the synthesis owner (this validator did not edit `sources.md`).

Access limits: buildertrend.com and helpcenter.buildertrend.net did not resolve from this sandbox, so BT facts come from search-result extracts of BT's own help pages, not full-page reads. No vendor demo or trial was run. Procore and Bluebeam prices are third-party estimates.

---

## Bottom line

1. **R1 is right, and it is the most valuable sentence on the page.** It is still over-claimed. At least two of the seven incidents are a design QA failure (Mulbry 9'-4" vs 9') and a release-authority failure (Stetson demolished early). Propagation tooling would not have prevented either of them.
2. **Build vs buy.** Don't buy Procore or Autodesk Build. They are commercial-GC tools priced on construction volume, and they would put a second field app beside BT for a superintendent who already resists the first. Do buy or use **Bluebeam-style slip-sheeting with a superseded stamp** on the design desk now, because that solves the watermark and history problems with no code. Build only a **thin register + publish checklist + acknowledgement** in LUIH OS, and only once Phase 0/1 shows the loop is used.
3. **The plan is weakest where it touches money, the buyer and the trades.** No step decides "does this revision change cost or schedule?". The buyer is never in the loop. The people who actually build from the sheets (framer, truss supplier, MEP subs) are not acknowledgers. Field questions are not tracked as RFIs. All four of these have BT-native features (change orders with client e-signature, sub permissions/notifications, RFIs) that the plan ignores.
4. **The riskiest single item is R4's "one click automates five systems"** against a BT document API that does not publicly exist. Next is R6's "QR on every sheet": stamping a QR into a digitally sealed PDF can invalidate the Florida digital seal.
5. Verdicts: R1 MODIFY · R2 MODIFY · R3 MODIFY · R4 MODIFY · R5 MODIFY · R6 MODIFY (per-sheet QR → DROP for v1) · R7 MODIFY · R8 MODIFY. Nothing is DROPped outright. Every recommendation has a real core, but each one is stated more broadly than the evidence supports.

---

## Benchmark: how established document control does it

| Practice | What the tool or standard actually does | Source | What it means for LUIH |
|---|---|---|---|
| **Procore Drawings: current set** | "Current Drawings" lists the current revision of every sheet (number, title, revision, dates, set). Obsolete sheets show only in "All Sets and Revisions". Uploading a sheet number that already exists is auto-filed as the next revision. Revision order follows drawing date. | W-PC1 | A **sheet register with automatic supersession** is table stakes. The industry handle is the *sheet revision* plus a *named set*, not a global counter. |
| **Procore: publish & distribute** | New uploads stay "unpublished" until an admin publishes them. Only "Publish & Distribute" notifies subscribers by email/push. Sketches (ASI-type deltas) go out as hourly batched emails. | W-PC2, W-PC3 | Procore separates *publish* from *distribute* and has **no acknowledgement**, only notification. LUIH's ack + escalation goes beyond the commercial standard (a strength), and it is also unproven in the industry (a risk). |
| **Bluebeam Batch Slip Sheet** | Revised pages are matched to current pages and then either inserted before them or replace them. Markups carry over. The **"Superseded" stamp is applied automatically** in insert mode. Pages that can't be matched are extracted as new sheets. Smart Overlay (diffing) needs the Max plan. | W-BB1 | R6 option 5 (superseded watermark) and the change cover sheet's "clouded deltas" can be **bought off the shelf today** for the design desk. |
| **Autodesk Build** | Version sets group specific sheet versions, and version can be set by issuance date. Per-sheet QR "is this current?" comes from a **third-party** marketplace app (DoCheck), not natively. | W-AD1, W-AD2 | Even Autodesk doesn't ship per-sheet QR natively. That is a signal about how much demand there is. |
| **ISO 19650 CDE** | Containers move WIP → Shared → Published → Archived, with approval, authorisation and verification gates. Suitability codes: S0 WIP; S1 coordination; S2 information; S3 review/comment; S4 stage approval; A-codes for contractual authorised; CR as-constructed record. Revisions use P01… (preliminary) and C01… (contractual). | W-ISO1, W-ISO2, W-ISO3 | The useful idea is **separating "status/suitability" from "revision number"** and **P vs C** (preliminary vs contractual). That maps directly onto LUIH's "released before stamp" and "city set ≠ construction set" (S7, S4). |
| **ASI / bulletin / RFI practice (AIA)** | ASI (G710) issues clarifications or minor changes **with no change to contract sum or time**. Anything that changes cost or time goes on a different instrument (G709 proposal request, G714 construction change directive, G701 change order). RFIs go upstream from the field or subs and come back as responses that may trigger ASIs. | W-AIA1 | Every issued revision in commercial practice is classified **cost-neutral vs cost/time-bearing** at issue. The Plan Room package has no such field. |
| **Buildertrend (what LUIH already owns)** | Job-specific folders. Viewing permissions per internal/client/sub set at upload, plus an optional notification to everyone with access. PDF annotation saves create versions with a Version History tab. Mobile access for subs and crew. Change orders with client approval and e-signature in the portal, and sub visibility. An RFI tool (number, assignee, link to schedule item, deadline, related items). A Notification History log of emails sent. **No evidence found of** a sheet register, per-sheet revision numbering, a "current set" concept, superseded stamping, per-file view receipts, or a public document-upload API. | W-BT1 to W-BT6 | BT covers **distribution to subs, buyer approval of change orders and RFIs**, which are the gaps in the plan. It does **not** cover the sheet register or supersession. That is exactly where a thin build earns its keep. |

---

## Specific questions

### Q1. Build vs buy: BT features, Procore/Bluebeam, or a LUIH OS Plan Room?

**What BT offers for plan versioning (fact, from BT help-page extracts):**
- Versions are created when a PDF is *annotated and saved*, with a Version History tab (W-BT1). I found no BT article on uploading a replacement file as a new version of an existing document. The same search also reports BT marketing that says teams can "work off the most up-to-date version… while easily accessing previous versions" (W-BT2), but no mechanism is documented.
- At upload, you set permissions per audience (internal, clients, subs/vendors) and can trigger a notification to everyone with access (W-BT3). Notification History logs emails sent, not files opened (W-BT3).
- No public API. Integrations go through a Marketplace partner agreement. One consultancy claims document upload is possible but gives no endpoint (W-BT4). This independently backs D9 and the "unverified" flag on P-2.

**Options compared**

| Option | Strongest case | Strongest objection | Cost signal |
|---|---|---|---|
| **A. BT only, with discipline** (Phase 0 rules + BT notify-on-upload + sub permissions) | Zero new systems. Field already lives there. Notification to subs is native. | No current-set register, no supersession, no ack, and no audit of manual reverts (S6 happened *inside* BT). | $0 incremental |
| **B. Procore Drawings or Autodesk Build** | Mature register, OCR sheet labelling, auto-revisioning, publish & distribute. | Commercial-GC workflow. Priced on annual construction volume, roughly $10K–$80K/yr for small contractors plus onboarding, by third-party estimate (W-PC4). A **second field app** beside BT for a superintendent who runs on radio and paper (I11). Still no acknowledgement. Still needs a BT sync, so the copy-paste loop survives as Procore → BT. | High |
| **C. Bluebeam on the design desk** (slip sheet, superseded stamp, overlay) | Solves supersession marking, change clouds and history on the PDFs themselves, for the 2–3 people who produce sets. | Doesn't touch notification, ClickUp, field ack or BT. Studio sessions are a design-review tool, not field distribution. | Per-seat desktop licence (price not verified here) |
| **D. LUIH OS Plan Room (as proposed)** | Joins with the Specbook (D6), ClickUp D&P phases (D5) and Slack bot already in house. LUIH-specific exception states. Ack is the differentiator. | Building a DMS-adjacent product with an unverified BT write path. Engineering capacity is spent on plumbing rather than the Specbook/catalog core. | Engineering time |

**Call:** **A + C now, D thin and later. B no.** [INF] The differentiator LUIH needs (acknowledgement, the Design Book/Specbook join, exception states) exists in none of the buy options. The commodity parts (supersession marking, PDF comparison) exist in a cheap desktop tool. Build the register + ack in LUIH OS. Do not build file movement into BT until the spike passes.
**Evidence that would flip this toward B:** LUIH moves to multi-sub coordination on commercial-scale work, or BT is replaced as the field system anyway, or a Procore/Autodesk quote comes in under ~$10K/yr with a native BT sync.

### Q2. Is a per-house "Set Version" better than ISO 19650-style codes?

Not *better*. It does a different job. A V-number is a **communication handle** ("we're on V8"). It is not a status model. Weaknesses:
- **One counter can't describe two legitimate concurrent sets.** S7 shows the stamped city set and a coordinated construction set coexisting on purpose. A-3 itself has an amber "released before stamp" state. A single V(n) either hides the difference or inflates V on every re-stamp of content that has already been released.
- **Counter inflation.** Every publish bumps V, including landscape-only or permit-card-only publishes. After V14 the number tells the framer nothing about *their* sheets. [INF]
- ISO 19650's lesson is to **keep status (suitability) separate from revision**, and to keep **preliminary (P) separate from contractual (C)**. Full ISO is overkill for houses. The UK annex even leaves code lists for each project to define (W-ISO2).

**Call:** keep V-numbers as the *issued-for-construction* handle only. Add a small per-sheet-revision status vocabulary inspired by 19650: `WIP` · `FOR-PERMIT` · `RELEASED-UNSTAMPED (P)` · `FOR-CONSTRUCTION (C)` · `SUPERSEDED` · `AS-BUILT`. Bump V only when a `FOR-CONSTRUCTION` or `RELEASED-UNSTAMPED` sheet changes. Show V as `V8` or `V8-P` (contains unstamped sheets). The P-1 data model already has most of this in `SheetRevision.status`. The change is to make V **derive from** status instead of from "any Publish".

### Q3. Is a QR on every sheet realistic for a small custom homebuilder's field team?

Mostly no for v1:
- **Seal integrity.** Florida digital seals must invalidate if any data in the document changes (61G15-23, W-FL1). Stamping a QR into the title block of a digitally sealed sheet at Publish can break the seal on exactly the documents an inspector checks. A QR can only go on a cover/slip sheet, a margin label on paper, or an *unsealed* print copy. That needs legal/EOR confirmation. [INF on enforcement practice]
- **Behaviour.** The source evidence is a superintendent from a radio/paper culture (I11) and "job channel works when field pulls" (S8). Per-sheet QR relies on curiosity, as P-3 itself admits. The case studies that report success are large infrastructure/commercial programmes with document controllers (Dura Vermeer, the Bond Street pilot, IMEP; W-QR1, W-QR2). All are self-reported, with no independent rework measurement.
- **The cheap 80%.** **One QR per house** on the blue bag cover, the job sign and the change cover sheet, opening the current set or register. That needs no seal question and no title-block automation, and it is live in Phase 1 from a static page.

**Call:** per-sheet QR → **DROP for v1**. Per-house QR + cover-sheet QR → keep. Revisit per-sheet only if Phase 1 scan logs show actual scanning (target, for example, >1 scan per house per week).

### Q4. What's missing from the plan

| Gap | Why it matters (evidence) | Established practice | Cheapest fix |
|---|---|---|---|
| **Change-cost approval** | Oberlin: brick shortage + CO slip (S1). $196K/yr rework claim (S13). A-3 has no "does this change cost or schedule?" step. Procurement occurrences (143/yr, S13) suggest many packages carry cost. | ASI = no change to sum or time. Otherwise G709/G714/G701 (W-AIA1). | Add a required `cost_schedule_impact` field to Package (`none` / `cost` / `schedule` / `both`). `≠ none` blocks Publish until a BT change order (internal or buyer) is linked. |
| **Buyer sign-off** | Oberlin spec book differs in ~15 items from what was installed (S1). Phase 3 mentions "buyer re-sign alerts after closing", which is too late. | BT change orders: client approves/declines with e-signature in the portal, with deadlines (W-BT5). | For buyer-visible changes (elevation, layout, finishes), route through a BT client change order *before* Publish. Don't build buyer approval in LUIH OS. |
| **Sub/trade distribution and ack** | Mulbry: the **truss supplier and framers** built to 9' (S2). Langholm CMU (S5). The plan only acks super/PM. | Procore distributes to drawing-log subscribers (W-PC3). BT sets sub/vendor viewing permissions + notification at upload (W-BT3). | Package lists `affected trades`. Publish sets BT sub visibility + BT notification for those subs. Trades whose work is affected (truss, framing, MEP) must confirm **before fabrication**, as a gate tied to the truss order, not to the 24h super ack. |
| **RFIs** | Field questions in job channels are informal RFIs. "Which version" questions (S10). Langholm root cause unknown. | RFI log upstream to design, responses linked to the revision (W-BT6 BT RFIs; Autodesk/Procore RFI tools). | Use **BT RFIs** (number, assignee, schedule link, deadline). Package trigger types gain `RFI-<n>`. No Plan Room RFI module. |
| **Design QA before release** | Mulbry 9'-4" vs 9' conflict (S2) is a cross-sheet *consistency* error, not a propagation error. | Internal QC/coordination review before issue. LUIH already has a permit-QC skill and a Submission Checklist (G-1). | Make "cross-sheet check run" a required Package step before Signing. Reuse the Submission Checklist / plan-review agent. |
| **Release authority** | Stetson demolished before approved plans existed (S4). Released-before-stamp exists, but nobody is named to authorize it. | Formal "issued for construction" authority, in ISO terms the authorisation gate (W-ISO3). | Name the authorizer (P-5 already asks). Make it a hard field on the RELEASED-UNSTAMPED transition, with expiry. |
| **Inspector copy / permit set on site** | The city-approved stamped set is what the inspector checks. [INF: Florida jurisdictions generally require approved plans on site.] A flat "current" Approved folder (R5) can drift from the stamped set. | Keep the stamped permit set as a record, separate from current construction docs. | See R5. |
| **As-built / record set at closeout** | I7: construction executes before the occurrence exists. | ISO `CR` as-constructed record (W-ISO1). | A Package of type `AS-BUILT` at closeout. Archive the final V. |

---

## R1–R8

### R1. Root problem is change control/propagation/acknowledgement, not storage
- **Strongest counter-argument:** Of the seven incidents in G-1, only Oberlin (S1), the Mulbry Design Book (S3) and arguably S7 are clean propagation failures. Mulbry trusses (S2) is a **design consistency** error: the propagation worked perfectly, it just propagated a conflict. Stetson (S4) is a **release-authority/schedule** decision (demolition before approval). Langholm (S5) is "unclear". 121 Fawsett (S6) is an uncontrolled edit *in the storage system*. So "not storage" is too strong: BT's lack of audit and supersession is part of the cause.
- **Simpler or cheaper alternative:** A named document-control role (a 0.25 FTE backup to Ingrid/Luiza) with a checklist fixes propagation for a ~100-house builder without software [INF]. This is what commercial GCs do with a document controller.
- **Evidence that would change the call:** Classify all incidents on 10+ houses into {propagation, consistency, authority, storage, unknown} with construction. If propagation is under ~50% of cost-weighted incidents, the product centre of gravity should move to QA + release authority.
- **Verdict: MODIFY.** "Root problem is change control: **release authority, cross-sheet consistency, propagation and acknowledgement**. Storage is sound but BT lacks audit and supersession." Tag each incident in G-1 with its class instead of a single "gap".

### R2. Keep Drive as storage and BT as field view; LUIH OS is the control layer (no new DMS)
- **Strongest counter-argument:** Three systems holding overlapping state (Drive files, BT files, LUIH OS register) is the drift pattern the page diagnoses, now with one more participant. The control layer **cannot control BT**: no public document API (W-BT4, D9), so BT stays manual and the "control layer" only controls the one system (Drive) that wasn't failing. Building also competes with Engineering's core OS roadmap.
- **Simpler or cheaper alternative:** Q1 option A + C: BT folder discipline + BT notify-on-upload to subs + Bluebeam slip sheet/superseded stamp on the design desk + Slack template. Then build only the **register + ack** (no file movement) in LUIH OS.
- **Evidence that would change the call:** (a) The BT spike shows a supported upload/replace path (partner API), which strengthens R2 as written. (b) Phase 1 shows that the manual BT step is where most incidents still occur, which would justify RPA. (c) A Procore/Autodesk quote under ~$10K/yr with native BT sync would reopen buy.
- **Verdict: MODIFY.** Keep "no new DMS". Scope LUIH OS v1 to a **register of record (what's current, why, who acknowledged)** that *points at* Drive and BT files and *verifies* them (for example, a weekly diff of BT folder listings vs the register via an export or a checklist). It does not *move* them. File movement is a Phase 2+ option gated on the BT spike.

### R3. One Set Version per house (V-number) plus sheet R-numbers
- **Strongest counter-argument:** See Q2. A single monotonic V can't represent the city set and the construction set at once (S7). It inflates on irrelevant publishes, and the industry handle is named sets/issuances + sheet revisions (W-PC1, W-AD1). R-numbers are already reused inconsistently (D3). Adding a second number without fixing R discipline doubles the confusion.
- **Simpler or cheaper alternative:** Named issuances ("Permit Set", "Bulletin 03 – Drainage") + a per-sheet revision + a status code. The field asks "am I on Bulletin 03?"
- **Evidence that would change the call:** A Phase 0/1 test with Mike and 2 other supers. Does "we're on V8" get used spontaneously in daily logs and calls, or do people quote the bulletin/reason? Also check how often two sets legitimately coexist per house (S7 says "across more than 10 channels").
- **Verdict: MODIFY.** Keep V as the **issued-for-construction handle**, derived only from sheets in `FOR-CONSTRUCTION`/`RELEASED-UNSTAMPED`, displayed with a P flag when unstamped sheets are included. Pair each V with an issuance name and reason. Add the 6-value status vocabulary from Q2. Enforce R-number uniqueness per sheet in the register; that is the actual fix for D3.

### R4. One Publish action automates Drive, BT, ClickUp, Slack and print
- **Strongest counter-argument:** Five side effects across systems with no transactions. The BT target is unverified and the printer target is "medium". A Publish that fails halfway (Drive moved, BT not updated) creates exactly the "two current sets" state of S7, but now *silently*, because people stop checking once a button exists. Automation also moves a wrong file faster. Make (Phase 1) has weak error handling for multi-step partial failure [INF].
- **Simpler or cheaper alternative:** Publish = **record the decision + generate the checklist + post the Slack message + update ClickUp**. Drive/BT moves are a checklist the publisher ticks, confirmed by a per-target status.
- **Evidence that would change the call:** The BT spike result. Make scenario error rates over 4 weeks of Phase 1. Whether the manual BT step is actually skipped (measure: BT listing vs register mismatches per week).
- **Verdict: MODIFY.** Publish is a **state change with per-target delivery status** (`Drive ✓ · BT pending-manual · ClickUp ✓ · Slack ✓ · Print queued`). The Set Version shows "incomplete" in amber until every required target is confirmed, and the ack request goes out only when BT is confirmed. Keep "one click" as the UX goal, not as a promise in v1.

### R5. Drive 00–04 mirror BT; Drive-only 05+; flat Approved plus immutable packages
- **Strongest counter-argument:** (1) A **flat, current-only "01. Approved"** conflates *what the city stamped* with *what we're building now*. The stamped permit set is a legal record the inspector checks. Luiza saves city files "as received" (I12), and S7 shows the two sets diverge on purpose. Replacing sheets in Approved erases the "city record" view unless you open packages. (2) Migrating active houses mid-construction (Phase 0) in 2 weeks, by the two people who are already single points of failure (S12), risks breaking in-flight work. (3) The BT 03 name is still unknown (D1).
- **Simpler or cheaper alternative:** Apply the standard to **new houses and new packages only**. For active houses, normalize names and dates going forward and leave the existing trees alone. Keep `01. Approved` as the **city record, as received** (immutable, dated by approval), and make "current for construction" a register view (or BT `02. Construction Documents`).
- **Evidence that would change the call:** Ask Luiza and an inspector-facing super whether anyone needs the stamped set separated from current construction docs on site. Count how many active houses are pre-framing (where migration is cheap) vs post-framing.
- **Verdict: MODIFY.** Keep the numbered mirror, 05 Packages (immutable), 06 Working and 99 Superseded. Change `01. Approved` to **"city-stamped record, as received"** and define "current for construction" separately (register + BT 02, with merged current-set PDF). Migrate only new houses and pre-framing active houses. Confirm BT 03 before publishing the standard.

### R6. QR on every sheet + acknowledgement + auto-print; pre-milestone gate
- **Strongest counter-argument:** See Q3. Per-sheet QR conflicts with Florida digital-seal integrity (W-FL1). It relies on curiosity in a radio/paper culture (I11, S8). Even Autodesk relies on a third-party app for it (W-AD2), and the success stories are large programmes with document controllers (W-QR1, W-QR2). A 24h ack by the super/PM doesn't reach the trades who build from the sheets (Mulbry framers/trusses, S2). The **pre-milestone gate** is the only element that *prevents* an incident rather than records it, yet it is listed last and deferred to Phase 3.
- **Simpler or cheaper alternative:** Per-house QR (blue bag, job sign, cover sheet) + Slack/BT daily-log ack + auto-print with change cover sheet + a **gate on truss order release and framing start**, done as a manual checklist item in BT's schedule from Phase 1.
- **Evidence that would change the call:** QR scan logs from the per-house pilot. Ack rate and time-to-ack over 4 weeks. Whether construction leadership will enforce a gate (P-5 decision). Legal/EOR answer on stamping sealed PDFs.
- **Verdict: MODIFY.** Per-sheet QR → **DROP for v1** (replace it with per-house + cover-sheet QR). Keep ack + escalation + auto-print. **Promote the pre-milestone gate to Phase 1 as a manual BT schedule checklist** for truss order, framing and MEP rough, and extend ack to affected trades for those milestones.

### R7. Phase 0 (no code) captures about 30% of the value in 2 weeks; Phase 1 on Make
- **Strongest counter-argument:** "30%" has no source or model behind it, and it is the kind of number a COO will quote back. Phase 0 bundles a leadership policy (R8), a RACI with backups for two overloaded people, a folder migration and a baseline. Two weeks is optimistic when the decision owners aren't in the room. Make adds another system and becomes shadow IT that someone must own after the "4 weeks".
- **Simpler or cheaper alternative:** Phase 0 = templates centralized + naming for *new* files + RACI/backups + baseline metrics (no migration). Phase 1 on Make with an explicit sunset date and owner, or directly as a minimal LUIH OS form, since the Slack bot and Drive API already exist there (D6, P-2).
- **Evidence that would change the call:** The baseline measured in Phase 0 (which-version questions, approval→field latency) and the reduction after 4 weeks of Phase 1. That number replaces "30%".
- **Verdict: MODIFY.** Replace "≈30% of value" with a testable hypothesis ("Phase 0 halves approval→field latency on new revisions"). Move the folder migration out of Phase 0. Keep Make only with a named owner and a sunset at Phase 2 start.

### R8. Governance: the plan set is authoritative over the Design Book
- **Strongest counter-argument:** For a custom homebuilder, the buyer's selections and spec book are what was *sold*. They are contractual with the buyer for finishes [INF]. A blanket "plans win" either forces every finish change through a plan revision (more packages, more load on Ingrid) or quietly overrides what the buyer signed (the Oberlin spec-book divergence, S1, is the buyer-facing failure). The real problem in S3/S9 is that the documents **disagree without anyone knowing**, not which one wins.
- **Simpler or cheaper alternative:** An **order-of-precedence by topic**. Plans govern geometry, structure, dimensions and layout. The Specbook governs products, finishes and quantities. The Design Book is a derived presentation and must cite the Set Version it was built from. Any Design Book change that touches layout opens or attaches to a Package (the plan's rule, kept).
- **Evidence that would change the call:** Review a sample of buyer contracts for existing precedence language. Classify the 11 Design Book changes (S9) by topic (layout vs finish).
- **Verdict: MODIFY.** Ask leadership for a **precedence matrix by topic**, not a yes/no on "plans authoritative", and require cross-reference (Design Book cites V-number) so divergence is detectable.

---

## Proposed edits to `plan-room.html` (for the synthesis owner)

1. G-0 "Challenge to the brief": add *release authority* and *cross-sheet QA* next to propagation, and tag the G-1 incidents by class.
2. A-3: add a `cost/schedule impact` decision before Publish, with a link to a BT change order (and buyer approval where applicable), plus a `cross-sheet check` step before Signing.
3. A-3/P-2: show Publish per-target delivery status. The ack goes out only when BT is confirmed.
4. A-4: redefine `01. Approved` as the city-stamped record, as received. Migration covers new and pre-framing houses only.
5. P-1: V derives from FOR-CONSTRUCTION/RELEASED-UNSTAMPED status (with a P flag). Add issuance name. Add `affected_trades` and `cost_schedule_impact` to Package. Add `AS-BUILT` and `RFI-<n>` trigger types (RFIs stay in BT).
6. P-3: per-sheet QR out of v1, per-house + cover-sheet QR in. Pre-milestone gate (truss order, framing, MEP rough) moves to Phase 1 as a manual BT checklist. Trades ack for gated milestones.
7. P-4: replace "≈30% of value" with a measurable hypothesis. Add Bluebeam-style slip sheet/superseded stamp to Phase 0 for the design desk.
8. P-5: add decisions on precedence matrix by topic, the release-before-stamp authorizer, legal/EOR on marking sealed PDFs, and a buy bake-off threshold.

---

## Web sources (W-*) used in this file

| ID | Source |
|---|---|
| W-BT1 | Buildertrend Help Center, Files Overview (annotation saves create versions; Version History tab): https://helpcenter.buildertrend.net/s/article/Files-Overview |
| W-BT2 | Buildertrend, construction document management software (marketing): https://buildertrend.com/communication/construction-document-management-software/ |
| W-BT3 | Buildertrend Setup & Customization FAQs / Glossary (upload permissions, notifications, Notification History): https://buildertrend.com/help-article/buildertrend-setup-customization-faqs/ · https://helpcenter.buildertrend.net/s/article/Buildertrend-Glossary |
| W-BT4 | Third-party reviews of the BT API (no public API, Marketplace partner agreements): https://www.usecarly.com/blog/buildertrend-api/ · https://datadrivenaec.com/tools/buildertrend · https://www.bolderapps.com/blog-posts/buildertrend-integration-custom-construction-apps-2026 · https://clickr.cloud/workflows/buildertrend-api/ |
| W-BT5 | Buildertrend Change Order Overview (client approve/decline, e-signature, sub visibility): https://buildertrend.com/help-article/change-order-overview/ |
| W-BT6 | Buildertrend Messaging on Mobile (RFIs: number, assignee, schedule link, deadline): https://buildertrend.com/help-article/messaging-on-mobile/ |
| W-PC1 | Procore, Review and Confirm Drawings (current drawings, auto revision, All Sets and Revisions): https://v2.support.procore.com/process-guides/user-guide-bidding-and-estimating-integration/review-and-confirm-drawings |
| W-PC2 | Procore, Publish Drawings (Publish vs Publish & Distribute): https://v2.support.procore.com/en-ca/product-manuals/drawings-project/tutorials/publish-drawings |
| W-PC3 | Procore, Subscribe to the Drawings Log (emails for sets, revisions, sketches): https://support.procore.com/products/online/user-guide/project-level/drawings/tutorials/subscribe-to-the-drawings-log |
| W-PC4 | Procore pricing estimates (third-party, ACV-based): https://www.getonecrew.com/post/procore-pricing · https://projul.com/blog/procore-pricing-analysis-2026/ · https://projul.com/competitors/procore-vs-buildertrend |
| W-BB1 | Bluebeam, Batch Slip Sheet: https://support.bluebeam.com/user-manual/menus/batch/slip-sheet.html |
| W-AD1 | Autodesk Build sheets / version sets: https://www.autodesk.com/learn/ondemand/curated/sheets/7lcpYbH4yMsscK58E3whio · https://resources.imaginit.com/construction/autodesk-forma-best-practice-part-8-build-settings |
| W-AD2 | DoCheck QR app (third party) on the Autodesk Marketplace: https://marketplace.autodesk.com/apps/8791b654-d8cb-4434-a955-af971f6d112b |
| W-ISO1 | Autodesk Docs naming standard, Status Codes (S0–S4, A, CR): https://help.autodesk.com/cloudhelp/ENU/Docs-Files/files/files-naming-standard/Status_Codes.html |
| W-ISO2 | NBS on status/revision (S4 + P02 example): https://support.thenbs.com/support/solutions/articles/7000055103 · Status codes, why the complexity: https://bimplus.co.uk/status-codes-why-complexity |
| W-ISO3 | CDE states WIP/Shared/Published/Archived: https://www.12dsynergy.com/blog/12d-synergy-iso-19650-common-data-environment/ · https://www.autodesk.com/autodesk-university/ko/article/ISO-19650-Common-Data-Environment-and-Autodesk-Construction-Cloud-2021 |
| W-AIA1 | AIA G710 ASI summary and instructions (no change in contract sum/time; use G709/G714/G701 otherwise): https://help.aiacontracts.com/hc/en-us/articles/1500009443722 · https://help.aiacontracts.com/hc/en-us/articles/1500009324201 |
| W-FL1 | Florida digital seal must invalidate on any change (61G15-23): https://docs.palmcoastgov.com/departments/building/permitting/guide-to-digital-signatures.pdf · https://www.law.cornell.edu/regulations/florida/Fla-Admin-Code-Ann-R-61G15-23-005 · https://www.townofpalmbeach.com/DocumentCenter/View/28627/DIGITAL-SIGNATURES-Information |
| W-QR1 | QR on drawings, case studies (Dura Vermeer, IMEP): https://www.cadac.com/es-en/cases/dura-vermeer · https://technologygateway.ie/case-studies/imep-intelligent-mep-design-consultancy-ltd/ |
| W-QR2 | Bond Street pilot and QR in document management: https://www.theconstructionindex.co.uk/news/view/qr-codes-in-document-management-role · Autodesk blog: https://www.autodesk.com/blogs/construction/4-ways-qr-codes-can-improve-construction-outcomes/ |
