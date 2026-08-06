# Ghost Lap

**Run once. Sign once. Race your past self until you finally beat it.**

Ghost Lap is a small one-button runner built for the YubiKey 5.8 hackathon. Your
first lap becomes a cryptographically signed rival: enter your FIDO PIN, touch
the physical key once, and the game turns the exact accepted jump and flap
timings into a verified ghost.

That ceremony creates the rival; it does not interrupt every race. The signed
input tape introduces each trail. Once you set a route time, later visits race
your exact local PB inputs as a faster, route-specific **PB Echo**.

> Hackathon prototype. The YubiKey signing path is real, but Ghost Lap is a
> trusted-local game, not a global anti-cheat or tournament-verification system.
> `previewSign` and its algorithm identifiers are experimental.

![Ghost Lap ready with a physical YubiKey 5.8.0](docs/images/ghost-lap-hardware-ready.png)

## Project title and description

**Project title:** Ghost Lap

The game has one input and one short loop:

1. Pick any of the six trails; the canvas previews its direction, scenery, and hazards.
2. Press Space, Up, click, or tap to jump. Press once more in the air to flap.
3. Catch carrots; the HUD shows 1/3, 2/3, then a short speed burst. A bonk
   pauses earned boost time instead of eating it.
4. Finish the capture lap, enter the FIDO PIN, and touch the YubiKey.
5. Race the verified ghost through Heat 1, Heat 2, Heat 3, and onward.

Every trail has three small, replayable goals: beat the active rival, collect
every carrot, and finish without a harmful bonk or slow. Their medals are local
game progress, not signed claims. Sound effects are optional, start muted, and
are synthesized in the browser only after the player turns them on.

The signed canonical payload contains the compact input tape—the chosen
versioned route ID, accepted `press_ticks`, and finish tick—plus a
schema/domain, run UUID, broker issue time, and pinned signer
metadata. The fixed physics rebuilds the run; no per-frame positions are stored. Heat 1 repeats the
exact selected signed trail. Later heats rotate through the other five routes,
with order selected from the rival's fingerprint: **Original Trail**,
**Moonlit Marsh**, **Orchard Bounce**, **Snowcap Slide**, **Haywire Farm**, and
**Firefly Hollow**. Three run right-to-left. Each has its own scenery, obstacle
geometry, carrot line, and small rule: puddles and roots slow, spring caps
launch, ice arrows boost, and tall farm gates reward a saved flap.

On a route's first visit, the on-track rival replays the signed tape through the
same local obstacles and carrots as the player. Its time is a deterministic
adaptation, not a newly signed result. Finishing stores only the accepted input
ticks and time for that route; the fixed physics reconstructs an exact, local,
unsigned PB Echo on later visits. The signed rival remains visible as a
secondary result. PBs use versioned route IDs, so catalog reordering cannot
attach a time to a different map. The finish card can retry the same route
without consuming the scheduled next heat. After all six trails have a time,
**Choose trail** opens the carousel for a free-choice run while **Next** keeps
the scheduled heat waiting. A blue ground marker
keeps overlapping runners readable, while carrot pops, impact words, and short
win/tie/loss flourishes make each result visible before the score card appears.
A rare, one-per-run rabbit-and-clock cameo may also appear after a bonk; it is a
brief visual joke and does not pause or change the run.

In hardware mode, each signed rival also gets deterministic **Rival DNA**: a
short tag, mirrored sigil, palette, body marking, and particle trail derived
only from that artifact's public ARKG run-key fingerprint. It makes a verified
rival recognizable without adding new identity claims. Practice mode uses its
local software signer's public-key fingerprint and says so; a local unsigned PB
Echo deliberately keeps a neutral style.

![Six Ghost Lap routes with distinct directions, hazards, and scenery](docs/images/ghost-lap-routes.png)

The browser saves verified rival artifacts and local stats in origin-scoped
`localStorage`, not cookies or the YubiKey. A bounded six-slot vault partitions
rivals by signer mode and enrolled identity, so practice and hardware rivals do
not overwrite each other. That storage belongs to the current
browser profile; a private/incognito window therefore starts empty. The exact
public rival JSON can be exported and imported into another browser profile
using the **same Ghost Lap installation**. Import rejects files over 128 KiB in
the browser, then asks the local verifier to validate the artifact before it
replaces the saved rival. It needs the same enrolled local identity and is not
standalone or globally portable. The file moves the signed rival, not its local
heat history, medals, sound preference, or scores.

The same panel has **Forget this rival + stats**. It clears only the active
signer's artifact, raw proof, scores, and PBs from that browser profile; other
signer slots remain. It does not change the authenticator or remove the
broker's public enrollment.

