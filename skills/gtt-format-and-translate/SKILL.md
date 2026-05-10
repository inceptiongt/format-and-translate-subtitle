---
name: gtt-format-and-translate
description: "将 YouTube 英文字幕转换为双语字幕（中文+英文），核心功能：英文片段的组合、重新断句、计算时间戳；翻译，通过 baoyu-skill 精译；中英文语义对齐、长句拆分、长度控制利于显示。 Convert YouTube English subtitles into bilingual subtitles (Chinese + English). Core features: combining English segments, re-phrasing, and calculating timestamps; translation using the baoyu-skill for high-quality results; semantic alignment between Chinese and English, splitting long sentences, and length control for optimal display."
version: 1.0.0
metadata:
  openclaw:
    requires:
      anyBins:
      - bun
---

# format-and-translate

将 YouTube 英文字幕转换为双语字幕（中文+英文），核心是 7 步工作流。
输入为 en.json3、info.json(可选) 文件，可通过 yt-dlp 下载；输出为字幕的 srt 和 json。

## 用法

```
/format-and-translate <en_json3_path> [info_json_path] [--steps 1-7] [--output-dir <dir>]
```

**参数说明：**
- `en_json3_path`：YouTube json3 格式的英文字幕文件路径（必填）
- `info_json_path`：包含 chapters 信息的 JSON 文件路径（可选，无则跳过章节标题）
- `--steps`：指定执行哪些步骤，格式 `1-7`（默认全部）。可指定范围如 `3-7`，或单步如 `5`
- `--output-dir`：中间文件输出目录（默认为 `<en_json3_dir>/Subtitle`）

**示例：**
```
/format-and-translate example/video.en.json3 example/video.info.json
/format-and-translate example/video.en.json3 --steps 5-7
/format-and-translate /absolute/path/to/video.en.json3 --output-dir /tmp/output/
```

---

## Script Directory

Scripts in `scripts/` subdirectory. `{baseDir}` = this SKILL.md's directory path. Resolve `${BUN_X}` runtime: if `bun` installed → `bun`; if `npx` available → `npx -y bun`; else suggest installing bun. Replace `{baseDir}` and `${BUN_X}` with actual values.

## 执行前准备

1. 解析 `$ARGUMENTS`，提取 `en_json3_path`、`info_json_path`（可能为空）、`--steps` 范围、`--output-dir`
2. 将 `en_json3_path` 转为绝对路径；提取其所在目录 `en_json3_dir`
3. 若未指定 `--output-dir`，则：`output_dir = <en_json3_dir>/Subtitle`
4. 验证 `en_json3_path` 文件存在
5. 若未提供 `info_json_path`，则在 `en_json3_dir` 下寻找对应的 `info.json`：从 `en_json3_path` 文件名去掉 `.en.json3` 后缀，加上 `.info.json`（例如 `video.en.json3` -> `video.info.json`）；若文件存在则使用，否则设为空字符串 `""`
6. 确认 `bun` 可用：`bun --version`
7. 创建 output 目录：`mkdir -p <output_dir>`
8. 告知用户将执行哪些步骤

步骤范围解析规则：
- `--steps 1-7`（默认）：执行所有步骤
- `--steps 3-7`：从第 3 步开始
- `--steps 5`：仅执行第 5 步
- 若 output 目录中已有某步骤的输出文件，且用户未明确指定该步骤，可跳过并提示

---

## Workflow

### Step 1: 整理输入的 json3 文件 (Code)

**输入、输出**：en.json3 -> 1.en.indexed.md + 1.en.indexed.json

**执行方式（Code）**：

```bash
${BUN_X} {baseDir}/scripts/step1.ts <en_json3_path> <output_dir>
```

---

### Step 2: 英文断句 (LLM + Code)

**输入、输出**：1.en.indexed.md -> 2.en.indexed.flag.md -> 2.en.indexed.flag.full.md

