# AGENTS.md

## Workspace Scope

This local folder is the static Russian drills site that currently backs the non-typing practice pages.

- Root drill: tense trainer
- Additional pages: `possessives.html`, `plurals/`, `colours/`
- Launcher source in this folder: `launcher/index.html`

## Project Intent

These Russian pages/apps are being built around the user's real Russian study with his tutor.

- Treat new apps/pages as focused practice tools tied to material the user is actively learning.
- Prefer concrete, narrow drills over broad generic language-learning features.
- If a new Russian app/page is built and meant to be usable, add it to the launcher at `launcher/index.html` as well.

## Project Skill

- For drill UI, mobile readability, launcher integration, visual QA, or deployment work in this repo, consult `.codex/skills/russian-drill-workflow/SKILL.md`.
- Use that skill to orient future sub-agents so they preserve the drill-first product shape, phone readability, and the droplet-first deployment flow.

## Droplet Context

- Droplet SSH: `ssh root@wordai.macchiatolabs.ai`
- Main Russian drills deploy dir on the droplet: `/srv/russian.159.223.236.244.sslip.io`
- Launcher deploy dir on the droplet: `/srv/russian-hub.159.223.236.244.sslip.io`
- `macchiatolabs.ai/` and `macchiatolabs.ai/index` currently serve the launcher
- Drill routes on the apex currently live under:
  - `macchiatolabs.ai/index/tenses/`
  - `macchiatolabs.ai/index/possessives.html`
  - `macchiatolabs.ai/index/plurals/`
  - `macchiatolabs.ai/index/colours/`

## Deployment Workflow

- This is a droplet-first workstation. If a change is meant to go live, deploy it to the droplet.
- Default deployment order: push the change to GitHub first, then pull it on the droplet in the appropriate checked-out repo.
- Prefer `git push` locally and `git -C <repo> pull` on the droplet over copying files directly into the served directories.
- After pulling on the droplet, verify the deployed result with the relevant HTTP check, route check, or service check.
- If a deploy target's repo mapping is unclear, verify the droplet checkout and remote before deploying instead of skipping the GitHub-first flow.

## Related Russian Apps And Repos

- Static Russian drills in this workspace
  - GitHub repo: `https://github.com/Legalphoenix/russian.git`
  - Verified droplet checkout/remote: `/srv/russian.159.223.236.244.sslip.io`

- Russian typing practice / Russian Key Coach
  - Public URL: `https://typing.macchiatolabs.ai`
  - Static files served from: `/srv/typing.macchiatolabs.ai`
  - Source/backend repo on droplet: `/opt/russian-key-coach/repo`
  - GitHub repo: `https://github.com/Legalphoenix/russian2.git`
  - Sync service: `russian-key-coach-sync.service`
  - Backend bind: `127.0.0.1:8786`

- Launcher page
  - Public URLs: `https://macchiatolabs.ai/` and `https://macchiatolabs.ai/index`
  - Source edited from this workspace: `launcher/index.html`
  - Deploy target: `/srv/russian-hub.159.223.236.244.sslip.io/index.html`
  - TODO: no separate GitHub repo was verified for the launcher deploy target

## Useful Commands

- Check droplet reachability:
  - `ssh -o BatchMode=yes root@wordai.macchiatolabs.ai 'hostname'`

- Inspect current Caddy routing:
  - `ssh root@wordai.macchiatolabs.ai 'sed -n "1,260p" /etc/caddy/Caddyfile'`

- Check the typing backend service:
  - `ssh root@wordai.macchiatolabs.ai 'systemctl status russian-key-coach-sync.service --no-pager'`

- Check the deployed Russian drills repo:
  - `ssh root@wordai.macchiatolabs.ai 'git -C /srv/russian.159.223.236.244.sslip.io remote -v'`
  - `ssh root@wordai.macchiatolabs.ai 'git -C /srv/russian.159.223.236.244.sslip.io status --short'`

- Check the typing source repo:
  - `ssh root@wordai.macchiatolabs.ai 'git -C /opt/russian-key-coach/repo remote -v'`
  - `ssh root@wordai.macchiatolabs.ai 'git -C /opt/russian-key-coach/repo status --short'`

- Quick HTTP checks:
  - `curl -I https://macchiatolabs.ai/index`
  - `curl -I https://typing.macchiatolabs.ai`
