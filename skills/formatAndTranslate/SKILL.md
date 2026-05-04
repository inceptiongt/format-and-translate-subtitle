---
name: format_and_translate
description: 将 YouTube 字幕 JSON 转换为双语（英文 + 中文）SRT 文件，执行完整 7 步工作流。用法: /format_and_translate <en_json_path> [info_json_path] [--steps 1-7] [--debug-dir <dir>]
version: 1.0.0
metadata:
  openclaw:
    requires:
      anyBins:
        - bun
---

# format_and_translate

将 YouTube 字幕 JSON 转换为双语（英文 + 中文）SRT 文件，执行完整 7 步工作流。

## 用法

```
/format_and_translate <en_json_path> [info_json_path] [--steps 1-7] [--debug-dir <dir>]
```

**参数说明：**
- `en_json_path`：YouTube json3 格式的英文字幕文件路径（必填）
- `info_json_path`：包含 chapters 信息的 JSON 文件路径（可选，无则跳过章节标题）
- `--steps`：指定执行哪些步骤，格式 `1-7`（默认全部）。可指定范围如 `3-7`，或单步如 `5`
- `--debug-dir`：中间文件输出目录（默认为 `<en_json_dir>/<prefix>`，其中 `en_json_dir` 为 `en_json_path` 所在文件夹，`prefix` 为文件名按空格/下划线分词后取前 5 个词再加 `...`）

**示例：**
```
/format_and_translate example/video.en.json3 example/video.info.json
/format_and_translate example/video.en.json3 --steps 5-7
/format_and_translate /absolute/path/to/video.en.json3 --debug-dir /tmp/output/
```

---

## 执行前准备

1. 解析 `$ARGUMENTS`，提取 `en_json_path`、`info_json_path`（可能为空）、`--steps` 范围、`--debug-dir`
2. 将 `en_json_path` 转为绝对路径；提取其所在目录 `en_json_dir`
3. 若未指定 `--debug-dir`，则：`debug_dir = <en_json_dir>/<prefix>`（prefix 为文件名去掉目录及扩展名后，按空格/下划线分词，取前 5 个词用空格拼接再加 `...`，例如 `Building a Railway on the...`）
4. 验证 `en_json_path` 文件存在
5. 若未提供 `info_json_path`，则在 `en_json_dir` 下寻找对应的 `info.json`：从 `en_json_path` 文件名去掉 `.en.json` 后缀，加上 `.info.json`（例如 `video.en.json` -> `video.info.json`）；若文件存在则使用，否则设为空字符串 `""`
6. 确认 `bun` 可用：`bun --version`
7. 创建 debug 目录：`mkdir -p <debug_dir>`
8. 告知用户将执行哪些步骤

步骤范围解析规则：
- `--steps 1-7`（默认）：执行所有步骤
- `--steps 3-7`：从第 3 步开始
- `--steps 5`：仅执行第 5 步
- 若 debug 目录中已有某步骤的输出文件，且用户未明确指定该步骤，可跳过并提示

---

## Step 1（Code）：en.json -> 1.en.indexed.md + 1.en.indexed.json

**脚本**：`{baseDir}/scripts/step1.ts`

**执行方式**：

```bash
${BUN_X} {baseDir}/scripts/step1.ts <en_json_path> <debug_dir>
```

**输出**：
- `<debug_dir>/1.en.indexed.md`（带序号的字幕文本，已过滤 `[music]`/空行）
- `<debug_dir>/1.en.indexed.json`（清洗后的 JSON，已过滤无效 item，dDurationMs 已更新）

---

## Step 2（LLM + Code）：1.en.indexed.md -> 2.en.indexed.flag.md -> 2.en.indexed.flag.full.md

**提示词**：`{baseDir}/prompts/step2_segmentation.md`

**执行方式**：
1. 读取提示词：`{baseDir}/prompts/step2_segmentation.md`
2. 使用 `{baseDir}/scripts/chunk.ts` 对`<debug_dir>/1.en.indexed.md` 进行分块（max-words 3000），输出到 `<debug_dir>/step2_chunks/`：
   ```bash
   ${BUN_X} {baseDir}/scripts/chunk.ts <debug_dir>/1.en.indexed.md --max-words 3000 --output-dir <debug_dir>/step2_chunks
   ```
3. 对每个 chunk，按提示词处理：根据句意确定 `[end]` 边界位置；对每个 chunk **并行**启动子 agent（subagent），每个 agent：
   - 读取提示词
   - 读取对应 chunk 文件
   - 输出到 `<debug_dir>/step2_chunks/chunk-NN-flagged.md`
