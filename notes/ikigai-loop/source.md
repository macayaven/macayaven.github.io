# Ikigai Loop: an AI assistant I'm running on myself

*2 November 2026 · Meta's Muse models, agent evals, a live run on my own data*

Ikigai Loop is an AI assistant that suggests, five times a day, how to spend my next free hour, on my work goals or with my family, and that never shows me a number it can't back with my own records. I'm running it on myself from 2 to 4 November 2026, for Meta's hackathon.

It looks at what I actually did, from my screen time, my calendar and my public GitHub activity. It picks two options from a list of promises I wrote down myself and sends them to my phone as a Telegram card. Before a card goes out, plain code checks every figure in it against those records, and a wrong one is sent back. I choose with a tap, or correct the card with a voice note.

## How it works

- **Signals:** screen time from ActivityWatch on my Mac, my two calendars and my public GitHub activity.
- **Facts:** code turns those records into numbers for three 24-hour periods ending at the card's hour, called earlier, prior and last. Muse Glimmer, running on my own DGX Spark, adds facts of its own, each citing the records it came from.
- **Proposals:** Muse Wonder gets only those facts and my written commitments, and proposes one commitment per goal for my next free hour, with its reasons.
- **The gate:** plain code checks every number and source in those reasons before the card is sent. A wrong draft gets one retry; if the retry fails too, I get a labelled fallback with no reasons.
- **Me:** I tap Take A, Take B or Neither now, or send a voice note to correct the card.

What the gate never checks is whether a sentence is true in a wider sense. It checks numbers, sources and wording.

Muse Code wrote the assistant's code, with the exceptions listed in the repo's [CONTRIBUTIONS.md](https://github.com/macayaven/ikigai-loop/blob/main/CONTRIBUTIONS.md). The code and its evidence are at [github.com/macayaven/ikigai-loop](https://github.com/macayaven/ikigai-loop). The same checks run in your browser, on your own agent's output: [the checker](https://carloscrespomacaya.com/ikigai-loop/verify/).

## Field notes

Newest first. Each note is one real thing the build or the run showed, with its evidence.

<h3 id="demo-2026-11-04">4 November, demo cut: the recording needs checks too</h3>

The [first demo cut](https://youtu.be/CfMPpmqZ7NU) is 2 minutes 56 seconds long. It shows a voice correction, a card reaching my phone, and the wrong-period failure from the notes below. The checker game stays in too, including a trap the checker misses.

The narration is my voice, cloned locally with Chatterbox from my own recording. I disclosed it on the end card and in the video description. The footage also distinguishes the real run, made-up tests and a recorded replay. A sentence rejected in a replay is evidence about the fixed gate; it doesn't undo the sentence that reached my phone.

What I changed: I put this cut up as unlisted and made a first hackathon submission. That leaves me time to finish the recording before the deadline. I'm keeping revisions in the build that produces the video, so the final cut can be rebuilt and checked for private data.

What still needs work: the phone and checker need more of the frame, the text cards need less text, and the editing labels need to go. The live-run placeholders need the frozen figures from [the run's report](https://github.com/macayaven/ikigai-loop/blob/main/docs/live-run.md). The failure and the checker's miss stay.

Known limit: my voice tests also used the clone. In [my audio evaluation](https://github.com/macayaven/ikigai-loop/blob/main/docs/r9-audio.md), 50 of 60 edits came out right from audio, against 58 of 60 from text. Every audio miss asked a question instead of making a wrong edit. Those were clean synthetic takes, with no room noise, phone microphone or Telegram codec. I still need a broader test with voice notes recorded on the phone, including mixed English and Spanish.

### 3 November, 11:30 card: "since the last card", on a real card

This morning's card was the first to use yesterday's fix. Its first draft passed the gate, and its Why? reply ended with this sentence:

> Prs rose by 11 since the last card.

That's the shape the rule asks for. Yesterday at 15:30, the same kind of change came out as "Prs rose by 3 in the last period", and the gate let it through.

The rule went live at 23:29 on 2 November. Its go/no-go ran all 54 made-up cases: 2 first drafts failed the gate, and both passed on the retry.

A second rehearsal that night used a copy of my data and my real list of private terms. The new gate stopped ordinary card sentences as if they held a private term. The 11:30 card fell back to a plain card in 5 runs out of 5.

What I changed: a private-term match made only of card words no longer counts. An exact match of the whole term still does. The same rehearsal then fell back in none of 5 runs, and the fix went live at 01:27, before any card used the 23:29 gate. It's merged in [pull request #58](https://github.com/macayaven/ikigai-loop/pull/58).

Known limit: a private term made only of card words, written as separate words, isn't caught. And the gate checks the 11 against my records at card time; a separate audit recounts it from GitHub later.

### 2 November, 15:30 card: the right number, the wrong period

The second real card passed the gate with this sentence:

> Prs rose by 3 in the last period.

The 3 was right. The sentence was wrong. On the same card, another sentence said pull requests were 27 in the last period, against 2 in the prior one: from the prior period to the last, they rose by 25.

The 3 was the change since my previous card, at 13:30. Then the last period held 24 pull requests; at 15:30 it held 27. The gate checked that 3 matched the stored change since the last card, and that the sentence named the last period. "In the last period" names it, so the sentence passed.

What I changed: first a test that fails on that exact sentence, then a rule. A change since the last card has to say "since the last card", and a phrase that puts the change inside a period is rejected. Muse Wonder is now taught that phrase, so cards don't start failing: on ten made-up cases, all ten drafts passed, and every since-last sentence said "since the last card". The fix is merged in [pull request #43](https://github.com/macayaven/ikigai-loop/pull/43). It reaches the live cards on 3 November only if that night's checks pass.

Known limit: the new rule also rejects one true but clumsy shape, "Pushes in the last period increased by 1 since the last card". The taught prompt wrote it in none of 252 claims.

*Claude Code drafted the original page from my spec, and I edited and approved it. I used Codex to draft the 4 November field note from the demo and its evidence. Every number comes from my assistant's stored cards, the public repo or the video file.*