**Race this route again** reuses the current layout and signed rival, while
**Next** advances the route rotation. On reload in the same profile, the
browser asks the local verifier to check the artifact before racing it again.
Neither action asks for a PIN or touch. If that check fails only because the
local server is temporarily unavailable, Ghost Lap keeps the browser copy and
blocks a new capture until Refresh verifies it. **Make a new rival** opens the
trail picker; the saved rival remains untouched until a replacement is
successfully signed and verified.

After a strictly faster personal best against the signed rival on its original
home trail—including a retry or a post-tour chosen run—the finish card offers the
explicit **Make this PB the rival · PIN + touch** action. It is never automatic:
every replacement artifact needs a fresh PIN and physical touch. Chosen home
runs use the exact capture carrot profile; other trails use their challenge
profiles. The
old rival remains active unless the replacement verifies. On success, the
unsigned PB book and cumulative stats carry over, progression returns to Heat
1, and the current streak resets.

The **About this rival** panel includes a disposable proof check. It changes
one input in a copy, asks the local verifier to reject it, and leaves the saved
rival untouched. Verification does not contact the YubiKey.

The panel keeps the summary readable, then exposes the exact artifact in a
collapsed **Raw public proof artifact** section. Its copy/download JSON includes
credential IDs, AAGUID, public COSE keys, signatures, ARKG derivation inputs and
arguments, WebAuthn client and authenticator data, and the canonical payload
CBOR. It contains no PIN or private key, but the public credential and key
material can identify and link uses of this locally enrolled identity; treat an
export as public proof rather than a secret backup.

## What problem you're solving

Hardware-key demos often end at “you logged in.” That proves authentication,
but it does not show how hardware trust can create something an application
keeps using.

Ghost Lap makes the signed object the game mechanic. A YubiKey ceremony gives
one captured run a durable identity, and replayability becomes useful instead
of suspicious: the same tamper-evident rival is meant to be challenged again
and again. The key is important at the moment a new rival is made, then gets out
of the way of play.

The project also tries to make an experimental cryptographic feature legible to
a beginner. “These are the exact accepted inputs this trusted browser recorded
for the run you touched the key for, and edits are now detectable” is easier to
see and demo than a generic signature dashboard.

## How you used YubiKey 5.8 specific feature

Ghost Lap uses the YubiKey 5.8 experimental WebAuthn `previewSign` extension
with the ESP256-split-ARKG profile.

During one-time local enrollment, the app creates:

- a normal, non-discoverable WebAuthn credential in a registration that requires
  user verification;
- a `previewSign` ARKG master public seed and key handle whose signing policy
  fixes both user presence and user verification; and
- a local identity fingerprint binding those two enrolled objects.

When a capture lap is signed, the broker:

1. validates the course ID, 50 Hz tick rate, finish tick, and strictly increasing
   `press_ticks`;
2. puts the replay and pinned signer metadata into deterministic canonical CBOR;
3. generates fresh 32-byte ARKG input keying material and derives a new P-256
   verification key in a ghost-specific, payload-bound context;
4. sends `SHA-256(payload_cbor)` to `previewSign`;
5. requires WebAuthn user verification and physical user presence (the supplied
   YubiKey 5.8 uses its FIDO PIN for that verification); and
6. verifies the ARKG signature and the normal WebAuthn assertion before
   returning the ghost artifact.

The broker constructs the normal assertion under its fixed localhost WebAuthn
origin, using a separate payload-bound challenge, and authenticates the same
`previewSign` signature. The verifier later recomputes the derived key
from the enrolled master public seed, verifies the original canonical CBOR, and
checks the WebAuthn RP, origin, challenge, credential, UP, and UV evidence.

Each new rival gets fresh ARKG derivation material. A valid rival is
intentionally replayable and has no expiration or one-race limit.

The signature covers the captured baseline replay, including its immutable
versioned route ID, accepted press ticks, and finish tick. It does **not** sign
later route adaptations, heat results, streaks, or claims that the browser
simulated the physics honestly. Those are deterministic local game mechanics
layered on top of a verified rival.

See [the implemented protocol](docs/PROTOCOL.md) and
[the threat model](docs/THREAT_MODEL.md) for the exact claim, plus the dated
[security audit](docs/SECURITY_AUDIT.md) for findings and residual risks.

## Setup & run instructions

### Requirements

