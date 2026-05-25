<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { PUBLIC_APP_NAME } from '$env/static/public';
</script>

<svelte:head>
  <title>Tietosuoja – {PUBLIC_APP_NAME}</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-xl flex-col items-center py-4">
  <Card.Root class="w-full shadow-md">
    <Card.Header>
      <Card.Title tag="h1" class="text-2xl">Tietosuojaseloste</Card.Title>
      <Card.Description>
        Lyhyt kuvaus siitä, miten {PUBLIC_APP_NAME} käsittelee henkilötietojasi.
      </Card.Description>
    </Card.Header>
    <Card.Content class="space-y-6 text-sm leading-relaxed">
      <section class="space-y-2">
        <h2 class="text-base font-semibold tracking-tight">Rekisterinpitäjä</h2>
        <p class="text-muted-foreground">
          Palvelu on yksityinen veikkauspeli tutuille. Rekisterinpitäjä on sovelluksen ylläpitäjä.
          Tietosuojaan liittyvissä asioissa ota yhteys ylläpitäjään sovelluksen kautta tai muulla
          ylläpitäjän ilmoittamalla tavalla.
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="text-base font-semibold tracking-tight">Kerättävät tiedot</h2>
        <ul class="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Sähköpostiosoite (kirjautuminen)</li>
          <li>Nimi tai nimimerkki (profiili)</li>
          <li>Veikkaukset ja niihin liittyvät pisteet</li>
          <li>Tekniset lokitiedot palvelun toiminnan varmistamiseksi (esim. virheet)</li>
        </ul>
      </section>

      <section class="space-y-2">
        <h2 class="text-base font-semibold tracking-tight">Käyttötarkoitus</h2>
        <p class="text-muted-foreground">
          Tietoja käytetään käyttäjätilin ylläpitoon, veikkausten tallentamiseen, tulosten ja
          pistetaulukon näyttämiseen sekä palvelun turvallisuuden ja luotettavuuden varmistamiseen.
          Tietoja ei käytetä markkinointiin eikä profilointiin.
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="text-base font-semibold tracking-tight">Palveluntarjoaja</h2>
        <p class="text-muted-foreground">
          Sovellus ja tietokanta isännöidään Supabasen (Supabase Inc.) pilvipalvelussa. Tiedot
          tallennetaan EU-alueen tai palveluntarjoajan ilmoittamien alueiden palvelimille. Supabase
          toimii käsittelijänä rekisterinpitäjän lukuun.
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="text-base font-semibold tracking-tight">Evästeet ja istunto</h2>
        <p class="text-muted-foreground">
          Kirjautumisen yhteydessä käytetään välttämättömiä evästeitä tai vastaavia tekniikoita
          istunnon ylläpitämiseksi. Niitä ei käytetä mainontaan tai seurantaan kolmansien osapuolien
          sivustoilla.
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="text-base font-semibold tracking-tight">Luovutus ja säilytys</h2>
        <p class="text-muted-foreground">
          Henkilötietoja ei myydä eikä luovuteta markkinointitarkoituksiin. Tietoja voidaan
          luovuttaa vain lain edellyttämissä tilanteissa tai teknisen palveluntarjoajan (Supabase)
          käsittelyyn palvelun tuottamiseksi. Tiedot säilytetään niin kauan kuin käyttäjätili on
          käytössä tai turnauksen tulokset vaativat.
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="text-base font-semibold tracking-tight">Oikeutesi</h2>
        <p class="text-muted-foreground">
          Voit pyytää tietojesi tarkistamista, oikaisua tai poistamista ottamalla yhteyttä
          ylläpitäjään. Voit myös poistaa tilisi kirjautumalla ulos ja pyytämällä tilin poistoa.
        </p>
      </section>

      <p class="text-xs text-muted-foreground">Viimeksi päivitetty: toukokuu 2026</p>
    </Card.Content>
  </Card.Root>
</div>
