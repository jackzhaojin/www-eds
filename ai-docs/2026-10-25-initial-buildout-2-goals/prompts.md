# Prompts

Everything Jack typed in the session, in order, verbatim. Times are US Eastern on 2026-10-25. The two goals are `/goal` prompts: Claude Code turns the condition into a Stop hook whose evaluator reads only the conversation and keeps the session working until the condition holds (or until Jack clears it).

## Prompt 1: Goal 1, prep and first page (09:34 ET)

```text
/goal Read /Users/jackjin/dev/jackzhaojin/jackzhaojin.github.io/ai-docs/2026-10-24-eds-migration/start-here.md and the files it lists, then complete Phase 1 (Prep, Foundation and first page, Article archetype) of workstreams.md in this repo, following its rules. Done when this conversation shows all of: (1) curl -s -o /dev/null -w "%{http_code}" https://main--www-eds--jackzhaojin.aem.live/ printing 200, with the v3 home page there; (2) stardust gate output for the home page and one explainer-heavy article at 1440 and 360 with 0 looks-same red and 0 nothing-lost yellow findings; (3) a mobile Lighthouse performance score of 100 for the home page; (4) the editability gate passing for every block built so far; (5) every best-practices.md section 9 item checked and the note updated; (6) start-here.md Done, Left and Run log updated. Also counts as met: Claude has stopped at a stop point listed in start-here.md and asked Jack for what it needs.
```

Met at about 11:20 ET. It stopped at two listed stop points: Experience Workspace enablement (a config change) and the register review.

## Between the goals

- 11:25: "I'm away from my laptop right now. Can you give me a URL I can click on in my Chrome browser? I'm guessing it's on a main branch or a branch somewhere I can take a look."
- 11:33: "Looks good. Maybe can you give me a prompt? I have some extra ChatGPT Codex tokens to burn. Can you give me a prompt for them to run online, just do a comparison, and then open the pull request on the fix? And then it's gonna be just code fixes. You don't have access to content, just limited, simple ChatGPT. Then they don't have my da.live token or anything, so they'll need to jump fix code. They can do a pull request and code review later." (Claude wrote a code-only comparison prompt for Codex.)
- 11:37: "Yeah, you did a lot of awesome work, actually. Before I even opened that PR, can you kind of just explain to me or help me visualize what you did? Just maybe do a bit of diagramming for me, just kind of tell me your process, you know, all the stuff you did with all the skills, what skills did you use, you know, obviously the content and code migration. Yeah, kind of go through it with me and, you know, what we need to do to figure that out." (Claude published a visual walkthrough as a private claude.ai artifact.)

## Prompt 2: Goal 2, migrate everything in parallel (12:32 ET)

```text
/goal Right, this looks really, really good. Let's just migrate everything over, and then using the same testing, make sure you validate, and yeah, and then just use a lot of sub agents, right? With agent AI migration, we can do things in parallel. Yeah, as long as the design system is moved over, we should be moving over the design system maybe first. But yeah, let's make sure we really go and yeah, get everything moved over. Maybe figure out what blocks you need to build, make sure you have all the blocks you need first, and then after that, go super wide and parallel and get everything migrated.
```

Jack cleared it at about 17:00 ET with `/goal clear`, after the 34 pages passed and while only the design system page and his own stop points remained.

## During Goal 2

- 14:25: "I approve pushing the design-system stream's commits from worktree-agent-abd6bd6521e3db01a to main once it finishes rebasing and gating." (The permission check had refused the stream's own push to main as a production deploy; Claude asked rather than pushing on its behalf.)
- 16:59: "Resume your design-system stream (push ff9bab1, re-gate pub7, fix the header chrome); I will stop the other session." (A forked session had started working on the same design system files; see process.md, Incidents.)

## Prompt 3: cleanup and these docs (17:19 ET)

```text
can you do some clean up as well when you're done with your last task? create an ai-docs folder a well and capture our both goal prompts we used to build this and our decisions and what's left, date it ai-docs/yyyy-mm-dd-initial-buildout-2-goals and document our process as much as you can (this would be prompt number 3), document this one too
```

It came with a screenshot of VS Code's Source Control view showing the leftovers: the agents' worktrees with local `accepted.json` edits, untracked qa reports and a modified motion capture. Claude finished the design system round first, then cleaned up and wrote this folder.

## After prompt 3

- 17:27: "Cool. I guess this is something markdown-wise I can paste into the other prompt. We're building a video now and also writing some articles. I recorded a video already, so yeah, but any additional context you can kind of give to the market write-up or flavor text, you might LinkedIn post, probably not going to redo my video, but anyways, anything you can add just kind of tell what this project is about, you know, all the metrics would be cool to show, maybe we'll have a metric slide and stuff like that." (Claude wrote [media-brief.md](media-brief.md): context, a slide-ready metrics table, story beats and flavor lines.)
- 17:29: "also documetn in a-docs as well! this is cool how mcu hwe got done today! and commit and push, make sure ai-docs is also in hlx ignore" (This folder was committed and pushed; `ai-docs/` is in `.hlxignore`, so EDS never serves it.)
