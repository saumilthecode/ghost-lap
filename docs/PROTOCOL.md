# Ghost Lap implemented protocol

Status: hackathon prototype. This document describes the v3 Ghost Lap replay
path implemented in this repository. WebAuthn `previewSign`, ARKG, and the
negative algorithm identifiers used by the supplied firmware are experimental.

## What a verified ghost means

For a hardware-mode artifact, the local verifier's claim is:

> The locally enrolled previewSign-compatible authenticator (observed locally
> as the supplied YubiKey) produced an ESP256-split-ARKG signature over the
> exact canonical Ghost Lap payload, and its locally enrolled normal WebAuthn
> credential authenticated the same operation with user presence and user
> verification.

The signed payload contains the baseline replay profile and a pinned description
of the local signer. A valid artifact is deliberately reusable. Verification is
read-only and does not enforce an expiration or limit the number of heats.

This is not a server-authoritative game protocol. The local browser records
accepted presses and runs the physics. The backend validates the replay's shape
and cryptographic evidence; it does not independently simulate the lap or prove
that the submitted timings came from honest play.

## Fixed replay profile

The server owns or strictly constrains these values:

| Field | Implemented value |
|---|---|
| Capture course | one of the six immutable `.v1` route IDs |
| Physics | `ghost-lap.physics.v3` |
| Tick duration | 20 ms (50 Hz) |
| Finish tick | integer from 250 through 3000 |
| Accepted presses | at most 256 strictly increasing integer ticks |
| Canonical payload limit | 4096 bytes |

Each press tick must be at least zero and less than `finish_tick`. Booleans are
rejected rather than accepted as Python integer aliases. Duplicate, descending,
out-of-range, and unsupported `jump_ticks` lists are rejected.

In the v3 game, the browser records a press only when it produces a ground jump
or the one available airborne flap. The backend cannot establish that semantic
fact; it enforces only the fixed numeric replay profile above.

## Exact signed payload

The implementation signs the canonical CBOR encoding of this string-keyed map:

```cddl
ghost-payload = {
  "schema": "hitl2.ghost-replay.v1",
  "version": 1,
  "domain": "hitl2.ghost-lap.replay",
  "run_id": tstr,              ; server-generated canonical UUIDv4
  "issued_at": tstr,           ; server clock, canonical UTC string ending Z
  "replay": {
    "course_id": capture-course-id,
    "physics_version": "ghost-lap.physics.v3",
    "tick_ms": 20,
    "finish_tick": 250..3000,
    "press_ticks": [* uint],   ; max 256, strictly increasing, each < finish
  },
  "signer": {
    "identity_fingerprint": tstr, ; lowercase SHA-256 hex
    "mode": "hardware" / "mock",
    "assurance": tstr,
    "rp_id": "localhost",
    "origin": tstr,            ; http://localhost:${HITL2_PORT}
    "algorithm": int,          ; -65539 hardware; -7 mock
  },
}

capture-course-id =
  "original-trail.v1" /
  "moonlit-marsh.v1" /
  "orchard-bounce.v1" /
  "snowcap-slide.v1" /
  "haywire-farm.v1" /
  "firefly-hollow.v1"
```

`canonical_cbor()` calls `cbor2.dumps(value, canonical=True)`. Verification
decodes and canonically re-encodes the bytes, then requires equality. The
profile is therefore pinned to the installed `cbor2` behavior rather than
claiming a new standardized wire format.

The client supplies only the PIN, selected course ID, tick duration, finish
tick, and press list. The request model forbids extra fields. The server accepts
only the explicit route allowlist above and fixes the physics version, schema,
domain, signer block, UUID, and issue time. Route definitions are immutable: a
future geometry or mechanics change needs a new versioned route ID.

`issued_at` is signed but is only the local broker's wall clock. There is no
trusted timestamping service and no expiration policy for a ghost.

## Local enrollment

The hardware enrollment profile is:

