# Synthesis: House Document Control, Discovery v2

Owner: Felipe Brito (Head of Product). Synthesis run 2026-10-11. Input: `claims.md` (47 claims from `plan-room.html` R00), `sources.md`, and the four validation files. Output feeds `plan-room.html` R01.

## How to read the citations

| Prefix | Meaning | File |
|---|---|---|
| `I1`…`I13`, `S1`…`S15`, `D1`…`D11`, `R1`…`R8` | Claim IDs and the verdict recorded against them | `claims.md` + validator file |
| `I:N1`…`I:N24` | New fact from the interview validator | `validation-interviews.md` §2 |
| `S:N-S1`…`S:N-S12` | New incident from the Slack validator | `validation-slack.md` §C |
| `S:B` / `S:C` / `S:D.1`…`S:D.12` | Slack 12-channel sample, incident rule, process facts | `validation-slack.md` |
| `D:§2`…`D:§5` | Drive trees, ClickUp volumes, code reuse, BT API | `validation-drive-clickup-code.md` |
| `R:Q1`…`R:Q4` | Red-team answers to the four questions | `validation-redteam.md` |
| `INT-*`, `MTG-*`, `SL-*`, `DR-*`, `CU-*`, `GH-*`, `W-*` | Primary sources | `sources.md` (new IDs added there in this run) |

Facts and inferences stay separate. `[INF]` marks an inference.

---

## 1. Verdict scoreboard

Red-team verdicts are mapped to the README scale as the red team defined it: HOLDS → CONFIRMED, MODIFY → CORRECTED, DROP → REFUTED (`validation-redteam.md` header).

### By verdict

| Verdict | Count | Claims |
|---|---|---|
| CONFIRMED | 28 | I2, I3, I5, I6, I7, I8, I9, I10, I11, I12 · S2, S3, S4, S5, S6, S7, S8, S11, S12, S14 · D3, D4, D5, D6, D8, D9, D10, D11 |
| CORRECTED | 18 | I1, I4, I13 · S1, S10, S13, S15 · D1, D2, D7 · R1, R2, R3, R4, R5, R6, R7, R8 |
| UNVERIFIED | 1 | S9 (the quote is real; the 64% and 10-of-11 numbers have no published method) |
| REFUTED | 0 | none |
| **Total** | **47** | |

### By area

| Area | Claims | Confirmed | Corrected | Unverified | Refuted |
|---|---|---|---|---|---|
| Interviews and process (I) | 13 | 10 | 3 | 0 | 0 |
| Slack (S) | 15 | 10 | 4 | 1 | 0 |
| Drive / ClickUp / BT / code (D) | 11 | 8 | 3 | 0 | 0 |
| Recommendations (R) | 8 | 0 | 8 | 0 | 0 |
| **All** | **47** | **28** | **18** | **1** | **0** |

### Confirmed, with a caveat that still matters

- I10: confirmed that field asked for a partial-revision view; the BT folder name is garbled in the transcript and unverified (`validation-interviews.md` I10).
- D5: the D&P Phases 7.3–7.9 list is confirmed; the folder mapping is `[INF]`, 7.8 is an action, not a folder, and occurrence tickets use a second status field (D5).
- D6: the specbook version schema and Slack text are confirmed in code; the "since about Sep 2026" start date rests on the Slack validator's observation of the "Luih OS" bot (D6, `S:D.1`).
- D9: confirmed and stronger than stated. There is no public BT API at all (D9, `D:§5`).
- S5: the Langholm event is real, but the source calls it a construction error, so it is not a document incident (S5, S15).
- I2: confirmed only as Ingrid's guess; she was not sure who creates the Drive folder (I2).

Nothing was refuted. Every R recommendation has a real core but was stated more broadly than the evidence supports (`validation-redteam.md` Bottom line 5).

---

## 2. Corrected facts

