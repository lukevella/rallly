---
title: 'Aktualizacja zabezpieczeń: React2Shell'
date: '2025-12-12'
category: Security
excerpt: >-
  Ważne aktualizacje zabezpieczeń usuwające luki w React Server Components, w
  tym React2Shell. Użytkownicy samodzielnie hostujący Rallly powinni natychmiast
  przeprowadzić aktualizację.
---

**To ogłoszenie dotyczy wyłącznie samodzielnie hostowanych instalacji Rallly.** Jeśli korzystasz z hostowanej usługi Rallly pod adresem [rallly.co](https://rallly.co), nie musisz podejmować żadnych działań. Serwery zostały zabezpieczone w ciągu kilku godzin od ogłoszenia CVE i w tym czasie nie doszło do żadnego naruszenia bezpieczeństwa.

---

Wykryto krytyczną lukę w zabezpieczeniach React Server Components, która dotyczy Rallly. W niezałatanych instalacjach luka ta mogła umożliwić osobie atakującej zdalne wykonywanie kodu na serwerze. Jeśli Twoja instancja jest dostępna z internetu i nie korzystasz z najnowszej wersji, **Twój serwer jest poważnie zagrożony**.

Luka [CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182), znana również jako [React2Shell](https://react2shell.com/), dotyczy wielu aplikacji zbudowanych przy użyciu React 19. Odnotowano już przypadki rzeczywistych naruszeń bezpieczeństwa, w których osoby atakujące wdrożyły złośliwe oprogramowanie na przejętych serwerach.

Ponadto w protokole React Server Components (RSC) zidentyfikowano dwie dodatkowe luki ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)). Chociaż nie umożliwiają one zdalnego wykonywania kodu, również wymagają załatania.

Zespół React odkrył później, że poprawka dla CVE-2025-55184 była niekompletna i wymagała dodatkowej aktualizacji. Problem ten ujawniono jako [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779).

## Oś czasu

- **3 grudnia 2025**: Zespół React ogłosił lukę React2Shell ([CVE-2025-55182](https://www.cve.org/CVERecord?id=CVE-2025-55182))
- **4 grudnia 2025**: Opublikowałem wersję v4.5.7 ze zaktualizowanym pakietem Next.js
- **8 grudnia 2025**: Opublikowałem wersję v4.5.8 ze zaktualizowanym pakietem React, w pełni zabezpieczającą przed React2Shell
- **11 grudnia 2025**: Zespół React ogłosił dwie dodatkowe luki CVE ([CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183), [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184)). W odpowiedzi opublikowałem wersję v4.5.10
- **12 grudnia 2025**: Zespół React ogłosił, że poprawka dla CVE-2025-55184 była niekompletna. Dodatkową poprawkę ujawniono jako [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779). W odpowiedzi opublikowałem wersję v4.5.11

## Wymagane działanie

Jeśli samodzielnie hostujesz Rallly, wykonaj natychmiast następujące kroki:

- **Zaktualizuj** Rallly do najnowszej wersji (v4.5.11 lub nowszej), aby zabezpieczyć się przed wszystkimi czterema lukami CVE. Szczegóły znajdziesz w [informacjach o wydaniu](https://github.com/lukevella/rallly/releases/tag/v4.5.11).
- Jeśli korzystasz z wersji v4.5.10, musisz zaktualizować ją do v4.5.11, ponieważ poprzednia poprawka była niekompletna.
- Jeśli korzystasz z wersji v4.5.8, która w pełni zabezpieczała przed React2Shell, musisz zaktualizować ją do v4.5.11, aby zabezpieczyć się przed wszystkimi lukami.
- Jeśli korzystasz z wersji v4.5.7, zalecamy zaktualizowanie jej do v4.5.11, ponieważ v4.5.7 mogła nie zapewniać pełnej ochrony przed React2Shell.
- Jeśli korzystasz z wersji wcześniejszej niż v4.5.7, jesteś podatny na React2Shell i powinieneś natychmiast przeprowadzić aktualizację.
- **Uruchom ponownie** wszystkie usługi, a jeśli korzystasz z Dockera, przebuduj obraz lub pobierz jego najnowszą wersję.
- **Jeśli nie możesz od razu przeprowadzić aktualizacji**, tymczasowo ogranicz dostęp (VPN lub serwer proxy uwierzytelniający) do czasu zainstalowania poprawek.

Po aktualizacji sprawdź, czy Twoja instancja zgłasza najnowszą wersję Rallly, i przejrzyj logi pod kątem ostrzeżeń. Aby sprawdzić wersję, odwiedź adres: `<your‑rallly‑instance>/api/status`.

## Dodatkowe informacje

Pełne informacje techniczne dotyczące wszystkich czterech luk znajdziesz tutaj:
- [React2Shell (CVE-2025-55182)](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) — krytyczna luka umożliwiająca zdalne wykonywanie kodu
- [Dodatkowe luki (CVE-2025-55183, CVE-2025-55184, CVE-2025-67779)](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components) — odmowa usługi i ujawnienie kodu źródłowego
