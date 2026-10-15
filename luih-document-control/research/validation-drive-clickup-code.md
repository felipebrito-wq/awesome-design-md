# Validation D: Drive, ClickUp, BT and code (claims D1 to D11)

Validator D. Run on 2026-10-11. Read-only throughout: nothing was posted, edited, moved or shared. Two Invisto repositories were cloned read-only to read their code: `Invisto/luih-buildertrend-api` and `Invisto/luih-os`.

Sources used: DR-ROOT, DR-MSG, CU-DP, CU-TKT, CU-TKL and GH-OS from `sources.md`. New sources found during this run (the synthesis should add them to `sources.md`):

| New ID | Item |
|---|---|
| DR-TPL | House folder template: Shared Drive "Home Building" › `02. Library` › `01. STANDARD FOLDER` (folder id `1JXmF7jxsa5reNcb869r8f7_dfno3rfLQ`, created 2024-07-23) |
| DR-GPERM | "Guide \| Permitting" (owner gabriella.santaella@luih.com, last modified 2026-03-26), doc id `1hJZN_74twBup-frVM5YuZ9YeH-XgR2WxCgbBYvJJSY0` |
| GH-BTAPI | `Invisto/luih-buildertrend-api` @ `f3b7045` (internal BT middleware) |
| GH-LOS | `Invisto/luih-os` @ `517e758` (2026-10-09, Engineering's LUIH OS) |

Tags: **[INF]** marks an inference. Everything else is read directly from the cited locator.

---

## 1. Verdict table

| ID | Verdict | Evidence (source + locator) | Correction / note |
|---|---|---|---|
| D1 | **CORRECTED** | DR-GPERM, section "Projeto aprovado › Builder Trend": *"Files > Documents > 03. Plans — Salvar na pasta '01. Approved' todos os desenhos … Mover os arquivos BLD, ENG … para a pasta '04. Permits and Documents'"*. Same guide: *"Salvar PDF e DWG na pasta '01. Survey' do BT"* and *"pasta '02. Committee' … do BT"*. DR-MSG: fence permit in BT *"'04. Permits and Documents' > 'FENCE-PERMIT'"* (BT link `buildertrend.net/app/Documents/Standard/81962511`). | The four folders are not siblings. BT top level mirrors the Drive house template: `01. Survey`, `02. Committee`, **`03. Plans`**, `04. Permits & Documents`. The missing "03" is `03. Plans`. `00. Waiting for City Approval`, `01. Approved` and `02. Construction Documents` sit **inside** `03. Plans`. The guide calls the waiting folder "In Review"/"00. In Review", an older name that DR-MSG now gives as "00. Waiting for City approval". [INF] The guide is from March 2026, so the current BT tree should be confirmed with one BT screenshot. Not checked: whether `03. Plans` holds a third subfolder after 02. |
| D2 | **CORRECTED** (partly confirmed) | DR-TPL tree (§2.1); 1225 Golfview and 907 N Hyer trees (§2.2, §2.3). | The `01. Unsigned / 02. Signed / 03. Approved` layout comes from the template (folders dated 2024-08 to 2025-01). Differences from D2: (a) `02. Signed/{01. Ready for Submission, 02. Waiting for Approval}` was added to the template only on **2025-10-13**, and houses got it by hand (Golfview 2025-10-24, Hyer 2025-10-31, where the names are lower-case: "01. Ready for submission"). (b) **`04. Narrative` is not in the template**. Golfview created it on 2026-10-06; Hyer keeps the narrative PDF loose at the PB root. (c) Every PB sub-folder also has an `00. Old`. (d) Template `03. Approved` contains `01. Received from the City` (added 2025-08-22). (e) Template `01. Unsigned` now has discipline sub-folders: `01. Trusses, 02. Civil, 03. Architecture, 04. Energy Calculations, 05. Landscape, 06. Structural` (added 2025-08 to 2026-06). |
| D3 | **CONFIRMED** (more examples found) | Drive folder-title search `Ocurrence/Occurrence/Occurence` (2026-10-11): 17 of 20 matching folders spell it **"Ocurrence(s)"**. Date formats seen: `jul.20.2026_`, `Jun.19.2026`, `Sep.16.2026`, **`Out.05.2026`** (Portuguese month), **`Dez.08.2025`** (Hyer Unsigned), **`Sep.08.2029`** (wrong year), `Approved_dec_13`, `Approved_mar_25.2026`, `Approved_Apr.22.2026`, `Approved_sep.04.2026- Site Plan` (Hyer Approved), and `Approved_Oct.10.2026 - Ocurrences - framing` (folder created 2026-10-07 but named Oct 10). | Additional problems: (a) the written standard is **`R0# - mmm.dd.yyyy`** (DR-GPERM "Salvar projetos no Drive"; template placeholder folder `RXX - xxx.XX.20XX` in `03. Plans/00. Old`), but none of the dated folders seen carry an R-number. (b) An occurrence folder sits inside a Narrative folder: Golfview `02. Permit Book (PB)/04. Narrative/Oct.06.2026 - Ocurrences - Project Revision`. (c) Files are misfiled or misnamed: 907 Hyer `01. Unsigned` holds `DD_2552 BROOKSHIRE AVE_civil.dwg/.bak` from another house, and 1225 Golfview files are named **"1125 Golfview"** (`NARRATIVE - 1125 Golfview St (full).pdf`, `1125 Golfview - Fence.dwg`). (d) Template typo `04. Interior Desgin (ID)`; houses spell it `04. Interior Design (ID)`. |
| D4 | **CONFIRMED** | Drive title and fullText searches for `D0`, `_D0`, `D00`, `_D01`, `- D0`: the only hits are UUID-prefixed import files (e.g. `d045a6ee-…__Plans…pdf`) and a doc whose body mentions D&P phases. No folder or file uses a D0 convention. | The convention that exists is **R-numbers** (`R0# - mmm.dd.yyyy` in DR-GPERM; `RXX` in DR-TPL; file names like `907 HYER AVE_R03.layout/.skp/.skb` in Hyer `03. Plans`). |
| D5 | **CONFIRMED** (mapping is [INF]) | CU-DP custom field `🏷️ D&P Phases` (`e9007d22-…`), all 19 options in order: 7.1 to do · 2.2 architectural design briefing · 2.3 design development · 5.1 architectural design committee · 5.2 dd revisions · 5.3 [legacy] 3rd committee · 5.4 truss set · 5.5 project coordination · 5.5.1 internal review · 5.6 plans check (trusses) · 5.7 private provider review · 5.8 design review (PP) · **7.3 ready for submission · 7.4 city review · 7.5 narrative preparation · 7.6 comment resolution · 7.7 approved - bp pending · 7.8 information update · 7.9 permit issued**. | [INF] Folder mapping: 7.3 ↔ `02. Signed/01. Ready for Submission`; 7.4 ↔ Drive `02. Waiting for Approval` and BT `03. Plans/00. Waiting for City Approval`; 7.5 ↔ `04. Narrative`; 7.6 ↔ back to `01. Unsigned`; 7.7 ↔ `03. Approved/01. Received from the City`; 7.8 ↔ BT `01. Approved` updated plus a Slack post (an action, not a folder); 7.9 ↔ `04. Permits & Documents/02. BLD-PERMIT`. Note that the occurrence tickets (CU-TKT/CU-TKL) use a **separate** field, `🏷️ Design & Permit Status`: To Do · Project Review · Inspection Check · Ready for Submission · City Workflow Request · City Review · **Information Updated BT** · Requirement · On hold · Done · Canceled. So there are two status vocabularies for the same folder moves. |
| D6 | **CONFIRMED** in code; start date **UNVERIFIED** | GH-LOS `modules/specbook/integrations/slack.ts:53-54` and GH-OS `src/modules/specbook/integrations/slack.ts` (same text): `` `[Specbook Updated]` <!channel> New version of the Spec Book (v${versionNumber}) for *address* … Selections Folder Link: … ``. Schema: `specbook_version.version_number`, `files` jsonb, `distribution_results` jsonb, `note`, `fyi_recipients` (GH-OS `src/modules/specbook/data/schema.ts:352-379`); `specbook.current_version` (GH-LOS schema:89). Distribution goes to Drive, BT, Slack and a fixed channel (`integrations/orchestrator.ts`). | The "since about Sep 2026" date can't be checked here, because both clones are shallow and the PM repo only has the vendoring merge on 2026-09-16. The S validator should confirm the first `[Specbook Updated]` post in Slack. Also relevant: ClickUp shows a high volume of `[Occurrences] - Spec Book Update` cards (§3). |
| D7 | **CORRECTED** | `ARCHITECTURE_MIGRATION.md` is not in GH-OS, GH-LOS (find by filename), or Drive (title and fullText search). The exact phrase "Platform owns state / ClickUp owns workflow" appears nowhere in either repo or in Drive. Equivalent wording does exist: GH-OS `documents/prd/F03_HomologationGate.md:9` *"ClickUp announces; it never decides. Item status is the single source of truth — never ClickUp."*; F03:59 *"The app owns the decision … ClickUp is the cross-team signal layer"*; `F04_Specbook.md:445` *"Drive stays the distribution copy; the platform is the source of truth."*; TRFC (`context/team-docs/TRFC_LuihOS_Foundation.md:187`) *"Slack is a delivery channel, not a source of truth."* | Cite F03/F04 and the TRFC instead of `ARCHITECTURE_MIGRATION.md`. Two older docs say the opposite: `F01_AIItemRegistration.md:19` *"ClickUp owns the approval state machine"* and `backlog/FX1_PortfolioProductReview.md:193` *"ClickUp owns state"*. The page should say the principle was adopted from F03 (Jul 2026) onward, not that it is universal. |
| D8 | **CONFIRMED** | GH-LOS `modules/` = `catalog, design-brief, pattern-book, specbook`. GH-OS `src/modules/` = `catalog, pattern-book, specbook`. Grep for plan-set, plan room, permit doc, sheet revision or document control returns nothing in `src/`, `server/`, `modules/`, `services/`. | Closest existing pieces: `src/permit-recon/phase0.ts` (GH-OS), a read-only Drive crawler of `03. Ongoing Projects` (it hard-codes root `1BKFSwIC88aMhzLx4gtFr0HM6qSn6Sg8o` and calibration folder = 1425 W Yale `03. Plans`); and GH-LOS `design-brief`, which parses the DD report, survey and PDFs. Neither manages plan versions. |
| D9 | **CONFIRMED, and stronger than stated** | GH-BTAPI `README.md` §1: *"o Buildertrend não disponibiliza uma API pública oficial para integrações de terceiros. Esta aplicação atua como um intermediário técnico, realizando requisições aos mesmos endpoints consumidos pelo frontend"* (gloss: "Buildertrend offers no official public API for third parties. This app is a technical intermediary that calls the same endpoints the web frontend uses"). It also warns that BT may change endpoints, invalidate sessions or block automated access, and that there is no sandbox. The middleware exposes only `/jobs` (grid, GET, PUT), `/bills`, `/schedules` (Calendar/Grid) and `/purchase-orders`, with **no documents or files endpoint** (`src/app.ts`, `src/external/buildertrend/data.ts`). GH-OS `src/modules/specbook/integrations/buildertrend.ts:5`: *"BT exposes no public write API"*; it writes only job custom fields ("Selections Link", "Slack Channel ID"). | Change "limited for document upload" to: **there is no public BT API; the internal route depends on a session cookie and is unofficial; document upload is not implemented and would need reverse-engineering the web app's upload flow.** See §5 for external sources. |
| D10 | **CONFIRMED** | DR-MSG metadata: `owner: ingrid.dourado@luih.com`, created 2026-03-27, modified 2026-10-01, shared with Felipe 2026-06-23. Files in the Home Building Shared Drive have no `owner` field in metadata, so a populated owner means a My Drive file. | [INF] It is in Ingrid's My Drive and not in the Shared Drive; the parent folder isn't visible to this account. A second process doc, DR-GPERM, is also in a personal Drive (owner gabriella.santaella@luih.com). |
| D11 | **CONFIRMED as a pattern** (Mulbry/Amherst not re-opened) | 907 N Hyer `03. Approved` = dated snapshot folders (`Approved_dec_13` + `.zip`, `Approved_mar_25.2026`, `Approved_Apr.22.2026`, `Approved_sep.04.2026- Site Plan`). 1225 Golfview `03. Approved` = flat current sheets (`A2.pdf, A4…A13, L2, S7, ST-1, ESM, PA, Truss Engineering.pdf`, all uploaded 2026-01-22) plus `01. Received from the City`. | Both patterns appear on other houses too, so the split is house-by-house, not a rule. The template expects flat sheets plus `01. Received from the City` (raw city return). DR-GPERM says approved files go to `03. Approved` and *"Apagar os documentos 'Narrative' e requerimentos"* (gloss: "delete the Narrative and request documents"). |

---

## 2. New trees

### 2.1 House folder template (DR-TPL)

Path: Home Building › `02. Library` › `01. STANDARD FOLDER`. Folder dates show it is still edited (latest change 2026-09-22). Who creates house folders from it is not recorded in metadata, so I2 ("probably Carol") stays with validator I.

```
01. STANDARD FOLDER/
├── 01. Survey/
├── 02. Committee/
├── 03. Plans/
│   ├── 00. Auxiliary/                         (added 2025-07-08)
│   ├── 00. Old/
│   │   └── RXX - xxx.XX.20XX/                 ← revision-folder naming placeholder
│   ├── 01. Design Development (DD)/
│   │   ├── 01. Reference project/
│   │   ├── 02. Studies/                       (2025-08-28)
│   │   └── 03. Truss Set/                     (2025-08-28)
│   ├── 02. Permit Book (PB)/
│   │   ├── 01. Unsigned/
│   │   │   ├── 00. Old/  01. Trusses/  02. Civil/  03. Architecture/
│   │   │   └── 04. Energy Calculations/  05. Landscape/  06. Structural/
│   │   ├── 02. Signed/
│   │   │   ├── 00. Old/
│   │   │   ├── 01. Ready for Submission/      (2025-10-13)
│   │   │   └── 02. Waiting for Approval/      (2025-10-13)
│   │   └── 03. Approved/
│   │       ├── 00. Old/
│   │       └── 01. Received from the City/    (2025-08-22)
│   ├── 03. Construction Documents (CD)/
│   │   └── 00. Old/
│   ├── 04. Interior Desgin (ID)/              ← typo in template (2025-09-02)
│   └── 05. Engineering Studies (ES)/          (2026-04-14)
├── 04. Permits & Documents/
│   ├── 00. Old/
│   ├── 01. DUE DILIGENCE/  02. BLD-PERMIT/  03. DEMO-PERMIT/  04. TREE-PERMIT/
├── 05. Selections/
├── 06. Quotation/
└── 07. Specbook/
```

Older variant: 1425 W Yale St (2024) uses `03. Plans/03. Permit Book (PB)`, so the PB was once numbered 03.

### 2.2 1225 Golfview St (folder created 2025-07-03), `03. Plans`

```
03. Plans/
├── 00. Auxiliary/   00. Old/
├── 01. Design Development (DD)/
├── 02. Permit Book (PB)/
│   ├── 01. Unsigned/   → Civil/, Landscape/, 1125 Golfview - Fence-FOLHAS.pdf   (note "1125")
│   ├── 02. Signed/     → 00. Old/, 01. Ready for Submission/, 02. Waiting for Approval/  (2025-10-24)
│   ├── 03. Approved/   → 00. Old/, 01. Received from the City/,
│   │                     A2 A4 A5 A6 A10 A11 A13 L2 S7 ST-1 ESM PA "Truss Engineering" .pdf (flat, 2026-01-22)
│   ├── 04. Narrative/  (2026-10-06) → Oct.06.2026 - Ocurrences - Project Revision/
│   ├── NARRATIVE - 1125 Golfview St (full).pdf     (note "1125")
│   ├── 1125 Golfview - Fence.dwg
│   └── SITE PLAN 1225 GOLFVIEW - DWG.dxf
├── 03. Construction Documents/                     (no "(CD)" suffix)
├── 04. Interior Design (ID)/                       (2026-03-18)
├── 1225 Golfview St_Facade.layout, …_Facade - Fence.layout   (loose working files)
└── Internal Review Checklist_1225 Golfview (sheet), Internal review 1225 golfview.pdf
```

House root: `01. Survey, 02. Committee, 03. Plans, 04. Permits & Documents, 05. Selections, 06. Quotation, 07. Specbook` plus a loose DD report.

### 2.3 907 N Hyer Ave (folder created 2025-07-19), `03. Plans`

```
03. Plans/
├── 00. Auxiliary/   00. Old/
├── 01. Design Development (DD)/
├── 02. Permit Book (PB)/
│   ├── 01. Unsigned/   → Dez.08.2025/, Feb.03.2026/, Mar.16.2026/ (dated, no R-number),
│   │                     907 HYER AVE_Dwelling.dwg, _Roof.dwg,
│   │                     DD_2552 BROOKSHIRE AVE_civil.dwg/.bak   ← another house's file
│   ├── 02. Signed/     → 00. Old/, 01. Ready for submission/, 02. Waiting for approval/ (2025-10-31, lower-case)
│   ├── 03. Approved/   → 00. Old/, Approved_dec_13/ (+ Approved_dec_13.zip), Approved_mar_25.2026/,
│   │                     Approved_Apr.22.2026/, Approved_sep.04.2026- Site Plan/   (dated snapshots)
│   └── NARRATIVE - 907 N HYER AVE (full).pdf       (no 04. Narrative folder)
├── 03. Construction Documents/
├── 04. Interior Design (ID)/
└── 907 HYER AVE_R02.skb, _R03.skb/.skp/.layout, "Backup of 907 HYER AVE_R03.layout"   (R-numbers on working files)
```

Only the first result page of each listing was read where noted. `01. Unsigned` may hold more items.

---

## 3. ClickUp: field vocabularies and occurrence volume

**Ticket list fields (CU-TKT 901112324227 and CU-TKL 901111611989).** Both lists share these fields:

- `📋 Ticket Type`: Occurrences · RFI · Customization · Catalog · Improvement (Committee, Budget Approval, Design, Market, Sales, Other).
- `📋 Source Area`: Design · Procurement · Construction · Permit · Portfolio · Sales.
- `👥 Responsible area`: 13 values.
- `📋 Request category`: 34 values.
- `🏷️ Design & Permit Status`: listed under D5.
- `🏷️ Waiting On`: 9 values.
- `🏷️ Type`: 90 root-cause values, including **`Design - Quality - Wrong Plan Version`**, `Design - Quality - Document Missing` and `Permit - Quality - Document Missing`.

CU-TKL also has `🏷️ Completion Category`, `🌐 Slack thread`, `requester_email` and `🏷️ Occurrence Status` (free text).

**Root-cause tagging is barely used.** `Type = Design - Quality - Wrong Plan Version` across the whole Home Building space returns **3 tickets in total**: [Trusses Revision](https://app.clickup.com/t/868jj31nd), [City submission - Missing sheets](https://app.clickup.com/t/868gt0fck) and [Landscape Review](https://app.clickup.com/t/868gh22v7). [INF] ClickUp therefore can't measure the version problem today. The S-validator incident counts are the better evidence.

**Occurrence tickets per month.** Method: keyword search `Occurrences`, limited to CU-TKL, filtered by creation date, all pages read, counting only tasks in CU-TKL whose title contains `[Occurrences]`. The counts are approximate: keyword search also catches `[RFI] or [Occurrences]` titles and misses misspellings like `[Occurences]`/`[Occurrence]`. Bulk-created cards are shown separately.

| Month (created) | `[Occurrences]` cards in CU-TKL | of which auto/bulk: "Spec Book Update" | auto: "New Item Homologation - CAT-…" (catalog bot) | Other |
|---|---|---|---|---|
| Jul 2026 | ≈146 | 0 | 42 | ≈104 (incl. bulk runs: 17 "Update 3D Images", 15 "Interior Design Improvements", 9 "Mirrors") |
| Aug 2026 | ≈126 | ≈40 | 0 | ≈86 (incl. 22 "Landscaping Plan", 12 "Façade Detailing") |
| Sep 2026 | ≈54 | 41 | 0 | ≈13 |

[INF] Raw counts mostly reflect bulk card creation, not field incidents. The September drop is consistent with the Ticket Hub workflow change (Kickoff deck, Sep 22 to Oct 1: "Everything starts on one form"). Plan-revision occurrences can't be separated from these counts without the `Type` field. Do not use these numbers as a "document problem" rate.

---

## 4. Code reuse inventory for a Plan Room

| Asset | Where | Reuse for Plan Room |
|---|---|---|
| Distribution orchestrator | GH-OS/GH-LOS `modules/specbook/integrations/orchestrator.ts` | The pattern for a single **Publish** action (R4): each channel (Drive, BT, Slack) runs on its own, results are stored as jsonb on the version row with compare-and-swap, failures are recorded and never thrown, and each channel can be retried. Copy the pattern for `plan_set_version`. |
| Version schema | `modules/specbook/data/schema.ts` (`specbook_version`: version_number, files, distribution_results, note, fyi_recipients) and `domain/changeTracking.ts` | Model for Set Version V-number plus changelog (R3). Sheet R-numbers would need a new child table. [INF] |
| Slack post + threaded changelog | `integrations/slack.ts` (`postUpdateMessage`, `postVersionReport`, `postCommunicationReply`) | Same shape as `[ PROJECT REVISION ]` / `[ PROJECT REVISION APPROVED ]` from DR-MSG; swap `[Specbook Updated] (vN)` for a plan-set header. |
| House channel resolution | `integrations/slackChannels.ts` (`houseChannelId`), `data/integrationRefsQueries.ts` (`setSlackChannelIdIfMissing`), BT custom field "Slack Channel ID" | Finds each house's job channel (SL-* IDs) without a lookup table. |
| Drive folder resolution and upload | `integrations/drive.ts` (`resolveSelectionsFolder`, `findExistingHouseFolder` by BT `job_name`, `uploadFilesReplacingInPlace`) | Locate `<house>/03. Plans/...`. Replace-in-place keeps file IDs, so links don't break, which suits a flat "current" Approved folder (R5). Today it only knows `05. Selections`. |
| BT job custom-field read/write | `integrations/buildertrend.ts` → GH-BTAPI `PUT /jobs/:id` | Could write a "Current Plan Set" link or version number into a BT job custom field [INF]. It **cannot** upload documents. |
| BT schedule read | GH-BTAPI `POST /schedules` (BT `Calendar/Grid`) | Input for a pre-milestone gate (R6: "is the current set acknowledged before slab/framing?") [INF]. |
| ClickUp adapter | GH-OS `server/adapters/clickup.ts` (`createOccurrenceCard`, HMAC `verifyWebhookSignature`, `extractTaskStatusChange`, status-name map); GH-LOS `modules/catalog/integrations/clickup/*`, `events/clickupConsumer.ts` | Listen for D&P Phase 7.x changes and drive folder moves or Publish; open occurrence cards from the Plan Room. |
| Drive inventory crawler | GH-OS `src/permit-recon/phase0.ts` (read-only OAuth, walks `03. Ongoing Projects`, checkpoints, writes `folders.json`/`files.json`, classifies Narrative docs) | Phase 0 baseline: measure folder-convention drift across all houses before any migration (R5). |
| PDF page rendering | GH-LOS `modules/design-brief/data/pdfPages.ts`, `pdfRender.ts`, `driveUrl.ts` | Sheet thumbnails and per-sheet split for a sheet register or a partial-revision view (I10) [INF]. |
| Module scaffolding | GH-LOS `modules/creating-a-module.md`, `lib/registry` (MODULE_REGISTRY) | Where a `plans` module would be registered (TRFC §MODULE_REGISTRY). |

What is missing: plan/sheet entities, R-number parsing, a BT documents client, acknowledgement or read receipts, QR codes and print.

---

## 5. Buildertrend API findings (D9)

**Primary, internal (high confidence)**

- GH-BTAPI `README.md` §1 says BT provides no official public API. The service replays the web app's own endpoints using a BT session cookie (`BUILDERTREND_SESSION_ID`), and there is no sandbox: *"Toda e qualquer operação de escrita … terá impacto real, imediato e irreversível"* (gloss: "every write has a real, immediate, irreversible impact").
- Endpoints implemented (`src/external/buildertrend/data.ts`): `POST /Jobsites/Grid`, `GET` and `PUT /Jobsites/{id}`, `POST /v1/bills/grid`, `GET` and `PUT /v1/bills/{id}`, `POST /Calendar/Grid`, `POST /PurchaseOrders/Grid`. **No Documents or Files endpoints.**
- GH-OS `src/modules/specbook/integrations/buildertrend.ts`: *"BT exposes no public write API"*. BT returns HTTP 200 on validation failure, and the job PUT needs the whole record (GET → transform → PUT).

**External**

None of these pages could be opened directly: the session proxy blocks buildertrend.com, launchnotes.io and supergood.ai. Statements below come from search-engine summaries and need a human click-through before anyone quotes them.

| Claim | Source | Type |
|---|---|---|
| Uploading files (Documents/Photos/Videos) is documented only as a web/mobile user workflow; no API is mentioned. | [Files Overview (BT help)](https://buildertrend.com/help-article/files-overview/), [Files on Mobile (BT help)](https://buildertrend.com/help-article/files-on-mobile/) | Official (end-user docs) |
| BT paused further Marketplace integrations after its CRM connectors (HubSpot, Salesforce, Pipedrive). | [Buildertrend roadmap: marketplace update](https://buildertrend-publicroadmap.launchnotes.io/announcements/buildertrend-marketplace-update) | Official roadmap post (content via search summary) |
| A REST API at `api.buildertrend.com` exists but is partner-gated and returns 401; there is no developer portal, OpenAPI spec or self-serve key. | [API Evangelist profile](https://providers.apievangelist.com/providers/buildertrend/), [apis.io](https://apis.io/providers/buildertrend/) | Third-party directory (hearsay) |
| An unofficial API/MCP is built by reverse-engineering authenticated browser flows. | [Supergood Buildertrend API](https://supergood.ai/docs/buildertrend-api), [Supergood report card](https://supergood.ai/api-report-card/buildertrend) | Vendor selling a workaround (hearsay) |
| "Buildertrend's API is robust enough for most residential workflows." | [Bolder Apps blog, Jul 2026](https://www.bolderapps.com/blog-posts/buildertrend-integration-custom-construction-apps-2026) | Consultancy marketing; conflicts with everything else, so low weight |

**Implication [INF].** Any plan that automates BT document upload (R4 "one Publish action automates … BT") depends on one of: (a) reverse-engineering BT's web upload call and adding it to `luih-buildertrend-api`, with the same fragility the README warns about; (b) a BT partner agreement; or (c) keeping BT upload manual and having the platform write only a link or version into a BT job custom field, which is already proven to work. R4 should be restated with (c) as the baseline.

---

## 6. Open items for other validators and the synthesis

- **S:** the date of the first `[Specbook Updated] (vN)` Slack post (D6).
- **I:** who creates the house folder from `02. Library/01. STANDARD FOLDER` (I2), and whether BT `03. Plans` holds anything after `02. Construction Documents`.
- **R:** D1 changes how R5 is worded. The Drive folders that should mirror BT are `03. Plans/{00,01,02}` inside each tree, not the house root. Also, R4 must not assume a BT upload API (§5).
- Add DR-TPL, DR-GPERM, GH-BTAPI and GH-LOS to `sources.md`.
