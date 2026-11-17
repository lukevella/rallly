---
title: Apresentamos a API do Rallly
date: '2026-09-15'
category: Product
excerpt: >-
  Crie enquetes, leia resultados e encerre-as usando suas próprias ferramentas.
  A API já está disponível para Espaços Pro no Rallly Cloud.
---

O Rallly tem uma pequena API por trás de um recurso experimental há algum tempo. Algumas pessoas a vêm usando para criar enquetes a partir dos próprios sistemas, e o feedback delas ajudou a definir o que está sendo lançado hoje. Agora, ela está disponível para todos os Espaços Pro no Rallly Cloud.

![Um editor de código mostrando uma solicitação fetch que cria uma enquete de datas com três opções usando a API do Rallly](/static/images/rallly-api/create-poll-editor.svg)

## O que ela faz

A API cobre todo o ciclo de vida de uma enquete:

- **Criar uma enquete** com dias inteiros ou horários. Os horários podem ser listados individualmente ou gerados a partir de uma programação, por exemplo, a cada 30 minutos entre 9h e 17h nos dias úteis das próximas duas semanas.
- **Listar e ler enquetes**, filtradas por status, com as mesmas opções e configurações que você vê no aplicativo.
- **Ler resultados**: a contagem de votos por opção e quais opções estão na liderança.
- **Ler participantes** e como cada um votou.
- **Encerrar ou excluir** uma enquete depois que uma decisão for tomada.

Cada solicitação é vinculada a um único Espaço. A chave da API identifica o Espaço, então tudo o que você criar ou ler pertencerá a ele.

## Como começar

O proprietário do Espaço cria uma chave em **Configurações → Chaves de API**. As solicitações a enviam como um token bearer:

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

A resposta inclui um `inviteUrl` para compartilhar com os participantes e um `adminUrl` para o Organizador. Cada Espaço pode fazer 60 solicitações por minuto.

A [referência da API](https://support.rallly.co/api-reference/introduction) contém todos os endpoints, com exemplos de solicitações e respostas, e o documento OpenAPI está disponível caso você prefira gerar um cliente.

## O que vem a seguir

Consultar os resultados funciona, mas não é assim que a maioria das integrações quer operar. Webhooks para eventos de enquetes estão planejados para que seu sistema seja informado sobre uma nova Resposta ou uma enquete encerrada assim que isso acontecer. Ainda não há uma data para isso. Se você criar algo usando a API, quero saber o que está desenvolvendo e o que está dificultando o processo. Escreva para [feedback@rallly.co](mailto:feedback@rallly.co).
