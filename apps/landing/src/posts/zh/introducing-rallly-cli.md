---
title: 推出 Rallly CLI
date: '2026-04-29'
category: Self-hosting
excerpt: 全新的 CLI，用于安装、配置和管理自托管 Rallly 实例，并开箱即用地支持 HTTPS 和图片上传。
---

过去，要自托管 Rallly，通常需要复制一份示例 `docker-compose.yml`，手动编辑配置，选择自己的反向代理；如果还希望图片上传正常工作，则需要配置 S3 存储桶。虽然也能用，但每次安装都略有不同，支持邮件中也经常会出现“我是不是正确配置了那部分？”这样的问题。

因此，我们构建了一个完善的 CLI，为你处理安装、配置和日常操作。

## 一条命令完成安装

```sh
curl -fsSL https://get.rallly.co | bash
```

安装程序会检查你的环境，引导你完成配置（域名、支持邮箱、SMTP），为你生成密钥，并启动所有服务。你无需手动编辑任何内容。

现在，一个可正常运行的实例会自带：

- **Rallly** 本身
- 用于数据库的 **PostgreSQL**
- 作为反向代理的 **Traefik**，并自动获取 Let's Encrypt 证书
- 用于兼容 S3 的对象存储的 **Garage**，因此头像和图片上传可以立即使用

你不再需要自行准备代理或对象存储，就能获得一个完整的实例。如果你更愿意使用外部服务（托管的 Postgres、AWS S3、自有的 Nginx 或 Caddy），也完全可以：在 `.env` 中设置相关变量后，内置的这些服务容器就不会启动。

## 使用 CLI 管理

安装完成后，所有操作都通过 `rallly.sh` CLI 进行：

```sh
./rallly.sh start          # Start all services
./rallly.sh stop           # Stop all services
./rallly.sh restart        # Apply .env changes
./rallly.sh status         # Show service status
./rallly.sh logs           # Stream logs
./rallly.sh update         # Pull latest images and recreate containers
./rallly.sh backup         # Back up the database to ./backups/
```

尤其是现在，更新只需一行命令。`./rallly.sh update` 会拉取最新镜像、重新创建容器，同时保留你的数据和配置。默认情况下，CLI 跟踪 `lukevella/rallly:4` 标签，因此你会自动获得兼容的 4.x 版本更新。

此外，由于我们对整个技术栈有了更多控制，未来可以在不让安装过程变得复杂、也不要求用户编辑 compose 文件的情况下，添加更多服务。

## 已经在自托管？

如果你已经通过手动编辑的 `docker-compose.yml` 或 `config.env` 运行 Rallly，可以参考分步的[迁移指南](https://support.rallly.co/self-hosting/migration)，了解如何升级到 4.10 并迁移到 CLI，同时不会丢失数据。迁移时最重要的是保留你的 `SECRET_PASSWORD`，因为它用于加密会话。

## 从哪里开始

- **全新安装**：[安装指南](https://support.rallly.co/self-hosting/installation/docker)
- **日常操作**：[管理指南](https://support.rallly.co/self-hosting/management)
- **从旧版设置迁移**：[迁移指南](https://support.rallly.co/self-hosting/migration)

这次发布的目标，是让自托管更像一个产品，而不是一份操作步骤。如果你在过程中遇到任何问题，或者对接下来应该做什么有想法，欢迎通过 [feedback@rallly.co](mailto:feedback@rallly.co) 告诉我。
