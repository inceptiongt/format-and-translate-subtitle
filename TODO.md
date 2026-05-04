# workflow: 

## Step One - Code: en.json3 -> en.indexed.md、en.indexed.json

### formatAndAddIndex.ts
任务一：整理字幕
- 提取 data
- 添加 index: `[index] ***`
- 去除多余字符 `\n`，`[music]`

任务二：整理 json
- 去除无效 item: 没有 utf8 字段，或者 utf8 指为多余字符（ `\n`，`[music]`）
- 更新 dDurationMs: 找到最后一个 tOffsetMs，再加上 800 得到 _dDurationMs。与下一个 item 的 tStartMs 比较，取较小的那一个。

### 例子一
**input**
en.json3
``` typescript
[ {
    "tStartMs": 4080,
    "dDurationMs": 4800,
    "segs": [ {
      "utf8": "Hey Starship Addicts my name is ZacK Golden \nand welcome to another CSI Starbase Deep Dive"
    } ]
  }, {
    "tStartMs": 8880,
    "dDurationMs": 4380,
    "segs": [ {
      "utf8": "Investigation. We have a lot to cover today so I'm \ngoing to attempt to get into this as quickly as"
    } ]
  }, {
    "tStartMs": 13260,
    "dDurationMs": 4380,
    "segs": [ {
      "utf8": "possible all of you - uhhh returning viewers - go \nahead and take this time to throw a bag of popcorn"
    } ]
  }]
```
**output**
en.indexed.md
``` md
[0] Hey Starship Addicts my name is ZacK Golden and welcome to another CSI Starbase Deep Dive
[1] Investigation. We have a lot to cover today so I'm going to attempt to get into this as quickly as
[2] possible all of you - uhhh returning viewers - go ahead and take this time to throw a bag of popcorn
```
en.idexed.json
``` typescript
[ {
    "tStartMs": 4080,
    "dDurationMs": 4800,
    "segs": [ {
      "utf8": "Hey Starship Addicts my name is ZacK Golden \nand welcome to another CSI Starbase Deep Dive"
    } ]
  }, {
    "tStartMs": 8880,
    "dDurationMs": 4380,
    "segs": [ {
      "utf8": "Investigation. We have a lot to cover today so I'm \ngoing to attempt to get into this as quickly as"
    } ]
  }, {
    "tStartMs": 13260,
    "dDurationMs": 4380,
    "segs": [ {
      "utf8": "possible all of you - uhhh returning viewers - go \nahead and take this time to throw a bag of popcorn"
    } ]
  }]
```

### 例子二

