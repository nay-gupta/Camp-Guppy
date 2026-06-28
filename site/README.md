# Camp Guppy — Murder Mystery Site

A static site (hosted on **Azure Static Web Apps**) that gives each player a
private character dossier. Players unlock their own page with a secret codeword,
and the page is **remembered on their device** so they never re-enter it. The
**host** controls the live act/phase from their own page, and every player's
playbook reveals one act at a time as the host advances the story.

## How it works

- Players open the site and enter their **codeword** once. Their phone remembers
  it (via `localStorage`), so reopening the link goes straight to their dossier.
- Each dossier shows personality, secrets, relationships, and an **act-by-act
  playbook**. Future acts stay **locked** until the host reveals them.
- The **host** logs in with the `MEDIUM` codeword and gets a control bar with
  **Advance to next act** / **Previous**. Tapping it updates a value in Azure,
  and every player's phone (polling every ~3s) reveals the next act with a
  little on-screen notification.

## Files

| File                       | Purpose                                                   |
| -------------------------- | --------------------------------------------------------- |
| `index.html`               | Lock screen + dossier shell                               |
| `styles.css`               | Stormy-night camp theme                                   |
| `app.js`                   | Codeword unlock, device memory, act reveal, host controls |
| `data.js`                  | All character sheets and act-by-act playbooks (edit me!)  |
| `cards.html` / `cards.*`   | Printable character cards (codewords + optional QR codes) |
| `staticwebapp.config.json` | Azure Static Web Apps routing/headers                     |
| `api/`                     | Azure Functions API that tracks the live act              |

## Codeword roster (keep this private!)

Hand each player their codeword on their physical card.

| Character                | Codeword    |
| ------------------------ | ----------- |
| Archery Counselor        | `BULLSEYE`  |
| Camp Director            | `KUMBAYA`   |
| Counselor in Training    | `BACKPACK`  |
| Maintenance              | `TOOLBELT`  |
| Lifeguard                | `WHISTLE`   |
| Alumnus                  | `GLORYDAYS` |
| Cook                     | `CAMPFIRE`  |
| Nurse                    | `BANDAGE`   |
| Survival Skills          | `COMPASS`   |
| Wealthy Land Owner       | `OLDMONEY`  |
| Useless Detective (HOST) | `MEDIUM`    |

Codewords are case-insensitive and ignore spaces.

## Printable cards

Open `cards.html` (locally or on the live site at `/cards.html`) to print a
sheet of character cards — two per row, with each player's codeword in big
letters and cut lines to snip along. Paste your live site URL in the toolbar to
add a **scannable QR code** to each card that opens that player's dossier
directly. Then click **Print**. Keep the cards face-down until handout — each
reveals a secret codeword.

## The act flow

The story moves through six phases the host advances in order:

`Intro → Act I → Act II → Act III → Accusation → Finale`

Players only see playbook sections up to the current phase. The host sees
everything plus the controls.

---

## Deploy to Azure

You need: an Azure subscription, a **Storage account** (for the shared act
state), and a **Static Web App**. Cost is effectively free (SWA Free tier + a
handful of table-storage transactions).

### 1. Create a Storage account (for the shared act state)

Azure Portal → **Create resource → Storage account** (or reuse an existing one).
After it's created, open **Access keys** and copy the **Connection string**.

### 2. Deploy the Static Web App

Easiest path — the **Azure Static Web Apps** VS Code extension:

1. Install the *Azure Static Web Apps* extension.
2. Sign in to Azure, then **Create Static Web App** from this `site` folder.
3. When prompted:
   - **App location:** `/`
   - **Api location:** `api`
   - **Output location:** *(leave blank)*

Or with the SWA CLI:

```bash
cd site
npm install -g @azure/static-web-apps-cli
swa deploy . --api-location api
```

(You can also push this folder to GitHub and let the Static Web Apps GitHub
Action build it — same three location values.)

### 3. Configure the Application Setting

In the Portal: your **Static Web App → Settings → Environment variables**
(a.k.a. Application settings) → add:

| Name                              | Value                             |
| --------------------------------- | --------------------------------- |
| `AZURE_STORAGE_CONNECTION_STRING` | the connection string from step 1 |

> **Note:** the act/blackout controls are **not** password-protected — the
> `/api/state` endpoint is open, so anyone who knows the site URL could advance
> the story. In practice the host is simply whoever logs in with the `MEDIUM`
> codeword. For a friendly party that's plenty; if you want true host-only
> control, add a server-side key check to the API.

### 4. Run the party

1. Share the site URL + each player's codeword.
2. On **your** device, open the site and log in with `MEDIUM` to get the host
   controls. It's remembered on your device after that.
3. Tap **Advance to next act** to walk everyone through the story.

> Tip: keep the host page open on your phone all night. To back up a step, use
> **Previous**.

---

## Local preview

Preview the look and feel without Azure:

```bash
cd site
python3 -m http.server 8000
```

Visit <http://localhost:8000>. The `/api/state` call fails locally, so the story
simply stays on **Intro** (future acts show as locked) — that's expected.

To test the live act-sync locally too, use the SWA CLI emulator:

```bash
cd site
npm install -g @azure/static-web-apps-cli
swa start . --api-location api
```

(You'll need `AZURE_STORAGE_CONNECTION_STRING` available to the local API, e.g.
via `api/local.settings.json`.)

## Direct links (optional)

Send each player a link that opens straight to their sheet and saves it to their
device:

```text
https://YOURSITE/?c=BULLSEYE
```

## A note on secrecy

This is a static site, so codewords live in `data.js` in the browser. That's
perfect for honest friends, but a determined player could read the source. Don't
share the repository or files with players before the party — only the live URL
and their own codeword. (The act state lives server-side in Azure, but the
advance-act control isn't authenticated — so keep the host page to yourself and
don't hand the site around before the party.)
