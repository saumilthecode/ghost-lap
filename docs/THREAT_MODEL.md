# Ghost Lap threat model

## Security objective

Ghost Lap protects the integrity and local identity of one baseline input
replay. Subject to the trust assumptions below, a valid hardware artifact means:

> The locally enrolled previewSign-compatible authenticator, observed locally
> as the supplied YubiKey, generated an ESP256-split-ARKG signature bound to
> these exact canonical replay bytes, and the locally enrolled normal WebAuthn
> credential authenticated the same operation with user presence and user
> verification. On the supplied YubiKey 5.8, that verification uses its FIDO PIN.

The artifact is intentionally replayable. Reusing it for another heat is the
desired behavior, not an attack. The security objective does not include proving
that the lap was honestly played or that a later heat result is genuine.

## Assets and scope

The prototype protects:

- the YubiKey's normal credential secret, ARKG signing secret, and FIDO PIN;
- the locally enrolled normal credential, ARKG master public seed, key handle,
  identity fingerprint, RP/origin, and signing policy;
- the exact canonical baseline replay, including course, physics version, tick
  rate, finish tick, accepted press ticks, signer block, run ID, and issue time;
- the binding between the derived signing key and enrolled ARKG master seed; and
- an honest interpretation of what a successful verification does and does not
  establish.

The project covers one loopback broker, one enrolled identity, one browser game,
and locally stored rivals and scores. It has no account system, remote match
server, leaderboard, or prize adjudication. Its file importer moves a public
rival artifact between browser profiles only when the same local Ghost Lap
installation and enrolled identity can verify it; it is not a general
third-party trust or portability mechanism.

The raw proof and exported JSON contain public but linkable evidence:
credential identifiers, AAGUID, public keys, signatures, ARKG derivation inputs
and arguments, WebAuthn client/authenticator data, and canonical payload CBOR.
They contain neither the FIDO PIN nor a private key. Their disclosure does not
enable signing, but it can correlate artifacts made by the same local identity.

## Trust boundaries

### Trusted for the cryptographic claim

- **Locally enrolled authenticator:** protects private material and enforces the
  enrolled preview-signing policy, which fixes user presence and user
  verification.
- **Local enrollment:** selects the intended single authenticator and pins its
  credential and ARKG public seed. The normal credential is created in a
  registration with user verification required.
- **Loopback broker and verifier:** creates canonical bytes, selects protocol
  metadata, coordinates the ceremony, and verifies all evidence.
- **Local platform:** OS, USB stack, browser process, random source, clock,
  filesystem permissions, SQLite state, and process integrity.

The loopback HTTP marker is a browser-CSRF control, not native-client
authentication. The trusted local-platform assumption therefore includes every
native process that can reach this user's loopback broker. The prototype should
run only on a trusted single-user machine and should be stopped after an
elevated Windows demo.

### Additionally trusted for an honest game

- **Game UI and JavaScript:** record only accepted jump/flap presses, execute
  fixed-tick physics, generate heat layouts, and report results accurately.
- **Browser local storage:** keeps the intended artifact and stats between
  sessions. A saved artifact is cryptographically rechecked, but stats are not.

The YubiKey has no display. It signs bytes supplied by the trusted broker; it
does not see a lap, carrot, time, or human-readable confirmation.

### Untrusted inputs

- malformed, stale, duplicated, reordered, or tampered HTTP requests;
- all ghost JSON and base64url/CBOR submitted to the verification endpoint;
- imported rival files, with a 128 KiB front-end cap before parsing;
- convenience metadata and public keys carried inside an artifact until they
  match the signed payload and local enrollment;
- corrupted or deliberately edited browser `localStorage`; and
- any claim about later heat layouts, collections, bursts, times, wins, or
  streaks, medals, cosmetic Rival DNA, or sound settings.

## Security claims

Subject to the trusted components above, hardware mode provides:

1. **Exact payload integrity.** Canonical CBOR, a stored digest, outer-to-inner
   binding, and the derived ESP256 signature make changed replay bytes fail
   verification.
2. **Local signer pinning.** The artifact's master seed, fingerprint, normal
   credential metadata, assurance, algorithm profile, and signed signer block
   must match the enrolled identity.
3. **Payload-bound ARKG derivation.** A fresh 32-byte IKM and ghost-specific
   context derive a P-256 verification key from the pinned master public seed.
   The context includes hashes of both the identity and exact payload.
4. **Same-operation UP/UV evidence.** A normal WebAuthn assertion checks the
   fixed RP, enrolled origin, payload-specific challenge, user-presence and
   user-verification flags, and authenticated `previewSign` signature.
5. **Profile downgrade resistance.** The verifier requires an allowlisted,
   versioned capture course, 50 Hz rate, `ghost-lap.physics.v3`, strict
   `press_ticks`, and all hardware algorithm roles. Even a newly signed v1
   `jump_ticks` payload is rejected.
6. **Explicit software separation.** Mock mode uses a separate software
   signature profile and never reports itself as hardware-backed.