4. 等待全部完成后，按顺序合并为 `<debug_dir>/2.en.indexed.flag.md`
5. （Debug）展开完整文本：
   ```bash
   ${BUN_X} {baseDir}/scripts/expandFlagFull.ts <debug_dir>/1.en.indexed.json <debug_dir>/2.en.indexed.flag.md <debug_dir>/2.en.indexed.flag.full.md
   ```
**输出**：
`<debug_dir>/2.en.indexed.flag.md`
`<debug_dir>/2.en.indexed.flag.full.md`（含 `[end]` 标记的完整原文，仅供 debug）

---

## Step 3（Code）：1.en.indexed.json + 2.en.indexed.flag.md -> 3.en.formatted.json

**脚本**：`{baseDir}/scripts/step3.ts`

**执行方式**：

```bash
${BUN_X} {baseDir}/scripts/step3.ts <debug_dir>/1.en.indexed.json <debug_dir>/2.en.indexed.flag.md <debug_dir>/3.en.formatted.json
```

**输出**：`<debug_dir>/3.en.formatted.json`

---

## Step 4（Code）：3.en.formatted.json + info.json -> 4.en.formatted.indexed.md

**脚本**：`{baseDir}/scripts/step4.ts`

**分支处理**：
- 若 `info_json_path` 不为空字符串：整合 chapters 信息（第二个参数传路径）
- 若为空字符串：不插入章节标题

**执行方式**：

```bash
# 有 info.json：
${BUN_X} {baseDir}/scripts/step4.ts <debug_dir>/3.en.formatted.json <info_json_path> <debug_dir>/4.en.formatted.indexed.md

# 无 info.json：
${BUN_X} {baseDir}/scripts/step4.ts <debug_dir>/3.en.formatted.json "" <debug_dir>/4.en.formatted.indexed.md
```

**输出**：`<debug_dir>/4.en.formatted.indexed.md`

---

## Step 5（LLM）：4.en.formatted.indexed.md -> 5.en.formatted.indexed.zh.md

**工具**：`baoyu-skills:baoyu-translate` skill

**执行方式**：
调用 `baoyu-translate` skill，参数：
- 源文件：`<debug_dir>/4.en.formatted.indexed.md`
- 目标语言：`zh-CN`
- --mode 等其他参数，严格参照 EXTEND.md 文件。

**额外要求（必须在调用时明确指定）**：
1. 保持序号一一对应：`[N]` 英文 ↔ `[N]` 中文，不合并不拆分行；使用 `grep -c '^\[\d\+\.\?\d\?\]' file.md` **验证 行数 是否一致**。
2. 保留所有 `[数字]` 序号前缀
3. 翻译 `# 章节标题` 行
4. 输出格式与输入完全一致

**输出**：`<debug_dir>/5.en.formatted.indexed.zh.md`

---

## Step 6（LLM + Code）：4.en.formatted.indexed.md + 5.en.formatted.indexed.zh.md -> 6.en.formatted.indexed.zh.segmention.md -> 6.en.formatted.indexed.zh.segmention.full.md

**提示词**：`{baseDir}/prompts/step6_segmentation_alignment.md`

**执行方式**：
1. 读取提示词：`{baseDir}/prompts/step6_segmentation_alignment.md`
2. 判断 Step 5 是否产生了 chunks：检查 baoyu-translate 实际输出目录（`<debug_dir>/4.en.formatted.indexed-zh-CN/chunks/chunks/`，或 baoyu-translate 实际输出目录下 `chunks/chunks/`）是否存在 `chunk-NN.md` 文件。

   **分支 A：有 chunks（文件较长，被分块）**

   2.0 运行以下脚本，将 `5.en.formatted.indexed.zh.md` 按英文 chunk 边界拆分为对应的中文 chunks：
      ```bash
      ${BUN_X} {baseDir}/scripts/splitZhByChunks.ts <debug_dir>/5.en.formatted.indexed.zh.md <en_chunks_dir>/chunks <en_chunks_dir>
      ```
      其中 `<en_chunks_dir>` 为 baoyu-translate 输出目录下的 `chunks/` 子目录（如 `<debug_dir>/4.en.formatted.indexed-zh-CN/chunks`）。输出：`<en_chunks_dir>/chunk-NN-zh.md`
   2.1 对每对 chunk **并行**启动子 agent，每个 agent：
      - 读取提示词
      - 读取对应英文 chunk：`<en_chunks_dir>/chunks/chunk-NN.md`
      - 读取对应中文 chunk：`<en_chunks_dir>/chunk-NN-zh.md`（最终翻译，非草稿）
      - 按提示词进行分句对齐，输出到 `<debug_dir>/step6_chunks/chunk-NN-segmented.md`
   2.2 等待全部完成后，按顺序合并为 `<debug_dir>/6.en.formatted.indexed.zh.segmention.md`

   **分支 B：无 chunks（文件较短，未分块）**

   直接以整体文件作为输入，启动单个 agent：
      - 英文：`<debug_dir>/4.en.formatted.indexed.md`
      - 中文：`<debug_dir>/5.en.formatted.indexed.zh.md`
      - 输出到 `<debug_dir>/step6_chunks/chunk-01-segmented.md`，合并为 `<debug_dir>/6.en.formatted.indexed.zh.segmention.md`