| Claim | R00 said | Corrected fact | Evidence |
|---|---|---|---|
| S15 | 10+ incidents in 4 job channels | **17 incidents across 12 job channels, 8 material**, 2026-04-11 to 10-11. In the original 4 channels: 7 (5 material). Rates: 0.24 per house-month; 0.11 material. Fawsett, Chantilly and Mulbry hold 12 of 17. Pre-permit and early houses have none. | S15, `S:B`, `S:C` |
| S10 | ~35% of job-channel messages are doc posts | **54%** of top-level posts (234/436), **40%** of human top-level posts (133/335), **17%** of all messages incl. replies (234/1,406). Always state the denominator. | S10, `S:B` Recomputed S10 |
| S10 | ~1 "which version" question per house per month | **0.42 per house per month** (30 in 72 house-months), range 0 (Langholm) to 1.33 (Chantilly). A lower bound: only flagged threads were opened. | S10, `S:B` method |
| S13 | Rework ≈ $196K/yr (cited as the business case) | $196K/yr is **all** rework measured from BT change orders; ~$118K is catalog-driven. Author: Felipe Nasser, #tech 2026-07-22. **Not a document-control cost.** | S13 |
| S1 | Oberlin: committee changed A-8 in March; spec book differs in ~15 items; CO postponed | The March change is Victor Moura's statement in SL-HB 08-17, not a March post in SL-OBE. "**At least** 15 items". The CO delay was tied to the **spec book** differing from the buyer-signed version, not to the brick. Resolved with elevation B (08-10); A-1/A-8 revised 08-27, approved 09-15. Ingrid: the issue "did not reach me, and no card was created". | S1 |
| S5 | Langholm CMU wall is a document incident | The source calls it a **construction error**. Not a document incident. | S5 |
| S4 | Stetson demolished before approved plans existed | True, but the demo permit was issued 02-24, so demolition followed the normal sequence `[INF]`. The 03-26 question shows the field couldn't see where the house stood. The 10-05 decision to contract trusses from the "00. Waiting for City Approval" set is the release-before-stamp case. | S4 |
| D9 | BT public API is limited for document upload | **BT has no public API.** LUIH's middleware replays web endpoints with a session cookie, has no sandbox and **no documents endpoint**. The only proven write is BT job custom fields. | D9, `D:§5`, GH-BTAPI, W-BT4 |
| D1 | BT folders 00, 01, 02, 04 are siblings; 03 unknown | BT top level mirrors the Drive house template: `01. Survey`, `02. Committee`, **`03. Plans`**, `04. Permits & Documents`. `00. Waiting for City Approval`, `01. Approved` and `02. Construction Documents` sit **inside `03. Plans`**. Source is DR-GPERM (Mar 2026), so confirm with one BT screenshot. | D1, `S:D.4` |
| D2 | Drive `02. Permit Book` tree | Template lives at Home Building › `02. Library` › `01. STANDARD FOLDER` (DR-TPL). `Ready for Submission` / `Waiting for Approval` were added on 2025-10-13 and copied by hand. `04. Narrative` is **not** in the template. Every PB subfolder has `00. Old`. `03. Approved` has `01. Received from the City`. `01. Unsigned` has six discipline subfolders. | D2, `D:§2.1` |
| D7 | "Platform owns state, ClickUp owns workflow" from ARCHITECTURE_MIGRATION.md | That file and phrase do not exist. Equivalent wording: F03 "ClickUp announces; it never decides", F04 "Drive stays the distribution copy; the platform is the source of truth", TRFC "Slack is a delivery channel, not a source of truth". Older F01/FX1 say the opposite. | D7 |
| I1 | BT holds only the latest **approved** PDFs | BT holds the latest PDFs, **approved and pending**. Pending sets, **including the Truss Set before approval**, sit in `Waiting for City Approval`. Drive is where everything is done; "BT is a consequence". | I1 |
| I4 | Luiza runs the permit flow end to end, incl. moving old files and BT | Two flows, two owners. **Permit issue:** Luiza does every step, with a two-person check. **Occurrences:** Luiza only submits and saves what the city returns; **Ingrid** moves superseded files to Old and does the BT upload. | I4, `I:N1`, `I:N4` |
| I13 | 4–5 manual steps per status change | No interviewee gave a number. It is **Felipe's count** of Luiza's described flow: about 5 actions for one person per document event (email → Drive → BT file → BT schedule tick → ClickUp → Slack). Occurrences add a second person. **An estimate.** | I13 |
| I6 | "More attention than time" | Confirmed, with her qualifier: asked whether it takes a lot of time, she said "Não" (no). The pain is interruption and risk, not hours. | I6 |
| R00 G-1 quote | Luiza: "…I can't breathe." | Not found in the validated transcript evidence. Replace with the validated quote: "a gente fala a mesma coisa várias vezes em vários lugares… é um Ctrl+C, Ctrl+V". | I6 |
| R00 P-5 | Interview "Maira" and Vini | The Granola summary garbled the name. It is **Moura** (Victor Moura) and Vini. | I11 |
| S9 | 64% multi-discipline; 10 of 11 Design Book layout changes had no plan revision | The quote exists (SL-HDC 10-07). No dataset or method is published. **Unverified**; do not cite until the matrix is published. | S9 |
| D3 | Four date formats, R-numbers reused, "Ocurrence" typo | Confirmed and worse: Portuguese months (`Out.05.2026`, `Dez.08.2025`), wrong year (`Sep.08.2029`), a folder named Oct 10 created Oct 7, 17 of 20 occurrence folders spelled "Ocurrence(s)", files from another house (Brookshire in Hyer) and a wrong address in file names ("1125 Golfview"). The written standard `R0# - mmm.dd.yyyy` exists, but no dated folder seen carries an R-number. | D3, D4 |
| D11 | Mulbry = dated snapshots; Amherst = flat | Pattern confirmed on other houses: 907 N Hyer = dated snapshots, 1225 Golfview = flat sheets. House by house, not a rule. | D11 |