- Python 3.11 or newer
- [`uv`](https://docs.astral.sh/uv/)
- one USB YubiKey 5.8 advertising FIDO 2.3 and `previewSign`
- a configured FIDO2 PIN for the required user-verification profile
- a current desktop browser (Chrome, Edge, Firefox, or Safari)

### Desktop and browser support

Ghost Lap is browser-neutral by design: the page never asks Chrome, Safari, or
Firefox to speak WebAuthn or WebUSB. The local Python broker talks CTAP directly
over the operating system's USB FIDO HID path; the browser only runs the Canvas
game and same-origin HTTP calls. The key, broker, and browser therefore need to
be on the same desktop.

- **macOS:** run the POSIX launcher normally.
- **Linux:** run the POSIX launcher after granting the current user FIDO HID
  access with the distribution's udev rules. Yubico documents the required
  [FIDO device permissions](https://developers.yubico.com/yubikey-manager/Device_Permissions.html).
- **Windows 10/11:** use the PowerShell launcher. Direct USB FIDO access from
  `python-fido2` may require an Administrator PowerShell; the launcher warns
  when it is not elevated. Install dependencies once in a normal PowerShell;
  if elevation is actually needed, the elevated path runs the already locked
  environment offline and without syncing. Stop that elevated broker after the
  demo and never use it on a shared or untrusted machine. This restriction and Linux's udev requirement are
  documented by [Yubico's `python-fido2` project](https://developers.yubico.com/python-fido2/index.html).

The browser UI supports Chromium, Firefox, and WebKit. Edge shares Chromium's
engine. Hardware mode is not currently supported on iOS, iPadOS, Android, or
ChromeOS, and the backend is USB-only rather than NFC/PCSC. Those platforms need
a native broker or app bridge; this prototype does not pretend otherwise.

### Hardware mode

macOS or Linux:

```bash
./scripts/run-local.sh
```

Windows PowerShell:

```powershell
.\scripts\run-local.ps1
```

The platform-neutral equivalent from the repository root is `uv sync --locked`
followed by `uv run --no-sync hitl2`. The named launchers force their named
mode, so an inherited `HITL2_MODE` cannot silently switch hardware and practice.

Open <http://localhost:8788>.

On first use, the page walks through local setup:

1. Connect exactly one compatible YubiKey. Ghost Lap auto-discovers USB FIDO
   authenticators and refuses to choose when more than one is present. Leave
   other security keys unplugged during PIN setup and enrollment. The page
   shows the device-reported product and firmware; those strings are advisory,
   not manufacturer attestation.
2. If it has no FIDO PIN, configure one with the authenticator's management
   tool. Browser-driven PIN setup is off by default. To use the built-in path
   deliberately, attach only the intended key and launch once with
   `HITL2_ALLOW_INITIAL_PIN=1`; restart normally afterward. Setting the initial
   PIN changes the FIDO application; resetting it later erases FIDO credentials.
3. Enroll Ghost Lap, enter the PIN, and touch your YubiKey.
4. Pick a trail, run the capture lap, enter the PIN once more, and touch to make the rival.

The local Python broker talks to the authenticator through the operating
system's FIDO/HID path, so there is no browser WebUSB “connect” dialog. PIN
values are used only for the current operation and are not written to app state
or environment files. Before entering a PIN, verify the sole connected device:
capability discovery cannot prove it is the enrolled physical key. The saved
credential allow-list fails closed during signing, but a PIN entered against
the wrong attached key can still consume that key's retries.

After a saved rival verifies against the local enrolled identity, the physical
key is not needed for the next heat. It is needed again only to replace the
rival, including the explicit promotion of an eligible home-trail PB. Keep the
loopback server running so it can serve the game and verify a saved or imported
artifact.

### Explicit software practice mode

For development without hardware:

```bash
./scripts/run-mock.sh
```

On Windows PowerShell, use `.\scripts\run-mock.ps1`.

Mock mode is opt-in, uses separate `.hitl2-mock` state, and labels its software
ES256 artifacts as not hardware-backed. It is never an automatic fallback when
hardware signing fails.

## Tech stack & dependencies

- **Game:** dependency-free HTML, CSS, JavaScript, and a responsive Canvas
- **Local broker:** FastAPI and Uvicorn
- **Authenticator access:** `python-fido2` 2.2.1
- **Cryptography:** `cryptography`, ARKG-derived P-256 verification, and normal
  WebAuthn assertion verification
- **Encoding:** deterministic canonical CBOR with `cbor2`
- **Persistence:** SQLite for the enrolled local identity; browser
  `localStorage` for the bounded signer-keyed rival vault, PB input tapes, heats,
  streaks, route medals, best times, and the opt-in sound preference; public
  JSON export/import for moving only a rival between profiles on the same
  installation

The gameplay simulation uses fixed 20 ms ticks (50 Hz). The replay profile
accepts only the six immutable `.v1` route IDs and
`ghost-lap.physics.v3`. Version 3 pauses
earned boost time during obstacle stumbles so a collected burst cannot
disappear without powering the runner.

## Learnings: what did you learn using the YubiKey 5.8?

- `previewSign` can authorize application bytes that are not a login challenge,
  while a normal WebAuthn assertion still supplies RP/origin binding, user
  presence, and user verification for the same operation.
- ARKG is a good fit for disposable application identities. A fresh derived key
  can mark each rival without asking the authenticator to keep another ordinary
  signing key.
- The algorithm roles must stay separate: the split signing protocol, ARKG
  master seed, and derived verification key use different identifiers.
- The firmware receives a SHA-256 digest as `tbs`, while ESP256 verification is
  performed over the original payload bytes. Accidentally verifying the digest
  again would check a double hash.
- Replay protection is not automatically desirable. A one-time authorization
  should be consumed; a racing ghost is valuable precisely because it can be
  replayed. The protocol should state which behavior it intends.
- A good hardware interaction can be rare and memorable. Requiring touch on
  every heat made the game feel like a security form; signing one rival made it
  feel like a game.
- Automatically replacing the rival on every personal best would also turn a
  reward into a PIN-and-touch interruption. An explicit home-trail PB promotion
  preserves player intent and signs only a replay with the exact capture layout.
- Cryptographic authenticity and gameplay honesty are different claims. The
  backend can prove that signed bytes were not altered, but a trusted browser is
  still responsible for recording and simulating the run.
- A public per-run key fingerprint can safely drive deterministic cosmetics,
  but the resulting Rival DNA is a visual label, not biometric identity or
  manufacturer attestation.

## Security model and limitations

Ghost Lap demonstrates a tamper-evident, locally verified input replay. It does
not demonstrate:

- global anti-cheat, proof that a lap was played honestly, or trusted heat
  results;
- a trusted display or proof the player understood what the key authorized;
- protection from a compromised browser, broker, OS, local storage, or local
  administrator;
- third-party YubiKey provenance or standalone verification in a fresh
  installation (JSON transfer works only with the matching enrolled local
  identity);
- recovery from a lost key or local identity database; or
- production stability of `previewSign`, ARKG drafts, placeholder algorithm
  identifiers, or SDK extension shapes.

Verification is pinned to the locally enrolled identity. Enrollment validates
the nested `previewSign` structure and bindings but does not validate a Yubico
certificate chain or FIDO Metadata Service trust root. Local stats are
deliberately disposable and unsigned. The exported JSON is therefore a
locally identity-pinned public artifact, not a standalone proof of Yubico
manufacture or firmware 5.8.

The HTTP broker is loopback-only. Middleware rejects non-loopback peers even if
raw Uvicorn is accidentally bound more broadly, rejects foreign Origin/Referer
headers, and requires an app marker before every API call. That
marker blocks ordinary cross-site browser requests; it is not authentication
against native software on the same host. Run Ghost Lap only on a trusted,
single-user machine. Another local process could still query the broker, set an
initial PIN during a deliberately opted-in setup launch, or attempt other
PIN-bearing operations.
Hardware calls are single-flight and wrong-PIN failures trigger a short local
cooldown, but those are availability mitigations rather than native-client
authorization.

The WebAuthn signature counter is retained and bound into each artifact. Ghost
Lap does not maintain a monotonic counter history across imports, so it does not
claim cloned-authenticator detection. The fixed WebAuthn origin is constructed
by the local broker; it does not prove which browser tab initiated the request.

Ghost Lap does not need a configured device path. For optional read-only
troubleshooting, list what the operating system exposes:

```bash
fido2-token -L
```

Do not run `fido2-token -R`; it resets the FIDO application.

## Project map

- `src/hitl2/static/` — Ghost Lap UI and deterministic runner
- `src/hitl2/service.py` — replay profile, artifact creation, and verification
- `src/hitl2/hardware.py` — YubiKey 5.8 enrollment, ARKG, and `previewSign`
- `src/hitl2/app.py` — loopback API and static server
- `docs/PROTOCOL.md` — exact signed data and verification flow
- `docs/THREAT_MODEL.md` — claims, trust boundaries, and non-goals
- `docs/SECURITY_AUDIT.md` — hostile review, fixes, and residual risks
- `docs/ASSETS.md` — provenance notes for bundled visual assets

## References

- [YubicoLabs `build-with-us` samples](https://github.com/YubicoLabs/build-with-us)
- [Official Python ARKG / `previewSign` example](https://github.com/YubicoLabs/build-with-us/blob/main/quickstart/python/example_arkg.py)
- [Yubico CTAP 2.3 developer guide](https://developers.yubico.com/CTAP/CTAP2.3.html)
- [WebAuthn `previewSign` version 4 draft](https://yubicolabs.github.io/webauthn-sign-extension/4/)
- [ARKG draft](https://datatracker.ietf.org/doc/draft-bradleylundberg-cfrg-arkg/)
