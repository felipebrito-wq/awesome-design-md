# limit-bar

An always-on bar above the Claude Code prompt showing how much of your usage limits you've consumed:

```
5h    ███████████░░░░░░░░░ 54% · resets 2h 55m
Week  ████████░░░░░░░░░░░░ 42% · resets 1d 0h
```

- One row per limit window (5-hour, weekly, spend limit if any), green < 70%, amber ≥ 70%, red ≥ 90%
- Updates after every turn and whenever a window moves a whole point
- `/limits` prints the figures and opens a "Usage limits" panel
- Compact status-line entry where the client shows one

Draws in local sessions (terminal, and the desktop app's local Code sessions). Cloud sessions attach no drawing surface, so there only `/limits` works.

## Install

At the prompt of a terminal session:

```
/plugin install limit-bar --marketplace felipebrito-wq/awesome-design-md
```

Answer `y` to add the marketplace, then pick the user scope.

From a shell:

```
claude plugin install limit-bar --marketplace felipebrito-wq/awesome-design-md
```

This repository is private: your machine needs a git credential for github.com (an SSH key, or `gh auth login` then `gh auth setup-git`).