```text
RP ID                    localhost
origin                   http://localhost:${HITL2_PORT}
user verification        required
previewSign protocol     ESP256-split-ARKG, placeholder -65539
ARKG master seed         ARKG-P256, placeholder -65700
derived verification     ESP256, COSE -9
```

Enrollment creates one non-discoverable normal WebAuthn credential in a
registration with user verification required, then asks
`previewSign.generateKey` for the split-ARKG profile with a signing policy that
fixes both user presence and user verification. The implementation checks the
nested attestation's RP hash, flags, AAGUID, credential ID, key handle,
generated algorithm, signing policy, `fmt=none`/empty attestation statement,
non-backup flags, and strict ARKG public-seed structure
before storing the local identity.

The public seed contains an EC2 P-256 blinding key using algorithm `-7`, an EC2
P-256 KEM key using `-25`, master algorithm `-65700`, and derived procedure
`-9`. These identifiers have different roles and are validated independently.

The identity fingerprint is:

```text
SHA-256("hitl2-identity-v1" || 0x00 || master_seed_cose || credential_id)
```

Enrollment performs a throwaway derivation before persisting the seed. It is
trust-on-first-use: attestation bindings are validated, but a certificate chain
is not checked against Yubico or FIDO Metadata Service trust roots.
On later loads, the broker reparses the stored normal credential and recomputes
its credential ID, AAGUID, master-seed fingerprint, RP, origin, algorithm, and
policy coherence before reporting the identity ready.

## Hardware signing ceremony

Let `P` be the retained canonical `ghost-payload` bytes.

1. Generate a fresh 32-byte ARKG IKM.
2. Decode the enrolled 32-byte identity fingerprint `F` and calculate:

   ```text
   D   = SHA-256(P)
   B   = SHA-256("hitl2-ghost-arkg-context-v1" || 0x00 || F || D)
   ctx = "hitl2://ghost-lap/replay/v1" || 0x00 || B
   ```

   The resulting context is payload-bound, identity-bound, ghost-specific, and
   within the ARKG 64-byte limit.
3. Call the enrolled ARKG master seed's `derive_public_key(IKM, ctx)`. Retain
   the exact returned derived COSE key and encoded `additionalArgs`.
4. Calculate the normal WebAuthn challenge:

   ```text
   SHA-256("hitl2-webauthn-ghost-lap-v1" || 0x00 || P)
   ```

5. Begin authentication with only the enrolled credential allowed and
   `userVerification="required"`.
6. Submit the enrolled `previewSign` key handle, `SHA-256(P)` as `tbs`, and the
   derived `additionalArgs` through `signByCredential`.
7. Require a returned `previewSign` signature plus authenticator UP and UV.
8. Before returning an artifact, recompute the derived key and arguments from
   the trusted master seed and verify the preview signature over `P` with the
   derived ESP256 key.
9. Verify the normal WebAuthn assertion, including credential, RP ID hash,
   enrolled origin, client-data type and challenge, UP, UV, extension data, and
   equality between the authenticated extension signature and the returned
   preview signature.

The prehash boundary matters. Firmware receives `SHA-256(P)`, but the derived
ESP256 verifier receives the original `P`; ESP256 performs SHA-256 as part of
verification. Passing `SHA-256(P)` to that verifier would validate a different,
double-hashed message.

## Returned artifact

The JSON artifact has schema `hitl2.ghost.v1`. Binary fields use unpadded
base64url. It carries:

| Group | Fields |
|---|---|
| Signed replay mirror | `run_id`, `issued_at`, `replay` |
| Local identity | `mode`, `assurance`, `identity_fingerprint`, `aaguid`, `credential_id`, `preview_sign_version` |
| Algorithms | `algorithm`, `algorithm_name`, `derived_algorithm`, `derived_algorithm_name`, `derivation_scheme` |
| ARKG evidence | `master_public_key_cose`, `derived_public_key_cose`, `derived_key_fingerprint`, `derivation_ikm`, `derivation_context`, `additional_args` |
| Normal assertion | `assertion_credential_id`, `assertion_authenticator_data`, `assertion_client_data_json`, `assertion_signature`, `sign_count`, `user_present`, `user_verified` |
| Signed material | `signature`, `payload_cbor`, `payload_sha256` |

