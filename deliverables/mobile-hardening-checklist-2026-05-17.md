# ISMACONNECT Mobile Hardening Checklist

## Done in this pass
- Replaced dead-end map states with conversion-focused recovery blocks.
- Added stronger ride-share mobile shortcuts for `Today`, `Camp map`, `Horizon`, `Airport`, `Night shift`, and `14 on / 7 off`.
- Demoted `Buy & Sell` out of the primary header navigation so the main hierarchy stays focused on rides, rentals, jobs, and services.
- Changed zero-result map pages to use map-specific empty copy instead of the same generic no-results message.

## Test first on mobile
- Open `Ride Share` on a phone and tap:
  - `Today`
  - `Camp map`
  - `Horizon`
  - `Night shift`
  - `Airport`
- Open a map view that returns no results and confirm the recovery block shows:
  - `Post a ride need` or `Post a need`
  - `Switch to list view`
  - filter-clear action when relevant
- Confirm the top mobile marketplace rail no longer shows `Buy & Sell`.
- Confirm the desktop top nav also no longer gives `Buy & Sell` equal weight beside the core categories.

## Still worth tightening next
- Compress mobile browse/category overhead a little more if users still feel too much scroll before results.
- Make ride-share listing cards even more thumb-scannable under weak signal.
- Test real weak-network behavior on Android and iPhone, not just desktop build output.
- Increase trust prominence on rides and services:
  - verification
  - member since
  - ratings
  - safety cues

## Launch watch items
- Fresh listings this week
- Messages started per fresh listing
- Saved searches created
- Repeat posters
- Ride-share category response rate