---

## 3. New facts that change the design

| # | Fact | Design consequence | Evidence |
|---|---|---|---|
| F1 | BT has no public API and no documents endpoint. A read connector BT→ClickUp already exists, and BT job custom fields can be written. | BT publish is **assisted or manual with a checklist** in v1. The platform writes a "Current set" link/version into a BT job custom field. File upload to BT is a Phase 2+ option gated on a spike. | D9, `D:§5`, `I:N22` |
| F2 | BT nesting is `03. Plans/{00,01,02}` plus `04. Permits & Documents`; the Drive template is `02. Library/01. STANDARD FOLDER` and already has `01. Survey`, `02. Committee`, `03. Plans`, `04. Permits & Documents` at house root. | The "mirror" rule applies to the house root (01–04) and to the three folders inside `03. Plans`, not to a renumbered `03. Plans`. R00's A-4 tree was wrong. | D1, D2, `D:§2.1` |
| F3 | Ingrid owns occurrences end to end: dated folder in Unsigned → sent to Luiz to sign → Ready for Submission → BT upload (into Waiting, pulling the same sheets out of Approved) → standard Slack post → after approval moves superseded to Old and updates BT Approved. Luiza only submits and saves the city return. | A-2 roles change. The single point of failure is Ingrid; she reported being at capacity. | I3, I4, S12, `I:N1`, `S:D.12` |
| F4 | Engineering coordinators (per house: Matheus, Adriana, Carol) fill Ready for Submission and resolve city comments; Luiza owns 7.3 onward and runs a two-person double check before publishing an approved permit set. | A-1 gets a coordinator lane and an explicit double check. | `I:N2`, `I:N3`, `I:N4` |
| F5 | The Truss Set and other pending sets are visible in BT `Waiting for City Approval` before approval; at Stetson the field was told to contract trusses from that set. | "Released before stamp" already happens through a folder, with no named authority and no expiry. Needs a hard authorizer field. | I1, S4, R:Q4 |
| F6 | Orlando accepts partial resubmission (changed sheets only); Winter Park and Tampa need the full book. Orlando and Orange County files are saved as received. A Bryant approved file is literally "Building Plans_partial (…)". | The register must track per-sheet status; a city-stamped record is separate from the current construction set. A single V-number can't carry this. | I12, `I:N11`, `S:D.8`, R3 |
| F7 | Florida digital seals must invalidate on any change to the document. | No QR or watermark stamped into a sealed PDF at Publish. One QR per house; confirm marking rules with the EOR. | W-FL1, R:Q3 |
| F8 | A QR already exists on the plans and points to Luiza's hand-built narrative page. | Find out what it links to before adding a second QR. A QR placed by the designer before sealing avoids the seal problem `[INF]`. | `I:N7` |
| F9 | Sold houses: the buyer-signed spec book is not version-locked; updates after signing were never sent to buyers. | Buyer-visible changes go through a BT client change order before Publish, not "re-sign alerts after closing". | `S:D.5`, S1, W-BT5 |
| F10 | Trades build from the sheets: Mulbry trusses were engineered to 9' and framers pulled off; siding delivered wrong at Mulbry and Bryant. | Acknowledgement must reach affected trades before fabrication, not only the super/PM. | S2, `S:N-S1`, `S:N-S12`, R:Q4 |
| F11 | The Design Book diverges from the plans by design ("adjustments not reflected in the building drawings"). Field picks whether a card is needed. | "Plans win" as a yes/no rule doesn't fit. Use a precedence matrix by topic and make the Design Book cite the set it was built from. | `S:D.2`, R8 |
| F12 | Catalog changes travel into houses (LUIH OS "nobody in this house asked for it", reverted 17 h later at Fawsett). The Fawsett revert was the Design Book/spec, not plans. | The audit gap is real but sits in the Specbook/Design Book layer too. Plan Room v1 audits plans only; the Specbook bot already versions its side. | S6, `S:D.6`, D6 |
| F13 | ✅ reactions are the de facto acknowledgement; design push posts get zero replies; field questions get 5–12 replies. | Baseline for ack is "no mechanism"; a Slack button alone may not land. Pair with a daily-log line and paper. | S8, `S:D.9`, I11 |
| F14 | LUIH OS already has a distribution orchestrator (per-channel results with retry), version schema, Slack threaded changelog, house-channel resolution, Drive replace-in-place, ClickUp adapter, BT custom-field write and a Drive crawler. | A thin register + publish is cheaper to build than R00 implied. The orchestrator gives per-target delivery status for free. | `D:§4` |
| F15 | Two ClickUp status vocabularies for the same folder moves: D&P Phases (7.3–7.9) and ticket `Design & Permit Status`. `Wrong Plan Version` root-cause tag used 3 times in total. Occurrence card counts are mostly bulk creation. | Package ↔ ClickUp mapping must handle both fields. ClickUp can't be the baseline for the version problem; use the Slack incident count. | D5, `D:§3` |
| F16 | Mulbry plan-height fix cost $690 extra and was resolved the same day. | Not every package needs a change order gate. Gate on buyer-visible changes and on a cost threshold. | S2 |
| F17 | Private-provider approvals (Tampa) are filed separately from city approvals; plan reviews post as `[1st/2nd Plans Review]`; bids wait for the 1st review in BT. | The register needs a "private provider" route and status. | `I:N6`, `S:D.7` |
| F18 | Process docs live in personal Drives: Mensagens padrões (Ingrid) and Guide \| Permitting (Gabriella). | Phase 0 moves both to the Shared Drive. | D10, `D:§1` D10 |
| F19 | Felipe's own kickoff said "No folders change during discovery." | Folder migration is out of Phase 0. | `S:D.11`, R7 |

