from __future__ import annotations

import argparse
import json
import sqlite3
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
MANIFEST_PATH = DATA_DIR / "snapshots.json"
SCHEMA_PATH = ROOT / "db" / "schema.sql"


def fail(message: str) -> None:
    raise ValueError(message)


def project_path(relative_path: str) -> Path:
    path = (DATA_DIR / relative_path).resolve()
    if not path.is_relative_to(DATA_DIR.resolve()):
        fail(f"path escapes data directory: {relative_path}")
    return path


def load_manifest() -> dict:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if manifest.get("schema_version") != 2:
        fail("unsupported snapshots schema_version")
    snapshots = manifest.get("snapshots", [])
    if not snapshots:
        fail("manifest must contain at least one snapshot")
    ids = [snapshot.get("id") for snapshot in snapshots]
    if len(ids) != len(set(ids)):
        fail("duplicate snapshot id")
    if manifest.get("default_snapshot") not in ids:
        fail("default_snapshot is not listed")
    for snapshot in snapshots:
        try:
            date.fromisoformat(snapshot["id"])
        except (KeyError, ValueError) as error:
            fail(f"invalid snapshot id: {snapshot.get('id')}")
        if snapshot.get("year") != int(snapshot["id"][:4]):
            fail(f"year mismatch for snapshot {snapshot['id']}")
        for key in ("seed_path", "graph_path", "database_path"):
            if not snapshot.get(key):
                fail(f"{key} missing for snapshot {snapshot['id']}")
            project_path(snapshot[key])
    return manifest


def load_snapshot(snapshot: dict) -> dict:
    seed_path = project_path(snapshot["seed_path"])
    if not seed_path.exists():
        fail(f"seed file not found for {snapshot['id']}: {seed_path}")
    data = json.loads(seed_path.read_text(encoding="utf-8"))
    validate(data, snapshot)
    return data


def validate(data: dict, snapshot: dict) -> None:
    if data.get("meta", {}).get("snapshot_date") != snapshot["id"]:
        fail(f"meta.snapshot_date must equal {snapshot['id']}")

    sources = data.get("sources", [])
    source_ids = {source["id"] for source in sources}
    if len(source_ids) != len(sources):
        fail("duplicate source id")
    for source in sources:
        if not all(source.get(key) for key in ("id", "title", "publisher", "url")):
            fail(f"incomplete source: {source.get('id')}")
        if not source["url"].startswith(("https://", "http://")):
            fail(f"invalid source URL: {source['id']}")

    node_rows = data.get("nodes", [])
    nodes = {node["id"]: node for node in node_rows}
    if len(nodes) != len(node_rows):
        fail("duplicate node id")

    locations = data.get("locations", [])
    location_ids = {location["id"] for location in locations}
    if len(location_ids) != len(locations):
        fail("duplicate location id")
    for location in locations:
        if not all(location.get(key) for key in ("id", "city", "region", "country_code")):
            fail(f"incomplete location: {location.get('id')}")
        if not isinstance(location.get("latitude"), (int, float)) or not isinstance(location.get("longitude"), (int, float)):
            fail(f"invalid coordinates for location: {location['id']}")

    sectors = data.get("sectors", [])
    sector_ids = {sector["id"] for sector in sectors}
    if len(sector_ids) != len(sectors):
        fail("duplicate sector id")
    sector_order = [sector.get("order_index") for sector in sectors]
    if len(set(sector_order)) != len(sector_order):
        fail("duplicate sector order_index")
    for sector in sectors:
        if not all(sector.get(key) is not None for key in ("id", "label", "description", "order_index")):
            fail(f"incomplete sector: {sector.get('id')}")

    for node in node_rows:
        if node["category"] not in {"subject", "organization"}:
            fail(f"invalid category for node {node['id']}")
        if node["source_id"] not in source_ids:
            fail(f"missing source for node {node['id']}")
        if node.get("location_id") not in location_ids:
            fail(f"missing location for node {node['id']}")
        if "groups" in node:
            fail(f"legacy groups field on node {node['id']}")
        node_sectors = node.get("sectors")
        if not isinstance(node_sectors, list):
            fail(f"node without sectors list: {node['id']}")
        if len(node_sectors) != len(set(node_sectors)):
            fail(f"duplicate sector on node {node['id']}")
        unknown_sectors = set(node_sectors) - sector_ids
        if unknown_sectors:
            fail(f"unknown sector on node {node['id']}: {unknown_sectors}")
        value = node.get("value_eur_bn")
        if value is not None and value < 0:
            fail(f"negative value for node {node['id']}")
    if "group_locations" in data:
        fail("legacy group_locations field in snapshot")

    logos = data.get("logos", {})
    logo_ids = set(logos)
    organization_ids = {node["id"] for node in node_rows if node["category"] == "organization"}
    if logo_ids != organization_ids:
        fail(f"logo coverage mismatch: missing={organization_ids - logo_ids}, extra={logo_ids - organization_ids}")
    for node_id, logo in logos.items():
        if not logo.get("mark") or not logo.get("background"):
            fail(f"incomplete logo metadata: {node_id}")
        asset_path = logo.get("asset_path")
        if asset_path and not (ROOT / "app" / asset_path).exists():
            fail(f"missing logo asset for {node_id}: {asset_path}")

    seen_edges: set[str] = set()
    for edge in data.get("ownerships", []):
        if edge["id"] in seen_edges:
            fail(f"duplicate edge id {edge['id']}")
        seen_edges.add(edge["id"])
        if edge["owner_id"] not in nodes or edge["owned_id"] not in nodes:
            fail(f"unknown endpoint in {edge['id']}")
        if nodes[edge["owned_id"]]["category"] != "organization":
            fail(f"a subject cannot be owned: {edge['id']}")
        if not 0 <= edge["percentage"] <= 100:
            fail(f"invalid percentage in {edge['id']}")
        if edge["source_id"] not in source_ids:
            fail(f"missing source for {edge['id']}")

    for edge in data.get("family_links", []):
        if edge["id"] in seen_edges:
            fail(f"duplicate edge id {edge['id']}")
        seen_edges.add(edge["id"])
        a = nodes.get(edge["person_a_id"])
        b = nodes.get(edge["person_b_id"])
        if not a or not b:
            fail(f"unknown family endpoint in {edge['id']}")
        if a["subtype"] != "person" or b["subtype"] != "person":
            fail(f"family links require two people: {edge['id']}")
        if edge["source_id"] not in source_ids:
            fail(f"missing source for {edge['id']}")


