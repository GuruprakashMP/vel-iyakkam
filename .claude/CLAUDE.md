# Commit rules for this repository

Every commit must count on the owner's GitHub contribution graph.

- Author AND committer must be the repository owner: name `GuruprakashMP`, with the
  same email as the owner's earlier commits (`git log --format='%an <%ae>' | sort -u`).
  Run `git config user.name` / `git config user.email` with those values before the
  first commit of a session — cloud containers default to a bot identity.
- No AI attribution anywhere: no `Co-Authored-By`, no session links, no tool or model
  names in commit messages, PR titles or PR bodies. Plain, direct messages only.
- Contributions only count once the commits reach `main`; prefer "Rebase and merge"
  so each commit is kept and no merge-commit message is added.
