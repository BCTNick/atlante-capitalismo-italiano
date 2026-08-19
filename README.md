# Atlante del Capitalismo Italiano (Atlas of Italian Capitalism)

An open-data visualization of ownership relationships among Italian people, families, public bodies, holdings, companies and recognizable assets such as newspapers and football clubs.

The Atlas represents explicit corporate chains. If a person owns a stake in a holding that owns a company, both relationships are shown; no shortcut is created between the person and the final company. Node size can reflect a person's estimated wealth or a company's indicative value. The interface offers a territorial layout and a sector layout; node colours continue to identify entity type, not sector.

## Local demo

Python 3.11 or later is required.

```bash
python scripts/build_db.py
python serve.py
```

Open <http://127.0.0.1:8000/app/>.

Or open it in my blog: <https://www.scognamiglionicola.com/atlante/app/index.html?snapshot=2025-12-31>.

## Available snapshots

| Date | Status | Nodes | Relationships |
|---|---|---:|---:|
| 31 December 2025 | published | 402 | 347 |

Snapshots are independent, complete views rather than incremental updates. Entity IDs remain stable across years; stakes, values, relationships and sources belong to each individual snapshot.

```text
data/
├── snapshots.json
└── snapshots/
    └── 2025-12-31/
        ├── seed.json
        ├── graph.json
        └── rich_graph.sqlite
```

- `seed.json` is the canonical source file to edit through pull requests.
- `graph.json` feeds the web application.
- `rich_graph.sqlite` makes the snapshot available as a relational database.
- `snapshots.json` indexes the available years.

Each node has one normalized `location_id` and an ordered `sectors` list. Locations describe the node itself rather than a family display group. Empty sector lists are valid for pure holdings, people, families and public bodies: in the sector view those nodes settle between the operating assets to which they are connected.

## Contributing

Documented corrections, additional companies and new annual snapshots are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [METHODOLOGY.md](METHODOLOGY.md) before opening a pull request.

Core rule: **every node and every relationship must have a verifiable source**. Primary sources such as annual reports, corporate-governance reports, official disclosures, Consob documents and investor-relations websites are preferred.

The 2025 expansion covers the 71 Forbes Italy wealth entries equivalent to at least EUR 1 billion and the 83 Italian listed companies whose year-end market capitalization met the same threshold. Related people can be represented by one family node when separate nodes would double-count the same ownership chain. See [COVERAGE_2025.md](COVERAGE_2025.md) for the boundary, aggregation map and known limitations.

To check a change locally:

```bash
python scripts/build_db.py
python scripts/validate_data.py
```

## Accuracy and AI assistance

The initial research was produced with the assistance of OpenAI Codex (GPT 5.6 Sol) and checked on a best-effort basis against the public sources attached to the records. The project may contain errors, omissions or inaccurate interpretations. Read the [full disclaimer](DISCLAIMER.md).

## Licences

- Code: [MIT](LICENSE).
- Original database and data contributions: [Open Database License 1.0](LICENSE-DATA.md).
- Logos, names and trademarks belong to their respective owners, are excluded from the project's licences and are used solely for identification. See [TRADEMARKS.md](TRADEMARKS.md).

## Documentation

- [Methodology and data model](METHODOLOGY.md)
- [2025 coverage register](COVERAGE_2025.md)
- [Contribution guidelines](CONTRIBUTING.md)
- [Governance](GOVERNANCE.md)
- [Disclaimer](DISCLAIMER.md)
- [Security](SECURITY.md)
