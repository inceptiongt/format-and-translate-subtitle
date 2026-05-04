# Examples: format-and-translate-subtitle

Concrete input/output examples for each step of the pipeline.

---

## Example A — Simple single-segment subtitles (Steps 1–3)

### Input: `video.en.json`

```json
[
  {
    "tStartMs": 4080,
    "dDurationMs": 4800,
    "segs": [{ "utf8": "Hey Starship Addicts my name is ZacK Golden \nand welcome to another CSI Starbase Deep Dive" }]
  },
  {
    "tStartMs": 8880,
    "dDurationMs": 4380,
    "segs": [{ "utf8": "Investigation. We have a lot to cover today so I'm \ngoing to attempt to get into this as quickly as" }]
  },
  {
    "tStartMs": 13260,
    "dDurationMs": 4380,
    "segs": [{ "utf8": "possible all of you - uhhh returning viewers - go \nahead and take this time to throw a bag of popcorn" }]
  },
  {
    "tStartMs": 17640,
    "dDurationMs": 3900,
    "segs": [{ "utf8": "in the microwave because this is that episode I've \nbeen warning you about for the last two months and" }]
  },
  {
    "tStartMs": 21540,
    "dDurationMs": 4020,
    "segs": [{ "utf8": "it's going to get a little intense. For everyone \nelse, if this is your first time clicking on a" }]
  },
  {
    "tStartMs": 25560,
    "dDurationMs": 4620,
    "segs": [{ "utf8": "CSI Starbase thumbnail...Then Hello, and welcome \nto the channel. Thanks for giving us a chance!" }]
  },
  {
    "tStartMs": 30840,
    "dDurationMs": 3180,
    "segs": [{ "utf8": "I don't usually do this but because of the \nlength of this episode I feel like I should" }]
  }
]
```

---

### Step 1 Output: `1.en.indexed.md`

```
[0] Hey Starship Addicts my name is ZacK Golden and welcome to another CSI Starbase Deep Dive
[1] Investigation. We have a lot to cover today so I'm going to attempt to get into this as quickly as
[2] possible all of you - uhhh returning viewers - go ahead and take this time to throw a bag of popcorn
[3] in the microwave because this is that episode I've been warning you about for the last two months and
[4] it's going to get a little intense. For everyone else, if this is your first time clicking on a
[5] CSI Starbase thumbnail...Then Hello, and welcome to the channel. Thanks for giving us a chance!
[6] I don't usually do this but because of the length of this episode I feel like I should
```

### Step 1 Output: `1.en.indexed.json`

```json
[
  { "tStartMs": 4080, "dDurationMs": 4800, "segs": [{ "utf8": "Hey Starship Addicts my name is ZacK Golden and welcome to another CSI Starbase Deep Dive" }] },
  { "tStartMs": 8880, "dDurationMs": 4380, "segs": [{ "utf8": "Investigation. We have a lot to cover today so I'm going to attempt to get into this as quickly as" }] },
  { "tStartMs": 13260, "dDurationMs": 4380, "segs": [{ "utf8": "possible all of you - uhhh returning viewers - go ahead and take this time to throw a bag of popcorn" }] },
  { "tStartMs": 17640, "dDurationMs": 3900, "segs": [{ "utf8": "in the microwave because this is that episode I've been warning you about for the last two months and" }] },
  { "tStartMs": 21540, "dDurationMs": 4020, "segs": [{ "utf8": "it's going to get a little intense. For everyone else, if this is your first time clicking on a" }] },
  { "tStartMs": 25560, "dDurationMs": 4620, "segs": [{ "utf8": "CSI Starbase thumbnail...Then Hello, and welcome to the channel. Thanks for giving us a chance!" }] },
  { "tStartMs": 30840, "dDurationMs": 3180, "segs": [{ "utf8": "I don't usually do this but because of the length of this episode I feel like I should" }] }
]
```

---

### Step 2 Output: `2.en.indexed.flag.md`

LLM outputs **only** lines that have sentence boundaries — one line per `[end]` marker, with one token of context before and after. Lines without a boundary are omitted entirely.

