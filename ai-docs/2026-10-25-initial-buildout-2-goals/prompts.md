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
- 17:46: "OK after it's done let's wrap up today's session, let's kill other sessions if they're not done in 30 more min" (The design system stream got an 18:15 deadline and reported at 17:51. Its last commit was gated on a preview branch and pushed, the 34-page sweep was re-run, and nothing else in this project was still running, so no session had to be stopped.)
- 18:14: "All right. Yeah, we have another page, obviously, on the work we've done today. Can you make sure that it gets migrated as well? The HTML I'm attaching, we're going through the process of publishing the other thread, but you know, feel free to move it over to EDS. Images should be local to the you know, my local directory in GitHub as well. It's pushing, but yeah, if you can't wait, just go ahead and grab it from local folders." followed by the path `/Users/jackjin/dev/jackzhaojin/jackzhaojin.github.io/writing/2026-10-25-eds-migration-two-goal-prompts/index.html`.
- 18:30: "Okay, the new page is also live on my website, [jackzhaojin.com]. So use local or use the online, whatever you want to migrate the content. Ideally, we don't change a ton of code, but if you need to change code, that's fine. So before you wrap up, let's make sure the newest page is also migrated so we have parity. We need to do a bit of double migration until we cut over." (The address was dictated; it is shown here as the site. The article about this build was migrated the same evening: see process.md, After the wrap-up.)
- 18:45: "go ahead and publish https://main--www-eds--jackzhaojin.aem.page/writing/2026-10-25-eds-migration-two-goal-prompts/ to .live if you haven't" (It was already live.)
- 18:48: "oh n/m it's there, and yeah maybe local cache. is there somethign simlar to https://github.com/jackzhaojin/ai-builder-kit/tree/main/skills/hlx-admin-api-executor ? if not let's get it added to plugin! if we have issues with plugins feel free. to fix it (it's local as well) but yeah it'd be cool to have my own site use my own skills as a plugin and other people might use it too!"
- 18:50: "and yeah once you take a look, as you know we'll want to configure our site so we have sitemap.xml and robots.txt to match the SEO of https://www.jackzhaojin.com/ on github pages, and whatever configurations we should do. for the hlx files i'm ok to store non secret things so i cna show off stuff, have a .env file if needed for temp token (obviously .env.example for the real thing)" and "We don't need the hook part of the plugin, just the skills maybe? maybe we should have a way to have the hook without the plugin and just all the skills" (No Adobe skill covers the Admin API, so `hlx-admin-api-executor@ai-builder-kit`, skills only, is now a project plugin. The site config went in as files under `hlx-config/`, applied the skill's way: see process.md.)
- 19:11: "Yes, commit and push the ai-builder-kit changes to its main." and "Oh add hlx api to hlx ignore if you havne't" (Pushed as 46e689e; `hlx-config/` was already in `.hlxignore`.)
- 19:25: "I was thinking we'd do the following - githbu pages will be on gh.jackzhaojin.com (currently on www), but ideally should work from gh.jackzhaojin.com as well. gh should NOT have any SEO. before cutover ideally we have eds.jackzhaojin.com without SEO. then cutover we'll cutover and then keep seo on www how hard is it to do all this?"
- 19:28: "well i'm logged into cloudflare via chrome, so you could configure everything no?"
- 19:30: "ya let's do as much as you can, open chrome browsers and do all the checkboxes and forms and have me just hit submit or somethign" (Claude filled the two DNS record forms in Jack's Chrome; Jack saved each, 19:34 and 19:35; the Workers were deployed with the wrangler sign-in already on the laptop.)
- 19:38 and 19:40: screenshots of eds and gh serving www's robots.txt: "eds is saying allow tho - can we have a rule that stops the proxy of sitemap.xml and robots.txt and just 404 it?" and "samething with" gh. 19:45: "Leave Cloudflare's managed robots.txt on; no rules is fine."
- About 20:00: "Cool minor eds content change - please update via mcp! look in last 2 commits in jackzhaojin", then "whatever you've doing to use da.live, if it was api let's do it" (no DA MCP was connected, so the change went through the DA Source API), then "OK after content is done, codex merged in PR1, make sure it's ok and we can fix forward if we need to, take a look!"
