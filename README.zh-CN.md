# YouTube 字幕格式化与翻译工具 (Skill)

[English](./README.md) | 中文版

将 YouTube 英文字幕转换为双语字幕（中文+英文）的 Skill，核心功能：英文片段的组合、重新断句、计算时间戳；翻译，通过 baoyu-skill 精译；中英文语义对齐、长句拆分、长度控制利于显示。
## 🌟 核心特性

- **7 步工作流**：一个稳健的多阶段流程，确保高准确度和高质量。
- **智能断句**：将 YouTube 自动生成的碎片化字幕合并为有意义的完整句子。
- **时间戳计算**：自动为新生成的句子计算精确的时间戳。
- **高质量翻译**：利用 `baoyu-translate` 工具进行精细的英中翻译。
- **语义对齐**：在语义上对齐中英文文本，并对长句进行拆分以获得最佳阅读体验。
- **章节支持**：集成 YouTube 章节信息 (info.json) 以保留上下文。

## 🚀 安装与设置

```bash
npx skills add inceptiongt/format-and-translate-subtitle
```

## 🚀 使用方法

安装完成后，你可以直接从你的 Agent 中调用该工具：

```bash
/gtt-format-and-translate <en_json3_path> [info_json_path] [--steps 1-7] [--output-dir <dir>]
```

### 参数说明：
- `<en_json3_path>`: (必填) YouTube `json3` 格式英文字幕文件的路径。
- `[info_json_path]`: (选填) 包含章节信息的 JSON 文件路径。如果省略，工具将在同一目录下查找匹配的 `.info.json` 文件。
- `--steps`: (选填) 指定要执行的步骤（例如 `1-7`、`3-7` 或仅执行 `5`）。默认为 `1-7`。
- `--output-dir`: (选填) 存放中间文件和最终文件的目录。默认为输入文件所在目录下的 `./Subtitle/`。

### 示例：
```bash
/gtt-format-and-translate video.en.json3 video.info.json
/gtt-format-and-translate video.en.json3 --steps 5-7
/gtt-format-and-translate /path/to/video.en.json3 --output-dir ./my-subtitles/
```

## 💡 小贴士：下载 YouTube 字幕

你可以使用 `yt-dlp` 来下载所需的 `json3` 字幕和视频信息：

```bash
yt-dlp --write-subs --sub-format json3  --sub-langs en --write-info-json --skip-download "https://www.youtube.com/watch?v=VIDEO_ID"
```

这将为你提供此工具所需的 `.en.json3` 和 `.info.json` 文件。

## 🛠 工作流概览

1.  **步骤 1：准备阶段**：将原始 `json3` 文件格式化为带索引的 Markdown 和 JSON。
2.  **步骤 2：英文断句**：使用大模型确定句子边界并重新组织文本。
3.  **步骤 3：格式化 JSON**：生成带有重新计算的时间戳的结构化 JSON。
4.  **步骤 4：翻译准备**：准备一个为翻译优化的 Markdown 文件，包含章节标记。
5.  **步骤 5：翻译**：调用 `baoyu-translate` 进行高质量的英中翻译。
6.  **步骤 6：中文对齐**：对中文翻译进行分句并与原始英文句子对齐。
7.  **步骤 7：SRT 生成**：将所有内容合并为最终的双语 `.srt` 和 `.json` 文件。

## 📁 输出结构

该工具会创建一个 `Subtitle` 目录，其中包含各种中间文件和最终结果：

- `7.final.srt`: 最终的双语字幕文件。
- `7.final.json`: 最终字幕的 JSON 版本。
- `statistics.json`: 处理结果报告（例如词数、句数）。
- `...`: 来自每个步骤的各种中间 `.md` 和 `.json` 文件。

## 📄 许可证

本项目采用 MIT 许可证。