The outer replay, run ID, and issue time are convenience mirrors. Verification
requires them to exactly match the signed payload. A public key carried by the
artifact is evidence, not a trust anchor; the implementation pins it to the
locally enrolled identity.

The **About this rival** panel presents a short summary by default and exposes
this exact JSON behind a collapsed **Raw public proof artifact** section. Copy
and download include credential identifiers, AAGUID, master and derived public
keys, signatures, derivation IKM/context/arguments, WebAuthn client and
authenticator data, and `payload_cbor`. These are public verification inputs,
not secrets: the artifact contains no FIDO PIN or private key. The identifiers
and public keys can nevertheless link artifacts to the same locally enrolled
identity.

## Verification

`POST /api/ghost/verify` returns a normal invalid result for malformed artifacts
rather than consuming them. A valid hardware artifact must pass all of these
classes of checks:

1. Exact artifact field set and artifact schema.
2. Bounded base64url encodings, canonical payload CBOR, and payload digest.
3. Exact payload field set, schema, version, domain, canonical UUIDv4, and UTC
   issue-time form.
4. The fixed v3 replay profile and exact outer-to-signed replay binding.
5. A locally enrolled identity with matching mode, assurance, master public
   seed, fingerprint, credential metadata, preview version, signer block, and
   signing policy.
6. Exact hardware algorithm roles, a 32-byte IKM, payload-bound context, derived
   key, additional arguments, and derived-key fingerprint.
7. The ESP256 signature over the original payload.
8. The complete normal WebAuthn assertion and its authenticated copy of the
   same preview signature, including UP and UV.

On success the API reports:

```json
{
  "valid": true,
  "replayable": true,
  "anti_cheat": false,
  "hardware_mode_valid": true,
  "trust_model": "local-tofu",
  "manufacturer_attested": false
}
```

`hardware_mode_valid` is true only for a valid hardware-mode artifact. It is
not a manufacturer or firmware attestation. Verification
does not open the authenticator, consume state, or require a new touch. It does
require the matching locally enrolled identity, so an artifact copied into a
fresh installation is not independently trusted by the current app.

## Browser game layer

The verified ghost's signed press set is replayed at the same fixed ticks. The
browser saves artifacts in a bounded, signer-keyed six-slot `localStorage` vault
and asks the local verification API to validate a candidate before restoring
it. Hardware and software-practice signers therefore coexist without replacing
one another. Cookies and the YubiKey do not store rivals or game stats.

The browser can export the exact artifact JSON and import it in another browser
profile served by the same Ghost Lap installation. The file path does not make
verification portable: import still calls `POST /api/ghost/verify`, which
requires the matching enrolled local identity. The front end rejects an import
larger than 128 KiB before parsing, treats the JSON as untrusted, and installs it
only after successful verification. A failed parse or verification leaves the
currently saved rival untouched. Export does not include per-profile heat,
streak, win, or PB state.

Heat 1 uses the immutable signed baseline route for both runners. For later
heats, the browser applies the signed input ticks to the other five routes. A
fingerprint-derived starting offset selects their deterministic rotation:

```text
"ghost-lap.carrot-route.v1" || derived_key_fingerprint || 0
```

Every third collected carrot starts a fixed-duration burst. Version 3 consumes
burst ticks only while burst speed is actually active, so an obstacle stumble
pauses rather than silently drains an earned burst. Both visible runners use
the active route's obstacle and carrot tables. Reverse routes still advance an
internal monotonic progress value and mirror only projection, rabbit facing,
finish art, and world effects. Route obstacle effects are bounded and
deterministic: puddles and roots extend the normal stumble, spring caps launch
the runner, and ice pads grant a normal fixed-duration burst. Ringed carrots
above the plain-jump pickup range still require the airborne flap.

