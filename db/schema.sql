PRAGMA foreign_keys = ON;

CREATE TABLE meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE sources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    publisher TEXT NOT NULL,
    url TEXT NOT NULL
);

CREATE TABLE locations (
    id TEXT PRIMARY KEY,
    city TEXT NOT NULL,
    region TEXT NOT NULL,
    country_code TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
);

CREATE TABLE sectors (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    description TEXT NOT NULL,
    order_index INTEGER NOT NULL
);

CREATE TABLE nodes (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('subject', 'organization')),
    subtype TEXT NOT NULL,
    description TEXT NOT NULL,
    value_eur_bn REAL,
    value_basis TEXT,
    location_id TEXT NOT NULL REFERENCES locations(id),
    source_id TEXT NOT NULL REFERENCES sources(id)
);

CREATE TABLE node_sectors (
    node_id TEXT NOT NULL REFERENCES nodes(id),
    sector_id TEXT NOT NULL REFERENCES sectors(id),
    rank INTEGER NOT NULL,
    PRIMARY KEY (node_id, sector_id),
    UNIQUE (node_id, rank)
);

CREATE TABLE node_logos (
    node_id TEXT PRIMARY KEY REFERENCES nodes(id),
    asset_path TEXT,
    mark TEXT NOT NULL,
    background TEXT NOT NULL
);

CREATE TABLE ownerships (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES nodes(id),
    owned_id TEXT NOT NULL REFERENCES nodes(id),
    percentage REAL NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    note TEXT NOT NULL DEFAULT '',
    source_id TEXT NOT NULL REFERENCES sources(id),
    CHECK (owner_id <> owned_id)
);

CREATE TABLE family_links (
    id TEXT PRIMARY KEY,
    person_a_id TEXT NOT NULL REFERENCES nodes(id),
    person_b_id TEXT NOT NULL REFERENCES nodes(id),
    relation_type TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    source_id TEXT NOT NULL REFERENCES sources(id),
    CHECK (person_a_id <> person_b_id)
);

CREATE INDEX idx_ownership_owner ON ownerships(owner_id);
CREATE INDEX idx_ownership_owned ON ownerships(owned_id);
CREATE INDEX idx_family_a ON family_links(person_a_id);
CREATE INDEX idx_family_b ON family_links(person_b_id);
CREATE INDEX idx_node_sector ON node_sectors(sector_id);
