from __future__ import annotations

import json
import sqlite3

from build_db import graph_payload, load_manifest, load_snapshot, project_path


def validate_generated_files(snapshot: dict, data: dict) -> None:
    graph_path = project_path(snapshot["graph_path"])
    if not graph_path.exists():
        raise ValueError(f"generated graph missing: {graph_path}")
    actual_graph = json.loads(graph_path.read_text(encoding="utf-8"))
    if actual_graph != graph_payload(data):
        raise ValueError(f"generated graph is stale: {snapshot['id']}")

    database_path = project_path(snapshot["database_path"])
    if not database_path.exists():
        raise ValueError(f"generated database missing: {database_path}")
    connection = sqlite3.connect(f"file:{database_path}?mode=ro", uri=True)
    try:
        integrity = connection.execute("PRAGMA integrity_check").fetchone()[0]
        if integrity != "ok":
            raise ValueError(f"database integrity failed for {snapshot['id']}: {integrity}")
        node_count = connection.execute("SELECT COUNT(*) FROM nodes").fetchone()[0]
        if node_count != len(data["nodes"]):
            raise ValueError(f"database node count mismatch for {snapshot['id']}")
    finally:
        connection.close()


def main() -> None:
    manifest = load_manifest()
    for snapshot in manifest["snapshots"]:
        data = load_snapshot(snapshot)
        validate_generated_files(snapshot, data)
        print(
            f"OK {snapshot['id']}: {len(data['nodes'])} nodes, "
            f"{len(data['ownerships']) + len(data['family_links'])} relations, "
            f"{len(data['sources'])} sources"
        )


if __name__ == "__main__":
    main()