```
[1] Investigation.[end]We
[2] possible.[end]all
[4] intense.[end]For
[5] thumbnail...[end]Then
[5] chance![end]
```

> The code in `calcuTimestampByFlag.ts` reconstructs the full flagged text by applying these markers to the original JSON source (`1.en.indexed.json`), then runs the timestamp-distribution logic unchanged. Line `[5]` has two entries (two boundaries). `Investigation.[end]` at line `[1]` produces only 1 word in that segment, so it merges forward per the 10-word rule.

---

### Step 3 Output: `3.en.formatted.json`

Sentences are assembled across lines; duration is distributed by character count.

```json
[
  {
    "tStartMs": 4080,
    "dDurationMs": 6000,
    "segs": [{ "utf8": "Hey Starship Addicts my name is ZacK Golden and welcome to another CSI Starbase Deep Dive Investigation." }]
  },
  {
    "tStartMs": 10080,
    "dDurationMs": 7560,
    "segs": [{ "utf8": "We have a lot to cover today so I'm going to attempt to get into this as quickly as possible." }]
  },
  {
    "tStartMs": 17640,
    "dDurationMs": 8460,
    "segs": [{ "utf8": "all of you - uhhh returning viewers - go ahead and take this time to throw a bag of popcorn in the microwave because this is that episode I've been warning you about for the last two months and it's going to get a little intense." }]
  },
  {
    "tStartMs": 26100,
    "dDurationMs": 3060,
    "segs": [{ "utf8": "For everyone else, if this is your first time clicking on a CSI Starbase thumbnail..." }]
  },
  {
    "tStartMs": 29160,
    "dDurationMs": 1620,
    "segs": [{ "utf8": "Then Hello, and welcome to the channel." }]
  },
  {
    "tStartMs": 30780,
    "dDurationMs": 1200,
    "segs": [{ "utf8": "Thanks for giving us a chance!" }]
  },
  {
    "tStartMs": 30840,
    "dDurationMs": 3180,
    "segs": [{ "utf8": "I don't usually do this but because of the length of this episode I feel like I should" }]
  }
]
```

---

## Example B — Multi-segment items with word-level timestamps (Step 1)

### Input: `video.en.json`

Items where `segs` contains multiple entries with `tOffsetMs` (word-level timing), plus separator items (only `\n`).

```json
[
  {
    "tStartMs": 0,
    "dDurationMs": 2801640,
    "id": 1,
    "wpWinPosId": 1,
    "wsWinStyleId": 1
  },
  {
    "tStartMs": 1199,
    "dDurationMs": 6720,
    "wWinId": 1,
    "segs": [
      { "utf8": "The", "acAsrConf": 0 },
      { "utf8": " Port", "tOffsetMs": 240, "acAsrConf": 0 },
      { "utf8": " of", "tOffsetMs": 481, "acAsrConf": 0 },
      { "utf8": " Rotterdam", "tOffsetMs": 640, "acAsrConf": 0 },
      { "utf8": " moves", "tOffsetMs": 1200, "acAsrConf": 0 },
      { "utf8": " 13.7", "tOffsetMs": 1680, "acAsrConf": 0 },
      { "utf8": " million", "tOffsetMs": 2720, "acAsrConf": 0 }
    ]
  },
  {
    "tStartMs": 4309,
    "dDurationMs": 3610,
    "wWinId": 1,
    "aAppend": 1,
    "segs": [{ "utf8": "\n" }]
  },
  {
    "tStartMs": 4319,
    "dDurationMs": 6081,
    "wWinId": 1,
    "segs": [
      { "utf8": "containers", "acAsrConf": 0 },
      { "utf8": " each", "tOffsetMs": 721, "acAsrConf": 0 },
      { "utf8": " year.", "tOffsetMs": 1121, "acAsrConf": 0 }
    ]
  },
  {
    "tStartMs": 7909,
    "dDurationMs": 2491,
    "wWinId": 1,
    "aAppend": 1,
    "segs": [{ "utf8": "\n" }]
  },
  {
    "tStartMs": 7919,
    "dDurationMs": 5881,
    "wWinId": 1,
    "segs": [
      { "utf8": "More", "acAsrConf": 0 },
      { "utf8": " than", "tOffsetMs": 241, "acAsrConf": 0 },
      { "utf8": " 180,000", "tOffsetMs": 881, "acAsrConf": 0 },
      { "utf8": " people", "tOffsetMs": 1680, "acAsrConf": 0 },
      { "utf8": " [music]", "tOffsetMs": 1906 },
      { "utf8": " work", "tOffsetMs": 2081, "acAsrConf": 0 },
      { "utf8": " in", "tOffsetMs": 2241, "acAsrConf": 0 }
    ]
  }
]
```

