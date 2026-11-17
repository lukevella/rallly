---
title: Apresentamos a CLI do Rallly
date: '2026-04-29'
category: Self-hosting
excerpt: >-
  Uma nova CLI para instalar, configurar e gerir instâncias do Rallly com
  alojamento próprio, com HTTPS e carregamento de imagens a funcionar de
  imediato.
---

O alojamento próprio do Rallly costumava envolver copiar um `docker-compose.yml` de exemplo, editá-lo manualmente, escolher o seu próprio proxy inverso e configurar um bucket S3 se quisesse que o carregamento de imagens funcionasse. Era possível, mas cada instalação acabava por ser um pouco diferente, e «será que configurei esta parte corretamente?» era uma pergunta recorrente nos emails enviados ao suporte.

Por isso, criámos uma CLI completa que trata da instalação, configuração e operações do dia a dia por si.

## Instalação com um comando

```sh
curl -fsSL https://get.rallly.co | bash
```

O instalador verifica o seu ambiente, orienta-o na configuração (domínio, email de suporte, SMTP), gera os segredos por si e inicia tudo. Não precisa de editar nada manualmente.

Uma instância funcional inclui agora:

- **O próprio Rallly**
- **PostgreSQL** para a base de dados
- **Traefik** como proxy inverso, com certificados Let's Encrypt automáticos
- **Garage** para armazenamento de objetos compatível com S3, para que os carregamentos de avatares e imagens funcionem de imediato

Já não precisa de fornecer o seu próprio proxy ou armazenamento de objetos para ter uma instância completa. Se preferir utilizar serviços externos (Postgres gerido, AWS S3, o seu próprio Nginx ou Caddy), também pode fazê-lo: defina as variáveis relevantes em `.env` e os contentores incluídos para esses serviços não serão iniciados.

## Gerir com a CLI

Depois de instalada, tudo é feito através da CLI `rallly.sh`:

```sh
./rallly.sh start          # Start all services
./rallly.sh stop           # Stop all services
./rallly.sh restart        # Apply .env changes
./rallly.sh status         # Show service status
./rallly.sh logs           # Stream logs
./rallly.sh update         # Pull latest images and recreate containers
./rallly.sh backup         # Back up the database to ./backups/
```

Em particular, as atualizações são agora feitas com uma única linha. `./rallly.sh update` obtém as imagens mais recentes, recria os contentores e preserva os seus dados e a sua configuração. Por predefinição, a CLI utiliza a etiqueta `lukevella/rallly:4`, pelo que receberá automaticamente versões 4.x compatíveis.

Além disso, ao termos mais controlo sobre a stack, poderemos fazer coisas como adicionar mais serviços no futuro sem complicar o processo de instalação nem obrigar os utilizadores a editar os seus ficheiros de composição.

## Já utiliza alojamento próprio?

Se já estiver a executar o Rallly a partir de um `docker-compose.yml` ou `config.env` editado manualmente, existe um [guia de migração](https://support.rallly.co/self-hosting/migration) passo a passo que explica como atualizar para a versão 4.10 e passar a utilizar a CLI sem perder dados. O mais importante a transferir é o seu `SECRET_PASSWORD`, que encripta as sessões.

## Por onde começar

- **Nova instalação**: [Guia de instalação](https://support.rallly.co/self-hosting/installation/docker)
- **Operações do dia a dia**: [Guia de gestão](https://support.rallly.co/self-hosting/management)
- **A migrar de uma configuração mais antiga**: [Guia de migração](https://support.rallly.co/self-hosting/migration)

O objetivo desta versão foi fazer com que o alojamento próprio parecesse um produto, e não uma receita. Se encontrar algum problema ao longo do caminho ou tiver ideias para o que deveríamos fazer a seguir, gostava muito de saber a sua opinião através de [feedback@rallly.co](mailto:feedback@rallly.co).
