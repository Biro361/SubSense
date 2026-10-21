<!-- src/routes/datenschutz/+page.svelte -->
<!-- Statischer Inhalt ohne +page.server.js: die Seite ist auch ausgeloggt erreichbar -->
<!-- Jede Aussage muss dem Code entsprechen: bei Änderungen an Daten, Speicherorten oder Cookies hier nachführen -->
<script>
	import Icon from '$lib/components/Icon.svelte';
</script>

<svelte:head>
	<title>Datenschutz – SubSense</title>
</svelte:head>

<main id="main" tabindex="-1" class="mx-auto w-full max-w-[70rem] px-6 pt-10 pb-16 max-sm:px-4 max-sm:pt-7">
	<a href="/" class="mb-10 inline-flex items-center gap-2.5">
		<span class="grid size-8 shrink-0 place-items-center rounded-card bg-accent text-surface">
			<Icon name="doc" size={18} />
		</span>
		<span>
			<span class="block text-lg leading-tight font-semibold tracking-tight">SubSense</span>
			<span class="block text-xs leading-none text-ink-3">Vertrags-Radar</span>
		</span>
	</a>

	<div class="max-w-2xl text-sm leading-relaxed text-ink-2">
		<h1 class="mb-2 text-3xl font-semibold tracking-tight text-ink">Datenschutzerklärung</h1>
		<p class="mb-4">Stand: 21. Oktober 2026</p>
		<p class="mb-8">
			SubSense ist ein privates, kostenloses Angebot ohne Werbung. Hier steht, welche Daten die App
			speichert, wo sie liegen und wie du sie löschen kannst.
		</p>

		<section class="border-t border-line-strong py-6">
			<h2 class="mb-3 text-base font-semibold text-ink">Verantwortlich</h2>
			<p>
				Birhat Özcan (Privatperson)<br />
				E-Mail: birhat.oezcan@gmail.com
			</p>
			<p class="mt-3">An diese Adresse kannst du dich mit allen Fragen zum Datenschutz wenden.</p>
		</section>

		<section class="border-t border-line py-6">
			<h2 class="mb-3 text-base font-semibold text-ink">Welche Daten bearbeitet werden</h2>
			<ul class="list-disc space-y-2 pl-5">
				<li>
					<strong class="font-medium text-ink">Konto:</strong> E-Mail-Adresse, Name (freiwillig; ohne Angabe
					wird der Teil deiner E-Mail-Adresse vor dem @ als Name gespeichert), Zeitpunkt der Registrierung und ob du Erinnerungs-E-Mails erhalten möchtest. Das Passwort wird nur als Hash (bcrypt) gespeichert, nie im Klartext.
				</li>
				<li>
					<strong class="font-medium text-ink">Verträge:</strong> Name, Anbieter, Kosten und
					Abrechnungsintervall, Kategorie, Status, Kündigungsfrist und Erinnerungsvorlauf, Kündigungslink,
					Kündigungsanleitung und Notizen. Was du in die Freitextfelder schreibst (z. B. eine
					Kundennummer), wird ebenfalls gespeichert. Dazu kommt der Zeitpunkt, an dem die
					Erinnerungs-E-Mail zu einem Vertrag verschickt wurde.
				</li>
				<li>
					<strong class="font-medium text-ink">Dokumente:</strong> die Dateien, die du zu einem Vertrag
					hochlädst, mit Dateiname, Dateityp, Grösse und Zeitpunkt des Uploads.
				</li>
				<li>
					<strong class="font-medium text-ink">Passwort zurücksetzen:</strong> Forderst du einen Link an,
					wird zu deinem Konto ein einmaliger Code mit Ablaufzeit gespeichert, nur als Hash und nie im
					Klartext.
				</li>
				<li>
					<strong class="font-medium text-ink">Schutz vor Missbrauch:</strong> Bei einem Anmeldeversuch
					und bei einer Anfrage zum Zurücksetzen des Passworts werden deine IP-Adresse und die
					eingegebene E-Mail-Adresse mit der Anzahl Versuche gespeichert, bei einer Registrierung die
					IP-Adresse.
				</li>
				<li>
					<strong class="font-medium text-ink">Verbindungsdaten:</strong> Beim Aufruf der Seite
					verarbeitet der Hosting-Anbieter technisch bedingt Daten wie deine IP-Adresse.
				</li>
			</ul>
		</section>

		<section class="border-t border-line py-6">
			<h2 class="mb-3 text-base font-semibold text-ink">Zwecke</h2>
			<ul class="list-disc space-y-2 pl-5">
				<li>
					Bereitstellung der Vertragsverwaltung: dein Konto, deine Verträge und Dokumente, Fristen,
					CSV-Import und -Export sowie der Kalender-Export deiner Fristen. Die Kalenderdatei enthält
					Vertragsname, Anbieter, Frist und Kündigungslink, aber keine Notizen; sie wird nur auf dein
					Gerät heruntergeladen.
				</li>
				<li>
					Erinnerungs-E-Mails: Am Erinnerungstag erhältst du pro Vertrag eine E-Mail mit Vertragsname,
					Anbieter, Kündigungsfrist und Links. Sie ist standardmässig eingeschaltet, weil die Erinnerung
					der Kern des Dienstes ist, und lässt sich jederzeit im Profil unter «Erinnerungen» abbestellen.
				</li>
				<li>
					Passwort zurücksetzen: Auf Anfrage erhältst du eine E-Mail mit einem Link, über den du ein neues
					Passwort setzt. Der Link ist 30 Minuten gültig und funktioniert nur einmal; danach werden alle
					bestehenden Anmeldungen beendet. Ob es zu einer Adresse ein Konto gibt, zeigt die Seite nicht an.
				</li>
				<li>
					Schutz vor Missbrauch: Nach zu vielen Versuchen werden Anmeldung, Registrierung oder das
					Zurücksetzen des Passworts vorübergehend gesperrt.
				</li>
			</ul>
			<p class="mt-3">
				Es gibt kein Tracking, keine Analyse deines Verhaltens und keine Werbung. Deine Daten werden
				nicht verkauft und nicht für Marketing weitergegeben.
			</p>
		</section>

		<section class="border-t border-line py-6">
			<h2 class="mb-3 text-base font-semibold text-ink">Empfänger und Speicherorte</h2>
			<p class="mb-3">SubSense nutzt drei Dienstleister, die die Daten im Auftrag bearbeiten:</p>
			<ul class="list-disc space-y-2 pl-5">
				<li>
					<strong class="font-medium text-ink">MongoDB Atlas</strong> (MongoDB, Inc., USA): Datenbank
					für Konto, Verträge, Codes zum Zurücksetzen des Passworts und die Zähler gegen Missbrauch.
					Rechenzentrum in Frankfurt, Deutschland.
				</li>
				<li>
					<strong class="font-medium text-ink">Netlify</strong> (Netlify, Inc., USA): Hosting und
					Ausführung der App sowie Speicherung der hochgeladenen Dokumente. Rechenzentrum in den USA
					(Region us-east-2).
				</li>
				<li>
					<strong class="font-medium text-ink">Infomaniak</strong> (Infomaniak Network SA, Genf,
					Schweiz): Versand der Erinnerungs-E-Mails. Übermittelt werden deine E-Mail-Adresse sowie
					Vertragsname, Anbieter, Kündigungsfrist und Kündigungslink des betroffenen Vertrags, aber
					keine Notizen und keine Dokumente. Für das Zurücksetzen des Passworts werden nur deine
					E-Mail-Adresse und der Link übermittelt. Rechenzentren in der Schweiz. Wie lange Infomaniak
					Versandprotokolle aufbewahrt, regelt deren Datenschutzerklärung.
				</li>
			</ul>
			<p class="mt-3">
				Eine verschickte E-Mail liegt danach auch bei deinem eigenen E-Mail-Anbieter; dort gelten
				dessen Bestimmungen. Weitere Empfänger gibt es nicht. Die App lädt keine Inhalte von Drittanbietern; auch die
				Schriften werden von SubSense selbst ausgeliefert.
			</p>
		</section>

		<section class="border-t border-line py-6">
			<h2 class="mb-3 text-base font-semibold text-ink">Bekanntgabe ins Ausland</h2>
			<p class="mb-3">Der E-Mail-Versand über Infomaniak bleibt in der Schweiz.</p>
			<ul class="list-disc space-y-2 pl-5">
				<li>
					<strong class="font-medium text-ink">Deutschland:</strong> Der Bundesrat anerkennt für
					Deutschland einen angemessenen Datenschutz.
				</li>
				<li>
					<strong class="font-medium text-ink">USA:</strong> Netlify, Inc. und MongoDB, Inc. sind unter
					dem Swiss-U.S. Data Privacy Framework zertifiziert. Für zertifizierte Unternehmen anerkennt
					der Bundesrat seit dem 15. September 2024 einen angemessenen Datenschutz.
				</li>
			</ul>
		</section>

		<section class="border-t border-line py-6">
			<h2 class="mb-3 text-base font-semibold text-ink">Aufbewahrung und Löschung</h2>
			<ul class="list-disc space-y-2 pl-5">
				<li>Deine Daten bleiben gespeichert, solange dein Konto besteht.</li>
				<li>Ein einzelnes Dokument kannst du jederzeit beim Vertrag löschen.</li>
				<li>Löschst du einen Vertrag, werden auch seine Dokumente gelöscht.</li>
				<li>
					Den Zeitpunkt der verschickten Erinnerung entfernt SubSense, sobald du Frist oder
					Erinnerungsvorlauf eines Vertrags änderst; dann folgt eine neue Erinnerung zur neuen Frist.
				</li>
				<li>
					Mit «Account löschen» im Profil werden dein Konto, alle Verträge und alle Dokumente endgültig
					gelöscht.
				</li>
				<li>
					Der Code zum Zurücksetzen des Passworts wird gelöscht, sobald du den Link benutzt, einen neuen
					anforderst, deine E-Mail-Adresse oder dein Passwort änderst oder dein Konto löschst, spätestens
					aber nach 30 Minuten automatisch.
				</li>
				<li>
					Die Zähler gegen Missbrauch verfallen nach 15 Minuten (Anmeldung) bzw. 60 Minuten
					(Registrierung, Zurücksetzen des Passworts) und werden danach automatisch gelöscht. Nach einer
					erfolgreichen Anmeldung wird der Zähler für deine E-Mail-Adresse sofort gelöscht.
				</li>
			</ul>
		</section>

		<section class="border-t border-line py-6">
			<h2 class="mb-3 text-base font-semibold text-ink">Cookies</h2>
			<p>
				Nach der Registrierung oder Anmeldung setzt SubSense ein einziges Cookie namens
				<code class="font-mono">session</code>. Es hält dich angemeldet, ist für Skripte nicht lesbar
				(HttpOnly), wird bei Anfragen von fremden Websites nur beim Öffnen eines Links mitgesendet
				(SameSite=Lax) und läuft nach 30 Tagen ab. Beim Abmelden wird es gelöscht. Das Cookie
				ist technisch notwendig. Tracking-, Analyse- oder Werbe-Cookies gibt es nicht.
			</p>
		</section>

		<section class="border-t border-line py-6">
			<h2 class="mb-3 text-base font-semibold text-ink">Deine Rechte</h2>
			<p class="mb-3">
				Du kannst Auskunft über deine Daten verlangen, sie berichtigen oder löschen lassen und sie
				herausverlangen. Vieles kannst du direkt in der App erledigen:
			</p>
			<ul class="list-disc space-y-2 pl-5">
				<li>Name, E-Mail-Adresse und Passwort im Profil ändern, ein vergessenes Passwort zurücksetzen</li>
				<li>Erinnerungs-E-Mails im Profil abbestellen</li>
				<li>Verträge bearbeiten oder löschen</li>
				<li>alle Verträge als CSV exportieren</li>
				<li>das ganze Konto im Profil löschen</li>
			</ul>
			<p class="mt-3">
				Für alles Weitere schreib an birhat.oezcan@gmail.com. Du kannst dich ausserdem beim
				Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) beschweren.
			</p>
		</section>

		<section class="border-t border-line py-6">
			<h2 class="mb-3 text-base font-semibold text-ink">Links zu anderen Websites</h2>
			<p>
				Kündigungslinks führen zu den Websites der Anbieter. Für deren Inhalte und den Umgang mit
				deinen Daten ist der jeweilige Anbieter verantwortlich; es gelten seine
				Datenschutzbestimmungen.
			</p>
		</section>
	</div>
</main>
