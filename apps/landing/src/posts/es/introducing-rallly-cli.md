---
title: Presentamos la CLI de Rallly
date: '2026-04-29'
category: Self-hosting
excerpt: >-
  Una nueva CLI para instalar, configurar y gestionar instancias de Rallly
  autoalojadas, con HTTPS y carga de imágenes funcionando desde el primer
  momento.
---

Autoalojar Rallly solía implicar copiar un `docker-compose.yml` de ejemplo, editarlo manualmente, elegir tu propio proxy inverso y configurar un bucket de S3 si querías que funcionara la carga de imágenes. Era viable, pero cada instalación era un poco diferente, y «¿he configurado correctamente esa parte?» era una pregunta recurrente en los correos de soporte.

Así que hemos creado una CLI completa que se encarga de la instalación, la configuración y las operaciones del día a día por ti.

## Instalar con un solo comando

```sh
curl -fsSL https://get.rallly.co | bash
```

El instalador comprueba tu entorno, te guía durante la configuración (dominio, correo electrónico de soporte y SMTP), genera los secretos por ti y pone todo en marcha. No tienes que editar nada manualmente.

Una instancia funcional incluye ahora:

- **Rallly**
- **PostgreSQL** para la base de datos
- **Traefik** como proxy inverso, con certificados de Let's Encrypt automáticos
- **Garage** para el almacenamiento de objetos compatible con S3, de modo que la carga de avatares e imágenes funcione de inmediato

Ya no tienes que aportar tu propio proxy ni tu propio almacenamiento de objetos para obtener una instancia completa. Si prefieres utilizar servicios externos (Postgres gestionado, AWS S3, tu propio Nginx o Caddy), también puedes hacerlo: configura las variables correspondientes en `.env` y los contenedores incluidos para esos servicios no se iniciarán.

## Gestionar con la CLI

Una vez instalada, todo se gestiona mediante la CLI `rallly.sh`:

```sh
./rallly.sh start          # Start all services
./rallly.sh stop           # Stop all services
./rallly.sh restart        # Apply .env changes
./rallly.sh status         # Show service status
./rallly.sh logs           # Stream logs
./rallly.sh update         # Pull latest images and recreate containers
./rallly.sh backup         # Back up the database to ./backups/
```

Las actualizaciones, en particular, ahora se hacen con una sola línea. `./rallly.sh update` descarga las imágenes más recientes, vuelve a crear los contenedores y conserva tus datos y tu configuración. De forma predeterminada, la CLI sigue la etiqueta `lukevella/rallly:4`, por lo que recibirás automáticamente las versiones compatibles de 4.x.

Además, al tener más control sobre la pila, en el futuro podremos hacer cosas como añadir más servicios sin complicar el proceso de instalación ni pedir a los usuarios que editen sus archivos de compose.

## ¿Ya autoalojas Rallly?

Si ya ejecutas Rallly desde un `docker-compose.yml` o `config.env` editado manualmente, hay una [guía de migración](https://support.rallly.co/self-hosting/migration) paso a paso que te explica cómo actualizar a la versión 4.10 y pasar a la CLI sin perder datos. Lo más importante que debes conservar es tu `SECRET_PASSWORD`, que cifra las sesiones.

## Por dónde empezar

- **Nueva instalación**: [Guía de instalación](https://support.rallly.co/self-hosting/installation/docker)
- **Operaciones del día a día**: [Guía de gestión](https://support.rallly.co/self-hosting/management)
- **Si vienes de una configuración anterior**: [Guía de migración](https://support.rallly.co/self-hosting/migration)

El objetivo de esta versión era conseguir que autoalojar Rallly se pareciera más a utilizar un producto que a seguir una receta. Si encuentras algún problema durante el proceso o tienes ideas sobre lo que deberíamos hacer a continuación, me encantará saber de ti en [feedback@rallly.co](mailto:feedback@rallly.co).