def build_database(data: dict, db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    if db_path.exists():
        db_path.unlink()

    connection = sqlite3.connect(db_path)
    try:
        connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        connection.executemany(
            "INSERT INTO meta(key, value) VALUES (?, ?)",
            [(key, str(value)) for key, value in data["meta"].items()],
        )
        connection.executemany(
            "INSERT INTO sources(id, title, publisher, url) VALUES (:id, :title, :publisher, :url)",
            data["sources"],
        )
        connection.executemany(
            """
            INSERT INTO locations(id, city, region, country_code, latitude, longitude)
            VALUES (:id, :city, :region, :country_code, :latitude, :longitude)
            """,
            data["locations"],
        )
        connection.executemany(
            """
            INSERT INTO sectors(id, label, description, order_index)
            VALUES (:id, :label, :description, :order_index)
            """,
            data["sectors"],
        )
        connection.executemany(
            """
            INSERT INTO nodes(
                id, label, category, subtype, description,
                value_eur_bn, value_basis, location_id, source_id
            ) VALUES (
                :id, :label, :category, :subtype, :description,
                :value_eur_bn, :value_basis, :location_id, :source_id
            )
            """,
            data["nodes"],
        )
        connection.executemany(
            "INSERT INTO node_sectors(node_id, sector_id, rank) VALUES (?, ?, ?)",
            [
                (node["id"], sector_id, rank)
                for node in data["nodes"]
                for rank, sector_id in enumerate(node.get("sectors", []))
            ],
        )
        connection.executemany(
            """
            INSERT INTO node_logos(node_id, asset_path, mark, background)
            VALUES (:node_id, :asset_path, :mark, :background)
            """,
            [{"node_id": node_id, **logo} for node_id, logo in data["logos"].items()],
        )
        connection.executemany(
            """
            INSERT INTO ownerships(id, owner_id, owned_id, percentage, note, source_id)
            VALUES (:id, :owner_id, :owned_id, :percentage, :note, :source_id)
            """,
            data["ownerships"],
        )
        connection.executemany(
            """
            INSERT INTO family_links(
                id, person_a_id, person_b_id, relation_type, note, source_id
            ) VALUES (
                :id, :person_a_id, :person_b_id, :relation_type, :note, :source_id
            )
            """,
            data["family_links"],
        )
        connection.commit()
    finally:
        connection.close()


def graph_payload(data: dict) -> dict:
    return {
        "meta": data["meta"],
        "sources": {source["id"]: source for source in data["sources"]},
        "locations": data["locations"],
        "sectors": data["sectors"],
        "logos": data["logos"],
        "nodes": data["nodes"],
        "edges": [{"kind": "owns", **edge} for edge in data["ownerships"]]
        + [{"kind": "family", **edge} for edge in data["family_links"]],
    }


def write_graph(data: dict, graph_path: Path) -> None:
    graph_path.parent.mkdir(parents=True, exist_ok=True)
    graph_path.write_text(
        json.dumps(graph_payload(data), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def build_snapshot(snapshot: dict) -> None:
    data = load_snapshot(snapshot)
    db_path = project_path(snapshot["database_path"])
    graph_path = project_path(snapshot["graph_path"])
    build_database(data, db_path)
    write_graph(data, graph_path)
    print(
        f"Built {snapshot['id']}: {len(data['nodes'])} nodes, "
        f"{len(data['ownerships'])} ownerships, "
        f"{len(data['family_links'])} family links."
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Build annual snapshots for the atlas")
    parser.add_argument("--snapshot", help="Build only the specified snapshot id")
    args = parser.parse_args()

    manifest = load_manifest()
    snapshots = manifest["snapshots"]
    if args.snapshot:
        snapshots = [snapshot for snapshot in snapshots if snapshot["id"] == args.snapshot]
        if not snapshots:
            fail(f"snapshot not found: {args.snapshot}")
    for snapshot in snapshots:
        build_snapshot(snapshot)


if __name__ == "__main__":
    main()
