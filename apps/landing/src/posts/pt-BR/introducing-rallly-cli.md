---
title: Apresentamos a CLI do Rallly
date: '2026-04-29'
category: Self-hosting
excerpt: >-
  Uma nova CLI para instalar, configurar e gerenciar instâncias autohospedadas
  do Rallly, com HTTPS e envio de imagens funcionando desde o início.
---

A autohospedagem do Rallly costumava envolver copiar um `docker-compose.yml` de exemplo, editá-lo manualmente, escolher seu próprio proxy reverso e configurar um bucket S3 se quisesse que o envio de imagens funcionasse. Era possível, mas cada instalação acabava sendo um pouco diferente, e “será que configurei essa parte corretamente?” era uma pergunta recorrente nos e-mails de suporte.

Por isso, criamos uma CLI completa que cuida da instalação, da configuração e das operações do dia a dia para você.

## Instalação com um comando

```sh
curl -fsSL https://get.rallly.co | bash
```

O instalador verifica seu ambiente, orienta você durante a configuração (domínio, e-mail de suporte e SMTP), gera os segredos para você e inicia tudo. Não é preciso editar nada manualmente.

Uma instância funcional agora inclui:

- o próprio **Rallly**
- **PostgreSQL** para o banco de dados
- **Traefik** como proxy reverso, com certificados automáticos do Let's Encrypt
- **Garage** para armazenamento de objetos compatível com S3, para que o envio de avatares e imagens funcione imediatamente

Você não precisa mais fornecer seu próprio proxy ou armazenamento de objetos para ter uma instância completa. Se preferir usar serviços externos (Postgres gerenciado, AWS S3, seu próprio Nginx ou Caddy), também é possível: defina as variáveis relevantes em `.env` e os contêineres incluídos para esses serviços simplesmente não serão iniciados.

## Gerencie com a CLI

Depois de instalada, tudo é feito pela CLI `rallly.sh`:

```sh
./rallly.sh start          # Start all services
./rallly.sh stop           # Stop all services
./rallly.sh restart        # Apply .env changes
./rallly.sh status         # Show service status
./rallly.sh logs           # Stream logs
./rallly.sh update         # Pull latest images and recreate containers
./rallly.sh backup         # Back up the database to ./backups/
```

As atualizações, em particular, agora podem ser feitas com uma única linha. `./rallly.sh update` baixa as imagens mais recentes, recria os contêineres e preserva seus dados e sua configuração. Por padrão, a CLI usa a tag `lukevella/rallly:4`, então você receberá automaticamente as versões compatíveis da série 4.x.

Além disso, com mais controle sobre a pilha, poderemos fazer coisas como adicionar mais serviços no futuro sem complicar o processo de instalação nem exigir que os usuários editem seus arquivos do Compose.

## Já usa a autohospedagem?

Se você já está executando o Rallly a partir de um `docker-compose.yml` ou `config.env` editado manualmente, há um [guia de migração](https://support.rallly.co/self-hosting/migration) passo a passo que orienta você na atualização para a versão 4.10 e na migração para a CLI sem perder dados. O mais importante a transferir é sua `SECRET_PASSWORD`, que criptografa as sessões.

## Por onde começar

- **Nova instalação**: [Guia de instalação](https://support.rallly.co/self-hosting/installation/docker)
- **Operações do dia a dia**: [Guia de gerenciamento](https://support.rallly.co/self-hosting/management)
- **Vindo de uma configuração antiga**: [Guia de migração](https://support.rallly.co/self-hosting/migration)

O objetivo desta versão foi fazer com que a autohospedagem pareça um produto, e não apenas uma receita. Se você encontrar algum problema pelo caminho ou tiver ideias sobre o que deveria vir a seguir, adoraria ouvir você pelo e-mail [feedback@rallly.co](mailto:feedback@rallly.co).
