---
title: Rallly API 现已推出
date: '2026-09-15'
category: Product
excerpt: 使用你自己的工具创建投票、读取结果并关闭投票。Rallly Cloud 上的 Pro 空间现在即可使用 API。
---

Rallly 的 API 在功能开关后运行了一段时间。已经有一些用户使用它从自己的系统创建投票，他们的反馈帮助我们完善了今天发布的版本。现在，Rallly Cloud 上的所有 Pro 空间都可以使用它。

![显示通过 Rallly API 创建包含三个选项的日期投票的 fetch 请求的代码编辑器](/static/images/rallly-api/create-poll-editor.svg)

## 它能做什么

API 覆盖投票的完整生命周期：

- **创建投票**，可以使用整天的日期或时间段。时间段既可以逐个列出，也可以根据日程自动生成，例如在接下来两周的工作日中，生成每天 9 点到 17 点之间、每隔 30 分钟的时间段。
- **列出和读取投票**，可以按状态筛选，并获取与你在应用中看到的相同选项和设置。
- **读取结果**：每个选项的投票数，以及哪些选项目前领先。
- **读取参与者**，以及每位参与者的投票情况。
- **关闭或删除**投票，以便在做出决定后结束投票。

每个请求都限定在一个空间内。API 密钥用于标识空间，因此你创建或读取的所有内容都属于该空间。

## 开始使用

空间所有者可以在**设置 → API 密钥**中创建密钥。请求需要将密钥作为 bearer token 传递：

```sh
curl https://api.rallly.co/v1/polls \
  -H "Authorization: Bearer $RALLLY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team offsite",
    "kind": "date",
    "options": [
      { "date": "2026-10-05" },
      { "date": "2026-10-06" },
      { "date": "2026-10-07" }
    ]
  }'
```

响应中会包含可分享给参与者的 `inviteUrl`，以及供组织者使用的 `adminUrl`。每个空间每分钟最多可以发出 60 个请求。

[API 参考文档](https://support.rallly.co/api-reference/introduction)列出了所有端点，并提供请求和响应示例。如果你更希望自行生成客户端，也可以使用 OpenAPI 文档。

## 接下来会有什么

轮询结果虽然可行，但大多数集成并不希望以这种方式运行。我们计划为投票事件提供 Webhook，这样你的系统就能在收到新回复或投票关闭时及时获知。目前还没有确定的发布日期。如果你基于 API 构建了什么功能，我很想了解你在做什么，以及哪些地方给你带来了阻碍。欢迎发送邮件至 [feedback@rallly.co](mailto:feedback@rallly.co) 与我分享。
