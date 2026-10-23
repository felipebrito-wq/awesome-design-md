---
name: ux-laws-check
description: Audit any screen, flow, form, onboarding, checkout, dashboard, or design spec against 7 UX laws (Fitts, Hick, Zeigarnik, Jakob, Goal Gradient, Von Restorff, Miller). Use when designing, reviewing, or critiquing UI/UX, writing a PRD with a user flow, or when a user drops off, abandons a signup, or "can't find the button". Triggers - "review this screen", "UX audit", "why do users drop off", "check the design", "is this flow too heavy", "design review".
---

# UX Laws Check

Core rule: **a good screen makes the user think less.** Drop-off is rarely the user's fault; it is the screen demanding too much effort. Audit every flow against the 7 laws below, then report findings.

Source: lawsofux.com. Tag each recommendation to a pillar: **Cheaper · Faster · Better**.

## The 7 laws

| # | Law | Principle | Check | Red flags | Fix |
|---|-----|-----------|-------|-----------|-----|
| 1 | **Fitts** (1954) | Time to hit a target grows with distance and shrinks with size | Is the primary action large and close to the user's focus/thumb? | Tiny or far CTA, small tap targets (<44px), primary and destructive actions adjacent | Enlarge and move the primary CTA, add spacing, use screen edges and corners |
| 2 | **Hick** (1952) | Decision time grows with the number of options | How many choices per screen or step? | Long menus, 5+ equal-weight CTAs, plan tables with no recommended default | Cut options, progressive disclosure, one clear default |
| 3 | **Zeigarnik** (1927) | Unfinished tasks stay in memory and pull people to finish | Is partial progress saved and visibly resumable? | Lost state on exit, no "continue where you left off", no reminders | Save drafts, show "2 of 5 done", resume prompts |
| 4 | **Jakob** (Nielsen) | Users expect your product to work like the ones they already use | Does it follow familiar conventions? | Custom-invented patterns, nonstandard icons, logo not linking home, unusual form behavior | Use standard patterns. Innovate only where it creates real value |
| 5 | **Goal Gradient** (Hull, 1932) | Motivation rises as the goal gets closer | Does the user see progress and how close the end is? | No progress bar, unknown step count, flat effort curve | Progress indicator, start users at a non-zero state, front-load easy steps |
| 6 | **Von Restorff** (1933) | The distinct item is the one remembered | Does exactly one thing stand out per screen? | Everything highlighted, 3 "primary" buttons, color overload | One visual emphasis per view. Reserve contrast for the key action |
| 7 | **Miller** (1956) | Short-term memory is limited. Chunk information | Is info grouped, with one decision at a time? | Long unbroken forms, dense tables, 10-field step | Chunk into groups, one question per step, defaults, autofill |

Note on Miller: "7±2" is a heuristic. Modern research suggests ~4 chunks of working memory. Treat 7 as a ceiling, not a target.

## Severity rubric

Use the same scale for every finding so audits are comparable:

- **Blocker**: stops or reverses the task (lost input, unreachable CTA, mis-tap destroys work).
- **Friction**: the task completes but with extra effort, errors, or abandonment risk.
- **Polish**: cosmetic or marginal, with no measurable effect on completion.

Scorecard mapping: Fail = at least one Blocker, Weak = Friction only, Pass = Polish or nothing.

## Static vs flow context

Zeigarnik (saved state, resume) and Goal Gradient (real progress across steps) cannot be judged from a single static screen. If you only have a screen or mockup, mark them **"Needs flow context"** and list what to check (draft persistence, resume behavior, step count). Do not guess a status.

## Procedure

1. **Scope**: identify the screen, flow, or spec under review and the user's primary goal on it.
2. **Run all 7 checks.** Do not skip laws that look irrelevant; mark them "N/A" with one line of reason.
3. **Find tensions**: laws can conflict (Hick wants fewer options, Jakob wants the familiar full menu; Von Restorff wants emphasis, Hick wants calm). Name the trade-off and pick a side.
4. **Rank** by estimated drop-off or effort impact, not by law number.
5. **Recommend** concrete changes, each tagged Cheaper / Faster / Better, with the expected business effect (conversion, completion rate, support cost, time to task).
6. **Be honest about evidence**: separate what you observed in the design from what you infer. Without analytics or user data, label findings as hypotheses and suggest the metric that would confirm them (step-level drop-off, time-to-click, error rate).

## Output format

```
UX LAWS AUDIT: <screen / flow>
User goal: <one line>

Scorecard
| Law | Status (Pass / Weak / Fail / N/A / Needs flow context) | Evidence |

Top issues (ranked by impact)
1. <issue> | Severity: <Blocker/Friction/Polish> | Law: <x> | Pillar: <Cheaper/Faster/Better> | Fix: <specific change> | Impact: <metric>

Tensions between laws: <if any, and the call made>
Hypotheses to validate: <metric / test>
Verdict: <ship / fix first / rethink>
```

Keep it short. Cut generic advice. If the design is already strong, say so and stop.

## When writing or generating UI (not just reviewing)

Apply the laws up front: one primary CTA sized per Fitts, at most 3-5 visible choices, progress shown on any multi-step flow, standard patterns by default, one emphasized element per view, and inputs chunked one decision at a time.
