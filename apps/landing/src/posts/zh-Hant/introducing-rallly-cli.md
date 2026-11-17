---
title: 介紹 Rallly CLI
date: '2026-04-29'
category: Self-hosting
excerpt: 全新的 CLI，用於安裝、設定及管理自行託管的 Rallly 執行個體，並內建 HTTPS 和圖片上傳功能。
---

過去，自行託管 Rallly 需要複製範例 `docker-compose.yml`、手動編輯檔案、選擇自己的反向代理伺服器，如果想使用圖片上傳功能，還得設定 S3 儲存貯體。雖然這樣仍然可行，但每次安裝的結果都不太一樣，而「我有正確設定那個部分嗎？」也成了支援信件中反覆出現的問題。

因此，我們打造了一個完整的 CLI，為你處理安裝、設定和日常操作。

## 一個指令即可安裝

```sh
curl -fsSL https://get.rallly.co | bash
```

安裝程式會檢查你的環境，引導你完成設定（網域、支援信箱、SMTP）、替你產生密鑰，並啟動所有服務。你不需要手動編輯任何檔案。

現在，一個可正常運作的執行個體會包含：

- **Rallly** 本身
- **PostgreSQL** 資料庫
- **Traefik** 反向代理，並自動取得 Let's Encrypt 憑證
- **Garage**，用於 S3 相容的物件儲存，因此頭像和圖片可以立即上傳

你不再需要自行準備代理伺服器或物件儲存服務，就能取得完整的執行個體。如果你比較想使用外部服務（代管的 Postgres、AWS S3、自己的 Nginx 或 Caddy），也可以：只要在 `.env` 中設定相關變數，內建的這些服務容器就不會啟動。

## 使用 CLI 管理

安裝完成後，所有操作都透過 `rallly.sh` CLI 進行：

```sh
./rallly.sh start          # Start all services
./rallly.sh stop           # Stop all services
./rallly.sh restart        # Apply .env changes
./rallly.sh status         # Show service status
./rallly.sh logs           # Stream logs
./rallly.sh update         # Pull latest images and recreate containers
./rallly.sh backup         # Back up the database to ./backups/
```

現在，更新特別簡單，只需要一行指令。`./rallly.sh update` 會下載最新的映像檔、重新建立容器，並保留你的資料和設定。CLI 預設追蹤 `lukevella/rallly:4` 標籤，因此你會自動取得相容的 4.x 版本更新。

此外，透過更完善地掌控整個技術堆疊，未來我們就能加入更多服務，而不會讓安裝流程變得複雜，也不需要使用者編輯 compose 檔案。

## 已經在自行託管？

如果你目前是透過手動編輯的 `docker-compose.yml` 或 `config.env` 執行 Rallly，可以參考這份逐步的[遷移指南](https://support.rallly.co/self-hosting/migration)，了解如何升級至 4.10 並改用 CLI，同時保留所有資料。最重要的是要保留你的 `SECRET_PASSWORD`，因為它會加密工作階段。

## 從哪裡開始

- **全新安裝**：[安裝指南](https://support.rallly.co/self-hosting/installation/docker)
- **日常操作**：[管理指南](https://support.rallly.co/self-hosting/management)
- **從較舊的設定開始**：[遷移指南](https://support.rallly.co/self-hosting/migration)

這次發布的目標，是讓自行託管更像一項產品，而不是一份操作食譜。如果你在過程中遇到任何問題，或對接下來應該加入哪些功能有想法，歡迎透過 [feedback@rallly.co](mailto:feedback@rallly.co) 告訴我。