**执行方式**：
1. 读取提示词：`{baseDir}/prompts/step2_segmentation.md`
2. 使用 `{baseDir}/scripts/chunk.ts` 对`<output_dir>/1.en.indexed.md` 进行分块（max-words 3000），输出到 `<output_dir>/step2_chunks/`：
   ```bash
   ${BUN_X} {baseDir}/scripts/chunk.ts <output_dir>/1.en.indexed.md --max-words 3000 --output-dir <output_dir>/step2_chunks
   ```
3. 对每个 chunk，按提示词处理：根据句意确定 `[end]` 边界位置；对每个 chunk **并行**启动子 agent（subagent），每个 agent：
   - 读取提示词
   - 读取对应 chunk 文件
   - 输出到 `<output_dir>/step2_chunks/chunk-NN-flagged.md`
   - 等待全部完成后，按顺序合并为 `<output_dir>/2.en.indexed.flag.md`
4. 展开完整文本并检查 `[end]` flag 准确性：
   ```bash
   ${BUN_X} {baseDir}/scripts/runExpandFlagFull.ts <output_dir>/1.en.indexed.json <output_dir>/2.en.indexed.flag.md <output_dir>/2.en.indexed.flag.full.md
   ```
   输出格式为 `[n:+m1+m2+-m3] sentence_text`，其中：
   - `n` 为合并后的句子序号
   - `+mi` 表示来源原始条目 mi（其 `[end]` 已匹配，或无 flag）
   - `+-mi` 表示来源原始条目 mi，但其 compact flag 中的 `[end]` **未被匹配**
   **输出**：`<output_dir>/2.en.indexed.flag.full.md`（合并后句子 + 来源索引）

5. 根据 `2.en.indexed.flag.full.md` 评估断句质量，决定后续操作：

   **5.1：匹配率检查（全量重跑判断）**

   运行统计脚本：
   ```bash
   ${BUN_X} {baseDir}/scripts/analyzeFlags.ts <output_dir>/2.en.indexed.flag.full.md <output_dir>/2.en.indexed.flag.analy.json
   ```
   输出（保存至 `<output_dir>/2.en.indexed.flag.analy.json`）：`{ "totalMi": X, "unmatchedMiCount": Y, "matchedRate": 0.ZZ, "unmatchedMiList": [...], "longSentencesCount": Z, "longSentences": [...] }`（exit code 0 表示 matchedRate ≥ 0.8，1 表示 < 0.8）

   **若 `matchedRate < 0.8`**（读取 `2.en.indexed.flag.analy.json` 中 `matchedRate`）（LLM 标记的 `[end]` 大量无法匹配）：
   - 清空 `<output_dir>/step2_chunks/`
   - 重新分块，改为 `--max-words 2000`：
     ```bash
     ${BUN_X} {baseDir}/scripts/chunk.ts <output_dir>/1.en.indexed.md --max-words 2000 --output-dir <output_dir>/step2_chunks
     ```
   - 重复步骤 3 和步骤 4（LLM 处理 + 展开 flag.full.md）
   - 若重跑后仍 < 80%，输出警告，继续执行5.2（局部修复），**不再全量重跑**。

   **5.2：任务二：对断句质量差的片段局部重新断句**

   根据 `2.en.indexed.flag.analy.json`，从 `1.en.indexed.md` 中提取需修复的句子
   （`unmatchedMiList` 中的 mi 及 `longSentences` 中的 mi）：
   ```bash
   ${BUN_X} {baseDir}/scripts/extractPartialIndexed.ts <output_dir>/2.en.indexed.flag.analy.json <output_dir>/1.en.indexed.md <output_dir>/2.en.indexed.part.md
   ```
   **输出**：`<output_dir>/2.en.indexed.part.md`（需重新断句的原始行，保留原始 mi 索引）

   若输出为空（无需修复），跳过以下步骤。

   对 `2.en.indexed.part.md` 直接运行步骤 3 的 LLM 断句（不分块，启用单个子 agent），得到：
   `<output_dir>/2.en.indexed.part.flag.md`

   将 `2.en.indexed.part.flag.md` 合并回 `2.en.indexed.flag.md`（以 `2.en.indexed.flag.md` 中已匹配的 mi 条目为基础，用 `part.flag.md` 中的条目添加或替换对应 mi）：
   ```bash
   cp <output_dir>/2.en.indexed.flag.md <output_dir>/2.en.indexed.flag.{timestamp}.md
   ${BUN_X} {baseDir}/scripts/mergePartialFlags.ts <output_dir>/2.en.indexed.part.flag.md <output_dir>/2.en.indexed.flag.md <output_dir>/2.en.indexed.flag.analy.json
   ```

   重新生成 flag.full.md（若已存在则先备份为在扩展名前添加 `.{timestamp}` 后缀，如 `2.en.indexed.flag.full.{timestamp}.md`）：
   ```bash
   cp <output_dir>/2.en.indexed.flag.full.md <output_dir>/2.en.indexed.flag.full.{timestamp}.md
   ${BUN_X} {baseDir}/scripts/runExpandFlagFull.ts <output_dir>/1.en.indexed.json <output_dir>/2.en.indexed.flag.md <output_dir>/2.en.indexed.flag.full.md
   ```

   重新统计，先备份 analy.json，再生成新的：
   ```bash
   cp <output_dir>/2.en.indexed.flag.analy.json <output_dir>/2.en.indexed.flag.analy.{timestamp}.json
   ${BUN_X} {baseDir}/scripts/analyzeFlags.ts <output_dir>/2.en.indexed.flag.full.md <output_dir>/2.en.indexed.flag.analy.json
   ```
   如果还存在 longSentences 或 unmatchedMiList，再次执行“任务二”；**最多再执行两次**。

