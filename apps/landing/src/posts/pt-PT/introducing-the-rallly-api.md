---
title: Apresentamos a API do Rallly
date: '2026-09-15'
category: Product
excerpt: >-
  Crie sondagens, consulte resultados e feche-as a partir das suas próprias
  ferramentas. A API está agora disponível para Espaços Pro no Rallly Cloud.
---

O Rallly tem uma API pequena por trás de uma funcionalidade experimental há algum tempo. Algumas pessoas têm-na usado para criar sondagens a partir dos seus próprios sistemas, e os comentários dessas pessoas ajudaram a definir o que disponibilizamos hoje. Está agora aberta a todos os Espaços Pro no Rallly Cloud.

![Um editor de código a mostrar um pedido fetch que cria uma sondagem de datas com três opções através da API do Rallly](/static/images/rallly-api/create-poll-editor.svg)

## O que faz

A API cobre todo o ciclo de vida de uma sondagem:

- **Criar uma sondagem** com dias completos ou intervalos horários. Os intervalos horários podem ser indicados individualmente ou gerados a partir de um horário, por exemplo, a cada 30 minutos entre as 9:00 e as 17:00 nos dias úteis das duas semanas seguintes.
- **Apresentar e consultar sondagens**, filtradas por estado, com as mesmas opções e definições que vê na aplicação.
- **Consultar resultados**: contagem de votos por opção e indicação das opções que estão à frente.
- **Consultar participantes** e saber em que opções votou cada um.
- **Fechar ou eliminar** uma sondagem depois de tomada uma decisão.

Cada pedido está associado a um único Espaço. A chave da API identifica o Espaço, por isso tudo o que criar ou consultar pertence a esse Espaço.

## Como começar

O proprietário do Espaço cria uma chave em **Definições → Chaves da API**. Os pedidos incluem-na como token bearer:

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

A resposta inclui um `inviteUrl` para partilhar com os participantes e um `adminUrl` para o organizador. Cada Espaço pode fazer 60 pedidos por minuto.

A [referência da API](https://support.rallly.co/api-reference/introduction) inclui todos os endpoints, com exemplos de pedidos e respostas, e o documento OpenAPI está disponível caso prefira gerar um cliente.

## O que se segue

Consultar os resultados periodicamente funciona, mas não é assim que a maioria das integrações quer funcionar. Está prevista a utilização de webhooks para eventos de sondagens, para que o seu sistema seja informado quando surgir uma nova resposta ou quando uma sondagem for fechada. Ainda não há uma data definida para isso. Se criar algo com a API, gostava de saber o que está a criar e o que lhe está a dificultar o trabalho, através de [feedback@rallly.co](mailto:feedback@rallly.co).