7. **Tamper-safe restore.** A browser-restored ghost must pass the local verifier
   before it is accepted as a rival. A transient verifier failure preserves the
   browser copy and blocks capture, preventing an accidental replacement.
8. **Deliberate replayability.** Verification is read-only. The same valid
   ghost can be checked and raced repeatedly.
9. **Verify-before-import.** A browser-profile transfer installs its artifact
   only after the same local verification path accepts it. A rejected import
   leaves the currently saved rival unchanged.

## Explicit non-claims

Ghost Lap does not claim:

- that submitted `press_ticks` came from a real or honestly simulated lap;
- server-authoritative physics, anti-cheat, bot detection, or tournament-grade
  timing;
- that carrot collections, boosts, heat layouts, finish times, wins, streaks,
  route medals, cosmetic Rival DNA, or best scores are signed;
- that the YubiKey displayed or understood the replay;
- that PIN plus touch implies informed consent on a compromised host;
- genuine-YubiKey provenance to a third party, because enrollment is local
  trust-on-first-use and no manufacturer/FIDO Metadata certificate chain is
  validated;
- standalone verification after copying an artifact to a fresh installation;
- manufacturer/model/firmware attestation by the exported artifact;
- authentication or isolation from malicious native processes on the same host;
- cloned-authenticator detection from a monotonic signature-counter history;
- a trusted issue time, expiration policy, global revocation, or recovery from
  lost local state;
- confidentiality of replay or artifact contents;
- protection after compromise of the browser, broker, OS, enrollment database,
  local administrator, or YubiKey firmware; or
- production stability of the draft extension, ARKG profile, placeholder
  identifiers, or SDK argument format.

## Threat analysis

| Threat | Implemented control | Residual risk / limit |
|---|---|---|
| Change a signed press or finish tick | Canonical payload digest, outer binding, and derived ESP256 signature are verified | A compromised browser can submit a dishonest replay before it is signed |
| Replace the carried master or derived key | Master must match local enrollment; derived key and exact arguments are recomputed | Integrity of the enrollment database is trusted |
| Reuse derivation evidence with another replay | Context and normal assertion challenge are domain-separated and bound to exact payload bytes | The artifact intentionally reveals public derivation evidence and remains linkable locally |
| Replace only the displayed outer replay | Outer replay, run ID, and issue time must exactly match the signed payload | A malicious UI can still display something different before signing |
| Claim UP or UV in booleans | Verifier checks the normal credential signature and authenticator flags | Host malware can capture a PIN or deceive the person during a genuine ceremony |
| Transplant an assertion from another operation | Ghost-specific payload challenge and authenticated preview signature must match | No trusted timestamp is added |
| Submit an unsupported v1/v2 artifact | Exact physics v3 profile and `press_ticks` field set are required | A future physics change needs a new reviewed profile |
| Corrupt a saved artifact | Restore calls `/api/ghost/verify`; malformed or changed artifacts fail | Local stats and heat progress are disposable and can be edited freely |
| Import malformed, oversized, or foreign rival JSON | The UI rejects files over 128 KiB, parses the rest as untrusted JSON, and verifies before replacement | Direct API input is still untrusted; a valid artifact remains usable only with its matching local enrollment |
| Race without the physical key connected | Verification uses stored public evidence and is intentionally offline from the authenticator | The local identity database and broker still need to be present |
| Replay the same artifact repeatedly | Allowed by design; verifier reports `replayable=true` | This artifact must never be reused as a one-time authorization token |
| Forge a heat win or streak | No security claim is made for local results | Not suitable for prizes or a public leaderboard without a server-authoritative game design |
| Change the selected capture route ID | The exact allowlisted, versioned ID is inside the signed payload and outer binding | The browser still supplies the claimed finish tick; this is not server-authoritative anti-cheat |
| Change deterministic route or carrot code | Signed capture ID and replay remain detectable; route IDs are treated as immutable and later heat adaptations are unsigned | A modified client can invent geometry, carrots, bursts, and results without changing the signed bytes |
| Cross-service use | Fixed broker-constructed `localhost` origin, signed signer metadata, and ghost-specific domains | It does not prove which browser tab initiated the request; another native local process remains in scope |
| Cross-site browser request | Every API call requires the app marker and rejects foreign Origin/Referer before device access | The public marker is not native-process authentication |
| Accidental external bind | Middleware rejects non-loopback socket peers in addition to host checking | Do not bypass or remove the peer check to support phones |
| Multiple authenticators attached | Hardware backend requires exactly one USB FIDO authenticator and shows its device-reported product/firmware | Capability discovery cannot prove it is the enrolled physical key until signing succeeds |
| Initial PIN mutation | Hardware mode disables browser PIN setup by default; opt-in still requires exactly one FIDO 2.3 + previewSign key | During a deliberate opt-in launch, another native local process remains in scope |
| PIN disclosure | Request models redact the PIN, form values are cleared, and PIN is not persisted | Browser/OS malware, logging added by a compromised broker, or shoulder surfing can capture it |
| Wrong-PIN brute force | Hardware access is single-flight, device retry behavior applies, and a wrong PIN starts a local five-second cooldown | A native local attacker can wait out the cooldown and can still block the FIDO application |
| Unsafe state path | New data dirs are `0700`; existing POSIX dirs/files must be owned by the user, non-writable by group/others, and non-symlinked | The local user and administrator remain trusted |
| Mock mistaken for hardware | Separate mode, assurance, algorithm, state directory, banner, and verifier profile | A misleading screenshot can omit surrounding labels |

