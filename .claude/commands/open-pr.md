Open a pull request from the current feature branch to the `stage` branch on GitHub (adobecom/da-events).

## Steps

1. Run `git branch --show-current` to get the current branch name. If already on `stage`, `dev`, or `main`, stop and tell the user to switch to a feature branch first.

2. Collect the following details. The user may pass them as `$ARGUMENTS` in the format:
   `ticket: MWPW-XXXXX | summary: ... | test plan: ...`
   Parse them if present. For any that are missing or empty, ask the user before proceeding. Do NOT skip this step — all three are required.

   - **Ticket** — e.g. `MWPW-12345`. If the branch name contains a ticket pattern like `MWPW-\d+`, pre-fill it and confirm with the user.
   - **Summary** — 2–4 sentences: what changed and why.
   - **Test plan** — bullet list of steps a reviewer should follow to verify the change works, including any relevant URLs or edge cases.

3. Check whether the branch has an upstream tracking remote. If not, push it with `git push -u origin <branch>`.

4. Use the `gh` CLI to create the PR:
   - **Base branch**: `stage`
   - **Title**: `<ticket>: <one-line summary>` (keep under 70 chars)
   - **Body**: formatted as shown below

   ```
   gh pr create \
     --base stage \
     --title "<ticket>: <short title>" \
     --body "$(cat <<'EOF'
   ## Ticket
   [<ticket>](https://jira.corp.adobe.com/browse/<ticket>)

   ## Summary
   <summary>

   ## Test Plan
   <test plan as markdown checklist>

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   EOF
   )"
   ```

5. Return the PR URL to the user.
