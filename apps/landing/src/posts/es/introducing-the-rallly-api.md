---
title: Presentamos la API de Rallly
date: '2026-09-15'
category: Product
excerpt: >-
  Crea encuestas, consulta sus resultados y ciérralas desde tus propias
  herramientas. La API ya está disponible para los Espacios Pro de Rallly Cloud.
---

Rallly ha tenido una API pequeña oculta tras una función experimental durante un tiempo. Algunas personas la han estado usando para crear encuestas desde sus propios sistemas, y sus comentarios han ayudado a dar forma a lo que presentamos hoy. Ahora está disponible para todos los Espacios Pro de Rallly Cloud.

![Un editor de código que muestra una solicitud fetch que crea una encuesta de fechas con tres opciones mediante la API de Rallly](/static/images/rallly-api/create-poll-editor.svg)

## Qué hace

La API cubre todo el ciclo de vida de una encuesta:

- **Crear una encuesta** con días completos o franjas horarias. Las franjas horarias se pueden indicar una a una o generar a partir de un horario; por ejemplo, cada 30 minutos entre las 9 y las 17 en días laborables durante las próximas dos semanas.
- **Enumerar y consultar encuestas**, filtradas por estado, con las mismas opciones y ajustes que ves en la aplicación.
- **Consultar los resultados**: el número de votos por opción y qué opciones van en cabeza.
- **Consultar los participantes** y cómo ha votado cada uno.
- **Cerrar o eliminar** una encuesta cuando ya se ha tomado una decisión.

Cada solicitud está vinculada a un solo Espacio. La clave de API identifica el Espacio, por lo que todo lo que crees o consultes pertenecerá a él.

## Primeros pasos

El propietario del Espacio crea una clave en **Ajustes → Claves de API**. Las solicitudes la incluyen como token de tipo bearer:

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

La respuesta incluye una `inviteUrl` para compartir con los participantes y una `adminUrl` para el Organizador. Cada Espacio puede hacer 60 solicitudes por minuto.

La [referencia de la API](https://support.rallly.co/api-reference/introduction) incluye todos los endpoints con ejemplos de solicitudes y respuestas. También está disponible el documento OpenAPI, por si prefieres generar un cliente.

## Lo que viene después

Consultar periódicamente los resultados funciona, pero no es la forma en que la mayoría de las integraciones quieren funcionar. Está previsto añadir webhooks para los eventos de las encuestas, de modo que tu sistema reciba información sobre una nueva Respuesta o una encuesta cerrada en cuanto ocurra. Todavía no hay una fecha para ello. Si creas algo con la API, me gustaría saber qué estás desarrollando y qué dificultades encuentras. Puedes escribirme a [feedback@rallly.co](mailto:feedback@rallly.co).
