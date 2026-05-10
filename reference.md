# Reference: format-and-translate-subtitle

Technical reference for the 7-step pipeline that converts YouTube subtitle JSON into dual-language (English + Chinese) SRT files.

---

## Pipeline Overview

| Step | Type | Script / Tool | Input → Output |
|------|------|---------------|----------------|
| 1 | Code | `scripts/step1.ts` | `*.en.json` → `1.en.indexed.md` + `1.en.indexed.json` |
| 2 | LLM  | `prompts/step2_segmentation.md` | `1.en.indexed.md` → `2.en.indexed.flag.md` |
| 3 | Code | `scripts/step3.ts` | `1.en.indexed.json` + `2.en.indexed.flag.md` → `3.en.formatted.json` |
| 4 | Code | `scripts/step4.ts` | `3.en.formatted.json` + `*.info.json` → `4.en.formatted.indexed.md` |
| 5 | LLM  | `baoyu-translate` skill | `4.en.formatted.indexed.md` → `5.en.formatted.indexed.zh.md` |
| 6 | LLM  | `prompts/step6_segmentation_alignment.md` | `4.en.formatted.indexed.md` + `5.en.formatted.indexed.zh.md` → `6.en.formatted.indexed.zh.segmention.md` |
| 7 | Code | `scripts/step7.ts` | `3.en.formatted.json` + `6.en.formatted.indexed.zh.segmention.md` → `7.final.srt` |

---

## Data Formats

### Input: `*.en.json` (YouTube json3 format)

```json
[
  {
    "tStartMs": 4080,
    "dDurationMs": 4800,
    "segs": [{ "utf8": "Hey Starship Addicts" }]
  }
]
```

Multi-segment items (word-level timestamps):
```json
{
  "tStartMs": 1199,
  "dDurationMs": 6720,
  "segs": [
    { "utf8": "The" },
    { "utf8": " Port", "tOffsetMs": 240 },
    { "utf8": " of", "tOffsetMs": 481 }
  ]
}
```

Items without a `utf8` field, or with `utf8` equal to `\n` / `[music]`, are invalid and filtered out.

### Input: `*.info.json` (chapters)

```json
[
  { "start_time": 0.0, "title": "Intro", "end_time": 225.0 },
  { "start_time": 225.0, "title": "Vapor Recovery Overview", "end_time": 336.0 }
]
```

`start_time` and `end_time` are in seconds.

---

### Step 1 Output: `1.en.indexed.md`

One line per subtitle item. `[music]` tokens are removed; `\n` within items is replaced with a space.

```
[0] Hey Starship Addicts my name is ZacK Golden and welcome to another CSI Starbase Deep Dive
[1] Investigation. We have a lot to cover today so I'm going to attempt to get into this as quickly as
[2] possible all of you - uhhh returning viewers - go ahead and take this time to throw a bag of popcorn
```

### Step 1 Output: `1.en.indexed.json`

Cleaned JSON array. Each item has exactly one `segs` entry with the normalized text. `dDurationMs` is recalculated: last `tOffsetMs` in the item + 800 ms, then capped at the next item's `tStartMs`.

```json
[
  { "tStartMs": 4080, "dDurationMs": 4800, "segs": [{ "utf8": "Hey Starship Addicts..." }] },
  { "tStartMs": 8880, "dDurationMs": 4380, "segs": [{ "utf8": "Investigation. We have..." }] }
]
```

---

### Step 2 Output: `2.en.indexed.flag.md`

Same format as the input, with `[end]` markers and punctuation added at sentence boundaries. Line indices (`[n]`) are never changed; text within a line is never modified other than adding `[end]` and punctuation.

```
[0] Hey Starship Addicts my name is ZacK Golden and welcome to another CSI Starbase Deep Dive
[1] Investigation.[end] We have a lot to cover today so I'm going to attempt to get into this as quickly as
[2] possible.[end] all of you - uhhh returning viewers - go ahead and take this time to throw a bag of popcorn
[4] it's going to get a little intense.[end] For everyone else, if this is your first time clicking on a
[5] CSI Starbase thumbnail...[end] Then Hello, and welcome to the channel. Thanks for giving us a chance![end]
```

**Merging rule**: within the same `[n]` line, a `[end]`-terminated sub-clause that has fewer than 10 words is merged into the following sub-clause (not treated as a sentence boundary).

---

### Step 3 Output: `3.en.formatted.json`

Complete sentences with recalculated timestamps. Duration is distributed proportionally by character count.

```json
[
  { "tStartMs": 4080, "dDurationMs": 6000, "segs": [{ "utf8": "Hey Starship Addicts my name is ZacK Golden and welcome to another CSI Starbase Deep Dive Investigation." }] },
  { "tStartMs": 10080, "dDurationMs": 7560, "segs": [{ "utf8": "We have a lot to cover today so I'm going to attempt to get into this as quickly as possible." }] }
]
```

