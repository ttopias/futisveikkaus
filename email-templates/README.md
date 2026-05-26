# Futisveikkaus – Supabase Auth -sähköpostipohjat

Valmiit HTML-pohjat, jotka voit kopioida Supabase Dashboardiin. Tekstit ovat suomeksi ja ulkoasu vastaa sovelluksen smaragdinvihreää teemaa (`hsl(158 …)`).

## Tiedostot ja Supabase-kohdistus

| Tiedosto | Supabase Dashboard -kohta | Oletusaihe (engl.) |
|----------|---------------------------|---------------------|
| `confirm-email.html` | **Confirm signup** | Confirm your signup |
| `invite.html` | **Invite user** | You have been invited |
| `reset-password.html` | **Reset password** | Reset your password |
| `password-changed.html` | **Password changed** (turvailmoitus) | Your password was changed |

> **Password changed** on turvailmoituspohja. Ota se käyttöön kohdassa **Authentication → Emails** (tai **Auth → Templates**), kun *Security notification templates* -esikatselu on päällä. Ilman sitä vain neljä peruspohjaa näkyvät dashboardissa.

## Suositellut aiheet (Subject)

Kopioi **Subject**-kenttään (ei HTML-tiedostoon):

| Pohja | Aihe (suomi) |
|-------|----------------|
| Confirm signup | `Vahvista sähköpostiosoitteesi – Futisveikkaus` |
| Invite user | `Sinut on kutsuttu Futisveikkaukseen` |
| Reset password | `Nollaa salasanasi – Futisveikkaus` |
| Password changed | `Salasanasi on vaihdettu – Futisveikkaus` |

## Asennus Supabaseen

1. Avaa [Supabase Dashboard](https://supabase.com/dashboard) → projekti → **Authentication** → **Email Templates** (tai **Emails**).
2. Valitse oikea pohjatyypi (esim. **Confirm signup**).
3. Aseta **Subject** yllä olevan taulukon mukaan.
4. Avaa vastaava `.html`-tiedosto tästä kansiosta, kopioi **koko** sisältö ja liitä **Message body** / **HTML** -kenttään.
5. Tallenna ja lähetä testiviesti (Signup / Invite / Recovery), jos SMTP on konfiguroitu.

Paikallinen kehitys: `supabase/config.toml` → `[auth.email.template.*]` ja `[auth.email.notification.password_changed]` – katso [Customizing email templates](https://supabase.com/docs/guides/local-development/customizing-email-templates).

## Site URL ja logo

Pohjat käyttävät logoa osoitteesta:

```text
{{ .SiteURL }}/football.png
```

Tiedosto on sovelluksessa `app/static/football.png` ja palveluun se tulee polusta `/football.png`.

**Pakollinen asetus:** **Authentication → URL Configuration → Site URL** = sama arvo kuin `PUBLIC_SITE_URL` (esim. `https://veikkaus.example.com`). Ilman oikeaa Site URL -arvoa logo ei lataudu sähköpostissa.

Lisää **Redirect URLs** -listaan tuotanto- ja kehitysosoitteet, esim.:

- `https://<domain>/auth/callback`
- `https://<domain>/auth/confirm`
- `https://<domain>/auth?reset`
- `https://<domain>/auth?signup`

Nämä vastaavat sovelluksen auth-reittejä (`app/src/routes/auth/`).

### Ympäristömuuttujat

`app/.env.example`:

```env
PUBLIC_SITE_URL=
PUBLIC_APP_NAME=
```

- **Site URL** Supabasessa = `PUBLIC_SITE_URL` (ilman loppukauttaviivaa).
- Sovelluksen nimi (`PUBLIC_APP_NAME`) voi poiketa brändistä sähköposteissa; pohjat käyttävät tekstiä **Futisveikkaus**.

## Go-mallimuuttujat

Supabase käyttää Go-template -syntaksia. Yleisimmät muuttujat (katso [Auth email templates](https://supabase.com/docs/guides/auth/auth-email-templates)):

| Muuttuja | Kuvaus |
|----------|--------|
| `{{ .ConfirmationURL }}` | Valmis vahvistus-/nollaus-/kutsulinkki (pää-CTA) |
| `{{ .Token }}` | 6-numeroinen OTP (vaihtoehto linkille) |
| `{{ .TokenHash }}` | Hashattu token (oma linkki tarvittaessa) |
| `{{ .SiteURL }}` | Projektin Site URL |
| `{{ .Email }}` | Vastaanottajan sähköposti |
| `{{ .RedirectTo }}` | Asiakkaan antama redirect (jos käytössä) |
| `{{ .Data }}` | Käyttäjän metadata (esim. `first_name` kutsussa) |

**Huom:** `{{ if .Email }}` -ehdot toimivat, jos Supabase tarjoaa muuttujan kyseisessä pohjassa.

### Sovelluksen redirectit (viite)

| Toiminto | Koodi | Kohde linkin jälkeen |
|----------|-------|----------------------|
| Salasanan nollaus | `resetPasswordForEmail` | `PUBLIC_SITE_URL + '/auth?reset'` |
| Kutsu | `inviteUserByEmail` | `PUBLIC_SITE_URL + '/auth?signup'` |
| OAuth / magic link | `exchangeCodeForSession` | `/auth/callback` → `next` |
| OTP-vahvistus | `verifyOtp` | `/auth/confirm` |

## Sähköpostin esikatselu ja ongelmat

- **Logo ei näy:** tarkista Site URL ja että sovellus on julki osoitteessa `…/football.png`.
- **Linkki vanhentunut heti:** jotkin sähköpostiskannerit avaavat linkin etukäteen. Harkitse OTP:ta (`{{ .Token }}`) tai [Send Email Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook).
- **SMTP-raja:** ilmaisella tierillä ~2 sähköpostia/h; tuotannossa käytä omaa SMTP:ä (**Project Settings → Auth → SMTP**).

## Ulkoasu

- Smaragdi: `#125a47` (≈ `hsl(158 64% 18%)`)
- Tausta: `#f4f8f6`, kortti valkoinen, reunat `#d9e8e2`
- Taulukkopohjainen, inline-tyylit (Gmail / Apple Mail -yhteensopiva)
- Ei ulkoisia fontteja tai monimutkaista CSS:ää