---

### Step 3: 生成格式化 JSON (Code)

**输入、输出**：1.en.indexed.json + 2.en.indexed.flag.md -> 3.en.formatted.json

**执行方式（Code）**：
```bash
${BUN_X} {baseDir}/scripts/step3.ts <output_dir>/1.en.indexed.json <output_dir>/2.en.indexed.flag.md <output_dir>/3.en.formatted.json
```

---

### Step 4: 生成待翻译 Markdown (Code)

**输入、输出**：3.en.formatted.json + info.json -> 4.en.formatted.indexed.md

**执行方式（Code）**：
```bash
# 有 info.json：
${BUN_X} {baseDir}/scripts/step4.ts <output_dir>/3.en.formatted.json <info_json_path> <output_dir>/4.en.formatted.indexed.md

# 无 info.json：
${BUN_X} {baseDir}/scripts/step4.ts <output_dir>/3.en.formatted.json "" <output_dir>/4.en.formatted.indexed.md
```

---

### Step 5: 翻译 (LLM)

**输入、输出**：4.en.formatted.indexed.md -> 5.en.formatted.indexed.zh.md

**工具**：`baoyu-skills:baoyu-translate` skill

**执行方式**：
调用 `baoyu-translate` skill，参数：
- 源文件：`<output_dir>/4.en.formatted.indexed.md`
- 目标语言：`zh-CN`
- --mode 等其他参数，严格参照 EXTEND.md 文件。

**额外要求（必须在调用时明确指定）**：
1. 保持序号一一对应：`[N]` 英文 ↔ `[N]` 中文，不合并不拆分行；使用 `grep -c '^\[\d\+\.\?\d\?\]' file.md` **验证 行数 是否一致**。
2. 保留所有 `[数字]` 序号前缀
3. 翻译 `# 章节标题` 行
4. 输出格式与输入完全一致

---

### Step 6: 中文分句与对齐 (LLM + Code)

**输入、输出**：4.en.formatted.indexed.md + 5.en.formatted.indexed.zh.md -> 6.en.formatted.indexed.zh.segmention.full.md

**提示词**：`{baseDir}/prompts/step6_segmentation_alignment.md`

