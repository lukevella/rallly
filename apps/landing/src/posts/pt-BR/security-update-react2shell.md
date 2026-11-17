---
title: 'Atualização de segurança: React2Shell'
date: '2025-12-12'
category: Security
excerpt: >-
  Atualizações de segurança importantes corrigindo vulnerabilidades nos React
  Server Components, incluindo a React2Shell. Quem hospeda o Rallly por conta
  própria deve atualizar imediatamente.
---

**Este anúncio só é relevante para instalações do Rallly hospedadas por conta própria.** Se você usa o serviço hospedado do Rallly em [rallly.co](https://rallly.co), não precisa tomar nenhuma medida. Os servidores foram corrigidos poucas horas depois que os CVEs foram anunciados, e não houve nenhuma violação nesse intervalo.

---

Foi descoberta uma vulnerabilidade crítica de segurança nos React Server Components que afeta o Rallly. Em instalações sem a correção, essa vulnerabilidade poderia permitir que um invasor executasse código remotamente no seu servidor. Se sua instância estiver acessível pela internet e você não estiver usando a versão mais recente, **seu servidor corre um risco significativo**.

Essa vulnerabilidade, [CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182), também conhecida como [React2Shell](https://react2shell.com/), afeta muitos aplicativos criados com o React 19. Já houve relatos de violações reais em que invasores instalaram software malicioso em servidores comprometidos.

Além disso, duas outras vulnerabilidades ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)) foram identificadas no protocolo dos React Server Components (RSC). Embora elas não permitam a execução remota de código, ainda é necessário instalar as correções.

A equipe do React descobriu posteriormente que a correção para o CVE-2025-55184 estava incompleta, exigindo uma correção adicional. Isso foi divulgado como [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779).

## Cronologia

- **3 de dezembro de 2025**: a React2Shell ([CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182)) foi anunciada pela equipe do React
- **4 de dezembro de 2025**: publiquei a v4.5.7 (pacote do Next.js atualizado)
- **8 de dezembro de 2025**: publiquei a v4.5.8 (pacote do React atualizado, totalmente protegida contra a React2Shell)
- **11 de dezembro de 2025**: dois outros CVEs ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)) foram anunciados pela equipe do React. Em resposta, publiquei a v4.5.10
- **12 de dezembro de 2025**: a equipe do React anunciou que a correção para o CVE-2025-55184 estava incompleta. A correção adicional foi divulgada como [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779). Em resposta, publiquei a v4.5.11

## Ação necessária

Se você hospeda o Rallly por conta própria, siga estas etapas imediatamente:

- **Atualize** o Rallly para a versão mais recente (v4.5.11 ou posterior) para se proteger contra os quatro CVEs. Consulte as [notas da versão](https://github.com/lukevella/rallly/releases/tag/v4.5.11) para obter detalhes.
- Se você estiver usando a v4.5.10, deverá atualizar para a v4.5.11, pois a correção anterior estava incompleta.
- Se você estiver usando a v4.5.8 (que oferecia proteção completa contra a React2Shell), deverá atualizar para a v4.5.11 para se proteger contra todas as vulnerabilidades.
- Se você estiver usando a v4.5.7, deverá atualizar para a v4.5.11, pois a v4.5.7 pode não ter oferecido proteção completa contra a React2Shell.
- Se você estiver usando uma versão anterior à v4.5.7, estará vulnerável à React2Shell e deverá atualizar imediatamente.
- **Reinicie** todos os serviços e, se estiver usando Docker, recrie ou baixe a imagem mais recente.
- **Se não puder atualizar imediatamente**, restrinja temporariamente o acesso (VPN/proxy de autenticação) até instalar a correção.

Depois de atualizar, verifique se sua instância informa a versão mais recente do Rallly e analise os registros em busca de avisos. Para verificar a versão, acesse: `<your‑rallly‑instance>/api/status`.

## Informações adicionais

Para consultar todos os detalhes técnicos sobre as quatro vulnerabilidades:
- [React2Shell (CVE-2025-55182)](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) - Vulnerabilidade crítica de execução remota de código
- [Vulnerabilidades adicionais (CVE-2025-55183, CVE-2025-55184, CVE-2025-67779)](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components) - Negação de serviço e exposição do código-fonte
