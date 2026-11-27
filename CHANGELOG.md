# Changelog

Notable changes to this WilderFire fork are documented here. Version headings distinguish released versions from development candidates.

## [0.1.3.1] — Development preview (unreleased)

### Fixed
- Added compact sign reversal buttons to signed shared sliders and camera coordinates/controls to accommodate mobile keyboards without a minus key.
- Sign reversal respects existing bounds; positive-only controls remain unchanged.

### Validation
- Automated build and mobile layout/sign-entry testing pending.

## [0.1.3] — Development preview (unreleased)

### Added
- Editable numeric fields in the shared slider component, retaining slider interaction and parameter bounds.
- Invalid entries restore the previous value; integer-step controls reject fractional input.

### Validation
- CI and Build WilderFire passed; pull request #3 merged.
- 2026-11-27: User confirmed editable fields work in Depth of Field, Tone and Engine after the deployed application updated.
- Initial update delay was consistent with caching, but its cause was not independently verified.
- User confirmed bidirectional slider/field synchronization, viewport updates, integer validation, field sizing and continued camera operation.
- Known mobile issue: user cannot enter a negative sign using the phone numeric keyboard; cause not independently verified.
- Independent sliders, converted display units and detailed numeric precision remain to be audited.

## [0.1.2] — Development preview (unreleased)

### Added
- Editable Center X and Center Y coordinates, synchronized with canvas navigation.
- Direct numeric entry alongside all six existing camera sliders.
- Numeric validation and zoom range aligned with canvas navigation (0.02–64×).

### Validation
- Automated CI and Build WilderFire workflows passed; pull request #2 merged.
- 2026-11-27: User confirmed deployed camera controls are present and editable, and flame files save and reload in WilderFire Dev and JWildfire Mini.
- Detailed slider/canvas synchronization, numeric precision and desktop JWildfire compatibility remain to be explicitly verified.

## [0.1.1] — Release candidate (unreleased)

### Added
- Automated TypeScript checks, Vitest tests, production builds, and build artifacts through GitHub Actions.
- Automated GitHub Pages deployment for the development branch.
- Separate WilderFire Dev PWA identity, allowing installation alongside the original application.

### Fixed
- Export palette hexadecimal values in uppercase for JWildfire Mini compatibility (`bfd14f7`).
- Use a generic binary MIME type for `.flame` downloads to prevent Android from appending `.xml`; XML file contents remain unchanged (`6529740`).
- Support deployment under a GitHub Pages subdirectory, including manifest paths, service worker registration, and scoped caches.

### Validation — 2026-11-24
User-reported acceptance tests:
- [x] Application loads without errors.
- [x] Random fractals generate and render.
- [x] Sample fractals load correctly.
- [x] Flame export succeeds.
- [x] Exported flames open in JWildfire Mini without manual editing or renaming.
- [x] Application installs as WilderFire Dev.
- [x] Original WilderFire remains installed.
- [x] Application launches offline.
- [ ] Desktop JWildfire import and rendering.
- [ ] Desktop JWildfire round-trip compatibility.

### Release status
All eight initial acceptance tests passed. Desktop compatibility testing remains pending. No v0.1.1 release tag has been published; the version heading is a proposed release milestone.

## [0.1.0] — Upstream baseline

Original WilderFire application inherited from [thepacket/wilderfire](https://github.com/thepacket/wilderfire).
