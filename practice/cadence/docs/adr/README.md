# Architecture decision records

One file per decision, `NNNN-kebab-title.md`, numbered in order and never renumbered.
A superseded ADR stays in place with its status changed and a pointer to its replacement.

An ADR is worth writing when a choice is expensive to reverse, or when the reasoning will
be invisible from the code six weeks later. The track calls for at least these:

| ADR | Phase | Subject |
|---|---|---|
| 0001 | 00 | The stack, with the trade-off accepted for each choice |
| — | 03 | Dynamic workflow vs single session for the invariant audit, with token math |
| — | 05 | SDK service vs plugin vs plain Claude Code, with your own numbers |

Template: **Status** (proposed / accepted / superseded by NNNN) · **Context** (the forces
in play) · **Decision** (what was chosen) · **Consequences** (what this costs, including
what it makes harder).
