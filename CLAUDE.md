# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Claude Code skill plugin that converts YouTube subtitle JSON (json3 format) into dual-language (Chinese + English) SRT files via a 7-step pipeline.

**Invocation:** `/format-and-translate <en_json_path> [info_json_path] [--steps 1-7] [--output-dir <dir>]`

## Running Scripts

All scripts require **Bun** runtime. Install dependencies first:

```bash
cd skills/format-and-translate/scripts
bun install
```

Run individual pipeline steps:

```bash
bun scripts/step1.ts <en_json_path> <output_dir>
bun scripts/step3.ts <indexed_json> <flag_md> <output_json>
bun scripts/step4.ts <formatted_json> <info_json> <output_md>
bun scripts/step7.ts <formatted_json> <segmentation_md> <output_srt>
bun scripts/chunk.ts <input.md> --max-words 3000 --output-dir <dir>
```

There is no test suite or linter configured.

## 7-Step Pipeline Architecture

The pipeline alternates between **code steps** (deterministic) and **LLM steps** (Claude-powered):

| Step | Type | Input → Output | Key logic |
|------|------|----------------|-----------|
| 1 | Code | YouTube JSON → `.indexed.md` + `.indexed.json` | Cleans `[music]`, adds `[n]` indices, recalculates durations from word-level timestamps |
| 2 | LLM | `.indexed.md` → `.indexed.flag.md` | Adds `[end]` markers at sentence boundaries using `baoyu-claude`; large files split via `chunk.ts` (max 3000 words) |
| 3 | Code | `.indexed.json` + `.indexed.flag.md` → `.formatted.json` | Merges lines into sentences using `[end]` markers; distributes duration proportionally by character count; auto-merges sub-clauses < 10 words |
| 4 | Code | `.formatted.json` + `info.json` → `.formatted.indexed.md` | Re-indexes sentences, optionally inserts chapter headings at time positions |
| 5 | LLM | `.formatted.indexed.md` → `.indexed.zh.md` | English→Chinese translation via `baoyu-translate`, preserving `[n]` indices line-for-line |
| 6 | LLM | English MD + Chinese MD → `.indexed.zh.segmention.md` | Splits lines into sub-clauses `[n.1]`, `[n.2]`…; English clauses < 20 words, Chinese < 20 chars; supports `[copy]` flag for identical translations |
| 7 | Code | `.formatted.json` + segmentation MD → `.srt` | Calculates per-clause timestamps (proportional to char count), renders dual-language SRT (Chinese line 1, English line 2) |

### Key Source Modules

- `formatAndAddIndex.ts` — Step 1: text cleaning and indexing
- `calcuTimestampByFlag.ts` — Step 3: timestamp distribution via `[end]` markers
- `formatWithChapters.ts` — Step 4: chapter heading insertion
- `calcuTimestampBySegmentation.ts` — Step 7: sub-segment timing and `[copy]` handling
- `genDualSrt.ts` — Step 7: SRT file rendering
- `chunk.ts` — Shared utility: word-aware markdown splitting (CJK char = 1 word)

### Intermediate File Formats

```
.indexed.md              [n] text lines (raw indexed)
.indexed.json            Cleaned items with recalculated durations
.indexed.flag.md         Indexed lines with [end] sentence boundary markers
.formatted.json          Complete sentences with merged timestamps
.formatted.indexed.md    Sentences + chapter headings, re-indexed
.indexed.zh.md           Chinese translation, one line per [n] index
.indexed.zh.segmention.md  Bilingual sub-segments [n.m]
```

## Critical Constraints

**Step 2 prompt rule:** Only add `[end]` markers and punctuation — never modify existing text.

**Step 3 merge rule:** Sub-clauses within a single line that have < 10 words are merged forward into the next `[end]`-terminated group.

**Step 6 segmentation rules:**
- No cross-line merging — every `[n]` index must appear in output
- English clause limit: < 20 words
- Chinese clause limit: < 20 characters
- Use `[copy]` when a Chinese translation applies to multiple consecutive English sub-clauses

**Step 7 validation:** Line count in segmentation MD must match before generating SRT output.

## Plugin Structure

```
.claude-plugin/plugin.json       Plugin metadata
skills/formatAndTranslate/
  SKILL.md                       Full skill spec (authoritative workflow doc)
  scripts/                       TypeScript pipeline scripts
  prompts/                       LLM prompt templates for steps 2 and 6
  examples.md                    Concrete I/O examples per step
  reference.md                   Technical format/algorithm reference
  TODO.md                        Known issues and planned improvements
```

`SKILL.md` is the authoritative reference for workflow details, error handling, and execution logic.
