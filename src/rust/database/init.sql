CREATE EXTENSION HSTORE;
CREATE EXTENSION IF NOT EXISTS pgrouting;


CREATE TABLE IF NOT EXISTS nodes (
    id bigint NOT NULL PRIMARY KEY,
    geom geometry(Point, 4326) NOT NULL,
    tags hstore
);

CREATE TABLE IF NOT EXISTS edges (
    id bigint NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tags hstore,
    source bigint,
    target bigint
);

-- Vytvoří cost jako vzdálenost bodů
UPDATE edges
SET cost = (
    SELECT
        st_distance(
                source_node.geom,
                target_node.geom
        ) AS distance
    FROM
        edges AS a
            JOIN
        nodes AS source_node ON source_node.id = a.source
            JOIN
        nodes AS target_node ON target_node.id = a.target
    WHERE
        a.id = edges.id
);

select * from edges where edges.tags -> 'highway' = 'residential' and edges.tags -> 'name' = 'Bartoňova';
