# Projektdokumentation – SubSense

## Inhaltsverzeichnis

1. [Einordnung & Zielsetzung](#1-einordnung--zielsetzung)
2. [Zielgruppe & Stakeholder](#2-zielgruppe--stakeholder)
3. [Anforderungen & Umfang](#3-anforderungen--umfang)
4. [Vorgehen & Artefakte](#4-vorgehen--artefakte)
    - [Understand & Define](#41-understand--define)
    - [Sketch](#42-sketch)
    - [Decide](#43-decide)
    - [Prototype](#44-prototype)
    - [Validate](#45-validate)
5. [Erweiterungen [Optional]](#5-erweiterungen-optional)
6. [Projektorganisation [Optional]](#6-projektorganisation-optional)
7. [KI‑Deklaration](#7-ki‑deklaration)
8. [Anhang [Optional]](#8-anhang-optional)


## 1. Einordnung & Zielsetzung
In der heutigen digitalen Welt sind abonnementbasierte Dienste allgegenwärtig. Insbesondere junge Erwachsene wie Studierende und Auszubildende schliessen häufig eine Vielzahl von Verträgen ab (z.B. für Streaming, Mobilfunk, Software oder Fitnessstudios). Die Verwaltung dieser Abos ist oft unübersichtlich, Kündigungsfristen werden leicht übersehen und die damit verbundenen Kosten sind schwer zu kontrollieren. Dieser Mangel an Transparenz führt oft zu unerwarteten Ausgaben und dem Gefühl, in einer „Abo-Falle“ gefangen zu sein.

Das Projekt „Vertrags-Radar“ zielt darauf ab, dieses Problem zu lösen, indem es eine zentrale Anlaufstelle zur Verwaltung aller Verträge und Abonnements bietet. Der Prototyp soll Nutzerinnen und Nutzer dabei unterstützen:

- Jederzeit den Überblick über alle laufenden Verträge und deren Kosten zu behalten.

- Proaktiv an bevorstehende Kündigungsfristen erinnert zu werden.

- Die volle Kontrolle über ihre finanziellen Verpflichtungen zurückzugewinnen.

## 2. Zielgruppe & Stakeholder
Die Anwendung richtet sich primär an Studierende und Auszubildende. Diese Gruppe ist aus folgenden Gründen besonders relevant:

- Sie verfügt oft nur über ein begrenztes Budget und muss Ausgaben genau im Auge behalten.
- Sie schliesst häufig erste eigene Verträge ab und hat noch wenig Erfahrung im Vertragsmanagement.
- Sie nutzt überdurchschnittlich viele digitale Dienste und Test-Abonnements, was die Komplexität erhöht.

## 3. Anforderungen & Umfang
Beschreibt den verbindlichen Umfang gemäss Übungen und allfällige Erweiterungen.
- **Kernfunktionalität (Mindestumfang):** _gemäss Übungen ab Semesterwoche 8; Workflows kurz nennen und optional illustrieren_  
- **Akzeptanzkriterien:** _[z. B. „Nutzende können Workflow X von Start bis Abschluss ohne Fehlermeldung durchführen.“]_  
- **Erweiterungen [Optional]:** _[Liste zusätzlicher Funktionen/Qualitätssprünge, falls umgesetzt]_  

## 4. Vorgehen & Artefakte
Die Durchführung erfolgt phasenbasiert; dokumentieren Sie die wichtigsten Ergebnisse je Phase.

### 4.1 Understand & Define
Ausgangslage
Junge Erwachsene verlieren bei der Vielzahl an digitalen Abos (Streaming, Software, Mobile) schnell den Überblick. Kündigungsfristen verstreichen ungewollt, was zu unnötigen Kosten führt ("Abo-Falle"). Es fehlt ein zentrales, vertrauenswürdiges Tool, das proaktiv warnt.

Zielgruppenverständnis & Szenarien
Basierend auf der Persona "Alex" (20, Azubi) wurden zwei Kernszenarien identifiziert:

- Reaktiv ("Panik-Moment"): Nutzer bemerkt unerwartete Abbuchung und will sofort prüfen, wann die nächste Kündigung möglich ist. -> Bedarf: Sofortige Übersicht.

- Proaktiv ("Test-Abo"): Nutzer schliesst ein Probe-Abo ab und will direkt die Kündigungserinnerung setzen, um Kosten zu vermeiden. -> Bedarf: Schnelle Eingabe (< 30s) und Sicherheit durch Erinnerung.

Wesentliche Erkenntnisse
Für den Prototyp sind folgende Aspekte kritisch:

- Schnelligkeit: Das Erfassen neuer Verträge muss extrem einfach sein, da die Motivation oft gering ist.
- Vertrauen: Das System muss zuverlässig und rechtzeitig an Fristen erinnern (Core Feature).
- Einfachheit: Keine komplexe Finanzplanung, sondern Fokus auf Fristen und Status.

### 4.2 Sketch
In der Sketch-Phase wurden drei unterschiedliche Interaktionskonzepte entwickelt, um die Bedürfnisse der Zielgruppe (schnelle Übersicht, Fristeneinhaltung) bestmöglich zu adressieren.

Variantenüberblick:
Variante A: Dashboard-First (Desktop/Web) – Fokus auf visuelle Übersicht und Management.
Variante B: Mobile-First Liste – Fokus auf schnelle Eingabe unterwegs (< 30s).
Variante C: Timeline-Kalender – Fokus auf chronologische Fristenkontrolle.

Skizzen & Unterschiede:
Variante A: Dashboard (Fokus: Übersicht)
Konzept: Startseite als Dashboard mit Kacheln für jedes Abo. Wichtige Infos (Kosten, Frist) sind direkt sichtbar.
Unterschied: Nutzt den Platz auf Desktop-Screens optimal für Details; weniger Scrollen als bei Listen. Navigation horizontal.

Variante B: Mobile Liste (Fokus: Schnelligkeit)
Konzept: Vertikale, sortierbare Liste mit "Quick-Add"-Button für sofortige Erfassung. Reduzierte Ansicht für kleine Screens.
Unterschied: Optimiert für Smartphone-Nutzung ("Unterwegs erinnern"), aber weniger Übersicht bei vielen Verträgen.

Variante C: Timeline (Fokus: Zeit)
Konzept: Kalenderbasierte Ansicht, die Kündigungsfristen visuell auf einem Zeitstrahl markiert (Ampelsystem: Rot/Gelb/Grün).
Unterschied: Stärkt das "Nicht-Vergessen", wirkt aber bei wenigen Einträgen leer und ist komplexer zu bedienen.

### 4.3 Decide
Gewählte Variante:
Variante A: Dashboard-First (Desktop/Web)

Begründung der Entscheidung:
Wir haben uns für das Dashboard-Konzept entschieden, da es die Kernbedürfnisse der Zielgruppe am besten abdeckt:

- Priorität auf Übersicht ("Radar"-Effekt):
Das primäre Nutzerbedürfnis ist nicht die ständige Dateneingabe (wie bei Variante B, Mobile-First), sondern die periodische Kontrolle von Kosten und Fristen. Das Kachel-Layout bietet hierfür die beste Informationsdichte auf einen Blick.

- Visuelle Hierarchie:
Im Gegensatz zur reinen Timeline (Variante C) erlaubt das Dashboard eine Gruppierung nach Status (z.B. "Kritische Fristen" vs. "Laufende Abos"). Dies unterstützt das mentale Modell eines "Kontrollzentrums" besser.

- Erweiterbarkeit:
Ein Dashboard bietet flexiblen Platz für zukünftige Erweiterungen wie Kosten-Charts oder Spar-Tipps, ohne die Navigation zu überfrachten.

- Technische Machbarkeit:
Die Umsetzung als responsive Web-App mit SvelteKit eignet sich hervorragend für ein kartenbasiertes Grid-Layout (CSS Grid), das auf Desktop-Screens den Platz optimal nutzt und mobil in eine vertikale Ansicht umbricht.


End-to-End Workflow:
Szenario: Neuen Vertrag erfassen & Status prüfen

Einstieg (Dashboard)
Der Nutzer öffnet die App und sieht das Dashboard mit einer Übersicht der aktuellen monatlichen Fixkosten und Status-Kacheln für bestehende Verträge.
Visuelles Feedback: Ein prominenter "Hinzufügen"-Button (FAB oder Header-Action) ist sofort sichtbar.

Erfassung (Add-Flow)
Nutzer klickt auf "+".
Ein modaler Dialog (oder eine neue Seite) öffnet sich.
Eingabe der Pflichtdaten:
Name (z.B. "Netflix")
Kosten (z.B. "12.90") & Intervall (monatlich/jährlich)
Vertragsstart & Kündigungsfrist (z.B. "1 Monat zum Monatsende").
Optional: Kategorie wählen (Streaming, Versicherung).
Bestätigung & Feedback
Nutzer speichert.
Das Modal schließt sich, eine Toast-Notification bestätigt: "Vertrag gespeichert".
Das Dashboard aktualisiert sich automatisch: Der neue Vertrag erscheint als neue Kachel.
Die Gesamtkosten-Anzeige oben wird sofort neu berechnet.

Detail & Kontrolle (Radar-Funktion)
Der Nutzer klickt auf die neue Kachel.
Die Detailansicht öffnet sich (Drawer/Seite).
Das System zeigt den errechneten nächsten Kündigungstermin an (Logik-Kern).
Ampel-Status: Da der Termin noch weit weg ist, wird der Status "Grün" (Sicher) angezeigt.

Link zum erstellten Mockup: https://www.figma.com/make/exmhhr0ygSBGS0J69G39nb/High-Fidelity-UI-f%C3%BCr-Vertrags-Radar?t=psrixILDQFCMV1Bz-20&fullscreen=1

### 4.4 Prototype
- **Kernfunktionalität:** Der Prototyp ermöglicht die vollständige Verwaltung von Abonnements und Verträgen mit den Workflows "Vertrag erfassen", "Dashboard-Übersicht anzeigen" und "Vertrag bearbeiten/löschen". Nutzer können neue Verträge mit Name, Anbieter, Kündigungsdatum und Status anlegen, bestehende Einträge in der Übersicht einsehen (sortiert nach Kündigungsfrist) und Verträge bearbeiten oder löschen. Die App bietet Echtzeit-Feedback durch Erfolgs- und Fehlermeldungen sowie visuelle Status-Indikatoren.
- **Deployment:** (https://subsense1.netlify.app/) 

#### 4.4.1. Entwurf (Design)
Beschreibt die Gestaltung und Interaktion.
> **Hinweis:** Hier wird der **Prototyp** beschrieben, nicht das **Mockup**.
- **Informationsarchitektur**

Die Navigation folgt einem klaren, dreistufigen Konzept:

- **Startseite (Dashboard)**: Zentrale Übersicht aller Verträge mit Schnellzugriff auf Hauptaktionen
- **Erfassungsseite** (`/contracts/new`): Dedizierte Formularseite für neue Verträge
- **Bearbeitungsseite** (`/contracts/[id]/edit`): Kontextuelle Editier-Ansicht für bestehende Verträge

Die Informationshierarchie priorisiert zeitkritische Daten (Kündigungsfristen) durch Sortierung und visuelle Hervorhebung. Der Nutzer hat stets Zugriff auf die "Neuer Vertrag"-Aktion via prominentem Button im Header.

**Oberflächenentwürfe**

*Dashboard (Hauptansicht):*

Zeigt alle Verträge als Cards mit Vertragsname, Anbieter, Kündigungsdatum und Status-Badge. Der Empty State leitet neue Nutzer an, ihren ersten Vertrag anzulegen. Eine grüne Erfolgsmeldung erscheint nach erfolgreichen Aktionen.

*Formular (Erfassung \& Bearbeitung):*

Strukturiertes Formular mit vier Pflichtfeldern (Name, Anbieter, Datum, Status). Validierungsfeedback wird serverseitig generiert und prominent angezeigt. Im Bearbeitungsmodus sind Felder vorausgefüllt und ein zusätzlicher "Löschen"-Button ist verfügbar.

**Designentscheidungen**

- **Dashboard-First-Ansatz**: Die Übersicht ist der primäre Einstiegspunkt, da Nutzer hauptsächlich bestehende Verträge überprüfen wollen (Problemstellung: "Kündigungsfristen im Blick behalten"). Dies spiegelt den "Radar"-Charakter der Anwendung wider.
- **Status-Badges statt Icons**: Farbcodierte Badges ("Aktiv" in Grün, "Gekündigt" in Grau) sind selbsterklärend und barrierefrei. Die Redundanz von Farbe und Text erhöht die Zugänglichkeit.
- **Inline-Feedback statt Modals**: Erfolgs-/Fehlermeldungen erscheinen am Seitenanfang (nicht als Overlays), um den Kontext zu erhalten und Screen-Reader-freundlich zu sein.
- **Separate Erfassungsseite statt Modal**: Eine dedizierte Route (`/contracts/new`) ermöglicht Deeplinks, bessere Fokussierung und vereinfacht die State-Verwaltung gegenüber einem Modal-Overlay.
- **Vereinfachtes Datenmodell**: Verzicht auf komplexe Features wie Kostenberechnung oder Kategorien im MVP, um den Fokus auf den Kernworkflow zu legen (Trade-off zugunsten schnellerer Iterationszyklen).

#### 4.4.2. Umsetzung (Technik)
**Technologie-Stack**

- **Framework**: SvelteKit 5.43.8 (mit Svelte 5 Runes: `$props()`, `$derived()`)
- **Styling**: Tailwind CSS 4.1.17 (Utility-First-Ansatz)
- **Datenbank**: MongoDB Atlas (Serverless, M0 Free Tier)
- **MongoDB-Client**: `mongodb` npm-Package mit eigenem Connection-Pooling
- **Deployment-Plattform**: Netlify (Serverless Functions)
- **Adapter**: `@sveltejs/adapter-netlify`

**Tooling**

- **IDE**: Visual Studio Code
- **Versionsverwaltung**: Git mit GitHub (Repository: `Biro361/SubSense`)
- **Paketmanager**: npm 10.9.4
- **Build-Tool**: Vite 7.2.6 (integriert in SvelteKit)
- **Lokale Entwicklung**: `npm run dev` (Port 5173)
- **Code-Qualität**: `svelte-check` für TypeScript-Validierung (JSDoc)

*Hinweis: Die Verwendung von KI-Tools ist im Kapitel **7. KI-Deklaration** dokumentiert.*

**Struktur \& Komponenten**

*Routing-Struktur:*

```
/                              → Dashboard (Übersicht)
/contracts/new                 → Formular für neue Verträge
/contracts/[id]/edit           → Formular zum Bearbeiten
/api/test                      → MongoDB-Verbindungstest (Dev)
```

*Kernkomponenten:*

- **`+page.svelte` (Dashboard)**: Listet alle Verträge aus der Datenbank. Nutzt `$derived()` für reaktive Filterung und Sortierung.
- **`+page.server.js` (Dashboard)**: Load-Funktion zum Abrufen aller Verträge beim SSR.
- **`contracts/new/+page.svelte`**: Formular-Komponente mit clientseitiger Validierung (HTML5) und serverseitiger Absicherung.
- **`contracts/new/+page.server.js`**: Form Action für POST-Requests, inklusive Fehlerbehandlung und Redirect nach Erfolg.
- **`contracts/[id]/edit/+page.svelte`**: Wiederverwendbare Formular-Logik mit vorausgefüllten Feldern und Lösch-Funktion.
- **`contracts/[id]/edit/+page.server.js`**: Load-Funktion für spezifischen Vertrag, Actions für Update und Delete.

*State-Management:*
Keine globalen Stores notwendig. Alle Daten werden serverseitig geladen und via `$props()` an Komponenten übergeben. Form Actions nutzen SvelteKits eingebautes `use:enhance` für optimistische Updates.

**Daten \& Schnittstellen**

*Datenmodell (MongoDB-Collection: `contracts`):*

```typescript
{
  _id: ObjectId,
  name: string,              // z.B. "Netflix Premium"
  provider: string,          // z.B. "Netflix Inc."
  cancellationDate: Date,    // ISO 8601 Datum
  status: "active" | "cancelled",
  createdAt: Date,
  updatedAt: Date
}
```

*CRUD-Operationen (`src/lib/db/contracts.js`):*

- `getContracts()`: Alle Verträge abrufen (sortiert nach `cancellationDate`)
- `getContractById(id)`: Einzelnen Vertrag per ID laden
- `createContract(data)`: Neuen Vertrag erstellen
- `updateContract(id, data)`: Vertrag aktualisieren
- `deleteContract(id)`: Vertrag löschen

*MongoDB-Connection (`src/lib/mongodb.js`):*
Serverless-optimierte Konfiguration mit globalem Connection-Pooling (`maxPoolSize: 1`), aggressiven Timeouts (5 Sekunden) und Wiederverwendung der Connection über Function-Invocations hinweg.

**Besondere Entscheidungen**

- **Serverless-Optimierung**: Standard-MongoDB-Clients verursachen Timeouts (30s) bei kalten Starts. Lösung: Globales Caching der Connection-Promise und minimaler Connection-Pool (`maxPoolSize: 1`) reduzieren die Initialisierungszeit auf ~500ms.
- **Netlify-Routing via `_redirects`**: Der Netlify-Adapter erlaubt keine Redirects in `netlify.toml`. Alle Anfragen werden über eine `_redirects`-Datei an die Serverless-Function (`/.netlify/functions/sveltekit-render`) geroutet.
- **Trade-off: SSR statt CSR**: Vollständiges Server-Side-Rendering erhöht die initiale Ladezeit (~1-2s), verbessert aber SEO und reduziert Client-Bundle-Größe. Für eine interne Tool-Anwendung akzeptabel.
- **Verzicht auf TypeScript**: Projekt nutzt JSDoc-Kommentare für Type-Hints (geprüft via `svelte-check`). Dies vereinfacht die Build-Konfiguration, bietet aber weniger strikte Typ-Sicherheit als natives TypeScript.
- **IP-Whitelist `0.0.0.0/0`**: MongoDB Atlas erlaubt alle IP-Adressen, da Netlify Functions dynamische IPs nutzen. In Produktion sollte dies durch API-Key-Authentifizierung oder VPC-Peering abgesichert werden.
- **Vereinfachter Error-Handling**: Datenbankfehler werden geloggt, aber dem Nutzer nur als generische Meldung angezeigt ("Vertrag konnte nicht gespeichert werden"). Detaillierte Error-Messages würden Implementierungsdetails preisgeben.

### 4.5 Validate
- **URL der getesteten Version**  (https://subsense1.netlify.app/)
- **Ziele der Prüfung:** 
1. **Effektivität:** Können Nutzer die Kernworkflows (Vertrag erfassen, bearbeiten, löschen) fehlerfrei abschliessen?
2. **Verständlichkeit:** Sind Labels, Navigation und Status-Anzeigen intuitiv verständlich?
3. **Effizienz:** Wie schnell finden Nutzer die wichtigsten Funktionen?
4. **Zufriedenheit:** Entspricht die Anwendung den Erwartungen der Zielgruppe?
5. **Kritische Issues:** Welche Usability-Probleme verhindern oder erschweren die Nutzung?
- **Vorgehen:** ***Testmethode:*** Moderierter Usability-Test (on-site)
***Testleiter:*** 1 Person (Projektverantwortlicher)
***Durchführungsort:*** ZHAW Campus / private Testumgebung
***Testdauer:*** Ca. 20-30 Minuten pro Testperson
***Testgerät:*** Laptop (Webbrowser: Chrome/Firefox)
***Methodik:*** Think-Aloud-Protokoll – Testpersonen wurden gebeten, laut zu denken und ihre Erwartungen sowie Probleme zu verbalisieren.

- **Stichprobe:** 2 Testpersonen, beide Studenten (BIS), Alter: 20-25 Jahre, geplante Zielgruppe des Projekts
- **Aufgaben/Szenarien:** Die Testpersonen durchliefen folgende 5 Aufgaben:

#### **Aufgabe 1: Erste Orientierung (Einstiegsaufgabe)**

**Szenario:** Du hast SubSense gerade zum ersten Mal geöffnet.
**Aufgabe:** Verschaffe dir einen Überblick – welche Informationen findest du? Was könntest du mit der Anwendung machen?

#### **Aufgabe 2: Neuen Vertrag erfassen (Kernworkflow)**

**Szenario:** Du hast gestern ein Netflix-Abo (15.90 CHF/Monat) abgeschlossen, das sich automatisch verlängert, ausser du kündigst bis spätestens 14. Januar 2026.
**Aufgabe:** Halte diese Information fest, damit du später weisst, wann du kündigen musst.

#### **Aufgabe 3: Bestehenden Vertrag bearbeiten**

**Szenario:** Dein Spotify-Vertrag hat eine neue Kündigungsfrist (31. März 2026) aufgrund eines Jahresabo-Wechsels.
**Aufgabe:** Aktualisiere die Kündigungsfrist.

#### **Aufgabe 4: Vertrag löschen**

**Szenario:** Du hast dein Fitnessstudio-Abo gekündigt und möchtest es aus der App entfernen.
**Aufgabe:** Lösche den Vertrag aus deiner Übersicht.

#### **Aufgabe 5: Status erkennen**

**Szenario:** Du möchtest prüfen, welche Abos noch aktiv sind und welche gekündigt wurden.
**Aufgabe:** Identifiziere den Status deiner Verträge.

- **Kennzahlen & Beobachtungen:**
#### **Quantitative Kennzahlen**

| **Kriterium** | **Ergebnis** |
| :-- | :-- |
| **Erfolgsquote (alle Aufgaben abgeschlossen)** | 100% (2/2 Testpersonen) |
| **Kritische Fehler (Aufgabe nicht lösbar)** | 0 |
| **Abbrüche** | 0 |

***Hinweis:*** Zeitdaten und Skala-Fragen (Navigation, Sicherheit, Nützlichkeit) wurden aufgrund von Zeitdruck nicht erfasst.

#### **Qualitative Beobachtungen**

**Positive Erkenntnisse:**

- **Erste Orientierung klar:** Beide Testpersonen verstanden sofort den Zweck der Anwendung.
*TP-01:* "einen Überblick über meine Verträge/Abos"
*TP-02:* "Übersichtlich, Einsatz von Farben"
- **Kernworkflows funktionieren:** Alle CRUD-Funktionen (Erfassen, Bearbeiten, Löschen) wurden erfolgreich durchgeführt, ohne dass Hilfe benötigt wurde.
- **Eingabefelder verständlich:** TP-02 bestätigte, dass alle Formularfelder klar waren (*"Gab es Felder, die du nicht verstanden hast? → Nein"*).
- **Löschen-Bestätigung hilfreich:** TP-02 empfand den Bestätigungsdialog als sinnvoll (*"War die Bestätigung hilfreich oder nervig? → Hilfreich"*).
- **Kostenanzeige geschätzt:** TP-01 lobte, dass die wichtigsten Informationen (Kosten) sofort sichtbar sind.

**Identifizierte Usability-Probleme:**


| **Issue-ID** | **Beschreibung** | **Betroffen** | **Schweregrad** | **Zitat/Kontext** |
| :-- | :-- | :-- | :-- | :-- |
| **1.1** | Vertragsliste sticht nicht heraus | TP-01 | 2 (Kleines Problem) | *"liste sticht nicht so heraus"* |
| **1.2** | Schriftart bei "Erinnerung" unleserlich | TP-02 (2×) | 3 (Grosses Problem) | Mehrfach erwähnt in Aufgabe 1 \& 5 |
| **2.1** | Erfolgsmeldung nicht prominent genug | TP-02 | 2 (Kleines Problem) | *"deutlicher vlt, Browser pop-up"* |
| **5.1** | Fehlende Suchfunktion | TP-02 (2×) | 2 (Kleines Problem) | *"Suchfenster bei Verträgen"* |
| **5.2** | Fehlende Kategorisierung | TP-02 (2×) | 1 (Nice-to-have) | *"Kategorisierung"* |
| **5.3** | Fehlende Verlinkung zur Anbieter-Homepage | TP-02 | 1 (Nice-to-have) | *"Webseite zum Anbieter"* |
| **5.4** | Unklarer Inhalt bei "Kündigung verpasst" | TP-02 | 2 (Kleines Problem) | *"Inhalt für ‹Kündigung verpasst›"* |

**Schweregrad-Skala:**
0 = Kein Problem | 1 = Kosmetisch | 2 = Klein | 3 = Gross | 4 = Kritisch

- **Zusammenfassung der Resultate:** Die Usability-Evaluation bestätigt, dass alle Kernfunktionen erfolgreich nutzbar sind – beide Testpersonen schlossen sämtliche Aufgaben ohne Abbruch ab (Erfolgsquote: 100%). Kritische Blockaden wurden nicht identifiziert, womit die Proof-of-Concept-Hypothese bestätigt ist. Verbesserungspotenzial besteht vor allem bei der Lesbarkeit (Schriftart bei Erinnerungen wurde zweimal kritisiert) und der Auffindbarkeit (Vertragsliste zu unauffällig, Erfolgsmeldung wird übersehen). Mehrfach gewünscht wurden eine Suchfunktion und Kategorisierung für bessere Skalierbarkeit sowie ein Status-Indikator für abgelaufene Fristen. Die identifizierten Issues (Schweregrad 1-3) betreffen primär visuelle Optimierungen und sind durchweg behebbar.

- **Abgeleitete Verbesserungen:** 
Basierend auf der Evaluation wurden folgende Massnahmen priorisiert:

#### **Hohe Priorität (Schweregrad 3)**

**1. Schriftart bei "Erinnerung" verbessern (Issue 1.2)**
**Grund:** Mehrfach erwähnt (2×), betrifft Kernfunktion (Kündigungsdatum).
**Massnahme:**

- Schriftgröße von Datumsfeldern erhöhen (min. 16px)
- Kontrastverhältnis prüfen (WCAG AA-Standard)
- System-Font statt Custom-Font verwenden für bessere Lesbarkeit


#### **Mittlere Priorität (Schweregrad 2)**

**2. Erfolgsmeldung prominenter gestalten (Issue 2.1)**
**Grund:** Nutzer unsicher, ob Speicherung erfolgreich war.
**Massnahme:**

- Toast-Notification mit Icon (✓) und Animation implementieren
- Position: Top-Right, Sticky, Auto-Dismiss nach 3 Sekunden
- Optional: Browser-Notification API nutzen

**3. Suchfunktion implementieren (Issue 5.1)**
**Grund:** Mehrfach gewünscht (2×), wichtig für Skalierbarkeit bei vielen Verträgen.
**Massnahme:**

- Suchfeld im Dashboard-Header hinzufügen
- Live-Suche nach Vertragsname, Anbieter, Status
- Keine Seitenreload erforderlich

**4. Status "Frist abgelaufen" hinzufügen (Issue 5.4)**
**Grund:** Nutzer erwartet Warnung bei verpasster Kündigungsfrist.
**Massnahme:**

- Automatische Prüfung: `cancellationDate < heute`
- Visuelles Warnsignal: Roter Badge "Frist abgelaufen"
- Optionale Benachrichtigung

**5. Vertragsliste visuell hervorheben (Issue 1.1)**
**Grund:** Liste wird als zu unauffällig empfunden.
**Massnahme:**

- Card-Design mit stärkerem Schatten/Kontrast
- Hover-Effekte für bessere Interaktivität
- Spacing zwischen Einträgen vergrössern


#### **Niedrige Priorität (Schweregrad 1 – Nice-to-have)**

**6. Kategorisierung hinzufügen (Issue 5.2)**
**Grund:** Verbesserung der Übersicht bei vielen Verträgen.
**Massnahme:**

- Optionales Kategorie-Feld im Formular (Dropdown: Streaming, Fitness, Software, Transport, Sonstiges)
- Filter-Funktion im Dashboard nach Kategorie

**7. Verlinkung zur Anbieter-Homepage (Issue 5.3)**
**Grund:** Direkter Zugang zur Kündigungsseite spart Zeit.
**Massnahme:**

- Optionales Feld "Kündigungs-URL" im Formular
- Link-Icon (🔗) neben Anbieter-Name im Dashboard



## 5. Erweiterungen [Optional]
Dokumentiert Erweiterungen über den Mindestumfang hinaus.
- **Beschreibung & Nutzen:** _[Was wurde erweitert? Warum?]_  
- **Umsetzung in Kürze:** _[Wie wurde es gemacht?]_  
- **Abgrenzung zum Mindestumfang:** _[klar darstellen]_  

## 6. Projektorganisation [Optional]
Beispiele:
- **Repository & Struktur:** _[Link; kurze Strukturübersicht]_  
- **Issue‑Management:** _[Vorgehen kurz beschreiben]_  
- **Commit‑Praxis:** _[z. B. sprechende Commits]_

## 7. KI‑Deklaration
Die folgende Deklaration ist verpflichtend und beschreibt den Einsatz von KI im Projekt.

### Eingesetzte KI‑Werkzeuge
_[z. B. Copilot, ChatGPT, Claude, lokale Modelle; Version/Variante wenn bekannt]_

### Zweck & Umfang
_[**wie, wofür und in welchem Ausmass** wurde KI eingesetzt (z. B. Textentwürfe, Codevorschläge, Tests, Refactoring) sowie **Überlegungen** zu Qualität, Urheberrecht/Quellen und Prompt‑Vorgehen]_

### Art der Beiträge
_[konkret: welche Teile stammen (ganz/teilweise) aus KI‑Unterstützung?]_

### Eigene Leistung (Abgrenzung)
_[was ist eigenständig erarbeitet/überarbeitet worden?]_

### Reflexion
_[Nutzen, Grenzen, Risiken/Qualitätssicherung]_

### Prompt‑Vorgehen [Optional]
_[wichtige Prompts/Workflows in Kürze]_

### Quellen & Rechte [Optional]
_[verwendete Vorlagen/Assets/Modelle; Lizenz/Urheberrecht; Zitierweise]_

## 8. Anhang [Optional]
Beispiele:
- **Testskript & Materialien:** _[Link/Datei]_  
- **Rohdaten/Auswertung:** _[Link/Datei]_  

---

