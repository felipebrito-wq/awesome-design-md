# Claims register (from plan-room.html R00)

Validator owner: **I** = interviews (Granola), **S** = Slack, **D** = Drive/ClickUp/BT/code, **R** = red team (logic and recommendations).

## Interviews and process (I)
| ID | Claim |
|---|---|
| I1 | Drive holds all versions from early stages (studies, DWG, SketchUp, PDFs). BT holds only the latest approved PDFs, for construction and sales. |
| I2 | Drive folder is created from an existing template, probably by Carol (DD). |
| I3 | Occurrence revision: dated folder in Unsigned → signed → "Ready for Submission" → uploaded to BT plus a standard Slack message. |
| I4 | Permit flow: Ready for Submission → Luiza submits → approved files at the Approved root (no R01/R02), old files → Old. BT: Waiting folder cleared, Approved updated. |
| I5 | "Approved" ≠ issued: the city approves, then the fee is validated and paid, then the permit card, then the stamped plans. Luiza marks the milestone only once she has both the card and the stamped plans. |
| I6 | Luiza's quote "more attention than time"; the copy-paste loop across Drive, BT, ClickUp and Slack. |
| I7 | Exceptions: construction executes before the occurrence exists; release before the stamp; revision cancelled mid-flow (by "marketing"?). |
| I8 | Ingrid identifies dependent sheets from memory (drainage → landscape) and wants a reminder. |
| I9 | Demo permit about 60 days before the building permit; tree permit is a prerequisite in Orlando; septic only when applicable. |
| I10 | Field asked to keep a partial-revision area so they can see which sheets changed. |
| I11 | Senna: daily log confirmation ("updated plans to V2") plus auto-print to the office printer; Mike comes from a radio/paper culture; BT links open the last page visited. |
| I12 | Orlando and Orange County: files are saved as received from the city. |
| I13 | "4–5 manual steps per status change" (estimate). |

## Slack (S)
| ID | Claim |
|---|---|
| S1 | Oberlin: committee changed A-8 (brick) in March and BT wasn't updated; construction used the old elevation; brick shortage 3 weeks before closing; spec book differs in about 15 items; CO postponed. |
| S2 | Mulbry: 9'-4" vs 9' ceiling/bearing conflict; trusses at 9'; framers pulled off (2026-05-26). |
| S3 | Mulbry 2026-10-06: tile layout only in the OLD Design Book; "missing half of the pages". |
| S4 | Stetson 1135: demolished before approved plans existed (03-26); on 10-05 decided to build from the set in "00. Waiting for City Approval". |
| S5 | Langholm: CMU wall built 8" off (2026-07-30), needed a truss engineering letter. |
| S6 | 121 Fawsett 2026-10-08: "I just reverted the project to the previous version in BT". |
| S7 | Sep 14: BT shows two electrical sets (stamped in Approved, coordinated in Construction Documents) across more than 10 channels. |
| S8 | Quote, Senna #homebuilding Aug 14: "job channel works when field pulls, not when design pushes". |
| S9 | Felipe's post: 64% of plan revisions are multi-discipline; 10 of 11 Design Book layout changes had no follow-up plan revision. |
| S10 | About 35% of job-channel messages are doc-update posts; about 1 "which version" question per house per month. |
| S11 | Standard post templates `[ PROJECT REVISION ]`, `[ PROJECT REVISION APPROVED ]`, `[PERMIT ISSUED]`. |
| S12 | Ingrid: "I now manage all occurrences" (#2623-s-bryant-cir 06-22). |
| S13 | About $196K/yr rework and 143 procurement occurrences/yr (#tech sprint review 07-22). |
| S14 | Victor Magalhães #homebuilding 08-19: four gaps (announce, batch, version, propagate). |
| S15 | 10+ incidents in 4 job channels traced to outdated or ambiguous docs. |

## Drive / ClickUp / BT / code (D)
| ID | Claim |
|---|---|
| D1 | BT folders: `00. Waiting for City Approval`, `01. Approved`, `02. Construction Documents`, `04. Permits & Documents`; the name of 03 is unknown. |
| D2 | Drive `03. Plans/02. Permit Book (PB)/{01. Unsigned, 02. Signed/{01. Ready for Submission, 02. Waiting for Approval}, 03. Approved, 04. Narrative}`. |
| D3 | Inconsistencies: date formats (abr.07, Sept.17, Aug.31.026, Sep.08.2029), R-numbers reused, occurrence folders in 3 places, "Ocurrence" typo. |
| D4 | No "D0" convention anywhere in Drive. |
| D5 | ClickUp D&P Phases 7.3–7.9 map to folder states. |
| D6 | The Specbook in LUIH OS is versioned v1/v2/v3 with a Slack bot (since about Sep 2026). |
| D7 | Architecture principle "Platform owns state, ClickUp owns workflow" (ARCHITECTURE_MIGRATION.md). |
| D8 | No LUIH OS module for plans or permit documents exists yet. |
| D9 | BT public API is limited for document upload (risk). |
| D10 | Mensagens padrões_R00 lives in Ingrid's personal Drive. |
| D11 | Mulbry keeps dated approved snapshots; Amherst keeps flat current sheets. |

## Recommendations to stress-test (R)
| ID | Claim |
|---|---|
| R1 | Root problem is change control/propagation/acknowledgement, not storage. |
| R2 | Keep Drive as storage and BT as the field view; LUIH OS is the control layer (no new DMS). |
| R3 | One Set Version per house (V-number) plus sheet R-numbers. |
| R4 | One Publish action automates Drive, BT, ClickUp, Slack and print. |
| R5 | Drive folders 00–04 mirror BT; Drive-only folders 05+; flat Approved plus immutable packages. |
| R6 | Site: QR on every sheet plus acknowledgement plus auto-print; pre-milestone gate. |
| R7 | Phase 0 (no code) captures about 30% of the value in 2 weeks; Phase 1 on Make. |
| R8 | Governance: the plan set is authoritative over the Design Book. |