### Step 1 Output: `1.en.indexed.md`

- First item (no `segs`) is dropped.
- Separator items (`\n` only) are dropped.
- `[music]` token is removed from text.
- `dDurationMs` for item `[0]` is recalculated: last `tOffsetMs` (2720) + 800 = 3520; capped at next item's `tStartMs` (4319 − 1199 = 3120) → 3120.

```
[0] The Port of Rotterdam moves 13.7 million
[1] containers each year.
[2] More than 180,000 people work in
```

### Step 1 Output: `1.en.indexed.json`

```json
[
  { "tStartMs": 1199, "dDurationMs": 3120, "segs": [{ "utf8": "The Port of Rotterdam moves 13.7 million" }] },
  { "tStartMs": 4319, "dDurationMs": 1121, "segs": [{ "utf8": "containers each year." }] },
  { "tStartMs": 7919, "dDurationMs": 2241, "segs": [{ "utf8": "More than 180,000 people work in" }] }
]
```

---

## Example C — Chapter integration (Step 4)

### Input: `3.en.formatted.json` (excerpt)

```json
[
  { "tStartMs": 4080, "dDurationMs": 4800, "segs": [{ "utf8": "Hey Starship Addicts my name is ZacK Golden..." }] },
  { "tStartMs": 226000, "dDurationMs": 3500, "segs": [{ "utf8": "The vapor recovery system captures..." }] }
]
```

### Input: `video.info.json`

```json
[
  { "start_time": 0.0,   "title": "Intro",                  "end_time": 225.0 },
  { "start_time": 225.0, "title": "Vapor Recovery Overview", "end_time": 336.0 }
]
```

### Step 4 Output: `4.en.formatted.indexed.md`

```
# Intro

[0] Hey Starship Addicts my name is ZacK Golden...

# Vapor Recovery Overview

[1] The vapor recovery system captures...
```

---

## Example D — Bilingual segmentation (Steps 6–7)

### Input: `4.en.formatted.indexed.md` (excerpt)

```
[1] We have a lot to cover today so I'm going to attempt to get into this as quickly as possible.
```

### Input: `5.en.formatted.indexed.zh.md` (excerpt)

```
[1] 我们今天有很多内容要讲，所以我会尽快进入正题。
```

### Step 6 Output: `6.en.formatted.indexed.zh.segmention.md` (excerpt)

LLM outputs **only** split-point descriptors — one line per split boundary, with one-token context. Lines that need no split are omitted.

English sentence `[1]` splits between `attempt` and `to`; Chinese splits between `会` and `尽`:

```
[1:en] attempt[split]to
[1:zh] 会[split]尽
```

`[copy]` example — two English sub-clauses share one Chinese rendering:

```
[5:en] thumbnail...[split]Then
[5:zh] [copy]
```

> The code in `calcuTimestampBySegmentation.ts` reconstructs sub-clauses by applying these split points to the English text in `3.en.formatted.json` and the Chinese text in `5.en.formatted.indexed.zh.md`.

---

### Step 7 Output: `7.final.srt` (excerpt)

```srt
1
00:00:04,080 --> 00:00:07,120
我们今天有很多内容要讲，所以我会
We have a lot to cover today so I'm going to attempt

2
00:00:07,120 --> 00:00:10,080
尽快进入正题。
to get into this as quickly as possible.
```