**input**
en.json3
``` typescript
[ {
    "tStartMs": 0,
    "dDurationMs": 2801640,
    "id": 1,
    "wpWinPosId": 1,
    "wsWinStyleId": 1
  }, {
    "tStartMs": 1199,
    "dDurationMs": 6720,
    "wWinId": 1,
    "segs": [ {
      "utf8": "The",
      "acAsrConf": 0
    }, {
      "utf8": " Port",
      "tOffsetMs": 240,
      "acAsrConf": 0
    }, {
      "utf8": " of",
      "tOffsetMs": 481,
      "acAsrConf": 0
    }, {
      "utf8": " Rotterdam",
      "tOffsetMs": 640,
      "acAsrConf": 0
    }, {
      "utf8": " moves",
      "tOffsetMs": 1200,
      "acAsrConf": 0
    }, {
      "utf8": " 13.7",
      "tOffsetMs": 1680,
      "acAsrConf": 0
    }, {
      "utf8": " million",
      "tOffsetMs": 2720,
      "acAsrConf": 0
    } ]
  }, {
    "tStartMs": 4309,
    "dDurationMs": 3610,
    "wWinId": 1,
    "aAppend": 1,
    "segs": [ {
      "utf8": "\n"
    } ]
  }, {
    "tStartMs": 4319,
    "dDurationMs": 6081,
    "wWinId": 1,
    "segs": [ {
      "utf8": "containers",
      "acAsrConf": 0
    }, {
      "utf8": " each",
      "tOffsetMs": 721,
      "acAsrConf": 0
    }, {
      "utf8": " year.",
      "tOffsetMs": 1121,
      "acAsrConf": 0
    } ]
  }, {
    "tStartMs": 7909,
    "dDurationMs": 2491,
    "wWinId": 1,
    "aAppend": 1,
    "segs": [ {
      "utf8": "\n"
    } ]
  }, {
    "tStartMs": 7919,
    "dDurationMs": 5881,
    "wWinId": 1,
    "segs": [ {
      "utf8": "More",
      "acAsrConf": 0
    }, {
      "utf8": " than",
      "tOffsetMs": 241,
      "acAsrConf": 0
    }, {
      "utf8": " 180,000",
      "tOffsetMs": 881,
      "acAsrConf": 0
    }, {
      "utf8": " people",
      "tOffsetMs": 1680,
      "acAsrConf": 0
    }, {
      "utf8": " [music]",
      "tOffsetMs": 1906
    }, {
      "utf8": " work",
      "tOffsetMs": 2081,
      "acAsrConf": 0
    }, {
      "utf8": " in",
      "tOffsetMs": 2241,
      "acAsrConf": 0
    } ]
  }]
```
**output**
en.indexed.md
``` md
[0] The Port of Rotterdam moves 13.7 million 
[1] containers each year.
[2] More than 180,000 people [music] work in
```
en.idexed.json
``` typescript
[ {
    "tStartMs": 1199,
    "dDurationMs": 2720,
    "segs": [ {
      "utf8": "The Port of Rotterdam moves 13.7 million"
    } ]
  }, {
    "tStartMs": 4319,
    "dDurationMs": 1121,
    "segs": [ {
      "utf8": "containers each year."
    } ]
  }, {
    "tStartMs": 7919,
    "dDurationMs": 2241,
    "segs": [ {
      "utf8": "More than 180,000 people work in"
    } ]
  }]
```
## Step Two - LLM: en.indexed.md -> en.indexed.flag.md

提示词，详见 @prompts/step2_segmentation.md

### 任务
- 使用 chunk.ts 分割，再处理。
- 根据句意、语法结构对内容进行分句，在添加句号、问号等表示句子介绍的标点符号，并再添加`[end]`句子结束标记。

### 例子
**input**
en.indexed.md
``` md
[0] Hey Starship Addicts my name is ZacK Golden and welcome to another CSI Starbase Deep Dive
[1] Investigation. We have a lot to cover today so I'm going to attempt to get into this as quickly as
[2] possible all of you - uhhh returning viewers - go ahead and take this time to throw a bag of popcorn
[3] in the microwave because this is that episode I've been warning you about for the last two months and
[4] it's going to get a little intense. For everyone else, if this is your first time clicking on a
[5] CSI Starbase thumbnail...Then Hello, and welcome to the channel. Thanks for giving us a chance!
[6] I don't usually do this but because of the length of this episode I feel like I should
```

**output**
en.indexed.flag.md
``` md
[0] Hey Starship Addicts my name is ZacK Golden and welcome to another CSI Starbase Deep Dive
[1] Investigation.[end] We have a lot to cover today so I'm going to attempt to get into this as quickly as
[2] possible.[end] all of you - uhhh returning viewers - go ahead and take this time to throw a bag of popcorn
[3] in the microwave because this is that episode I've been warning you about for the last two months and
[4] it's going to get a little intense.[end] For everyone else, if this is your first time clicking on a
[5] CSI Starbase thumbnail...[end] Then Hello, and welcome to the channel. Thanks for giving us a chance![end]
[6] I don't usually do this but because of the length of this episode I feel like I should
```

## Step Three - Code: en.indexed.json、en.indexed.flag.md -> **en.formatted.json**

### calcuTimestampByFlay.ts