---

## 4. Revised recommendations

Each line states the R00 recommendation, the red-team verdict, what R01 adopts, and where I disagree.

### RR1 (R1): Root problem
- **Adopt the MODIFY.** The root problem is change control: **release authority, cross-sheet consistency, propagation and acknowledgement**. Storage is sound, but BT has no audit or supersession (R1, `validation-redteam.md` R1).
- Tag every incident by class. On the 8 material incidents: propagation 3 (Oberlin A-8, Mulbry Design Book, Oberlin spec book vs buyer-signed), consistency 3 (Mulbry 9'-4"; Chantilly plans vs Design Book; Bryant siding plans vs delivery), spec gap 2 (Mulbry siding link, Fawsett toilets) (S1, S2, S3, `S:N-S1`, `S:N-S4`, `S:N-S7`, `S:N-S12`) `[INF on classes]`.
- **Where I disagree:** the red team counts Stetson's demolition as a release-authority failure. The demo permit was issued 02-24, so demolition followed the normal sequence; the failure was visibility (S4). The authority case at Stetson is the 10-05 truss contracting from the Waiting set.

### RR2 (R2): Control layer, no new DMS
- **Adopt the MODIFY.** LUIH OS v1 is a **thin register of record plus acknowledgement**: what's current, why, who acknowledged. It points at Drive and BT files and checks them (weekly BT listing vs register) (R2, D9).
- **Build vs buy.** BT discipline + Bluebeam-style slip sheet now; thin LUIH OS register later; no Procore/Autodesk Build. Procore is ~$10K–$80K/yr by third-party estimate, adds a second field app beside BT, and still has no acknowledgement (R:Q1, W-PC1–W-PC4, W-BB1). Flip toward buy only if a quote comes in under ~$10K/yr with native BT sync, or BT is replaced (R:Q1).
- **Where I disagree:** the red team says LUIH OS should not move files at all in v1. For **Drive** that is too cautious: the Drive API, replace-in-place and the orchestrator are already proven in the Specbook module (`D:§4`). Drive moves can be automated in Phase 2. The "point and verify, don't move" rule applies to **BT**.

### RR3 (R3): Set Version
- **Adopt the MODIFY.** V-number is the **issued-for-construction handle only**. It derives from per-sheet status and bumps only when a `FOR-CONSTRUCTION` or `RELEASED-UNSTAMPED` sheet changes. Shown as `V8`, or `V8-P` when unstamped sheets are included. Pair each V with an issuance name and reason (R3, R:Q2).
- Per-sheet status, ISO 19650-lite: `WIP · FOR-PERMIT · RELEASED-UNSTAMPED (P) · FOR-CONSTRUCTION (C) · SUPERSEDED · AS-BUILT` (R:Q2, W-ISO1–W-ISO3).
- Enforce R-number uniqueness per sheet in the register; that is the actual fix for D3 (D3, R3).
- Evidence for the change: two sets coexist on purpose (S7, 11 channels), partial approvals exist (`S:D.8`), Orlando accepts partial resubmission (`I:N11`).

### RR4 (R4): Publish
- **Adopt the MODIFY.** Publish is a **state change with per-target delivery status**: `Drive ✓ · BT manual ☐ · ClickUp ✓ · Slack ✓ · Print queued`. The set shows amber "incomplete" until each required target is confirmed. The acknowledgement request goes out only when BT is confirmed (R4).
- BT is **assisted or manual with a checklist** in v1; the platform writes the current-set link into a BT job custom field (D9, `D:§5` option c).
- Luiza wants "upload in one place" but is wary of 100% automation (`I:N17`, I7). Per-target status with a human tick fits both.

### RR5 (R5): Folder standard
- **Adopt the MODIFY, with corrected structure.** Mirror BT at house root (`01. Survey`, `02. Committee`, `03. Plans`, `04. Permits & Documents`) and inside `03. Plans` (`00. Waiting for City Approval`, `01. Approved`, `02. Construction Documents`). Drive-only folders inside `03. Plans` start at 05 (D1, D2, `D:§2.1`).
- `01. Approved` = **city-stamped record, as received**, dated by approval, never edited. "Current for construction" = register view + `02. Construction Documents` with the merged current-set PDF (R5, I12, S7).
- Apply to **new houses and pre-framing active houses only**, from Phase 1. Confirm BT tree with one screenshot first (R5, D1, `S:D.11`).

### RR6 (R6): Site
- **Adopt the MODIFY.** Per-sheet QR **out of v1**. One QR per house on the blue bag cover, the job sign and the change cover sheet (R6, R:Q3, W-FL1, W-AD2).
- Keep ack + escalation + auto-print with change cover sheet (I11).
- **Pre-milestone gate moves to Phase 1** as a manual BT schedule checklist for truss order, framing and MEP rough. Affected trades confirm before fabrication (R6, S2, F10).
- **Where I disagree, in part:** the seal argument only rules out stamping a QR at Publish. A static per-sheet QR placed by the designer before sealing would not break the seal, and a QR already exists on the plans (`I:N7`). I still agree to drop per-sheet QR for v1, on the behaviour evidence (I11, S8) and because the per-house QR is cheaper. Revisit with scan logs (>1 scan per house per week) (R:Q3).

### RR7 (R7): Phasing
- **Adopt the MODIFY.** Replace "≈30% of value" with a testable hypothesis: **Phase 0 halves approval → field latency on new revisions** (R7).
- Phase 0 = templates centralized, naming for new files, RACI + backups, baseline metrics, Bluebeam slip sheet on the design desk. **No migration** (R7, `S:D.11`, F18).
- Phase 1 on Make only with a named owner and a sunset at Phase 2 start, or as a minimal LUIH OS form. The reuse inventory (`D:§4`) makes the LUIH OS form more viable than R00 assumed `[INF]`. Leadership decides.

### RR8 (R8): Governance
- **Adopt the MODIFY.** Ask leadership for a **precedence matrix by topic**: plans govern geometry, structure, dimensions and layout; the Specbook governs products, finishes and quantities; the Design Book is derived and must cite the Set Version it was built from. A Design Book change that touches layout opens or attaches to a package (R8, `S:D.2`, F11).

### New items from the red team's gap list
| ID | Recommendation | Evidence |
|---|---|---|
| RR9 | Package field `cost_schedule_impact` (none / cost / schedule / both). A BT change order link is required before Publish **when the change is buyer-visible or above a cost threshold leadership sets**. *Disagreement:* the red team gates on any impact ≠ none; Mulbry's fix cost $690 and was resolved the same day (S2), so a blanket gate would add load on Ingrid for small fixes. | R:Q4, S1, S2, W-AIA1, W-BT5 |
| RR10 | Buyer sign-off: buyer-visible changes (elevation, layout, finishes) go through a BT client change order **before** Publish. Don't build buyer approval in LUIH OS. | R:Q4, `S:D.5`, W-BT5 |
| RR11 | Trade distribution: Package lists `affected_trades`; Publish sets BT sub visibility and notification; trades confirm before fabrication for gated milestones. | R:Q4, S2, `S:N-S1`, `S:N-S12`, W-BT3 |
| RR12 | RFIs stay in BT (number, assignee, schedule link, deadline). Package trigger type `RFI-<n>`. No Plan Room RFI module. | R:Q4, W-BT6, `S:B` V items |
| RR13 | Release before stamp needs a **named authorizer** as a hard field on the `RELEASED-UNSTAMPED` transition, with an expiry. | R:Q4, I7, S4, F5 |
| RR14 | Cross-sheet check before signing: reuse the internal review (127 checks) and Submission Checklist. | R:Q4, S2, `I:N21` |
| RR15 | `AS-BUILT` package at closeout, for occurrences that only record what was built. | R:Q4, I7 |

---

## 5. Revised metrics

| Metric | Validated baseline | Target (Phase 2 exit) | Evidence |
|---|---|---|---|
| Document incidents | 17 in 12 channels over 6 months (0.24 per house-month); 8 material (0.11) | Material: 0 on register houses. All: −50% | S15, `S:C` |
| "Which version / where is it" questions | 0.42 per house per month (30 / 72 house-months), lower bound | ≤ 0.2 (−50%), same method | S10, `S:B` |
| Doc posts as share of human top-level posts | 40% (133/335) | Tracked, no target; should fall as Publish posts consolidate | S10 |
| Manual actions per document event | ~5 for one person, +1 person on occurrences (estimate, `[INF]`) | 1 Publish + a BT checklist tick until the spike passes | I13 |
| Approval → field notified | Not measured. Oberlin: March change never reached BT | Measure in Phase 0; Phase 0 hypothesis: halve it. Then < 4 business hours | S1, R7 |
| Set acknowledged by super/PM within 24 h | No mechanism; ✅ reactions only; push posts get zero replies | ≥ 90% | S8, `S:D.9` |
| Affected trades confirmed before truss order / framing / MEP rough | Not tracked | 100% of gated milestones | RR6, RR11 |
| BT listing vs register mismatches per week | Not tracked | 0 | R2, R4 |
| New and pre-framing houses on the folder standard | 0 | 100% | RR5 |
| ClickUp `Wrong Plan Version` tags | 3 in total | Not usable as a baseline | `D:§3` |
| Rework dollars from document incidents | Unknown. $196K/yr is all rework, not document control | Attribute per material incident with construction before Phase 2 | S13, S2 ($690) |

---

## 6. Open questions and next interviews

### Open questions
1. **BT spike:** reverse-engineer the web upload call into `luih-buildertrend-api`, seek a partner agreement, or stay manual? (D9, `D:§5`)
2. **BT tree:** one screenshot of a current job's `03. Plans`. Is there a fourth subfolder after `02. Construction Documents`? Is it "00. Waiting for City Approval" or "00. In Review"? SL-WAT shows a nested `02. Construction Documents → 03. Plans → 02. Construction Documents` path. (D1, `S:D.4`)
3. **Partial-revision folder** in BT that holds only the latest revision's changed sheets: name, and who empties it. (I10)
4. **QR on the plans today:** what does it link to and who can see it? (`I:N7`)
5. **S9 dataset:** publish the method behind 64% and 10-of-11 before citing them. (S9)
6. **Legal/EOR:** what marking is allowed on sealed PDFs (cover sheet, margin label, superseded stamp on the superseded copy)? (W-FL1, R:Q3)
7. **V-number with partial resubmission** in Orlando versus full book in Winter Park and Tampa. (`I:N11`, R3)
8. **Private-provider approvals:** shown differently from city approvals in BT? (`I:N6`)
9. **Who creates the Drive house folder** from `02. Library/01. STANDARD FOLDER`, and at what trigger? (I2, DR-TPL)
10. **Date of the first `[Specbook Updated] (vN)` post.** (D6)
11. **Precedence language** in buyer contracts. (R8)
12. **How often** an occurrence is created after the fact to match what was built. (I7)

### Next interviews
| Who | Why | Evidence |
|---|---|---|
| Luiza Dias | Confirm "X" = Ingrid; who "Ká/Cata/Kaki" is (Caroline Bramigk or Ekaterina Zink); surveyor name; QR target | `I:N1`, `I:N2`, `I:N5`, `I:N7` |
| Ingrid Dourado | Partial-revision folder; which template steps are outdated; who backs her up | I10, `I:N14`, S12, `S:D.12` |
| Victor Moura, Vini, Mike Lewellen | Daily-log line + office print; who collects the print; who orders the Foundation Survey; whether they'd enforce a pre-milestone gate | I11, `I:N5`, R6 |
| Engineering coordinators (Matheus, Adriana, Carol) | Do they upload to BT and post templates for permit-issue revisions? | `I:N3` |
| Carol Penha or Gabi (DD) | Who creates the Drive house folder; naming alignment for design-phase folders | I2, `I:N12` |
| Karina Delomo | New pool process; who uploads pool sheets C1/C2 to BT | `I:N10` |
| Construction leadership | Precedence matrix; release-before-stamp authorizer; gate commitment; cost threshold for RR9 | R8, RR6, RR9, RR13 |
| Rafa (Rafael Jeronymo) | Process inputs; Corona and Bryant plan-vs-delivery cases | `S:N-S11`, `S:N-S12` |
