---
title: 'Mise à jour de sécurité : React2Shell'
date: '2025-12-12'
category: Security
excerpt: >-
  Importantes mises à jour de sécurité pour corriger les vulnérabilités des
  composants serveur de React, notamment React2Shell. Les personnes qui
  auto-hébergent Rallly doivent effectuer la mise à jour immédiatement.
---

**Cette annonce concerne uniquement les installations de Rallly auto-hébergées.** Si vous utilisez le service hébergé de Rallly à l’adresse [rallly.co](https://rallly.co), vous n’avez aucune action à effectuer. Les serveurs ont été corrigés dans les heures qui ont suivi l’annonce des CVE, et aucune faille n’a été exploitée pendant cette période.

---

Une vulnérabilité critique a été découverte dans les composants serveur de React et concerne Rallly. Sur les installations qui n’ont pas été corrigées, cette vulnérabilité pourrait permettre à un attaquant d’exécuter du code à distance sur votre serveur. Si votre instance est accessible depuis Internet et que vous n’utilisez pas la dernière version, **votre serveur court un risque important**.

Cette vulnérabilité, [CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182) (également connue sous le nom de [React2Shell](https://react2shell.com/)), concerne de nombreuses applications créées avec React 19. Des compromissions réelles ont déjà été signalées : des attaquants ont déployé des logiciels malveillants sur des serveurs compromis.

Par ailleurs, deux autres vulnérabilités ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)) ont été identifiées dans le protocole des composants serveur de React (RSC). Même si elles ne permettent pas l’exécution de code à distance, elles nécessitent tout de même l’installation des correctifs.

L’équipe React a ensuite découvert que le correctif pour CVE-2025-55184 était incomplet, ce qui a nécessité un correctif supplémentaire. Celui-ci a été publié sous le numéro [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779).

## Chronologie

- **3 décembre 2025** : React2Shell ([CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182)) a été annoncée par l’équipe React
- **4 décembre 2025** : j’ai publié la version v4.5.7 (mise à jour du paquet Next.js)
- **8 décembre 2025** : j’ai publié la version v4.5.8 (mise à jour du paquet React, avec une protection complète contre React2Shell)
- **11 décembre 2025** : deux CVE supplémentaires ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)) ont été annoncées par l’équipe React. J’ai publié la version v4.5.10 en conséquence
- **12 décembre 2025** : l’équipe React a annoncé que le correctif pour CVE-2025-55184 était incomplet. Le correctif supplémentaire a été publié sous le numéro [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779). J’ai publié la version v4.5.11 en conséquence

## Action requise

Si vous auto-hébergez Rallly, veuillez effectuer immédiatement les étapes suivantes :

- **Mettez à jour** Rallly vers la dernière version (v4.5.11 ou ultérieure) pour être protégé contre les quatre CVE. Consultez les [notes de version](https://github.com/lukevella/rallly/releases/tag/v4.5.11) pour plus de détails.
- Si vous utilisez la version v4.5.10, vous devez passer à la version v4.5.11, car le correctif précédent était incomplet.
- Si vous utilisez la version v4.5.8 (qui offrait une protection complète contre React2Shell), vous devez passer à la version v4.5.11 pour être protégé contre toutes les vulnérabilités.
- Si vous utilisez la version v4.5.7, nous vous recommandons de passer à la version v4.5.11, car la version v4.5.7 pourrait ne pas avoir fourni une protection complète contre React2Shell.
- Si vous utilisez une version antérieure à v4.5.7, vous êtes vulnérable à React2Shell et devez effectuer la mise à jour immédiatement.
- **Redémarrez** tous les services et, si vous utilisez Docker, reconstruisez ou récupérez la dernière image.
- **Si vous ne pouvez pas effectuer la mise à jour immédiatement**, limitez temporairement l’accès (VPN ou proxy d’authentification) jusqu’à l’installation du correctif.

Après la mise à jour, vérifiez que votre instance indique la dernière version de Rallly et consultez les journaux pour repérer d’éventuels avertissements. Pour vérifier la version, rendez-vous à l’adresse suivante : `<your‑rallly‑instance>/api/status`.

## Informations supplémentaires

Pour obtenir tous les détails techniques sur les quatre vulnérabilités :
- [React2Shell (CVE-2025-55182)](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) - Vulnérabilité critique permettant l’exécution de code à distance
- [Vulnérabilités supplémentaires (CVE-2025-55183, CVE-2025-55184, CVE-2025-67779)](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components) - Déni de service et exposition du code source
