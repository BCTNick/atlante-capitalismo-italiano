# Atlante del Capitalismo Italiano (Atlas of Italian Capitalism)

An open-data visualization of ownership relationships among Italian people, families, public bodies, holdings and companies.

The Atlas represents explicit corporate chains. If a person owns a stake in a holding that owns a company, both relationships are shown; no shortcut is created between the person and the final company. Node size can reflect a person's estimated wealth or a company's indicative value.

## Local demo

Python 3.11 or later is required.

```bash
python scripts/build_db.py
python serve.py
```

Open <http://127.0.0.1:8000/app/>.

## Embed the graph in a blog

The visualization includes a responsive iframe mode. Once GitHub Pages is enabled, use:

```text
https://bctnick.github.io/atlante-capitalismo-italiano/embed.html
```

Filters become a slide-out panel and node details open above the graph, without duplicating data or application logic. See [docs/EMBED.md](docs/EMBED.md) for the complete HTML snippet and CMS guidance.

## Available snapshots

| Date | Status | Nodes | Relationships |
|---|---|---:|---:|
| 31 December 2025 | published | 107 | 97 |

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

## Contributing

Documented corrections, additional companies and new annual snapshots are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [METHODOLOGY.md](METHODOLOGY.md) before opening a pull request.

Core rule: **every node and every relationship must have a verifiable source**. Primary sources such as annual reports, corporate-governance reports, official disclosures, Consob documents and investor-relations websites are preferred.

To check a change locally:

```bash
python scripts/build_db.py
python scripts/validate_data.py
```

## Accuracy and AI assistance

The initial research was produced with the assistance of OpenAI Codex and checked on a best-effort basis against the public sources attached to the records. The project may contain errors, omissions or inaccurate interpretations. Read the [full disclaimer](DISCLAIMER.md).

## Licences

- Code: [MIT](LICENSE).
- Original database and data contributions: [Open Database License 1.0](LICENSE-DATA.md).
- Logos, names and trademarks belong to their respective owners, are excluded from the project's licences and are used solely for identification. See [TRADEMARKS.md](TRADEMARKS.md).

## Documentation

- [Methodology and data model](METHODOLOGY.md)
- [Contribution guidelines](CONTRIBUTING.md)
- [Governance](GOVERNANCE.md)
- [Disclaimer](DISCLAIMER.md)
- [Security](SECURITY.md)
