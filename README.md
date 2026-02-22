# 🚪 Door Opening Tracking App

Webová aplikace pro detailní sledování a audit stavů dveří. Umožňuje uživatelům vytvářet vlastní instance počítání, interaktivně zaznamenávat změny stavů a vizualizovat sebraná data v přehledných statistikách.

---

## Obsah

1. [Klíčové funkce](#klíčové-funkce)
2. [Sledované stavy dveří](#sledované-stavy-dveří)
3. [Technický stack](#technický-stack)
4. [Architektura a struktura souborů](#architektura-a-struktura-souborů)
5. [Databázový model](#databázový-model)
6. [Autentizace](#autentizace)
7. [Server Actions](#server-actions)
8. [Popis stránek a komponent](#popis-stránek-a-komponent)
9. [Nastavení prostředí](#nastavení-prostředí)
10. [Instalace a spuštění](#instalace-a-spuštění)
11. [Bezpečnost](#bezpečnost)
12. [Design a UX](#design-a-ux)
13. [Možná rozšíření](#možná-rozšíření)

---

## Klíčové funkce

- **Komplexní autentizace** — přihlašování heslem (bcryptjs) nebo přes GitHub OAuth (Auth.js v5)
- **Správa instancí** — každý uživatel má vlastní dashboard s možností vytváření a mazání sledovacích instancí
- **Interaktivní počítadlo** — Optimistic UI s okamžitou odezvou a 3D animacemi dveří (Framer Motion)
- **Auditní logování** — každá změna stavu je asynchronně zaznamenána s přesným časovým razítkem
- **Statistiky a vizualizace** — sloupcové grafy a historie posledních změn pro každou instanci
- **Smart Proxy Routing** — skryté přesměrování kořenové URL na `/login` nebo `/dashboard`

---

## Sledované stavy dveří

| ID | Název stavu | Popis |
|----|-------------|-------|
| 1 | Zavřený → Zavřený | Dveře byly zavřené a neotevřely se |
| 2 | Zavřený → Otevřený | Dveře byly zavřené a někdo je otevřel |
| 3 | Otevřený → Zavřený | Dveře byly otevřené a někdo je zavřel |
| 4 | Otevřený → Otevřený | Dveře byly otevřené a zůstaly otevřené |

---

## Technický stack

| Kategorie | Technologie | Verze / Poznámka |
|-----------|-------------|------------------|
| Framework | Next.js | 16.1.6 — App Router, Turbopack, React Compiler |
| Jazyk | TypeScript + React | TS 5, React 19.2.3 |
| Databáze | PostgreSQL + Drizzle ORM | postgres driver, drizzle-kit migrace |
| Autentizace | NextAuth (Auth.js v5 Beta) | @auth/drizzle-adapter, JWT session |
| Styling | Tailwind CSS v4 | PostCSS plugin |
| Animace | Framer Motion | 12.34.3 |
| Ikony | Lucide React | 0.575.0 |
| Hashování hesel | bcryptjs | 3.0.3 |

---

## Architektura a struktura souborů

```
/
├── auth.ts                           # NextAuth konfigurace (providers, callbacks)
├── proxy.ts                          # Next.js middleware (ochrana rout)
├── db/
│   ├── index.ts                      # Drizzle ORM připojení k PostgreSQL
│   └── schema.ts                     # Definice databázových tabulek
├── lib/
│   ├── index.ts                      # Konstanty (DOOR_STATES)
│   └── actions.ts                    # Server Actions (registrace, CRUD, audit)
└── app/
    ├── api/auth/[...nextauth]/route.ts  # Auth.js API handler
    ├── login/page.tsx                # Přihlašovací stránka (Client Component)
    ├── register/page.tsx             # Registrační stránka (Server Component)
    └── dashboard/
        ├── page.tsx                  # Přehled instancí (Server Component)
        └── [id]/
            ├── page.tsx              # Inicializace počítadla (Server Component)
            ├── CounterClient.tsx     # Interaktivní UI (Client Component)
            └── stats/page.tsx        # Statistiky a grafy (Server Component)
```

### Tok dat

Aplikace striktně odděluje Server a Client Components:

1. **Server Components** zajišťují přístup k databázi, autentizaci a počáteční načtení dat
2. Uživatel klikne na `+` nebo `-` v `CounterClient` → okamžitá Optimistic UI aktualizace lokálního stavu
3. Paralelně je volána Server Action `logStateAction()` přes `useTransition()`
4. Server Action zapíše záznam do tabulky `audit_log` v PostgreSQL
5. Stránka statistik načítá tyto záznamy a počítá výsledky na serveru

---

## Databázový model

### Tabulka `user`

Ukládá uživatelské účty (kompatibilní s `@auth/drizzle-adapter` formátem).

| Sloupec | Typ | Popis |
|---------|-----|-------|
| `id` | text (PK) | UUID generovaný automaticky přes `crypto.randomUUID()` |
| `name` | text | Zobrazované jméno uživatele |
| `email` | text (UNIQUE) | Email; pro GitHub účty bez emailu se generuje placeholder |
| `emailVerified` | timestamp | Datum ověření emailu (vyžaduje Auth.js adapter) |
| `password` | text | bcrypt hash hesla; NULL pro OAuth uživatele |
| `image` | text | URL profilového obrázku (z GitHubu) |

### Tabulka `door_instance`

Každý uživatel může mít více instancí, každá svázaná přes cizí klíč.

| Sloupec | Typ | Popis |
|---------|-----|-------|
| `id` | text (PK) | UUID primárního klíče |
| `userId` | text (FK) | Reference na `user.id`; kaskádové mazání |
| `name` | text NOT NULL | Název instance zadaný uživatelem |
| `createdAt` | timestamp | Automaticky nastaveno na aktuální čas při vytvoření |

### Tabulka `audit_log`

Neměnný audit trail. Každý klik na `+` nebo `-` vytvoří jeden záznam. Aktuální stav se vždy přepočítá z celé historie.

| Sloupec | Typ | Popis |
|---------|-----|-------|
| `id` | text (PK) | UUID primárního klíče |
| `instanceId` | text (FK) | Reference na `door_instance.id`; kaskádové mazání |
| `stateType` | integer | Typ stavu: 1, 2, 3, nebo 4 (viz tabulka výše) |
| `action` | text | Hodnota: `'increment'` nebo `'decrement'` |
| `createdAt` | timestamp | Přesný čas záznamu události |

---

## Autentizace

Autentizace je řešena přes NextAuth (Auth.js v5 beta) s JWT session strategií. Konfigurace se nachází v souboru `auth.ts`.

### Providers

**Credentials provider** — přihlášení pomocí emailu a hesla. Heslo je porovnáváno s bcrypt hashem v databázi. GitHub OAuth uživatelé (bez hesla) se přes tento provider přihlásit nemohou.

**GitHub OAuth provider** — při prvním přihlášení je uživatel automaticky uložen do tabulky `user` (upsert přes `onConflictDoUpdate`). Pokud GitHub účet nemá veřejný email, aplikace vygeneruje placeholder `github_{providerAccountId}@noemail.local`.

### JWT Callbacks

- **`jwt`** — při přihlášení uloží `user.id` do JWT tokenu
- **`session`** — přenese `id` z tokenu do session objektu (`session.user.id`)
- **`signIn`** — zajišťuje upsert GitHub uživatelů do databáze před dokončením přihlášení

### Middleware (`proxy.ts`)

Middleware zpracovává každý request a řeší:
- Přesměrování kořenové URL `/` na `/login` nebo `/dashboard` podle stavu přihlášení
- Ochranu všech rout začínajících `/dashboard` před nepřihlášenými uživateli

---

## Server Actions

Veškerá mutace dat probíhá přes Next.js Server Actions (`'use server'` v `lib/actions.ts`).

### `registerUser`
Validuje vstup formuláře, zahashuje heslo (bcrypt, cost faktor 10), vloží uživatele do databáze a přesměruje na `/login`.

### `createDoorInstance`
Ověří session, vytvoří nový záznam v `door_instance` svázaný s přihlášeným uživatelem a přesměruje na `/dashboard`.

### `deleteDoorInstance`
Ověří session, smaže instanci podle ID. Díky `ON DELETE CASCADE` se automaticky smažou i všechny příslušné `audit_log` záznamy.

### `logStateAction`
Zapíše jeden auditní záznam do `audit_log`. Přijímá `instanceId`, `stateType` (1–4) a `action`. Volána z `CounterClient` přes `useTransition()` pro neblokující zápis.

---

## Popis stránek a komponent

### `/login` — Přihlášení
Klientská komponenta. Formulář ovládá React state. Po odeslání volá `signIn('credentials', { redirect: false })`. Při úspěchu přesměruje na `/dashboard`. Obsahuje také tlačítko pro GitHub OAuth.

### `/register` — Registrace
Serverová komponenta. Čistý HTML formulář se Server Action `registerUser` jako `action` atributem.

### `/dashboard` — Přehled instancí
Serverová komponenta. Ověří session a načte seznam instancí z databáze. Zobrazuje mřížku karet (3 sloupce) s odkazem na počítadlo a tlačítkem pro smazání.

### `/dashboard/[id]` — Počítadlo
Serverová komponenta (`page.tsx`) načte historii `audit_log` a přepočítá aktuální hodnoty. Tyto počáteční hodnoty předá jako props do `CounterClient.tsx`.

#### `CounterClient.tsx` — Client Component
Hlavní interaktivní rozhraní:
- Animované 3D dveře (Framer Motion, `rotateY: -85°` pro otevřené)
- Ovládací panel se čtyřmi řádky (jeden pro každý stav), každý s tlačítky `−` / `+`
- Při kliknutí: Optimistic UI aktualizace (`setCounts`) + asynchronní zápis (`logStateAction`)

### `/dashboard/[id]/stats` — Statistiky
Serverová komponenta. Načte až 200 posledních `audit_log` záznamů a přepočítá stav. Zobrazuje:
- **Sloupcový graf** v čistém Tailwind CSS — výška relativní vůči maximální hodnotě
- **Scrollovatelný seznam** posledních 50 aktivit s časovými razítky (+1 žlutě, −1 červeně)

---

## Nastavení prostředí

Vytvořte soubor `.env` v kořenovém adresáři projektu:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
NEXTAUTH_SECRET="nahodny-tajny-retezec-min-32-znaku"
GITHUB_ID="client-id-z-github-oauth"
GITHUB_SECRET="client-secret-z-github-oauth"
```

Vygenerování `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### Nastavení GitHub OAuth

1. Přejděte na **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
2. **Homepage URL:** `http://localhost:3000`
3. **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`
4. Zkopírujte **Client ID** a vygenerujte **Client Secret**

---

## Instalace a spuštění

### Lokální vývoj

```bash
# 1. Naklonujte repozitář
git clone <url-repozitare>
cd door-opening-tracking-app

# 2. Nainstalujte závislosti
npm install

# 3. Vytvořte .env soubor a spusťte migrace
npm run db:push

# 4. Spusťte vývojový server
npm run dev
```

Aplikace bude dostupná na [http://localhost:3000](http://localhost:3000). Middleware automaticky přesměruje na `/login`.

### Produkční build

```bash
npm run build
npm run start
```

### Databázové příkazy

| Příkaz | Popis |
|--------|-------|
| `npm run db:push` | Synchronizuje `schema.ts` přímo do databáze (vhodné pro vývoj) |
| `npm run db:generate` | Generuje SQL migrační soubory (vhodné pro produkci) |

---

## Bezpečnost

### Autentizace a autorizace
- Hesla jsou hashována pomocí bcrypt (cost faktor 10) — nikdy se neukládají jako prostý text
- JWT tokeny jsou podepisovány `NEXTAUTH_SECRET`
- Middleware chrání všechny `/dashboard/*` routy před nepřihlášenými uživateli
- Server Actions ověřují session na začátku každé operace

### Databázová bezpečnost
- Drizzle ORM používá parametrizované dotazy — ochrana před SQL injection
- Cizí klíče s `ON DELETE CASCADE` zajišťují referenční integritu
- Uživatel může mazat pouze své vlastní instance

### Doporučení pro produkci
- Nastavte silný `NEXTAUTH_SECRET` (min. 32 náhodných znaků)
- Použijte HTTPS — session cookies by měly mít `Secure` flag
- Zvažte rate limiting na `/api/auth` pro ochranu před brute force útoky
- Pro produkci preferujte `npm run db:generate` + SQL migrace místo `db:push`

---

## Design a UX

Aplikace používá konzistentní barevné schéma:
- **Tmavě modrá** (`#1E3A5F`) — primární barva
- **Jasně modrá** (`#2563EB`) — akcentová barva
- **Zlatá/žlutá** (`yellow-400`) — call-to-action prvky

### Animace dveří
Element dveří má nastaven `transformOrigin` na levý okraj (`origin-left`) a animuje `rotateY` mezi `0°` (zavřené) a `-85°` (otevřené). Přechod používá spring fyziku pro přirozený pohyb.

### Optimistic UI
Kliknutí na `+` nebo `-` okamžitě aktualizuje zobrazený počet bez čekání na server. Zápis do databáze probíhá asynchronně přes `useTransition()`. Při dalším načtení stránky se stav vždy přepočítá z databáze.

---

## Možná rozšíření

- Export statistik do CSV nebo PDF
- Sdílení instancí mezi více uživateli (role viewer/editor)
- Real-time aktualizace přes WebSocket nebo Server-Sent Events
- Mobilní aplikace využívající stejné API
- Nastavení alertů při překročení prahových hodnot
- Přidání vlastních stavů dveří (nejen předdefinované 4 typy)
- Grafové zobrazení vývoje v čase (time-series)

---

*Door Opening Tracking App — verze 0.1.0*