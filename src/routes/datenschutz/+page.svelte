<!-- src/routes/datenschutz/+page.svelte -->
<!-- Statischer Inhalt ohne +page.server.js: die Seite ist auch ausgeloggt erreichbar -->
<!-- Jede Aussage muss dem Code entsprechen: bei Änderungen an Daten, Speicherorten oder Cookies hier nachführen -->
<script>
	import Icon from '$lib/components/Icon.svelte';
</script>

<svelte:head>
	<title>Datenschutz – SubSense</title>
</svelte:head>

<main class="mx-auto w-full max-w-[70rem] px-6 pt-10 pb-16 max-sm:px-4 max-sm:pt-7">
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
		<p class="mb-4">Stand: [BETREIBER: Datum der Freigabe eintragen]</p>
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
					<strong class="font-medium text-ink">Konto:</strong> E-Mail-Adresse, Name (freiwillig), Zeitpunkt
					der Registrierung. Das Passwort wird nur als Hash (bcrypt) gespeichert, nie im Klartext.
				</li>
				<li>
					<strong class="font-medium text-ink">Verträge:</strong> Name, Anbieter, Kosten und
					Abrechnungsintervall, Kategorie, Status, Kündigungsfrist und Erinnerungsvorlauf, Kündigungslink,
					Kündigungsanleitung und Notizen. Was du in die Freitextfelder schreibst (z. B. eine
					Kundennummer), wird ebenfalls gespeichert.
				</li>
				<li>
					<strong class="font-medium text-ink">Dokumente:</strong> die Dateien, die du zu einem Vertrag
					hochlädst, mit Dateiname, Dateityp, Grösse und Zeitpunkt des Uploads.
				</li>
				<li>
					<strong class="font-medium text-ink">Schutz vor Missbrauch:</strong> Bei einem Anmeldeversuch
					werden deine IP-Adresse und die eingegebene E-Mail-Adresse mit der Anzahl Versuche gespeichert,
					bei einer Registrierung die IP-Adresse.
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
					CSV-Import und -Export.
				</li>
				<li>
					Schutz vor Missbrauch: Nach zu vielen Versuchen werden Anmeldung oder Registrierung vorübergehend
					gesperrt.
				</li>
			</ul>
			<p class="mt-3">
				Es gibt kein Tracking, keine Analyse deines Verhaltens und keine Werbung. Deine Daten werden
				nicht verkauft und nicht für Marketing weitergegeben.
			</p>
		</section>

		<section class="border-t border-line py-6">
			<h2 class="mb-3 text-base font-semibold text-ink">Empfänger und Speicherorte</h2>
			<p class="mb-3">SubSense nutzt zwei Dienstleister, die die Daten im Auftrag bearbeiten:</p>
			<ul class="list-disc space-y-2 pl-5">
				<li>
					<strong class="font-medium text-ink">MongoDB Atlas</strong> (MongoDB, Inc., USA): Datenbank
					für Konto, Verträge und die Zähler gegen Missbrauch. Rechenzentrum in Frankfurt, Deutschland.
				</li>
				<li>
					<strong class="font-medium text-ink">Netlify</strong> (Netlify, Inc., USA): Hosting und
					Ausführung der App sowie Speicherung der hochgeladenen Dokumente. Rechenzentrum in den USA
					(Region us-east-2).
				</li>
			</ul>
			<p class="mt-3">
				Weitere Empfänger gibt es nicht. Die App lädt keine Inhalte von Drittanbietern; auch die
				Schriften werden von SubSense selbst ausgeliefert.
			</p>
		</section>

		<section class="border-t border-line py-6">
			<h2 class="mb-3 text-base font-semibold text-ink">Bekanntgabe ins Ausland</h2>
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
					Mit «Account löschen» im Profil werden dein Konto, alle Verträge und alle Dokumente endgültig
					gelöscht.
				</li>
				<li>
					Die Zähler gegen Missbrauch verfallen nach 15 Minuten (Anmeldung) bzw. 60 Minuten
					(Registrierung) und werden danach automatisch gelöscht; nach einer erfolgreichen Anmeldung
					sofort.
				</li>
			</ul>
		</section>

		<section class="border-t border-line py-6">
			<h2 class="mb-3 text-base font-semibold text-ink">Cookies</h2>
			<p>
				Nach der Anmeldung setzt SubSense ein einziges Cookie namens <code class="font-mono">session</code>.
				Es hält dich angemeldet, ist für Skripte nicht lesbar (HttpOnly), wird nur von SubSense selbst
				gesendet (SameSite=Lax) und läuft nach 30 Tagen ab. Beim Abmelden wird es gelöscht. Das Cookie
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
				<li>Name, E-Mail-Adresse und Passwort im Profil ändern</li>
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