3. （Debug）展开完整双语对照文本：
   ```bash
   ${BUN_X} {baseDir}/scripts/expandSegmentFull.ts <debug_dir>/3.en.formatted.json <debug_dir>/5.en.formatted.indexed.zh.md <debug_dir>/6.en.formatted.indexed.zh.segmention.md <debug_dir>/6.en.formatted.indexed.zh.segmention.full.md
   ```

**输出**：
`<debug_dir>/6.en.formatted.indexed.zh.segmention.md`
`<debug_dir>/6.en.formatted.indexed.zh.segmention.full.md`

---

## Step 7（Code）：3.en.formatted.json + 6.en.formatted.indexed.zh.segmention.md + 5.en.formatted.indexed.zh.md -> 7.final.srt

**脚本**：`{baseDir}/scripts/step7.ts`

**执行方式**：

```bash
${BUN_X} {baseDir}/scripts/step7.ts <debug_dir>/3.en.formatted.json <debug_dir>/6.en.formatted.indexed.zh.segmention.md <debug_dir>/5.en.formatted.indexed.zh.md <debug_dir>/7.final.srt
```

**输出**：`<debug_dir>/7.final.srt`（双语字幕，中文在上，英文在下）

---

## 完成汇报

所有步骤执行完毕后，统计数量:

统计 md 文件内容的数量，包括行数、字数：
-  行数，通过 `grep -c '^\[\d\+\.\?\d\?\]' file.md` 统计。
-  字数，内容为英文的，通过 `wc -w file.md` 统计；内容为中文的（文件名 .zh.md 后缀），通过 `wc -m file.md` 统计。

zh.segmention.md 文件只统计行数，不统计字数。

统计 srt 文件的字幕数量（即字幕块数量），通过 `grep -c '^\d\+$' file.srt` 统计。

json 文件不统计

输出，并保存摘要为 `<debug_dir>/statistics.md`:

```
✅ format_and_translate 完成

输入：<en_json_path>
输出：<debug_dir>/7.final.srt

中间文件：
  Step 1 -> <debug_dir>/1.en.indexed.md + 1.en.indexed.json ，数量：行数：...行；英文词数：...词
  Step 2 -> <debug_dir>/2.en.indexed.flag.md ，数量：行数：...行；英文词数：...词 + 2.en.indexed.flag.full.md（debug）
  Step 3 -> <debug_dir>/3.en.formatted.json
  Step 4 -> <debug_dir>/4.en.formatted.indexed.md ，数量：行数：...行；英文词数：...词
  Step 5 -> <debug_dir>/5.en.formatted.indexed.zh.md ，数量：行数：...行；中文字数：...字
  Step 6 -> <debug_dir>/6.en.formatted.indexed.zh.segmention.md ，数量：行数：...行；+ 6.en.formatted.indexed.zh.segmention.full.md（debug）
  Step 7 -> <debug_dir>/7.final.srt ，数量：字幕块数：...块
```

---

## 错误处理

- 某步骤失败时，显示错误信息，询问用户是否：(a) 重试 (b) 跳过继续 (c) 停止
- 代码步骤（1/3/4/7）失败通常是路径或依赖问题，检查 bun 可用性（`bun --version`）和文件路径
- LLM 步骤（2/5/6）若遇到 API 限额，等待后重试失败的 chunk，已成功的 chunk 无需重新处理
- 若 debug 目录已有输出文件，询问用户是否覆盖或跳过该步骤
