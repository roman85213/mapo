CREATE EXTENSION HSTORE;
CREATE EXTENSION PGROUTING CASCADE ;


CREATE TABLE IF NOT EXISTS nodes (
    id bigint NOT NULL PRIMARY KEY,
    geom geometry(Point, 4326) NOT NULL,
    tags hstore
);

CREATE TABLE IF NOT EXISTS edges (
    id bigint NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tags hstore,
    source bigint,
    target bigint,
    cost float,
    reverse_cost float
);

Alter table edges add reverse_cost float;
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

SELECT * FROM nodes where id = 12539658013;

SELECT * FROM nodes ORDER BY nodes.geom <-> st_point(50.04346, 15.80278, 4326) LIMIT 5;

SELECT id, nodes.geom <-> st_point(50.04346, 15.80278, 4326) as dist FROM nodes ORDER BY dist LIMIT 5;

SELECT ST_X(ST_Centroid(ST_Transform(st_point(50.04346, 15.80278, 4326), 4326))) AS long, ST_Y(ST_Centroid(ST_Transform(st_point(50.04346, 15.80278, 4326), 4326))) AS lat FROM nodes WHERE nodes.id = 568467323;

SELECT ST_X(ST_Centroid(ST_Transform(geom, 4326))) AS long, ST_Y(ST_Centroid(ST_Transform(geom, 4326))) AS lat FROM nodes WHERE id = 9654380568;

SELECT id FROM nodes ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint(15.80278, 50.04346), 4326)) LIMIT 1;

SELECT nodes.id FROM nodes JOIN edges ON edges.tags -> 'highway' = ANY(ARRAY['residential', 'primary', 'secondary']) WHERE nodes.id = 9654380568;

select * from edges where edges.tags -> 'highway' = ANY(ARRAY['residential', 'primary', 'secondary']);

SELECT * from pgr_dijkstra('SELECT id, source, target, cost FROM edges WHERE edges.tags -> ''highway'' = ANY(ARRAY[''residential'', ''primary'', ''secondary'', ''service''])', 6297607131, 568455342, false);

SELECT ST_Length(ST_GeogFromText('SRID=4326;LINESTRING(15.8111241 50.0478304,15.811003200000002 50.0477633,15.810957900000002 50.0477391)'));

SELECT nodes.id, ST_X(ST_Centroid(ST_Transform(geom, 4326))) AS long, ST_Y(ST_Centroid(ST_Transform(geom, 4326))) AS lat FROM nodes JOIN edges ON edges.source = nodes.id AND edges.tags->'name' = 'U Lípy';

SELECT * FROM edges WHERE source = 9357078411 OR target = 9357078411;
SELECT * FROM edges WHERE target = 288345903;
