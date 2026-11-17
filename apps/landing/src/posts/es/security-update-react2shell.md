---
title: 'Actualización de seguridad: React2Shell'
date: '2025-12-12'
category: Security
excerpt: >-
  Importantes actualizaciones de seguridad para solucionar vulnerabilidades en
  React Server Components, incluida React2Shell. Quienes alojen Rallly por su
  cuenta deben actualizar inmediatamente.
---

**Este anuncio solo es relevante para instalaciones de Rallly alojadas por sus propios administradores.** Si utilizas el servicio alojado de Rallly en [rallly.co](https://rallly.co), no tienes que hacer nada. Los servidores se actualizaron en las horas posteriores al anuncio de los CVE y no se produjo ninguna brecha durante ese tiempo.

---

Se ha descubierto una vulnerabilidad de seguridad crítica en React Server Components que afecta a Rallly. En las instalaciones que no se hayan actualizado, esta vulnerabilidad podría permitir a un atacante ejecutar código de forma remota en el servidor. Si tu instancia está accesible desde internet y no ejecuta la versión más reciente, **tu servidor corre un riesgo considerable**.

Esta vulnerabilidad, [CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182) (también conocida como [React2Shell](https://react2shell.com/)), afecta a muchas aplicaciones creadas con React 19. Ya se han comunicado brechas reales en las que los atacantes instalaron software malicioso en servidores comprometidos.

Además, se han identificado otras dos vulnerabilidades ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)) en el protocolo React Server Components (RSC). Aunque no permiten ejecutar código de forma remota, también requieren una actualización.

Más tarde, el equipo de React descubrió que la solución para CVE-2025-55184 estaba incompleta, por lo que fue necesario aplicar una actualización adicional. Esta se ha identificado como [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779).

## Cronología

- **3 de diciembre de 2025**: el equipo de React anunció React2Shell ([CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182))
- **4 de diciembre de 2025**: publiqué la versión v4.5.7 (paquete de Next.js actualizado)
- **8 de diciembre de 2025**: publiqué la versión v4.5.8 (paquete de React actualizado, totalmente protegida contra React2Shell)
- **11 de diciembre de 2025**: el equipo de React anunció dos CVE adicionales ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)). En respuesta, publiqué la versión v4.5.10
- **12 de diciembre de 2025**: el equipo de React anunció que la solución para CVE-2025-55184 estaba incompleta. La solución adicional se identificó como [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779). En respuesta, publiqué la versión v4.5.11

## Acción necesaria

Si alojas Rallly por tu cuenta, sigue estos pasos inmediatamente:

- **Actualiza** Rallly a la última versión (v4.5.11 o posterior) para estar protegido frente a los cuatro CVE. Consulta las [notas de la versión](https://github.com/lukevella/rallly/releases/tag/v4.5.11) para obtener más información.
- Si utilizas la versión v4.5.10, debes actualizar a la v4.5.11, ya que la solución anterior estaba incompleta.
- Si utilizas la versión v4.5.8 (que ofrecía protección completa frente a React2Shell), debes actualizar a la v4.5.11 para estar protegido frente a todas las vulnerabilidades.
- Si utilizas la versión v4.5.7, deberías actualizar a la v4.5.11, ya que la v4.5.7 podría no haber ofrecido protección completa frente a React2Shell.
- Si utilizas una versión anterior a la v4.5.7, eres vulnerable a React2Shell y debes actualizar inmediatamente.
- **Reinicia** todos los servicios y, si utilizas Docker, vuelve a crear la imagen o descarga la última versión.
- **Si no puedes actualizar de inmediato**, restringe temporalmente el acceso (VPN o proxy de autenticación) hasta que hayas aplicado la actualización.

Después de actualizar, comprueba que tu instancia muestra la última versión de Rallly y revisa los registros en busca de advertencias. Para comprobar la versión, visita: `<your‑rallly‑instance>/api/status`.

## Información adicional

Para consultar todos los detalles técnicos sobre las cuatro vulnerabilidades:
- [React2Shell (CVE-2025-55182)](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components): vulnerabilidad crítica de ejecución remota de código
- [Vulnerabilidades adicionales (CVE-2025-55183, CVE-2025-55184, CVE-2025-67779)](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components): denegación de servicio y exposición del código fuente
