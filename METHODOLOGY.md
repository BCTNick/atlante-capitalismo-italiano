# Methodology and data model

## Objective

The Atlas describes how people, families, public bodies and organizations are connected through equity stakes and publicly documented family relationships. It does not automatically calculate indirect control and does not replace real ownership chains with synthetic links.

## Time unit

Each dataset is a **complete snapshot** identified by an ISO date, such as `2025-12-31`. Every node, value and relationship in a snapshot is understood to refer to that date or to the best available information sufficiently close to it.

Individual relationships do not carry date ranges. When the situation changes, a new annual snapshot is created.

## Nodes

Nodes belong to two categories:

- `subject`: person, family, state, region, province or municipality;
- `organization`: holding, trust, foundation, cooperative, listed company, private company, sports club or a reusable `brand` node.

A territorial public body may own an organization but cannot itself be owned. An organization may both own and be owned.

IDs use `snake_case`, are descriptive and remain stable across years. The same entity must retain the same ID in every snapshot.

Every node has one normalized `location_id` and an ordered `sectors` list. The first sector is the primary visual anchor. Pure holdings, people, families and public bodies may have no sector: their position in the sector view is derived from the operating organizations connected to them.

The `brand` subtype represents a recognizable asset such as a newspaper title, radio station or book imprint without pretending that it is a separate share-capital company. It deliberately reuses the normal node and relationship model so the Atlas can show which legal publisher or operating company controls it.

## The `owns` relationship

This relationship is directional: it runs from the legal holder of a stake to the entity in which that stake is held. Percentages must be between 0 and 100.

Every step in a chain is recorded separately. For example:

```text
Ministry of Economy and Finance → CDP → CDP Equity → Fincantieri
```

No Ministry of Economy and Finance → Fincantieri link is created when the legal interest passes through CDP and CDP Equity.

The relationship records a disclosed interest, not necessarily corporate control. Shareholder agreements, enhanced voting rights and other governance elements should be explained in the note and supported by a source.

For a `brand` node, 100% means exclusive ownership or control of that brand asset inside the cited corporate perimeter, not 100% of a separate company's share capital. The relationship note must state this distinction.

## Family relationships

Family relationships connect people only and require a declared type such as `spouse`, `child`, `parent` or `sibling`. Relationships are not inferred from surnames, generic articles or assumptions.

## Values

- People and families: wealth estimates published by a recognizable source.
- Listed companies: market capitalization on the snapshot date or a nearby date.
- Private companies and holdings: an indicative value stated by the source, or `null` when no sufficiently reliable estimate is available.

The `value_basis` field must briefly explain what the number represents. A value does not automatically measure the economic interest attributable to an owner.

## EUR 1 billion coverage rule

The expanded 2025 snapshot uses two reproducible universes:

- people and families: the Forbes Italy ranking published on 16 December 2025, whose underlying estimates were dated 12 December 2025;
- listed companies: companies classified as Italian by CompaniesMarketCap with an end-of-2025 market capitalization of at least EUR 1 billion.

Forbes publishes its estimates in US dollars. They are converted using the ECB reference rate on 12 December 2025, EUR 1 = USD 1.1731. The qualifying cutoff is therefore USD 1.1731 billion: entries reported at USD 1.2 billion qualify, while USD 1.1 billion entries do not.

Several ranked people can derive their wealth from the same family pool and the same ownership chain. In those cases the Atlas may use one family node whose value is the sum of the qualifying ranked entries. The coverage register maps those entries to the aggregate. This avoids drawing the same family asset several times and makes the graph answer its main question: which family is wealthy, and through which companies?

The listed-company universe is exhaustive within the stated provider definition. No equivalent observable universe exists for private-company valuations. Private companies are therefore included when they are necessary to explain a covered person's or family's wealth, and their value remains `null` unless a sufficiently reliable public valuation is available.

An included wealth node may have no ownership arrow. This is intentional when the fortune comes from a completed sale, when the asset is held through a trust that cannot legally be treated as owned by its beneficiary, or when no defensible 2025 percentage is public. Descriptions explain those cases; the Atlas does not invent a stake to make the graph look complete.

## Sources

Every node and relationship contains a `source_id`. Preferred source order:

1. annual reports, corporate-governance reports and official issuer documents;
2. Consob, company registers and other public authorities;
3. press releases and investor-relations websites;
4. reputable financial journalism;
5. secondary sources, only when a primary source is not accessible.

The source must directly support the record to which it is attached. A generic source about a family is not sufficient evidence for a specific ownership percentage.

## Territorial positioning

Each node is assigned its own city, normally using the registered office, principal headquarters or most recognizable operating centre documented by its source. The city is a soft visual anchor, not an exact address. A person's location is a broad public association and must not be interpreted as residence or registry data.

## Sector positioning

Sectors describe operating activity and do not change node colour. In the sector layout, companies and brands are pulled toward their primary sector. Holdings, people, families and public bodies are not assigned an artificial sector merely for display: they settle between the sector anchors of the entities connected to them through the graph.
