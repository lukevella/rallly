---
title: Rallly API 隆重推出
date: '2026-09-15'
category: Product
excerpt: 從你自己的工具建立投票、讀取結果並關閉投票。Rallly Cloud 上的 Pro 空間現在即可使用 API。
---

Rallly 背後有一個隱藏開關控制的 API 已經一段時間了。有一些人一直使用它從自己的系統建立投票，而他們的回饋也影響了今天推出的功能。現在，Rallly Cloud 上的每個 Pro 空間都能使用這個 API。

![顯示 fetch 請求的程式碼編輯器，透過 Rallly API 建立包含三個選項的日期投票](/static/images/rallly-api/create-poll-editor.svg)

## API 可以做什麼

這個 API 涵蓋投票的完整生命週期：

- **建立投票**，可以使用整天或時段。時段可以逐一列出，也可以根據排程產生，例如在接下來兩週的平日，建立每天上午 9 點到下午 5 點之間每 30 分鐘一個的時段。
- **列出及讀取投票**，並依狀態篩選，取得與應用程式中相同的選項和設定。
- **讀取結果**：每個選項的投票數，以及目前領先的選項。
- **讀取參與者**及每個人的投票方式。
- **關閉或刪除**投票，適合在做出決定後使用。

每個請求都限定在一個空間內。API 金鑰會識別空間，因此你建立或讀取的所有內容都屬於該空間。

## 開始使用

空間擁有者可以在 **設定 → API 金鑰** 中建立金鑰。請求會將金鑰作為 bearer 權杖傳送：

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

回應中會包含可分享給參與者的 `inviteUrl`，以及提供給主辦人的 `adminUrl`。每個空間每分鐘可以提出 60 個請求。

[API 參考文件](https://support.rallly.co/api-reference/introduction) 列出了所有端點，並提供請求和回應範例。如果你想改為產生用戶端，也可以使用 OpenAPI 文件。

## 接下來的功能

輪詢結果雖然可行，但並不是大多數整合想採用的運作方式。我們計畫為投票活動提供 Webhook，讓你的系統能在收到新回覆或投票關閉時即時得知。目前還沒有確定推出日期。如果你使用這個 API 建立了什麼，我很想知道你正在打造什麼，以及有哪些地方造成阻礙，歡迎寫信到 [feedback@rallly.co](mailto:feedback@rallly.co) 告訴我。