**执行方式**：
1. 读取提示词：`{baseDir}/prompts/step6_segmentation_alignment.md`
2. 检查 chunks。判断 Step 5 是否产生了 chunks：检查 baoyu-translate 实际输出目录（`<output_dir>/4.en.formatted.indexed-zh-CN/chunks/chunks/`，或 baoyu-translate 实际输出目录下 `chunks/chunks/`）是否存在 `chunk-NN.md` 文件。

   **分支 A：有英文 chunks（利用现有 chunks）**

   运行以下脚本，将 `5.en.formatted.indexed.zh.md` 按现有的英文 chunk 边界拆分为对应的中文 chunks：
   ```bash
   ${BUN_X} {baseDir}/scripts/splitZhByChunks.ts <output_dir>/5.en.formatted.indexed.zh.md <en_chunks_dir>/chunks <output_dir>/step6_chunks
   ```
   其中 `<en_chunks_dir>` 为 baoyu-translate 输出目录下的 `chunks/` 子目录（如 `<output_dir>/4.en.formatted.indexed-zh-CN/chunks`）。输出为：`<output_dir>/step6_chunks/chunk-NN-zh.md`
   
   **分支 B：无英文 chunks（生成 chunks）**
   
   使用 `{baseDir}/scripts/chunk.ts` 对 `<output_dir>/4.en.formatted.indexed.md` 进行分块（max-words 2000），输出到 `<output_dir>/step6_chunks/`：
   ```bash
   ${BUN_X} {baseDir}/scripts/chunk.ts <output_dir>/4.en.formatted.indexed.md --max-words 2000 --output-dir <output_dir>/step6_chunks
   ```   
   
   运行以下脚本，将 `5.en.formatted.indexed.zh.md` 按上述生成的英文 chunk 边界拆分为对应的中文 chunks：
   ```bash
   ${BUN_X} {baseDir}/scripts/splitZhByChunks.ts <output_dir>/5.en.formatted.indexed.zh.md <output_dir>/step6_chunks <output_dir>/step6_chunks
   ```
   
3. 处理 chunks
   2.2 对每对 chunk **并行**启动子 agent，每个 agent：
      - 读取提示词
      - 读取对应英文 chunk：`<en_chunks_dir>/chunks/chunk-NN.md` 或者 `<output_dir>/step6_chunks/chunk-NN.md`
      - 读取对应中文 chunk：`<output_dir>/step6_chunks/chunk-NN-zh.md`（最终翻译，非草稿）
      - 按提示词进行分句对齐，输出到 `<output_dir>/step6_chunks/chunk-NN-segmented.md`
   2.3 等待全部完成后，按顺序合并为 `<output_dir>/6.en.formatted.indexed.zh.segmention.md`
4. 展开完整双语对照文本：
   ```bash
   ${BUN_X} {baseDir}/scripts/runExpandSegmentFull.ts <output_dir>/3.en.formatted.json <output_dir>/5.en.formatted.indexed.zh.md <output_dir>/6.en.formatted.indexed.zh.segmention.md <output_dir>/6.en.formatted.indexed.zh.segmention.full.md
   ```

**输出**：
`<output_dir>/6.en.formatted.indexed.zh.segmention.md`
`<output_dir>/6.en.formatted.indexed.zh.segmention.full.md`

---

### Step 7: 生成最终 SRT (Code)

**输入、输出**：3.en.formatted.json + 6.en.formatted.indexed.zh.segmention.md + 5.en.formatted.indexed.zh.md -> 7.final.srt

**执行方式（Code）**：
```bash
${BUN_X} {baseDir}/scripts/step7.ts <output_dir>/3.en.formatted.json <output_dir>/6.en.formatted.indexed.zh.segmention.md <output_dir>/5.en.formatted.indexed.zh.md <output_dir>/7.final.srt
```

---

## 统计汇报 (Code)

**输入、输出**：1.en.indexed.json + 3.en.formatted.json + 7.final.json -> statistic.json

**执行方式（Code）**：
```bash
${BUN_X} {baseDir}/scripts/report.ts <output_dir>/1.en.indexed.json <output_dir>/3.en.formatted.json <output_dir>/7.final.json <output_dir>/statistics.json
```