**概述**
- 输入两个参数，第一个是数组 arr，第二个是 md 的文本；
- md 的内容一行以`[x]`序号开头，与 arr 的一个 item 对应。所以 item 的时间，表示 md 一行内容的时间。

**任务**：
- 根据 [end] 标志拼接出整句
- 避免过分拆分。如：[43] >> Hi.[end] Good morning.[end] How are you?[end] -> >> Hi. Good morning. How are you?。规则是：同一 [n] 行内的 [end]，只有当该子句 < 10 个单词时才合并，否则仍视为正常分句边界
- 重新计算对应的时间戳，根据字符的长度所占的比例，表示所占时间的比例。

### 例子

**input**
en.indexed.json
``` typescript
[ {
    "tStartMs": 4080,
    "dDurationMs": 4800,
    "segs": [ {
      "utf8": "Hey Starship Addicts my name is ZacK Golden \nand welcome to another CSI Starbase Deep Dive"
    } ]
  }, {
    "tStartMs": 8880,
    "dDurationMs": 4380,
    "segs": [ {
      "utf8": "Investigation. We have a lot to cover today so I'm \ngoing to attempt to get into this as quickly as"
    } ]
  }, {
    "tStartMs": 13260,
    "dDurationMs": 4380,
    "segs": [ {
      "utf8": "possible all of you - uhhh returning viewers - go \nahead and take this time to throw a bag of popcorn"
    } ]
  }, {
    "tStartMs": 17640,
    "dDurationMs": 3900,
    "segs": [ {
      "utf8": "in the microwave because this is that episode I've \nbeen warning you about for the last two months and"
    } ]
  }, {
    "tStartMs": 21540,
    "dDurationMs": 4020,
    "segs": [ {
      "utf8": "it's going to get a little intense. For everyone \nelse, if this is your first time clicking on a"
    } ]
  }, {
    "tStartMs": 25560,
    "dDurationMs": 4620,
    "segs": [ {
      "utf8": "CSI Starbase thumbnail...Then Hello, and welcome \nto the channel. Thanks for giving us a chance!"
    } ]
  }, {
    "tStartMs": 30840,
    "dDurationMs": 3180,
    "segs": [ {
      "utf8": "I don't usually do this but because of the \nlength of this episode I feel like I should"
    } ]
  }]
```

en.indexed.flag.md
``` md
[0] Hey Starship Addicts my name is ZacK Golden and welcome to another CSI Starbase Deep Dive
[1] Investigation.[end] We have a lot to cover today so I'm going to attempt to get into this as quickly as
[2] possible.[end] all of you - uhhh returning viewers - go ahead and take this time to throw a bag of popcorn
[3] in the microwave because this is that episode I've been warning you about for the last two months and
[4] it's going to get a little intense.[end] For everyone else, if this is your first time clicking on a
[5] CSI Starbase thumbnail...[end] Then Hello, and welcome to the channel. Thanks for giving us a chance![end]
[6] I don't usually do this but because of the length of this episode I feel like I should
```

**output**
en.formatted.json
``` typescript
[ {
    "tStartMs": 4080,
    "dDurationMs": 6000,
    "segs": [ {
      "utf8": "Hey Starship Addicts my name is ZacK Golden and welcome to another CSI Starbase Deep Dive Investigation."
    } ]
  }, {
    "tStartMs": xxxx,
    "dDurationMs": xxxx,
    "segs": [ {
      "utf8": "We have a lot to cover today so I'm going to attempt to get into this as quickly as possible."
    } ]
  }, {
    "tStartMs": xxxx,
    "dDurationMs": xxxx,
    "segs": [ {
      "utf8": "all of you - uhhh returning viewers - go ahead and take this time to throw a bag of popcorn in the microwave because this is that episode I've been warning you about for the last two months and it's going to get a little intense."
    } ]
  }, {
    "tStartMs": xxxx,
    "dDurationMs": xxxx,
    "segs": [ {
      "utf8": " For everyone else, if this is your first time clicking on a CSI Starbase thumbnail..."
    } ]
  }, {
    "tStartMs": xxxx,
    "dDurationMs": xxxx,
    "segs": [ {
      "utf8": "Then Hello, and welcome to the channel. "
    } ]
  }, , {
    "tStartMs": xxxx,
    "dDurationMs": xxxx,
    "segs": [ {
      "utf8": "Thanks for giving us a chance!"
    } ]
  }{
    "tStartMs": xxxx,
    "dDurationMs": xxxx,
    "segs": [ {
      "utf8": "I don't usually do this but because of the length of this episode I feel like I should"
    } ]
  }]
```
## Step Four - Code: en.formatted.json、info.json -> en.formatted.indexed.md

