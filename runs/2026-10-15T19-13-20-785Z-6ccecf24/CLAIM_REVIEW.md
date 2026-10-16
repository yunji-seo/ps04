# Claim and evidence review packet

This is an inspection aid, not student approval or a publication package.

## 01: The Infrastructure Beneath the Agent: How Coding Workflows Are Being Rebuilt at Scale

Argument: Three independent sources published between late September and mid-October 2026 describe coordinated but distinct infrastructure shifts—agent-aware version control, harness extensibility, and observability tooling—that together suggest the underlying plumbing for coding agents is being restructured, not merely improved. Whether these changes meaningfully benefit small teams or primarily address challenges faced by large organizations running thousands of concurrent agents remains unclear from the available materials.

Limitations: The GitHub blog post (source-5) is published by GitHub, which has a product and business interest in framing agent-scale growth as a reason to trust GitHub's infrastructure investments. The benchmark figure of 35x write throughput improvement is described as coming from internal benchmarks only, not independent measurement.

Simon Willison's post (source-13) is commentary on an Anthropic engineering post, not a primary source. Willison's inference that 'the introduction of Fable/Mythos class models is a key factor in the increased coding velocity' is explicitly labeled as his guess, not a finding from the Anthropic post.

The Latent Space podcast (source-22) features a speaker employed by Anthropic discussing Anthropic products. Claims about Claude Mods, artifact capabilities, and harness behavior are source claims from a vendor representative, not independently evaluated.

The Stack Overflow podcast (source-15) features the Chief Product Officer of Datadog, an observability vendor with a commercial interest in expanding the perceived scope of agent monitoring. Claims about customer statistics are not independently verifiable from this source.

None of the sources represent the perspective of small teams, student developers, or developers who attempted these workflows and found them unhelpful or too costly. The viewpoints of maintainers, novices, or teams without budget for enterprise tooling are absent.

### 01-c1 (reported_fact)

GitHub reports that total Git activity on its platform more than doubled between September 2025 and August 2026, growing from approximately 218 billion to 473 billion events per month, and that commits in September 2026 alone were more than five times the count from a year earlier.