The selected capture trail's versioned ID, replay, and finish tick are signed.
Heat 1 reconstructs that exact signed route profile. A route's first visit may
adapt the signed tape to its local mechanics; this is not a new
hardware-attested result. After a finish, the browser retains that route's exact
accepted press ticks and time. On later visits it validates and resimulates that
unsigned PB tape, then races it as a route-specific **PB Echo**. The proof panel
continues to show the original signed capture, while each result also compares
against the signed rival as a secondary metric.

A dashed personal-best pacer and result flourishes are local presentation. The
browser stores one best finish tick and one validated input tape per versioned
route ID. A stored tape is accepted only when every press is accepted by the
fixed physics and its reconstructed finish matches the route PB. The dashed
line appears before an exact PB Echo exists. A new heat needs no cryptographic
ceremony.

The finish card may immediately retry the completed route. A retry uses the
same deterministic heat index and saved route PB, records ordinary unsigned
local stats, and leaves `nextHeat` unchanged. Continuing with **Next** resumes
the scheduled route rotation. Neither action signs again or contacts the key.

After all six route times are set, **Choose trail** reuses the route carousel.
A chosen run leaves the scheduled heat untouched; **Next** remains the one-click
scheduled default. The signed home trail uses its capture carrot layout, while
the other five trails use their challenge layouts.

When any exact-layout run on the rival's signed home trail is both a new
same-route PB and strictly faster than the signed rival, the finish
card offers **Make this PB the rival · PIN + touch**. The action is opt-in. It
submits that run's accepted press tape and finish tick through the normal
signing endpoint, so hardware mode requires a fresh PIN and physical touch. The
current rival remains installed until the replacement has passed server-side
self-verification. A successful promotion carries forward the unsigned PB book
and cumulative stats, resets `nextHeat` to 1 and the current streak to zero,
then begins again at Heat 1.

No automatic PB signing is attempted. Every artifact needs fresh user
verification and presence. Restricting promotion to the signed home trail's
exact capture profile preserves the same capture/replay semantics as making a
rival from the initial lap.

This browser layer is outside the signature scope. Heat numbers, generated
carrot layouts, collections, bursts, finish results, wins, and streaks are local
state and can be edited by a player controlling the browser. **Make a new
rival** and the explicit eligible-PB promotion are the only gameplay actions
that create a new signed payload.

The proof panel's edit check deep-copies the saved artifact, changes one outer
replay input, and submits only that disposable copy to `/api/ghost/verify`.
Expected rejection demonstrates outer-to-signed-payload binding. It does not
write local storage, sign again, or contact the authenticator.

## API summary

### `POST /api/ghost/sign`

```json
{
  "pin": "REDACTED",
  "course_id": "moonlit-marsh.v1",
  "tick_ms": 20,
  "finish_tick": 800,
  "press_ticks": [73, 181, 322, 617]
}
```

Returns `{ "ghost": ..., "verification": ... }` only after self-verification.
Wrong PIN, missing enrollment, incompatible hardware, policy mismatch, invalid
profile, derivation failure, missing touch/UV evidence, or signature failure
does not issue an artifact.

### `POST /api/ghost/verify`

```json
{ "ghost": { "schema": "hitl2.ghost.v1", "...": "..." } }
```

Returns the check map and the verified replay without mutating broker state.

Every API call requires `X-Ghost-Lap-Request: 1`, and any explicitly
foreign Origin or Referer is rejected first. The middleware also rejects a
non-loopback socket peer even if raw Uvicorn is mistakenly bound broadly. The
marker prevents ordinary browser CSRF; because it is public, it does not
authenticate native processes on the same host.

## Software practice profile

Mock mode is explicit and structurally separate:

- assurance is `MOCK_SOFTWARE_DO_NOT_TRUST`;
- the signing algorithm is software ES256 (`-7`);
- no ARKG derivation, WebAuthn assertion, user presence, or user verification is
  claimed; and
- the verifier requires empty assertion evidence and the fixed mock context.

Mock mode is useful for trying the game without hardware. It must not be described
as YubiKey-backed.
