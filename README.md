# Door Opening Tracking App 🚪

Tato aplikace slouží k detailnímu sledování a auditu stavů dveří. Umožňuje uživatelům vytvářet vlastní instance počítání, interaktivně zaznamenávat změny stavů pomocí animovaného rozhraní a následně vizualizovat sebraná data v přehledných statistikách.

Projekt je postaven na nejmodernějším stacku s využitím Next.js 15 (App Router), striktního TypeScriptu a bezpečné databázové vrstvy přes Drizzle ORM.

## Hlavní funkce

* **Komplexní Autentizace:** Bezpečné přihlašování pomocí hesla (šifrování přes `bcryptjs`) nebo pomocí GitHub OAuth účtu (implementováno přes Auth.js v5).
* **Správa Instancí:** Každý uživatel má svůj vlastní oddělený dashboard pro vytváření a mazání sledovacích instancí.
* **Interaktivní Počítadlo:** Klientské rozhraní s "Optimistic UI" updaty pro okamžitou odezvu při klikání, doplněné o plynulé 3D animace dveří (Framer Motion).
* **Auditní Logování:** Každá změna stavu (inkrementace/dekrementace) je asynchronně zaznamenána do databáze s přesným časovým razítkem.
* **Statistiky a Vizualizace:** Automaticky generované responzivní sloupcové grafy a historie posledních změn pro každou instanci (čisté Tailwind CSS).
* **Smart Proxy Routing:** Skryté přesměrování (rewrites) kořenové adresy na `/login` pro zachování čisté URL bez agresivního cachování v prohlížeči.

## Sledované stavy dveří

1. **Zavřený -> Zavřený** (Dveře byly zavřené a neotevřely se)
2. **Zavřený -> Otevřený** (Dveře byly zavřené a někdo je otevřel)
3. **Otevřený -> Zavřený** (Dveře byly otevřené a někdo je zavřel)
4. **Otevřený -> Otevřený** (Dveře byly otevřené a zůstaly tak)

## Použité Technologie

* **Framework:** Next.js 15 (App Router, Turbopack, zapnutý React Compiler)
* **Jazyk:** React 19, TypeScript
* **Databáze:** PostgreSQL (komunikace přes `postgres` driver)
* **ORM:** Drizzle ORM (`drizzle-kit` pro migrace)
* **Autentizace:** NextAuth (Auth.js v5 Beta) + `@auth/drizzle-adapter`
* **Styling:** Tailwind CSS, Lucide React (ikony)
* **Animace:** Framer Motion

## Požadavky pro spuštění

Před lokálním spuštěním se ujistěte, že máte k dispozici:
* Nainstalované [Node.js](https://nodejs.org/) (ideálně verze 20+).
* Přístup k PostgreSQL databázi (lze využít lokální instanci nebo cloudová řešení jako Neon.tech či Supabase).
* Zaregistrovanou GitHub OAuth aplikaci pro získání Client ID a Secret (pro funkční GitHub přihlášení).

## Instalace a nastavení

### 1. Klonování repozitáře a instalace závislostí
Naklonujte si repozitář a nainstalujte všechny potřebné NPM balíčky:
```bash
npm install