# YouTube Subtitle Format & Translate Skill

English | [中文版](./README.zh-CN.md)

A powerful skill convert YouTube English subtitles into bilingual subtitles (Chinese + English). Core features: combining English segments, re-phrasing, and calculating timestamps; translation using the baoyu-skill for high-quality results; semantic alignment between Chinese and English, splitting long sentences, and length control for optimal display.

## 🌟 Key Features

- **7-Step Workflow**: A robust, multi-stage process ensuring high accuracy and quality.
- **Smart Re-phrasing**: Combines fragmented YouTube auto-generated captions into meaningful sentences.
- **Timestamp Calculation**: Automatically calculates precise timestamps for newly formed sentences.
- **High-Quality Translation**: Leverages the `baoyu-translate` skill for sophisticated translation results.
- **Semantic Alignment**: Aligns Chinese and English text semantically, splitting long sentences for optimal readability.
- **Chapter Support**: Integrates with YouTube chapter information (info.json) to preserve context.

## 🚀 Installation

```bash
npx skills add inceptiongt/format-and-translate-subtitle
```

## 🚀 Usage

Once installed, you can invoke the skill directly from your agent:

```bash
/gtt-format-and-translate <en_json3_path> [info_json_path] [--steps 1-7] [--output-dir <dir>]
```

### Arguments:
- `<en_json3_path>`: (Required) Path to the YouTube `json3` English subtitle file.
- `[info_json_path]`: (Optional) Path to the JSON file containing chapter information. If omitted, the tool looks for a matching `.info.json` file in the same directory.
- `--steps`: (Optional) Specify which steps to execute (e.g., `1-7`, `3-7`, or just `5`). Defaults to `1-7`.
- `--output-dir`: (Optional) Directory for intermediate and final files. Defaults to `./Subtitle/` relative to the input file.

### Examples:
```bash
/gtt-format-and-translate video.en.json3 video.info.json
/gtt-format-and-translate video.en.json3 --steps 5-7
/gtt-format-and-translate /path/to/video.en.json3 --output-dir ./my-subtitles/
```

## 💡 Pro Tip: Downloading YouTube Subtitles

You can use `yt-dlp` to download the required `json3` subtitles and video info:

```bash
yt-dlp --write-subs --sub-format json3 --sub-langs en --write-info-json --skip-download "https://www.youtube.com/watch?v=VIDEO_ID"
```

This will give you the `.en.json3` and `.info.json` files needed for this tool.

## 🛠 Workflow Overview

1.  **Step 1: Preparation**: Formats the raw `json3` file into indexed Markdown and JSON.
2.  **Step 2: English Segmentation**: Uses LLM to determine sentence boundaries and re-phrase the text.
3.  **Step 3: Format JSON**: Generates a structured JSON with recalculated timestamps.
4.  **Step 4: Translation Prep**: Prepares a Markdown file optimized for translation, including chapter markers.
5.  **Step 5: Translation**: Invokes `baoyu-translate` for high-quality English-to-Chinese translation.
6.  **Step 6: Chinese Alignment**: Segment and align the Chinese translation with the original English sentences.
7.  **Step 7: SRT Generation**: Combines everything into the final dual-language `.srt` and `.json` files.

## 📁 Output Structure

The tool creates a `Subtitle` directory containing various intermediate files and the final results:

- `7.final.srt`: The final bilingual subtitle file.
- `7.final.json`: JSON version of the final subtitles.
- `statistics.json`: Reports on the processing results (e.g., word counts, sentence counts).
- `...`: Various intermediate `.md` and `.json` files from each step.

## 📄 License

This project is licensed under the MIT License.
