---
title: 'Aggiornamento di sicurezza: React2Shell'
date: '2025-12-12'
category: Security
excerpt: >-
  Importanti aggiornamenti di sicurezza per risolvere le vulnerabilità dei React
  Server Components, inclusa React2Shell. Chi gestisce un'installazione autonoma
  deve aggiornare immediatamente.
---

**Questo annuncio riguarda esclusivamente le installazioni autonome di Rallly.** Se utilizzi il servizio ospitato di Rallly su [rallly.co](https://rallly.co), non devi fare nulla. I server sono stati corretti entro poche ore dalla divulgazione delle CVE e nel frattempo non si è verificata alcuna violazione.

---

È stata scoperta una vulnerabilità critica nei React Server Components che riguarda Rallly. Nelle installazioni non aggiornate, questa vulnerabilità potrebbe consentire a un aggressore di eseguire codice da remoto sul server. Se la tua istanza è accessibile da Internet e non utilizzi l'ultima versione, **il tuo server è esposto a un rischio significativo**.

Questa vulnerabilità, [CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182) (nota anche come [React2Shell](https://react2shell.com/)), riguarda molte applicazioni basate su React 19. Sono già state segnalate violazioni reali durante le quali gli aggressori hanno installato software dannoso sui server compromessi.

Inoltre, sono state identificate altre due vulnerabilità ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)) nel protocollo React Server Components (RSC). Sebbene non consentano l'esecuzione di codice da remoto, richiedono comunque l'installazione delle correzioni.

In seguito, il team di React ha scoperto che la correzione per CVE-2025-55184 era incompleta e richiedeva un'ulteriore patch. Questa è stata divulgata come [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779).

## Cronologia

- **3 dicembre 2025**: il team di React ha annunciato React2Shell ([CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182))
- **4 dicembre 2025**: ho pubblicato la versione v4.5.7 (pacchetto Next.js aggiornato)
- **8 dicembre 2025**: ho pubblicato la versione v4.5.8 (pacchetto React aggiornato, completamente protetta da React2Shell)
- **11 dicembre 2025**: il team di React ha annunciato due CVE aggiuntive ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)). In risposta, ho pubblicato la versione v4.5.10
- **12 dicembre 2025**: il team di React ha annunciato che la correzione per CVE-2025-55184 era incompleta. La correzione aggiuntiva è stata divulgata come [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779). In risposta, ho pubblicato la versione v4.5.11

## Azioni richieste

Se gestisci un'installazione autonoma di Rallly, esegui immediatamente i seguenti passaggi:

- **Aggiorna** Rallly all'ultima versione (v4.5.11 o successiva) per proteggerti da tutte e quattro le CVE. Consulta le [note di rilascio](https://github.com/lukevella/rallly/releases/tag/v4.5.11) per maggiori dettagli.
- Se utilizzi la versione v4.5.10, devi aggiornare alla versione v4.5.11 perché la correzione precedente era incompleta.
- Se utilizzi la versione v4.5.8 (completamente protetta da React2Shell), devi aggiornare alla versione v4.5.11 per proteggerti da tutte le vulnerabilità.
- Se utilizzi la versione v4.5.7, dovresti aggiornare alla versione v4.5.11, perché la versione v4.5.7 potrebbe non aver fornito una protezione completa da React2Shell.
- Se utilizzi una versione precedente alla v4.5.7, sei vulnerabile a React2Shell e devi aggiornare immediatamente.
- **Riavvia** tutti i servizi e, se utilizzi Docker, ricrea o scarica l'immagine più recente.
- **Se non puoi aggiornare immediatamente**, limita temporaneamente l'accesso (VPN o proxy di autenticazione) fino all'installazione della patch.

Dopo l'aggiornamento, verifica che la tua istanza segnali l'ultima versione di Rallly e controlla i log per individuare eventuali avvisi. Per controllare la versione, visita: `<your‑rallly‑instance>/api/status`.

## Ulteriori informazioni

Per tutti i dettagli tecnici sulle quattro vulnerabilità:
- [React2Shell (CVE-2025-55182)](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) - Vulnerabilità critica che consente l'esecuzione di codice da remoto
- [Vulnerabilità aggiuntive (CVE-2025-55183, CVE-2025-55184, CVE-2025-67779)](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components) - Negazione del servizio ed esposizione del codice sorgente
