# Session protocol

How to run a "NEW GFX ENGINE" study session. Written so a fresh LLM with no
memory of previous sessions can pick up cleanly.

## Start of session

1. Read `README.md`, this file, and the **last three entries** of
   `LEARNING-LOG.md`. Do not read the whole log; it will grow past useful.
2. Confirm the working tree is clean:
   `cd ~/Downloads/gfxv23 && git status --porcelain`
   If it is dirty, commit or stash BEFORE starting. Unbacked work is the single
   biggest risk in this project — 5,080 lines sat uncommitted for seven weeks.
3. Pick the next module from `CURRICULUM.md` per the log.

## The 99% rule (context / session limit)

**Pause at 99% of the session limit, not at 100%.**

A session that dies mid-edit can leave `app.js` (7.7k lines, ~560KB) in a
half-written state, and rule 42 in DESIGN-LAW.md documents exactly how
destructive a partial edit to that file is: a spliced range silently deleted
`enrichFills()`, every pass after it aborted, and the page still rendered
243/243 and reported no errors. A broken edit here does not announce itself.

So, at 99%:

1. **Stop starting new work immediately.** Do not begin another template pass.
2. Finish only the write currently in flight, or abandon it cleanly with
   `git checkout -- <file>`.
3. Commit whatever is complete and green. A small honest commit beats a large
   broken one.
4. Push.
5. Append a `LEARNING-LOG.md` entry using the template at the bottom of this
   file, including a **RESUME HERE** line naming the exact next action.
6. State clearly to the user that the session is pausing and why.

**Resuming.** When the limit resets, the next session starts by reading the
RESUME HERE line and continuing from it. Do not re-derive what the log already
records as settled.

## Working rules

- **Never hand-splice `app.js` between two anchors.** Locate a named function's
  own opening and closing brace, or append. This is DESIGN-LAW rule 42 and it
  has already cost a full silent breakage.
- **Verify by rendering, not by reading.** The library reports 243/243 while
  being broken. After any pass, load the page and count what actually drew.
- **One concept per commit.** The commit message says what was learned and what
  it changed, in prose.
- **Push every session.** No exceptions.

## Log entry template

```
## YYYY-MM-DD — <module>

Studied:
Measured:            <the number, and how it was obtained>
Changed:             <files, commits>
Rejected:            <what was tried and thrown away, and why>
RESUME HERE:         <the exact next action>
```

The **Rejected** line matters as much as the others. DESIGN-LAW records an
early colour pass that proposed a pastel money word appearing nowhere in the
references and had to be thrown away. Recording that stops the next session
proposing it again.