---

### Step 4 Output: `4.en.formatted.indexed.md`

Re-indexed markdown with optional chapter headings inserted at the correct positions.

```
# Intro

[0] Hey Starship Addicts my name is ZacK Golden and welcome to another CSI Starbase Deep Dive Investigation.
[1] We have a lot to cover today so I'm going to attempt to get into this as quickly as possible.

# Vapor Recovery Overview

[42] The vapor recovery system captures...
```

---

### Step 5 Output: `5.en.formatted.indexed.zh.md`

Line-for-line Chinese translation. `[N]` indices and `# Chapter` headings are preserved.

```
[0] 嘿，星际飞船爱好者们，我是 ZacK Golden，欢迎来到另一期 CSI 星际基地深度探索。
[1] 我们今天有很多内容要讲，所以我会尽快进入正题。
```

---

### Step 6 Output: `6.en.formatted.indexed.zh.segmention.md`

Sub-segmented bilingual format. English block followed by Chinese block, with `[n.m]` sub-indices.

```
[1.1] We have a lot to cover today so I'm going to attempt
[1.2] to get into this as quickly as possible.

[1.1] 我们今天有很多内容要讲，所以我会
[1.2] [copy]
```

**`[copy]`**: the Chinese sub-clause is identical to the previous sibling's translation (two English sub-clauses share one Chinese rendering).

---

### Step 7 Output: `7.final.srt`

Standard SRT. Chinese on the first subtitle line, English on the second.

```
1
00:00:04,080 --> 00:00:10,080
嘿，星际飞船爱好者们，我是 ZacK Golden，欢迎来到另一期 CSI 星际基地深度探索。
Hey Starship Addicts my name is ZacK Golden and welcome to another CSI Starbase Deep Dive Investigation.
```

---

## Scripts

### `scripts/step1.ts`

```bash
bun scripts/step1.ts <en_json_path> <output_dir>
```

Calls `formatAndAddIndex()` and `cleanSubtitleItems()` from `formatAndAddIndex.ts`. Writes `1.en.indexed.md` and `1.en.indexed.json`.

---

### `scripts/step3.ts`

```bash
bun scripts/step3.ts <output_dir>/1.en.indexed.json <output_dir>/2.en.indexed.flag.md <output_dir>/3.en.formatted.json
```

Calls `calcuTimestampByFlag()` from `calcuTimestampByFlag.ts`.

**Algorithm**: For each `[n]` line, splits text at `[end]` markers into sub-clauses. Sub-clauses under 10 words within the same line are merged. Duration of the parent item is distributed proportionally by character count across resulting sentences. Cross-line sentences (no `[end]` before the next `[n]`) accumulate across items.

---

### `scripts/step4.ts`

```bash
bun scripts/step4.ts <output_dir>/3.en.formatted.json [info_json_path] <output_dir>/4.en.formatted.indexed.md
# Pass "" as second arg when no info.json is available
```

Calls `formatWithChapters()` from `formatWithChapters.ts`. Chapter headings are inserted before the first subtitle item whose `tStartMs` falls within the chapter's time range.

---

### `scripts/step7.ts`

```bash
bun scripts/step7.ts <output_dir>/3.en.formatted.json <output_dir>/6.en.formatted.indexed.zh.segmention.md <output_dir>/7.final.srt
```

Calls `calcuTimestampBySegmentation()` then `genDualSrt()`.

**Algorithm**: Groups `[n.m]` entries by parent index `n`, distributes the parent item's duration from `3.en.formatted.json` proportionally by character length. `[copy]` entries reuse the translation from the previous sibling.

---

### `scripts/chunk.ts`

```bash
bun scripts/chunk.ts <input.md> --max-words <N> --output-dir <dir>
```

Splits a markdown file into chunks for LLM context limits. Uses `markdown-it` to detect block boundaries (headings, code blocks, etc.). Supports CJK character counting (each CJK character = 1 word).

---

## Key Source Files

| File | Purpose |
|------|---------|
| `scripts/formatAndAddIndex.ts` | Step 1 core — normalize items, add `[n]` indices, clean text |
| `scripts/calcuTimestampByFlag.ts` | Step 3 core — distribute timestamps using `[end]` markers |
| `scripts/formatWithChapters.ts` | Step 4 core — insert chapter headings at time positions |
| `scripts/calcuTimestampBySegmentation.ts` | Step 7 core — distribute timestamps using `[n.m]` sub-segments |
| `scripts/genDualSrt.ts` | Step 7 core — render `SegmentResult[]` to SRT format |
| `scripts/chunk.ts` | LLM chunking utility (Steps 2 and 6) |
| `prompts/step2_segmentation.md` | LLM prompt for Step 2 |
| `prompts/step6_segmentation_alignment.md` | LLM prompt for Step 6 |