## Why replay is allowed

A racing rival is useful because it is stable and reusable. Ghost verification
therefore can return `valid=true` repeatedly, reports `replayable=true`, and
never treats starting another heat as a new hardware authorization.

This separation is security relevant. A Ghost Lap artifact must not be
reinterpreted as permission for an external side effect.

## Release-blocking invariants

1. The retained canonical bytes hashed for `previewSign`, signed by the derived
   key, mirrored in the artifact, and verified later are the same payload.
2. The server, not the browser, chooses schema, domain, physics version, run ID,
   issue time, and signer metadata.
3. Hardware mode requires the enrolled ESP256-split-ARKG profile plus both UP
   and UV; it never silently downgrades to mock or touch-only signing.
4. Each new rival uses fresh 32-byte IKM and a context bound to the enrolled
   fingerprint and exact payload.
5. Verification recomputes the derived key and exact arguments from the pinned
   master seed rather than trusting artifact-supplied public keys.
6. Firmware receives the payload prehash while the ESP256 verifier receives the
   original payload bytes.
7. The normal assertion uses a ghost-specific payload challenge and carries the
   same preview signature in authenticated extension data.
8. The current verifier requires the matching local enrolled identity.
9. An unsupported replay version or `jump_ticks` request fails closed.
10. Successful ghost verification remains side-effect-free and replayable.
11. Restored artifacts are verified; unsigned stats are never presented as
    hardware-backed facts.
12. “Next heat,” chosen trails, and ordinary retries perform no signing request.
    Only “Make a new rival” or explicit promotion of an eligible exact-layout
    home-trail PB can replace the signed baseline, and the current rival remains until replacement
    verification succeeds.

## Security review checklist

The implementation was reviewed against these protocol abuse cases:

- altered outer replay fields and altered signed payload bytes;
- a recomputed digest paired with a broken signature;
- a cryptographically valid but unsupported v1 `jump_ticks` replay;
- wrong course, tick rate, finish bounds, negative/out-of-lap/duplicate/reversed
  ticks, boolean ticks, and too many presses;
- extra request fields and malformed artifact shapes;
- wrong PIN with no artifact issued;
- unique server-assigned run IDs;
- payload-bound ghost derivation contexts and WebAuthn challenges; and
- repeated successful read-only verification.

The gameplay and browser review also covered:

- a ground jump and at most one accepted flap per airborne cycle;
- exactly one signing request when a new rival is made;
- many next-heat races with no PIN or key request;
- a deterministic versioned route for the same rival fingerprint and heat;
- six distinct themes and obstacle layouts, mirrored rendering on reverse
  routes, and bounded slow/bounce/boost obstacle effects;
- an immutable baseline simulation for the signed capture plus deterministic
  active-route adaptation of its input tape for the visible rival;
- route-specific local personal bests and a pacer that never compares unlike
  layouts, keyed by stable route ID rather than catalog position;
- immediate same-route retries and post-tour chosen trails that preserve the
  scheduled `nextHeat` and make no additional signing request;
- saved-rival verification on reload, rejection of corrupted storage, and play
  with the key unplugged after successful restore;
- transient restore failure recovery without deleting or replacing the saved
  rival, including a gated Start button while verification is pending;
- export of the exact public rival artifact and verify-before-replace import in
  another profile on the same installation, including the 128 KiB file cap and
  rejection under a non-matching enrollment;
- disposable edited-copy rejection without changing the saved rival or making
  another signing request;
- signer-partitioned rival storage plus per-rival heat, win, streak,
  overall-best, exact PB input tapes, per-route-best, and route-medal
  persistence;
- artifact-scoped Rival DNA derived only from the verified public run-key
  fingerprint, with unsigned PB echoes kept visually distinct;
- muted-by-default audio whose cues are supplementary and created only after a
  user gesture; and
- an opt-in PB promotion only after a faster exact-layout home-trail run,
  with a fresh PIN/touch, retained PBs and cumulative stats, reset
  progression, and preservation of the existing rival if signing fails.

## Safe demo language

Say:

> “This locally enrolled physical key signed the exact baseline replay, and the
> verifier accepted its user-verification-and-touch evidence. Now I can intentionally reuse that rival
> for endless local heats.”

Do not say:

> “The YubiKey proved this score, this later heat, or honest gameplay.”

The first statement matches the implemented evidence. The second does not.
