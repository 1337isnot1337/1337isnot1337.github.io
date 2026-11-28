#!/usr/bin/env python3
"""Monitor the deployed catalogue independently of GitHub's workflow scheduler."""
import json
import os
from pathlib import Path
import subprocess
import time
from urllib.request import Request, urlopen

WEBSITE = "1337isnot1337/1337isnot1337.github.io"
RESEARCH = "1337isnot1337/solved-conjectures"
ROOT = "https://itsdavis.com/solved-conjectures/"
WORKFLOW = "gh-pages.yml"
TITLE = "Public Solved Conjectures catalogue is behind or unavailable"
MARKER = "<!-- catalogue-freshness-monitor -->"
MINUTE = 60


def gh(*args):
    return subprocess.check_output(["gh", *args], text=True, timeout=45).strip()


def observe(now):
    def read(path, headers=None):
        request = Request(f"{ROOT}{path}?monitor={now}",
                          headers={"Cache-Control": "no-cache", **(headers or {})})
        with urlopen(request, timeout=20) as response:
            return response.read()

    research = gh("api", f"repos/{RESEARCH}/commits/main", "--jq", ".sha")
    website = gh("api", f"repos/{WEBSITE}/commits/main", "--jq", ".sha")
    provenance = json.loads(read("catalogue-provenance.json"))
    manifest = json.loads(read("build-manifest.json"))
    footer = read("", {"Range": "bytes=-8192"})
    live = provenance["rendered_source"]["commit"]
    web = provenance["website_commit"]
    consistent = (provenance["mode"] == "current"
                  and provenance["current_catalogue_validation"] == "passed"
                  and provenance["attempted_source"]["commit"] == live == manifest["source_commit"]
                  and manifest["source_dirty"] is False
                  and f'https://github.com/{RESEARCH}/commit/{live}">Source '.encode() in footer)
    fresh = consistent and (live, web) == (research, website)
    detail = f"Research {live} (expected {research}), website {web} (expected {website}), mode {provenance['mode']}, live checks agree: {consistent}."
    return fresh, live if consistent else None, detail


def active_run():
    runs = gh("run", "list", "-R", WEBSITE, "--workflow", WORKFLOW, "--branch", "main",
              "--limit", "30", "--json", "status")
    return any(run["status"] != "completed" for run in json.loads(runs))


def tracking_issue():
    issues = gh("issue", "list", "-R", WEBSITE, "--author", "@me", "--state", "open",
                "--search", f'"{TITLE}" in:title', "--json", "number,title,body")
    return next((issue["number"] for issue in json.loads(issues)
                 if issue["title"] == TITLE and MARKER in issue["body"]), None)


def save(path, state):
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(state) + "\n")
    temporary.replace(path)


def check(path, now):
    state = json.loads(path.read_text()) if path.exists() else {}
    try:
        fresh, progress, detail = observe(now)
        observed = True
    except (OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError) as error:
        fresh, progress, detail, observed = False, None, f"Could not verify the public release: {error}", False
    print(detail, flush=True)

    if fresh:
        if state.get("alert_due"):
            issue = state.get("issue") or tracking_issue()
            if issue:
                gh("issue", "close", str(issue), "-R", WEBSITE, "--comment",
                   f"The public homepage, manifest, and provenance now match both main branches. {detail}")
        path.unlink(missing_ok=True)
        return

    if progress and state.get("progress") != progress:
        state.update(since=now, progress=progress)
    age = now - state.setdefault("since", now)
    if age >= 60 * MINUTE:
        state["alert_due"] = True
    save(path, state)

    if state.get("alert_due") and not state.get("issue"):
        issue = tracking_issue()
        if not issue:
            body = (f"{MARKER}\n\nThe monitor has seen no verified recovery for at least an hour.\n\n"
                    f"{detail}\n\n[Public catalogue]({ROOT}) · "
                    f"[Publication runs](https://github.com/{WEBSITE}/actions/workflows/{WORKFLOW})")
            url = gh("issue", "create", "-R", WEBSITE, "--title", TITLE, "--body", body)
            issue = int(url.rsplit("/", 1)[-1])
        state["issue"] = issue
        save(path, state)

    if (observed and age >= 15 * MINUTE and now - state.get("last_dispatch", 0) >= 60 * MINUTE
            and not active_run()):
        gh("workflow", "run", WORKFLOW, "-R", WEBSITE, "--ref", "main")
        state["last_dispatch"] = now
        save(path, state)
        print("Requested a catalogue refresh.", flush=True)


if __name__ == "__main__":
    check(Path(os.environ["STATE_DIRECTORY"]) / "freshness.json", int(time.time()))
