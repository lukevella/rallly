---
title: Przedstawiamy Rallly CLI
date: '2026-04-29'
category: Self-hosting
excerpt: >-
  Nowe narzędzie CLI do instalowania, konfigurowania i zarządzania samodzielnie
  hostowanymi instancjami Rallly — z obsługą HTTPS i przesyłania obrazów od razu
  po uruchomieniu.
---

Samodzielne hostowanie Rallly wiązało się wcześniej ze skopiowaniem przykładowego pliku `docker-compose.yml`, ręczną jego edycją, wyborem własnego odwrotnego proxy oraz skonfigurowaniem zasobnika S3, jeśli przesyłanie obrazów miało działać. Dało się to zrobić, ale każda instalacja wyglądała trochę inaczej, a pytanie „czy na pewno dobrze to skonfigurowałem?” regularnie pojawiało się w wiadomościach do naszego zespołu pomocy.

Dlatego stworzyliśmy porządne narzędzie CLI, które zajmuje się za Ciebie instalacją, konfiguracją i codziennym zarządzaniem.

## Instalacja jednym poleceniem

```sh
curl -fsSL https://get.rallly.co | bash
```

Instalator sprawdza środowisko, przeprowadza Cię przez konfigurację (domena, adres e-mail do kontaktu, SMTP), generuje za Ciebie sekrety i uruchamia wszystko. Nie trzeba niczego edytować ręcznie.

Działająca instancja zawiera teraz:

- **Rallly**
- **PostgreSQL** jako bazę danych
- **Traefik** jako odwrotne proxy z automatycznie generowanymi certyfikatami Let's Encrypt
- **Garage** jako zgodny z S3 magazyn obiektów, dzięki czemu przesyłanie awatarów i obrazów działa od razu

Nie musisz już zapewniać własnego proxy ani magazynu obiektów, aby uzyskać kompletną instancję. Jeśli wolisz korzystać z zewnętrznych usług (zarządzanego Postgres, AWS S3, własnego Nginx lub Caddy), możesz to zrobić: ustaw odpowiednie zmienne w `.env`, a dołączone kontenery tych usług po prostu się nie uruchomią.

## Zarządzanie za pomocą CLI

Po instalacji wszystkim zarządza się za pomocą narzędzia CLI `rallly.sh`:

```sh
./rallly.sh start          # Start all services
./rallly.sh stop           # Stop all services
./rallly.sh restart        # Apply .env changes
./rallly.sh status         # Show service status
./rallly.sh logs           # Stream logs
./rallly.sh update         # Pull latest images and recreate containers
./rallly.sh backup         # Back up the database to ./backups/
```

W szczególności aktualizacje sprowadzają się teraz do jednego polecenia. `./rallly.sh update` pobiera najnowsze obrazy, odtwarza kontenery i zachowuje dane oraz konfigurację. Domyślnie CLI korzysta z tagu `lukevella/rallly:4`, więc automatycznie otrzymasz zgodne wydania z serii 4.x.

Dzięki większej kontroli nad całym stosem będziemy mogli w przyszłości dodawać kolejne usługi bez komplikowania procesu instalacji i zmuszania użytkowników do edytowania plików compose.

## Już samodzielnie hostujesz Rallly?

Jeśli Rallly działa już u Ciebie na podstawie ręcznie edytowanego pliku `docker-compose.yml` lub `config.env`, skorzystaj ze szczegółowego [przewodnika migracji](https://support.rallly.co/self-hosting/migration), który pokazuje, jak przejść na wersję 4.10 i CLI bez utraty danych. Najważniejszą rzeczą, którą trzeba przenieść, jest `SECRET_PASSWORD` — hasło używane do szyfrowania sesji.

## Od czego zacząć

- **Nowa instalacja**: [Przewodnik instalacji](https://support.rallly.co/self-hosting/installation/docker)
- **Codzienne zarządzanie**: [Przewodnik zarządzania](https://support.rallly.co/self-hosting/management)
- **Korzystasz ze starszej konfiguracji**: [Przewodnik migracji](https://support.rallly.co/self-hosting/migration)

Celem tego wydania było sprawienie, aby samodzielne hostowanie przypominało korzystanie z gotowego produktu, a nie realizowanie przepisu krok po kroku. Jeśli po drodze napotkasz jakiś problem lub masz pomysły na to, co powinno pojawić się w przyszłości, napisz do nas na adres [feedback@rallly.co](mailto:feedback@rallly.co).
