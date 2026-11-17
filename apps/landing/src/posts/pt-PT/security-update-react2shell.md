---
title: 'Atualização de segurança: React2Shell'
date: '2025-12-12'
category: Security
excerpt: >-
  Atualizações de segurança importantes que corrigem vulnerabilidades nos React
  Server Components, incluindo a React2Shell. Quem aloja o Rallly por conta
  própria deve atualizar imediatamente.
---

**Este anúncio só é relevante para instalações do Rallly alojadas por conta própria.** Se utiliza o serviço alojado da Rallly em [rallly.co](https://rallly.co), não precisa de fazer nada. Os servidores foram corrigidos poucas horas depois de os CVE terem sido anunciados e não ocorreu nenhuma falha de segurança nesse período.

---

Foi descoberta uma vulnerabilidade de segurança crítica nos React Server Components que afeta o Rallly. Em instalações sem as correções, esta vulnerabilidade pode permitir que um atacante execute código remotamente no seu servidor. Se a sua instância estiver acessível a partir da Internet e não estiver a executar a versão mais recente, **o seu servidor corre um risco significativo**.

Esta vulnerabilidade, [CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182) (também conhecida como [React2Shell](https://react2shell.com/)), afeta muitas aplicações criadas com o React 19. Já foram divulgados casos reais de falhas de segurança em que os atacantes instalaram software malicioso em servidores comprometidos.

Além disso, foram identificadas duas outras vulnerabilidades ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)) no protocolo React Server Components (RSC). Embora estas não permitam a execução remota de código, é igualmente necessário aplicar-lhes as correções.

A equipa do React descobriu posteriormente que a correção para o CVE-2025-55184 estava incompleta, sendo necessária uma correção adicional. Esta foi divulgada como [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779).

## Cronologia

- **3 de dezembro de 2025**: A React2Shell ([CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182)) foi anunciada pela equipa do React
- **4 de dezembro de 2025**: Publiquei a v4.5.7 (com o pacote Next.js atualizado)
- **8 de dezembro de 2025**: Publiquei a v4.5.8 (com o pacote React atualizado e totalmente protegida contra a React2Shell)
- **11 de dezembro de 2025**: Foram anunciados pela equipa do React dois CVE adicionais ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)). Publiquei a v4.5.10 em resposta
- **12 de dezembro de 2025**: A equipa do React anunciou que a correção para o CVE-2025-55184 estava incompleta. A correção adicional foi divulgada como [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779). Publiquei a v4.5.11 em resposta

## Ação necessária

Se aloja o Rallly por conta própria, siga imediatamente estes passos:

- **Atualize** o Rallly para a versão mais recente (v4.5.11 ou posterior) para ficar protegido contra os quatro CVE. Consulte as [notas da versão](https://github.com/lukevella/rallly/releases/tag/v4.5.11) para obter mais detalhes.
- Se estiver na v4.5.10, tem de atualizar para a v4.5.11, uma vez que a correção anterior estava incompleta.
- Se estiver na v4.5.8 (que oferecia proteção completa contra a React2Shell), tem de atualizar para a v4.5.11 para ficar protegido contra todas as vulnerabilidades.
- Se estiver na v4.5.7, deve atualizar para a v4.5.11, uma vez que a v4.5.7 pode não ter oferecido proteção completa contra a React2Shell.
- Se estiver numa versão anterior à v4.5.7, está vulnerável à React2Shell e deve atualizar imediatamente.
- **Reinicie** todos os serviços e, se utilizar o Docker, reconstrua ou descarregue a imagem mais recente.
- **Se não puder atualizar de imediato**, restrinja temporariamente o acesso (VPN/proxy de autenticação) até aplicar as correções.

Depois de atualizar, confirme que a sua instância indica a versão mais recente do Rallly e reveja os registos para verificar se existem avisos. Para consultar a versão, visite: `<your‑rallly‑instance>/api/status`.

## Informações adicionais

Para obter todos os detalhes técnicos sobre as quatro vulnerabilidades:
- [React2Shell (CVE-2025-55182)](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) - Vulnerabilidade crítica de execução remota de código
- [Vulnerabilidades adicionais (CVE-2025-55183, CVE-2025-55184, CVE-2025-67779)](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components) - Negação de serviço e exposição do código-fonte
