# Contributing to the Atlas

Thank you for helping improve Atlante del Capitalismo Italiano (Atlas of Italian Capitalism). Corrections, new sources, additional ownership chains and new annual snapshots are welcome.

## Before you begin

1. Read [METHODOLOGY.md](METHODOLOGY.md) and [DISCLAIMER.md](DISCLAIMER.md).
2. Search open issues and pull requests to avoid duplicates.
3. For broad changes, open an issue first and describe the proposed scope.
4. Do not add unnecessary personal data or information obtained from private sources.

## Data rules

- A pull request should cover one corporate chain, one family or one coherent correction.
- Every node and relationship must identify a source.
- Prefer official documents; when a document is long, cite the relevant page or section in the note.
- Do not create synthetic links for indirect ownership.
- Do not add stakes together or estimate percentages without explaining the calculation.
- Clearly distinguish ownership, control and a board or management role.
- Preserve existing IDs across snapshots.
- Do not alter a historical snapshot only because the situation changed after its date; create or update the appropriate snapshot instead.

## Correcting the 2025 snapshot

Edit:

```text
data/snapshots/2025-12-31/seed.json
```

Then rebuild and validate:

```bash
python scripts/build_db.py --snapshot 2025-12-31
python scripts/validate_data.py
```

Include `seed.json` and the generated `graph.json` and `rich_graph.sqlite` files in the pull request.

## Adding a new year

1. Copy the previous snapshot directory.
2. Rename it using the new ISO date, for example `2026-12-31`.
3. Update `meta.snapshot_date` and every record that changed.
4. Add the snapshot to `data/snapshots.json`.
5. Rebuild and validate all snapshots.

Each year must be a complete, verifiable view—not a file containing changes only.

## Pull-request checklist

- [ ] I identified the snapshot date.
- [ ] Every new node and relationship has an accessible source.
- [ ] Percentages are between 0 and 100.
- [ ] I did not add shortcuts for indirect ownership.
- [ ] I did not add unnecessary personal data.
- [ ] I ran the build and validation scripts.
- [ ] I accept the MIT licence for code and ODbL 1.0 for data contributions.

## Contribution licence

By opening a pull request, you represent that you have the right to provide the contribution. Code is distributed under the MIT licence; database changes and additions are distributed under ODbL 1.0. Logos and other third-party materials remain excluded.
