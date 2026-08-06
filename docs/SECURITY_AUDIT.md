# Ghost Lap security audit

Date: 2026-08-06

## Verdict

No critical or high-severity vulnerability was found in the reviewed Ghost Lap
path. The previewSign/ARKG verification chain held up under hostile source
review: canonical bytes, payload prehashing, ARKG derivation, the derived ESP256
signature, and the companion WebAuthn assertion are bound and rechecked in the
right places.

This is still a hackathon prototype with a trusted-local threat model. Its
largest remaining risk is that a loopback HTTP service is not authenticated
against native processes on the same computer. Run it only on a trusted,
single-user machine. The exported artifact proves against this installation's
locally enrolled identity; it does not prove Yubico manufacture, firmware 5.8,
honest gameplay, or a later heat result.

No PIN, enrollment, signing, reset, or other state-changing hardware operation
was performed as part of this audit. Hardware checks were read-only status
queries.

## Scope

Reviewed:

- the five Ghost Lap API paths: status, initial PIN, enrollment,
  ghost signing, and ghost verification;
- USB authenticator discovery and ceremony serialization;
- previewSign enrollment evidence, ARKG derivation, signing, and verification;
- canonical replay validation, persistence, import/export, PB replacement, and
  the disposable edit demonstration;
- browser DOM sinks, keyboard behavior, local storage, cosmetic Rival DNA,
  route medals, opt-in audio, headers, and request boundaries;
- launchers, dependency locking, state-directory permissions, documentation,
  and release packaging.

Out of scope by design: a compromised OS/browser/broker, malicious firmware,
server-authoritative anti-cheat, remote multiplayer, account recovery, and a
manufacturer/FIDO Metadata attestation chain.

## Findings fixed

- Cross-site GETs could reach the hardware status path. Every API
  call now requires the app marker, and an explicit foreign Origin or Referer
  is rejected before service or USB access.
- Raw Uvicorn could bypass the supported launcher's host check. Middleware now
  also rejects non-loopback socket peers.
- The runtime allowed the non-production `testserver` hostname. It was removed from
  production host/origin allowlists.
- Hardware and mock launchers could inherit the opposite `HITL2_MODE`. Named
  launchers now force their own mode and run from the checked lock without a
  second dependency sync.
- Elevated Windows startup could fetch/install dependencies as Administrator.
  The elevated path now requires a preinstalled environment and runs offline,
  no-sync, with an explicit risk warning.
- Initial PIN setup checked generic PIN support before the required Ghost Lap
  capabilities. It now refuses to mutate a key unless FIDO 2.3 and previewSign
  are both advertised. Hardware-mode browser PIN setup is also disabled by
  default and requires a deliberate one-launch environment opt-in.
- Simultaneous enrollment requests could create an unused extra authenticator
  credential. Enrollment is serialized across the check, ceremony, and commit.
- Hardware requests could queue behind a 60-second ceremony. Device access is
  now single-flight and returns `DEVICE_BUSY`; wrong PIN failures start a short
  cooldown.
- Routine status exposed unnecessary AAGUID/options/extensions and a possible
  serial number. Status now returns only UI-required public fields and a small
  identity summary.
- Status wording implied the connected device was the enrolled YubiKey and
  defaulted unknown firmware to 5.8. The UI now says compatible key, displays
  only device-reported product/firmware, and explains that enrollment identity
  is confirmed only when signing succeeds.
- UI copy claimed the replay stayed in the browser. It now states that raw
  replay inputs go only to the local broker while previewSign receives the
  digest and ARKG arguments.
- Persistent identity coherence was only partially checked. Readiness now
  reparses the normal credential and recomputes its credential ID, AAGUID,
  master-seed fingerprint, RP/origin, and policy coherence.
- The nested previewSign enrollment accepted backup flags. Backup eligibility
  and backup state are now rejected for this hardware-local profile.
- An existing shared or symlinked state directory could weaken the `0600`
  database guarantee. POSIX paths are now rejected when symlinked, owned by a
  different user, or writable by group/others; arbitrary existing directories
  are never silently chmodded.