### formatAndAddIndex.ts
任务：
- 提取 data，添加 index: `[index] ***`
- 整合 info.json 中的 chapters，把 chapter 当做标题。

### 例子
**input**
en.formatted.json
``` typescript
[ {
    "tStartMs": 4080,
    "dDurationMs": xxxx,
    "segs": [ {
      "utf8": "Hey Starship Addicts my name is ZacK Golden and welcome to another CSI Starbase Deep Dive Investigation."
    } ]
  }, {
    "tStartMs": xxxx,
    "dDurationMs": xxxx,
    "segs": [ {
      "utf8": "We have a lot to cover today so I'm going to attempt to get into this as quickly as possible."
    } ]
  }, {
    "tStartMs": xxxx,
    "dDurationMs": xxxx,
    "segs": [ {
      "utf8": "all of you - uhhh returning viewers - go ahead and take this time to throw a bag of popcorn in the microwave because this is that episode I've been warning you about for the last two months and it's going to get a little intense."
    } ]
  }]
```
info.json
``` typescript
[
    {
        "start_time": 0.0,
        "title": "Intro",
        "end_time": 225.0
    },
    {
        "start_time": 225.0,
        "title": "Vapor Recovery Overview",
        "end_time": 336.0
    }
]
```
**output**
en.formatted.indexed.md
``` md
[0] Hey Starship Addicts my name is ZacK Golden and welcome to another CSI Starbase Deep Dive Investigation.
[1] We have a lot to cover today so I'm going to attempt to get into this as quickly as possible.
[2] all of you - uhhh returning viewers - go ahead and take this time to throw a bag of popcorn in the microwave because this is that episode I've been warning you about for the last two months and it's going to get a little intense.
```
## Step Five - LLM: en.formatted.indexed.md -> en.formatted.indexed.zh.md

翻译，使用第三方 Skills(baoyu-translate)
额外要求：英文与译文的序号一一对应。

## Step Six - LLM: en.formatted.indexed.md、index.en.formatted.zh.md -> **en.formatted.indexed.zh.segmention.md**

- 提示词，详见 @prompts/step6_segmentation_alignment.md
- 拆分长句，对齐短句
- 添加 [copy] flag
- 利用 step two 过程中生成的 chunk

## Step Seven - Code: en.formatted.json、en.formatted.indexed.zh.segmention.md -> srt

### calcuTimestampBySegmentation.ts
任务：
- 计算 segmention 时间戳
- 处理 [copy] flag

参考 @utils/addTimestampForSegmentations.ts

### genDualSrt.ts
任务：
- 生成双语字幕

参考 @utils/segmentResult2Srt.ts

# tips: 

- 调用 LLM 是要不要进行分 chunk，哪次调用需要分 chunk？
- 什么时候把chapter 信息整合进 **.index.md 文件中？要不要整合？
- 没有 chapters 怎么处理？

# todo

- 修改文件夹名为：Subtitle
- 没利用 refine 后的翻译，而是使用了分 chunk 的翻译。
- 评价 LLM 打 flag 结果的质量。

## 节省 Token
- 减小输出：
  - step two
  - step six
- 利用 cache：
  - step five 的 input 与 step six 的 input 部分是一样的。
  - sub-agent 与 主 agent 好像不能命中缓存？