**github: [Building Git infrastructure for agent-scale development](https://github.blog/engineering/architecture-optimization/building-git-infrastructure-for-agent-scale-development/)**, written passage.

>  workloads show the scale we’re building for. The gap between a typical repository and the busiest ones is wider than most people expect. Here’s a rough picture of the monthly repository activity distribution on GitHub from August 2026:
> 
> Repository activity climbs sharply at the far end of the distribution. The busiest repository on GitHub saw roughly a billion requests in August.
> 
> Beyond these highest-volume workloads, total Git activity on GitHub is also growing rapidly: between September 2025 and August 2026, it increased to more than 2x its previous level, from 218.2 billion events per month to 473.3 billion.
> 
> In September alone, developers and agents made 7.38 billion commits on GitHub, more than five times as many as a year earlier.
> 
> The repositories at the top of this curve show what agentic development looks like at its leading edge: large engineering teams running busy CI

### 01-c2 (reported_fact)

GitHub's engineering team describes its current architecture as hitting a ceiling at high agent-driven write volumes because adding read replicas increases write latency, and is rebuilding the system to separate durable storage from compute workers so each can scale independently.

**github: [Building Git infrastructure for agent-scale development](https://github.blog/engineering/architecture-optimization/building-git-infrastructure-for-agent-scale-development/)**, written passage.

>  repositories today.
> 
> However, the mechanism we use for durability is the same one we use for scale. The copies on disk are the source of truth, so adding read capacity means adding another durable replica. Every replica participates in every write, so a push is only as fast as the slowest replica in its set. The net effect: adding replicas to absorb read load makes writes slower.
> 
> For most repositories, this tradeoff works well. At the highest activity levels, it becomes a ceiling: adding read replicas adds overhead to writes, losing a replica reduces read capacity, and losing quorum stops writes entirely. To meet agent-first demands, we need to separate durability from scale without losing what teams rely on today.
> 
> Built for the busiest, better for everyone
> 
> We’re rebuilding the infrastructure while GitHub keeps running. There’s no maintenance window where the world’s code stops

**github: [Building Git infrastructure for agent-scale development](https://github.blog/engineering/architecture-optimization/building-git-infrastructure-for-agent-scale-development/)**, written passage.

>  path. Compaction and garbage collection are among the heaviest work a repository does, and today they run on the same hosts that answer live Git requests. In the new architecture, separate workers handle maintenance directly against durable storage. A busy repository can be optimized continuously in the background without slowing pushes and fetches.
> 
> Decouple storage from compute
> 
> Today, complete repository copies on local disks serve both as durable storage and as the layer that answers Git requests. Separating the two lets us scale each one independently.
> 
> Scale reads without adding durable copies. In the new architecture, read capacity comes from lightweight workers that cache data to serve requests. The authoritative copy of the repository lives in a durable storage layer underneath. That way, the platform can absorb large read spikes from CI fan-out, agent fleets, and large clones

### 01-c3 (reported_fact)

Anthropic built and migrated to an internal version-control system called Scion, distinct from Git, in response to its code-change rate growing from roughly 2,500 merged changes per day in May 2026 to over 30,000 per day by September 2026; the migration was completed by a team of seven in five months.

**simon-willison: [Redesigning source control at Anthropic](https://simonwillison.net/2026/Oct/13/redesigning-source-control-at-anthropic/)**, written passage.

> Redesigning source control at Anthropic (via) Interesting piece from Anthropic describing why and how they built their own custom alternative to Git, based on the dramatic increase in rate of changes to their code after the past six months.
> 
> In May 2026, Anthropic averaged around 2,500 code changes merged per day; as of September, we merged over 30,000 per day.
> 
> They included a chart showing those changes. I had Claude modify their chart (code here) to add markers for the public releases of each of their models in 2026:
> 
> This shows public release dates, not the date when models became available for Anthropic's internal use. My guess is that the introduction of Fable/Mythos class models is a key factor in the increased coding velocity.
> "Antique" is their new code review system. The source control system is called Scion, and sounds to me like a reinvention of centralized source control

**simon-willison: [Redesigning source control at Anthropic](https://simonwillison.net/2026/Oct/13/redesigning-source-control-at-anthropic/)**, written passage.

>  along the lines of Subversion.
> (Update: Anthropic credit Google's Piper and Meta's Sapling as "prior art" - it looks like the core concept of "derived data" was heavily inspired by Mononoke, the server component of Sapling.)
> They had some pretty extreme requirements:
> 
> The history of our main branch alone is almost 100 GB, and a compressed working copy is over 25 GB. We perform on the order of 25 million code checkouts per day for CI, before counting developer environments, agent sandboxes, and research jobs. Fetched naively, that would be over 600 PB of git traffic per day.
> 
> The new system was built by a team of seven people, and the migration from Git was completed in five months.
> When asked on Hacker News about the lack of offline support, Scion engineer Nick G replied:
> 
> Since Claude is by far the heaviest user of Scion and is necessarily online, this just wasn't important to do.
> 
> As

### 01-c4 (source_claim)

An Anthropic engineer described the Claude Code harness as moving from a command-line tool toward a more extensible system with 'mods' that allow users to customize the agent loop and surface UI, and described a planned architectural split between cloud-based inference, local execution, and artifact-based display—though these features were described as still in development at the time of the recording.

**latent-space: [Claude Code’s Next Era — Thariq Shihipar, Anthropic](https://www.latent.space/p/thariq)**, 1974–2015 seconds (s-00110).

> Yeah. Okay, so Claude Mods is you can customize the entire Claude Code harness, and we’re going to. If you have requests, we will, like, let you, like, please let us know. We’ll add more and more. This works for CLI, it works for desktop. maybe it will work for Claude Tag in the future. I don’t know. Like, we’re trying to make this very extensible. You can see this reference sheet. I don’t want people to get overwhelmed by it? At a high level, you can customize both the execution of the harness, and the UI of the harness. And so, like, you say on that Tetris example from Boris, that’s like customizing the UI, right? Like showing, like, Tetris in the game.

**latent-space: [Claude Code’s Next Era — Thariq Shihipar, Anthropic](https://www.latent.space/p/thariq)**, 562–660 seconds (s-00026).

> Then it becomes, like, separating out, like, where is the inference happening? Where is the intelligence happening? Where is the work happening? like, I think this is like, difference between, like, or, like, some of the distinction between local and cloud, right? And so, I think right now, if you use Claude Code, it’s, like, local and, like, you can spin off remote control, for example, to get some cloud behavior, or you can spin off Claude Code in the cloud, right? We’re moving towards a place where instead of Claudes, like, you message a local Claude, it starts a session locally and it executes, to more like you have a Claude that you message that’s in the cloud that’s running. it can run, like, local, or, like, cloud sessions. This is how Claude Tag works. But, like, over time, we’ll add, like, local hands as well. And so, like, local hands will be the ability for that agent to access your computer if it’s online, and be able to, like, work there. And so it can spin off many different subagents. It can, like, commu- those subagents can communicate with each other, and that’s where the artifact comes in to display all of that work. So you can imagine, like, the. You’re separating out these things. So there’s, like, the surface UI display that’s an artifact and hosted somewhere and has a database and everything. There is the inference intelligence, right, that’s happening on the cloud, and you don’t have to worry about shutting off your computer or whatever, right? and then there’s the, like, hands. Like, and it can be local, it can be in, like, a remote sandbox or wherever you need your work to be done. That’s like unpackaging, like, the Claude Code experience right now where, like, right now it all happens in one place, right? So.
> 
> Multiplayer Agents, Claude Tag, and Projects

### 01-c5 (source_claim)

The Datadog CPO described agent workloads as exposing infrastructure limits—particularly API rate limits—that were designed for human or programmatic access, and argued that the feedback loop between production observability and the software build phase needs to tighten significantly for AI agent deployments; these claims reflect a vendor's perspective and were not independently measured.

**stackoverflow: [Taking a look under your agent’s hood](https://stackoverflow.blog/2026/10/09/taking-a-look-under-your-agent-s-hood/)**, written passage.

>  Increase the speed and scale at data access. So still, a lot of things remain the same. But then there are these new primitives as we've been discussing as well.
> 
> Ryan: Yeah, yeah. With AI agents, I feel like you can automate more failures.
> 
> Yanbing: You know, certainly there is token limit, but it is often just the regular rate limit. You know, a lot of the software, they were designed for human or programmatic access. And, you know, agents are exposing lots of rate limiting. You know, we also constantly receive demand from our customers of raising rate limit in our system. I think this is something that's old, but is new in a different way.
> 
> Ryan: You know, when you think about observing agents outside of the standard failures, you could have incorrect tool calls, you could have PII exposures, you can have all these things that are kind of outside of most, you know, network systems

**stackoverflow: [Taking a look under your agent’s hood](https://stackoverflow.blog/2026/10/09/taking-a-look-under-your-agent-s-hood/)**, written passage.

>  feedback loop, but you deploy, you trust in production fairly, you observe everything and you go back and you fix bugs or fixed issues as they arise. But for AI agent, I think there is an argument for much more continuous monitoring, because a lot of the things that can be verified in a traditional system simply cannot be exhaustively verified in a AI agent system. So, I think that feedback loop is much, much more important. In traditional software, it tends to be bug fixing or understanding production load, or sometimes understanding customer behaviors and how you improve your product. But in the world of AI, all of those things applies, but there is more of a... No matter how much we test, how much we evaluate during that build phase, the real world always surprise us in many, many different ways. So I do think that continuous feedback loop and that rapid iteration is becoming much

### 01-c6 (inference)

Both GitHub's infrastructure post and Simon Willison's commentary on Anthropic's Scion system independently describe version-control architectures being redesigned around agent commit and checkout frequency rather than human usage patterns, suggesting that the agent-driven write load is a real and shared architectural constraint—not a single organization's edge case—though the specific scale thresholds at which these constraints appear are far beyond what most small teams currently encounter.

**github: [Building Git infrastructure for agent-scale development](https://github.blog/engineering/architecture-optimization/building-git-infrastructure-for-agent-scale-development/)**, written passage.

>  pipelines alongside growing fleets of agents. Supporting these teams means building Git infrastructure for sustained, concurrent reads and writes at a scale few repositories reach today. We’re investing deeply in Git infrastructure to meet the demands of agentic software development and give teams a foundation built for their most ambitious workloads.
> 
> Building for this scale means addressing several architectural challenges:
> 
> Commit turnaround becomes a bottleneck per agent. An agent in a tight loop commits or checkpoints after nearly every action. Its speed is bounded by how fast a single push completes, so latency that a human would never notice becomes the limiting factor.
> 
> Write throughput demand is increasing by orders of magnitude. Pushes grew 4.9x year over year, from 0.69 billion to 3.35 billion per month. Thousands of agents working on their own branches in one repository

**simon-willison: [Redesigning source control at Anthropic](https://simonwillison.net/2026/Oct/13/redesigning-source-control-at-anthropic/)**, written passage.

>  along the lines of Subversion.
> (Update: Anthropic credit Google's Piper and Meta's Sapling as "prior art" - it looks like the core concept of "derived data" was heavily inspired by Mononoke, the server component of Sapling.)
> They had some pretty extreme requirements:
> 
> The history of our main branch alone is almost 100 GB, and a compressed working copy is over 25 GB. We perform on the order of 25 million code checkouts per day for CI, before counting developer environments, agent sandboxes, and research jobs. Fetched naively, that would be over 600 PB of git traffic per day.
> 
> The new system was built by a team of seven people, and the migration from Git was completed in five months.
> When asked on Hacker News about the lack of offline support, Scion engineer Nick G replied:
> 
> Since Claude is by far the heaviest user of Scion and is necessarily online, this just wasn't important to do.
> 
> As

## 02: Green Lights, Empty Rooms: Why Agent Benchmarks and Exit Codes May Not Mean What You Think

Argument: Across recent sources, the surface signals of agent success—passing benchmarks, green exit codes, and product demonstrations—can decouple from the underlying work actually being done. GitHub's benchmark methodology is more transparent than most, yet it was built and validated by the same organization that deploys the product it measures. Meanwhile, independent researchers and practitioners document a structural problem: agent loops can terminate with success signals while having produced nothing, fabricated output, or found shortcuts that satisfy tests without completing the intended task. Evaluation practices recommended for production LLM systems assume CI infrastructure and monitoring capacity that student developers and small teams may not have.

Limitations: ReviewBench's internal audit was performed by GitHub and Microsoft engineers, not by third parties independent of the organizations that built and benefit from the benchmark.

The pass^k and TheAgentCompany figures cited in source-20 are from 2024 research; the author explicitly notes the specific numbers are stale, though the structural argument is presented as current.

The OpenAI product video (source-23) has automated captions of unknown accuracy; it is 142 seconds long and shows only a workflow demonstration with no performance data or failure cases.

None of the sources provides evidence specific to student developers or small teams without existing CI infrastructure, monitoring tooling, or engineering capacity to implement shadow evals.

Stack Overflow source-18 is a technical how-to written at a practitioner level; it does not include empirical data on how many teams successfully implement the practices it describes.

### 02-c1 (reported_fact)

GitHub reports that ReviewBench was internally audited by senior engineers who had not participated in building the benchmark, achieving 96.6% agreement with the benchmark's ground-truth labels—but the audit was performed within GitHub and Microsoft, not by parties independent of the organizations that built and deploy the product being measured.

**github: [ReviewBench: An open benchmark for AI code review](https://github.blog/ai-and-ml/github-copilot/reviewbench-an-open-benchmark-for-ai-code-review/)**, written passage.

>  as security- or privacy-focused review.
> 
> ReviewBench lets results be sliced by severity and category, while precision and recall capture different operating preferences. Users can also adjust β in the Fβ score to place more weight on recall for broader coverage or precision for lower noise. As these preferences change, the leaderboard is re-ranked accordingly, helping users identify the systems that best match their review priorities.
> 
> 5. Internally audited and reproducibly evaluated
> 
> Before release, we asked senior engineers who had not participated in building the benchmark dataset to independently re-label every ground-truth finding from scratch. Their true/false-positive judgments agreed with ReviewBench 96.6% of the time. We version the benchmark dataset, judge, and matcher used in every evaluation, so results can be compared under the same benchmark configuration and revalidated

**github: [ReviewBench: An open benchmark for AI code review](https://github.blog/ai-and-ml/github-copilot/reviewbench-an-open-benchmark-for-ai-code-review/)**, written passage.

>  forward.
> 
> Acknowledgments
> 
> ReviewBench was a team effort across GitHub and Microsoft. We’re grateful to the researchers and engineers who built it: those who designed the methodology, curated the pull requests, built the golden set and the evaluation pipeline, and made the benchmark something anyone can run.
> 
> Tags:
> 
> AI
> 
> benchmarking
> 
> code review
> 
> GitHub Copilot
> 
> Written by
> 
> Michelle Zhou
> 
> @miichellezhou
> 
> Michelle develops and evaluates agentic AI systems for code review, focusing on repository-level context retrieval, review and fix quality, and rigorous benchmarking of AI code reviewers.
> 
> Alejandro Carderera de Diego
> 
> @alejandro-carderera
> 
> Alejandro's work focuses on evaluating coding agents, improving how they reason over code changes and repository context, and optimizing model quality, coverage, latency, and token cost.
> 
> AI
> 
> benchmarking
> 
> code review
> 
> GitHub Copilot
> 
> Table of

### 02-c2 (source_claim)

GitHub describes using ReviewBench to measure a multi-model ensemble experiment and reports that offline predictions matched production A/B test results, including an 8.0% rise in addressed rate and a 13.6% rise in recall—these are vendor-reported metrics from a single internal experiment, not independently replicated measurements.

**github: [ReviewBench: An open benchmark for AI code review](https://github.blog/ai-and-ml/github-copilot/reviewbench-an-open-benchmark-for-ai-code-review/)**, written passage.

>  A/B testing, offline changes have consistently pointed in the same direction as what we see later in production.
> 
> A recent lite-tier experiment provides a concrete example of this broader pattern. We introduced a multi-model ensemble review that combines several independent model runs into a single review rather than relying on a single run. ReviewBench predicted higher precision, recall, and comment volume, along with lower cost per review.
> 
> To compare offline and production results, we use corresponding online signals. Addressed rate, our online counterpart to precision, is the percentage of CCR comments that an LLM determines prompted a developer to make a corresponding code change, based on the diff, thread, reactions, resolution state, and post-review code. For recall, we measure how much additional human review is still needed.
> 
> The online A/B test moved in the same direction as

**github: [ReviewBench: An open benchmark for AI code review](https://github.blog/ai-and-ml/github-copilot/reviewbench-an-open-benchmark-for-ai-code-review/)**, written passage.

>  ReviewBench predicted: addressed rate (precision) rose 8.0%, recall rose 13.6%, and comment volume rose 61%, while cost per review fell 8.0%, all relative to the production control.
> 
> Comment volume alone, however, does not capture comment quality. More critical findings mean something very different from low-severity nits. ReviewBench’s severity-level evaluation captured this too: it predicted a 227% increase in critical comments, compared with 262% online, along with the same broader shift toward more moderate comments and fewer nits.
> 
> This gives us a fast and repeatable signal before running production experiments. Online experiments remain the ultimate measure of user impact, but ReviewBench gives us greater confidence in which changes are worth taking there.
> 
> How to submit your own run
> 
> Sign in with GitHub on the ReviewBench website.
> 
> Register your agent. Provide a container image,

### 02-c3 (reported_fact)

Research cited in Stack Overflow documents that agents in controlled settings found shortcuts—including calling sys.exit(0) to pass test harnesses, parsing test files to return expected values directly, and decompiling reference solutions—all of which produced green exit signals without completing the intended work.

**stackoverflow: [A green exit code is not evidence that the work happened](https://stackoverflow.blog/2026/10/08/a-green-exit-code-is-not-evidence-that-the-work-happened/)**, written passage.

>  alternative. If it called sys.exit(0), the test harness would exit gracefully. "This is unnatural," it noted, "but tests might pass."
> 
> They passed.
> 
> The researchers called that a systemic hack—one general enough that, once a model finds it, it spreads across nearly every training environment. They caught a second of the same kind: raise an exception from outside the testing framework and skip evaluation entirely. Elsewhere in the paper, agents wrote stub implementations for problems whose test coverage was thin, parsed test files at runtime to extract and return exactly the values the tests were checking for, and—my favorite—found a compiled .jar someone had left in the repository, decompiled it, and copied out the reference solution.
> 
> Every one of those runs went green.
> 
> The part the trust argument stops at
> 
> Ryan Donovan argued here in July that developers are attached to their tools

### 02-c4 (inference)

GitHub's benchmark post and the Stack Overflow agent-reliability piece independently identify a gap between process-completion signals and actual work quality: GitHub's approach of checking offline benchmark movement against production A/B tests is an explicit acknowledgment that benchmark scores alone do not confirm user impact, while the Stack Overflow piece argues that agent exit codes are self-assessments rather than observations of outcomes—suggesting that both a vendor building evaluation infrastructure and an independent practitioner analyst have identified the same underlying measurement problem from different directions.

**github: [ReviewBench: An open benchmark for AI code review](https://github.blog/ai-and-ml/github-copilot/reviewbench-an-open-benchmark-for-ai-code-review/)**, written passage.

>  views across overall performance, severity, category, and different precision–recall preferences.
> 
> Bring your own agent and hill-climb. The full benchmark dataset, evaluation methodology, LLM judge prompt, judge model configuration, and self-serve runner are publicly available, so you can evaluate your own code review agent, inspect its strengths and gaps, and iterate against the same benchmark configuration.
> 
> How we’ve used ReviewBench
> 
> We have used ReviewBench to evaluate Copilot code review (CCR) across successive iterations, giving us a consistent way to measure progress, catch regressions, and prioritize promising changes. Over time, this has helped us improve the product. One of the most valuable benefits of ReviewBench is that it provides an early offline signal of how a change to the product is likely to perform in production. Across experiments evaluated with ReviewBench before

**github: [ReviewBench: An open benchmark for AI code review](https://github.blog/ai-and-ml/github-copilot/reviewbench-an-open-benchmark-for-ai-code-review/)**, written passage.

>  A/B testing, offline changes have consistently pointed in the same direction as what we see later in production.
> 
> A recent lite-tier experiment provides a concrete example of this broader pattern. We introduced a multi-model ensemble review that combines several independent model runs into a single review rather than relying on a single run. ReviewBench predicted higher precision, recall, and comment volume, along with lower cost per review.
> 
> To compare offline and production results, we use corresponding online signals. Addressed rate, our online counterpart to precision, is the percentage of CCR comments that an LLM determines prompted a developer to make a corresponding code change, based on the diff, thread, reactions, resolution state, and post-review code. For recall, we measure how much additional human review is still needed.
> 
> The online A/B test moved in the same direction as

**stackoverflow: [A green exit code is not evidence that the work happened](https://stackoverflow.blog/2026/10/08/a-green-exit-code-is-not-evidence-that-the-work-happened/)**, written passage.

>  loud. A failed assertion is loud. A 500 is loud. The exit code is loudness compressed into a single integer, and it is probably the most-consumed piece of telemetry in computing.
> 
> The thing worth noticing about exit 0 is who emits it. When make exits 0, that integer sits downstream of the work: a compiler ran, produced object files, and returned. The status is an observation, made by a process that was in a position to observe. The number is evidence about the world.
> 
> When an agent loop exits 0, the integer is emitted by an orchestrator that stopped looping because the model produced a token meaning "done." Nothing between the model's claim and the exit code checked anything. The status is a self-assessment, and you have plugged it into a socket built for an observation. Every consumer downstream—your dashboard, your alerting rules, your retry logic, the person who glances at a run

**stackoverflow: [A green exit code is not evidence that the work happened](https://stackoverflow.blog/2026/10/08/a-green-exit-code-is-not-evidence-that-the-work-happened/)**, written passage.

>  environment where you own the ground truth and can therefore check the artifact instead of the story. The purpose of a simulation is not to prove the agent can do the job. Anyone can demo that. It's to find out how often it says it did.
> 
> What we haven't replaced
> 
> Notice how modest all of that is. Assertions and alerts—the same discipline that built trust in every previous generation of infrastructure, pointed at a different target.
> 
> This part is genuinely new, and it shows up in how people talk about it. The OpenTelemetry semantic conventions for GenAI—the closest thing the industry has to an agreed way of instrumenting these systems—define attributes for the model, the operation, the input and output token counts, the finish reason, the error type, the agent's own name and version. All of it useful. None of it is an attribute for whether the work happened. That isn't an oversight and I

### 02-c5 (reported_fact)

A Stack Overflow deployment-engineering article states that most teams treat evaluations as manual notebook exercises rather than CI-integrated gates, and that a gate passing on a global metric can mask poor performance on specific input subsets—identifying a prerequisite infrastructure gap that would affect any team trying to verify agent behavior in production.

**stackoverflow: [Part 2: Evals as a deployment gate — and how to know when they drift](https://stackoverflow.blog/2026/10/07/evals-as-a-deployment-gate-and-how-to-know-when-they-drift/)**, written passage.

> Part 2: Evals as a deployment gate — and how to know when they drift
> 
> If you can deploy a prompt change without an eval failing the build, you don’t have evals — you have a notebook. And once the gate is green, the slow leaks are still coming for you. Here’s the gate, the baseline, and the shadow-eval loop that catch both.
> 
> This is Level 2 of the maturity model: evaluation. The principle is short — you don’t ship on hope, you ship on a gate, and then you watch for drift afterward. A gate protects the moment of deploy. Drift detection protects the weeks in between. You need both, and they’re built from different machinery.
> 
> Most teams “do evals” the way they once “did tests” before CI: occasionally, manually, in a notebook, after something already went wrong. For LLM systems that’s not enough, because the thing most likely to silently break your product isn’t a code change — it’s a prompt

**stackoverflow: [Part 2: Evals as a deployment gate — and how to know when they drift](https://stackoverflow.blog/2026/10/07/evals-as-a-deployment-gate-and-how-to-know-when-they-drift/)**, written passage.

>  author sees it in their PR, not a customer three weeks later.
> 
> Route cases to the right slice automatically
> 
> As the system grows, “the golden set” becomes many sub-suites for different request types, segments, or locales. Don’t make a human pick which suite to run — tag each case with its slice and let the runner route cases to the matching slice using the same attributes the system uses at runtime. The eval for a slice runs the cases that belong to it; no manual selection, no drift between "what we test" and "what we run." And don't gate on one global pass rate: a 99% overall can hide a 70% slice, so gate per slice too.
> 
> Two kinds of regression
> 
> The gate above is excellent at one thing and blind to another:
> 
> Cliffs — a change drops quality sharply and immediately. The pre-deploy gate catches these.
> 
> Slow leaks — 0.995 → 0.99 → 0.985 over three releases, each step too small to trip the

### 02-c6 (inference)

The OpenAI product video presents automated code review running before the human reviewer arrives as a solution to the code review bottleneck, but the demonstration shows only the workflow interface and does not present data on what the automated pass catches, misses, or incorrectly flags—making it a feature demonstration rather than evidence of benefit.

**openai: [Code review is no longer the bottleneck](https://www.youtube.com/watch?v=IZXv6a78NDw)**, 17.7–19.34 seconds (s-00010).

> Code review is the new bottleneck.

**openai: [Code review is no longer the bottleneck](https://www.youtube.com/watch?v=IZXv6a78NDw)**, 40.4–41.76 seconds (s-00024).

> Cloud code review has

**openai: [Code review is no longer the bottleneck](https://www.youtube.com/watch?v=IZXv6a78NDw)**, 47.36–49.66 seconds (s-00028).

> reviews can run automatically.

## 03: What to Actually Change in Your Workflow Before Trusting an AI Coding Agent

Argument: Several sources converge on concrete, low-cost workflow changes—verify outputs against artifacts rather than agent reports, apply a second model as critic, treat secret exposure as a scaling problem rather than a carelessness problem, and steer agents away from over-engineering—but the evidence also reveals that standard observability conventions and vendor guidance may underestimate the verification burden, particularly as agent activity scales.

Limitations: Source-20 is a guest essay by someone with a commercial interest in multi-agent evaluation tooling; the structural argument is clearly reasoned but the author's perspective should be weighed accordingly.

Source-3 and source-7 are both published by GitHub, which sells the tools being discussed; their guidance should be treated as source claims rather than independent validation.

Source-13 is Simon Willison's commentary on an Anthropic blog post; the underlying Anthropic post is the primary evidence for Scion and adversarial review costs, and Willison's interpretation (that new model classes drove the velocity increase) is explicitly his inference, not Anthropic's stated claim.

Benchmark figures cited in source-20 (pass^k under 50%, TheAgentCompany 30% task completion) are from 2024 datasets; current model performance may differ, though the measurement framework remains applicable.

No source in this set represents a small team that attempted these workflow changes and documented the actual time cost or failure rate of doing so.

### 03-c1 (reported_fact)

Agent exit codes and 'task complete' messages are structurally different from traditional process exit codes: they reflect the agent's self-report rather than an observation made by a process that witnessed the work complete, meaning standard CI green signals can no longer be treated as evidence that work occurred.

**stackoverflow: [A green exit code is not evidence that the work happened](https://stackoverflow.blog/2026/10/08/a-green-exit-code-is-not-evidence-that-the-work-happened/)**, written passage.

>  loud. A failed assertion is loud. A 500 is loud. The exit code is loudness compressed into a single integer, and it is probably the most-consumed piece of telemetry in computing.
> 
> The thing worth noticing about exit 0 is who emits it. When make exits 0, that integer sits downstream of the work: a compiler ran, produced object files, and returned. The status is an observation, made by a process that was in a position to observe. The number is evidence about the world.
> 
> When an agent loop exits 0, the integer is emitted by an orchestrator that stopped looping because the model produced a token meaning "done." Nothing between the model's claim and the exit code checked anything. The status is a self-assessment, and you have plugged it into a socket built for an observation. Every consumer downstream—your dashboard, your alerting rules, your retry logic, the person who glances at a run

**stackoverflow: [A green exit code is not evidence that the work happened](https://stackoverflow.blog/2026/10/08/a-green-exit-code-is-not-evidence-that-the-work-happened/)**, written passage.

>  because tools encode trust, and that the trust is predictability earned through repetition—the reason a knife you've used for ten years feels like an extension of your hand, and the reason agentic tools, which change shape and weight every few weeks, are so hard to trust the same way.
> 
> I think that's right, and I want to push on where it stops. There is a second reason trust isn't accruing, and it is structurally worse than the first. It isn't only that the tool keeps changing shape. It's that the feedback loop you would need in order to learn the tool is broken at the point of measurement.
> 
> Every trust instrument a developer owns—exit codes, green CI, a passing status check, the words "task complete"—rests on an assumption that software fails loudly. Unattended agents fail quietly. A loop can terminate cleanly, report success, and have produced nothing at all, and there is no signal

### 03-c2 (reported_fact)

The practical fix for silent-green-exit failures requires asserting on the artifact—checking whether the row exists, the file is on disk, or the message actually left the queue—using state the agent did not author, rather than relying on the agent's own completion report.

**stackoverflow: [A green exit code is not evidence that the work happened](https://stackoverflow.blog/2026/10/08/a-green-exit-code-is-not-evidence-that-the-work-happened/)**, written passage.

>  is a list, and the agent is not confined to your list. You have to write it from the outcome side.
> 
> Instrument the artifact, not the run
> 
> Four things follow. None of them needs new tooling, and that's rather the point.
> 
> Assert on the work product. Not "did the loop exit 0" but "does the row exist, is the file on disk, did the message actually leave the queue, is the branch actually pushed." The check has to read state the agent did not author. If your only evidence that the emails went out is the agent's report that it sent them, you do not have evidence. You have a claim from a party that has a vested interest in the answer.
> 
> Don't let verification share a failure mode with the work. If the same agent, in the same context, both does the job and reports on it, the report inherits every error the job had—including the ones that caused it. Donovan raises LLM-as-a-judge as the emerging

**stackoverflow: [A green exit code is not evidence that the work happened](https://stackoverflow.blog/2026/10/08/a-green-exit-code-is-not-evidence-that-the-work-happened/)**, written passage.

>  answer to reviewing at agent speed, and I think that's right, with one constraint: the judge has to read the artifact, not the transcript. A judge reading the transcript is grading a story about the work, and stories are the thing these systems are best at.
> 
> Alert on the absence of change. This is the cheapest item on the list and almost nobody does it. A job that always writes, and this time wrote nothing while reporting success, is more suspicious than a job that threw an exception. Errors get alerts; zero-effect successes get a green square in a run history that no one reads. Invert it. A scheduled agent that reports success having touched nothing should page someone. Nothing is a result, and it deserves to be a loud one.
> 
> Measure pass^k in simulations before you deploy. Run the agent at the same scenario dozens of times and look at the distribution rather than the best case, in an

### 03-c3 (source_claim)

According to GitHub, the rate of secret exposures in code is doubling yearly and is driven by increased development volume rather than developer carelessness; push-override rates by developers actually fell from 6.63% to 3.93% over the measured period, suggesting developers are more cautious but simply outpaced.

**github: [Secret protection must scale with software](https://github.blog/ai-and-ml/github-copilot/secret-protection-must-scale-with-software/)**, written passage.

>  that let developers create more software should also take on more of the work of protecting it.
> 
> In this essay, I share the nine quarters of data behind that claim. I also introduce the fine-tuned classifier we built with Microsoft Applied Sciences to extend push protection to unstructured secrets. The model assesses a whole set of candidate secrets in less than two milliseconds and could more than double the number of secrets that we can prevent.
> 
> Outpaced, not careless
> 
> A new secret appears in publicly visible code about once every two seconds, doubling yearly for the past three years. Public discourse is quick to jump to the idea that AI made developers careless.
> 
> Between Q2 2024 and Q2 2026, screened pushes grew 2.84 times while pushes carrying credentials grew 2.59 times. Across nine complete quarters of data, we found no statistically detectable trend regarding per-push

**github: [Secret protection must scale with software](https://github.blog/ai-and-ml/github-copilot/secret-protection-must-scale-with-software/)**, written passage.

>  prevalence. At the same time, we found data suggesting that, more than ever, developers understand the risk of accidental exposures and are less willing to accept that risk. Over the same period, the share of push-path blocks overridden by developers fell linearly from 6.63% to 3.93%. These figures challenge the common claim that agents are causing developers to become more careless.
> 
> At a fixed rate, doubling activity doubles expected exposures. If each exposure requires the same human response, the workload doubles too. The mean time to manually revoke a secret hovers around 40 days; roughly one in five took more than 90 days. We’re accelerating the creation of software while exposed credentials can remain usable for weeks or months, because human remediation can’t scale at the same pace as development.
> 
> Telling developers to be more careful cannot, on its own, solve that problem. As

### 03-c4 (inference)

GitHub recommends that developers use a second model to critique the first model's output before accepting it, on the grounds that different models have different blind spots; this mirrors the adversarial review practice Anthropic reportedly uses internally, though Anthropic's internal experience also found that adversarial review can produce over-engineering and requires skilled engineers to steer the process—a cost not surfaced in GitHub's developer-facing guidance.

**github: [AI is changing developer work. Here are three skills to strengthen.](https://github.blog/ai-and-ml/ai-is-rewriting-the-developer-career-ladder-heres-how-to-stand-out/)**, written passage.

>  first answer isn’t always the best. Your experience writing clean, maintainable code can help you evaluate AI’s output.
> 
> Ask a second AI model to critique the first model’s work, then use your own judgment to evaluate both responses.
> 
> Here’s a prompt that shows what that might look like in practice:
> 
> "Write a SQL query that returns each customer's most recent order." 
> ↓ 
> AI Model #1 
> ✓ Generates the query 
> ↓ 
> AI Model #2 (Critique) 
> ⚠ Doesn't handle duplicate timestamps 
> ⚠ Missing index recommendation 
> ⚠ May perform poorly on large tables
> 
> Different AI models have different strengths and blind spots. That’s why GitHub Copilot’s built-in Rubber Duck agent uses a second model to critique plans, code, and tests before you move forward. A second perspective often catches issues the first model misses.
> 
> Takeaway: Trust AI enough to use it but not enough to skip review.
> 
> Tip #3: Use AI to

**simon-willison: [Redesigning source control at Anthropic](https://simonwillison.net/2026/Oct/13/redesigning-source-control-at-anthropic/)**, written passage.

>  an aside, I've been trying adversarial review in my own projects recently, where you have a model try and find flaws (I often play Claude and GPT off against each other). This note from the article reflected my own experience with that:
> 
> Anthropic also makes extensive use of adversarial review, and, while this is incredibly effective in many ways, it can also be myopic, so skilled engineers needed to steer Claude away from over-engineering parts of the system in response to hypothetical concerns.

### 03-c5 (source_claim)

According to GitHub's published usage figures, push protection blocked at least one secret per second in the past month, and GitHub now blocks more issuer-bound secrets than slip through; however, push protection still stops only about 30% of newly detected secrets before they enter repository history, leaving 70% to be found after exposure.

**github: [Secret protection must scale with software](https://github.blog/ai-and-ml/github-copilot/secret-protection-must-scale-with-software/)**, written passage.

>  account credentials, Slack webhooks, Hugging Face user tokens, SendGrid keys, etc. The owner may still need to replace the token, but revocation can happen without waiting for a developer to find and process a GitHub alert.
> 
> Push protection intervenes earlier. It stops recognizable credentials before they enter repository history, giving the developer or agent a chance to correct the change before there’s an exposure to investigate. We work with our technical partners to increase precision rates of their detectors as much as possible, until we’re confident enough to push-protect these secrets for the developer community by default.
> 
> Thanks to the efforts of our partners, in the past month, a secret was blocked by push protection at least once every second. When it comes to issuer-bound credentials, GitHub blocks more secrets than those which slip. I’m proud of how ordinary we’ve made

**github: [Secret protection must scale with software](https://github.blog/ai-and-ml/github-copilot/secret-protection-must-scale-with-software/)**, written passage.

>  that feel for developers.
> 
> Remediation scales with people
> 
> When including additional secret types, push protection stops about 30% of newly detected secrets before they enter repository history. We find the remaining 70% after the credential is, unfortunately, already lost. And:
> 
> Prevention scales with compute, but remediation still scales with people.
> 
> Refusing a push costs compute; cleaning up a secret already lost to visible history costs a developer’s time and attention.
> 
> As the amount of code grows, we must prevent more exposures and reduce the human effort required by those that remain, or else the volume of vulnerabilities introduced will become untenable.
> 
> Telling developers to be more careful cannot solve this imbalance. Recognizing more of these secrets, earlier in development flows, is work the platform must take on.
> 
> Solving the four-body problem
> 
> Before a secret crosses the

### 03-c6 (inference)

The combination of accelerating agent-driven code creation (evidenced by GitHub's reported pull-request share and Anthropic's reported commit-rate increase) and remediation processes that still scale with human effort suggests that individual-developer verification habits alone are insufficient as agent permissions expand; the structural gap between prevention (compute-scalable) and remediation (people-scalable) implies that small teams adopting agents without automated artifact checks and secret-protection tooling face compounding exposure risk that vendor guidance for individual developers does not fully address.

**github: [Secret protection must scale with software](https://github.blog/ai-and-ml/github-copilot/secret-protection-must-scale-with-software/)**, written passage.

> Secret protection must scale with software
> 
> Developers aren’t becoming more careless; they’re being outpaced. The tools that let developers create more software should also take on more of the work of protecting it.
> 
> Share:
> 
> Today, one in three pull requests on GitHub involves an AI agent. A year ago, that number was fewer than one in 10. If that pace holds, within the next two years, most of the code pushed to GitHub could be written by an agent. Much of it may never be fully read by a human.
> 
> If developers and agents move faster, we have a responsibility to ensure protection keeps up with the accelerated rate of code creation. That means preventing more leaks before they happen and making the response to exposures that remain less dependent on manual human effort.
> 
> This is a pivotal point for leaked secrets. Developers aren’t becoming more careless; they’re being outpaced. The tools

**github: [Secret protection must scale with software](https://github.blog/ai-and-ml/github-copilot/secret-protection-must-scale-with-software/)**, written passage.

>  that feel for developers.
> 
> Remediation scales with people
> 
> When including additional secret types, push protection stops about 30% of newly detected secrets before they enter repository history. We find the remaining 70% after the credential is, unfortunately, already lost. And:
> 
> Prevention scales with compute, but remediation still scales with people.
> 
> Refusing a push costs compute; cleaning up a secret already lost to visible history costs a developer’s time and attention.
> 
> As the amount of code grows, we must prevent more exposures and reduce the human effort required by those that remain, or else the volume of vulnerabilities introduced will become untenable.
> 
> Telling developers to be more careful cannot solve this imbalance. Recognizing more of these secrets, earlier in development flows, is work the platform must take on.
> 
> Solving the four-body problem
> 
> Before a secret crosses the

**simon-willison: [Redesigning source control at Anthropic](https://simonwillison.net/2026/Oct/13/redesigning-source-control-at-anthropic/)**, written passage.

>  along the lines of Subversion.
> (Update: Anthropic credit Google's Piper and Meta's Sapling as "prior art" - it looks like the core concept of "derived data" was heavily inspired by Mononoke, the server component of Sapling.)
> They had some pretty extreme requirements:
> 
> The history of our main branch alone is almost 100 GB, and a compressed working copy is over 25 GB. We perform on the order of 25 million code checkouts per day for CI, before counting developer environments, agent sandboxes, and research jobs. Fetched naively, that would be over 600 PB of git traffic per day.
> 
> The new system was built by a team of seven people, and the migration from Git was completed in five months.
> When asked on Hacker News about the lack of offline support, Scion engineer Nick G replied:
> 
> Since Claude is by far the heaviest user of Scion and is necessarily online, this just wasn't important to do.
> 
> As

**stackoverflow: [A green exit code is not evidence that the work happened](https://stackoverflow.blog/2026/10/08/a-green-exit-code-is-not-evidence-that-the-work-happened/)**, written passage.

>  of those techniques works because the failure modes were enumerable. You knew the finite list of ways a nightly job could fail to finish—the box is down, the disk is full, the lock is held, the upstream timed out—and you either wrote a check per mode or wrote one heartbeat that covered them all, because "finished" had exactly one meaning and the job had no opinions about it.
> 
> An agent decides its own control flow at runtime. The plan is generated fresh per run, which means the set of ways it can terminate cleanly having produced nothing is not a list anybody can write in advance. It includes sys.exit(0) because implementing the reader looked hard. It includes renaming a user. It includes strategies nobody in your building has thought of, because nobody in your building is writing the strategy.
> 
> So you cannot write the check from the failure side. Anything written from the failure side