- An unrelated prototype authorization state machine widened the running game
  surface. It was deleted; the broker now contains only the five endpoints the
  game calls, and the database persists only enrollment.
- Browser restore once mixed an unpartitioned save pointer with signer-keyed
  slots. Ghost Lap now has one bounded six-slot format keyed by signer mode and
  enrolled identity, so practice and hardware rivals cannot overwrite one
  another.
- Refreshing device status during a countdown or live lap could change the
  selected route underneath the simulation. Route selection is now immutable
  for the whole run.
- A route PB Echo could be accepted from plausible-looking stored ticks without
  proving that every tick was an accepted jump or flap. Restore now replays the
  whole tape through the pinned physics, rejects inert presses, and requires the
  reconstructed finish to match the stored time and route PB.
- Importing the application module used to initialize local state. App creation
  is now lazy, keeping imports and tooling side-effect-free.
- Low-level USB discovery failures could surface raw operating-system text.
  Hardware failures are now mapped to bounded, secret-free application errors.
- Guided setup could focus an off-screen refresh control, practice copy implied
  hardware use, and one primary-button color missed contrast. Focus now lands
  on the visible setup card, copy names the software signer, and the control
  palette meets the contrast target.
- Public, linkable proof remained in browser storage without a visible removal
  action. The UI now offers **Forget this rival + stats**, which clears the
  current profile without touching the key or broker enrollment.
- Gameplay keys stole Space/ArrowUp from focused controls. Global gameplay input
  now applies only when the body or canvas owns focus.

## Controls that held

- No dynamic HTML parsing, `innerHTML`, `eval`, external script/CDN dependency,
  or untrusted URL navigation was found. Imported and device strings render via
  text nodes.
- Rival DNA uses only the already-public verified derived-key fingerprint and
  is explicitly cosmetic. Route medals and sound preferences remain unsigned
  local state, and audio starts muted with no signing or PIN cue.
- Artifact and replay objects have exact field sets, bounded encodings, a 4 KiB
  canonical payload limit, at most 256 presses, and strict integer/order/range
  checks. Import is capped at 128 KiB and verifies before replacement.
- The firmware receives `SHA-256(payload)` as previewSign `tbs`; the local
  ESP256 verifier receives the original canonical payload, avoiding accidental
  double hashing.
- Fresh ARKG IKM and a payload-, identity-, and protocol-bound context derive
  each rival key. The normal assertion binds the enrolled credential, fixed
  broker origin, ghost-specific challenge, UP, UV, and authenticated preview
  signature.
- Mock mode uses separate state, algorithms, assurance, context, UI labeling,
  and verifier rules, with no automatic fallback.
- CSP, frame denial, no-store, TrustedHost, loopback peer checks, strict request
  models, secret-redacted validation errors, and restrictive local state modes
  are in place.

## Residual risks

1. The public `X-Ghost-Lap-Request` marker prevents ordinary browser CSRF; it does
   not authorize native clients. Another local process can still call PIN-
   bearing endpoints and may consume authenticator retries. Initial PIN setup
   is exposed only during a deliberate opt-in launch, reducing its default
   impact. A production build
   needs authenticated native IPC or an out-of-band per-launch capability.
2. Exactly-one-device discovery is advisory selection, not cryptographic device
   identity. The credential allow-list fails closed during signing, but a PIN
   entered while the wrong compatible key is attached can affect that key.
3. Enrollment uses `attestation=none`; neither UI nor artifact proves vendor,
   model, or firmware. Full provenance needs a validated attestation/FIDO
   Metadata trust chain.
4. Browser timing and physics are trusted. The signature detects edits to what
   the broker signed; it does not prove honest play.
5. The WebAuthn counter is signed evidence but Ghost Lap keeps no monotonic
   cross-import history, so it does not claim cloned-authenticator detection.
6. Windows may require an elevated broker for direct HID. Elevation expands the
   impact of every trusted-local assumption; use it only briefly on a trusted
   single-user computer.

See [THREAT_MODEL.md](THREAT_MODEL.md) for the formal claim boundary and
[PROTOCOL.md](PROTOCOL.md) for exact signed fields and verification steps.
