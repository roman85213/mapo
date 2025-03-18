package cz.spse.mapo.model;

import cz.spse.mapo.dto.GeneratedPath;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class DatabaseConnection {
    private final JdbcTemplate jdbcTemplate;

    public DatabaseConnection(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Node getNodeById(double id) {
        String sql = "SELECT id, ST_X(ST_Centroid(ST_Transform(geom, 4326))) AS long, ST_Y(ST_Centroid(ST_Transform(geom, 4326))) AS lat FROM nodes WHERE id = ?";
        return jdbcTemplate.query(sql, nodeRowMapper, id).get(0);
    }

    private final RowMapper<Node> nodeRowMapper = (rs, rowNum) ->
            new Node(
                    rs.getLong("id"),
                    rs.getDouble("lat"),
                    rs.getDouble("long")
            );

//    public Double getNodeId(double lon, double lat) {
//        String sql = "SELECT id FROM nodes ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint(?, ?), 4326)) LIMIT 1";
//        return jdbcTemplate.query(sql, idNodeMapper, lon, lat).get(0);
//    }
    public Double getNodeId(double lon, double lat, String type) {
        String sql = "SELECT id FROM nodes ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint(?, ?), 4326)) LIMIT 300";
        List<Double> ids = jdbcTemplate.query(sql, idNodeMapper, lon, lat);

        switch (type) {
            case "walk", "bicycle":
                return ids.get(0);
            case "car", "bus":
                String inSql = "SELECT nodes.id FROM nodes JOIN edges ON edges.tags -> 'highway' = ANY(ARRAY['residential', 'primary', 'secondary']) WHERE nodes.id = ?";
                for (Double id : ids) {
                    Double result = jdbcTemplate.query(inSql, idNodeMapper, id).get(0);
                    if (result != -1)
                        return result;
                }
        }
        throw new RuntimeException();
    }

    private final RowMapper<Double> idNodeMapper = (rs, rowNum) -> {
        if (!rs.next()) return -1D;
        return rs.getDouble("id");
    };


    public String getNodesStreetName(double id) {
        String sql = "SELECT edges.tags->'name' as street FROM edges JOIN nodes n ON n.id = edges.source WHERE edges.tags->'name' IS NOT NULL AND n.id = ?";
        List<String> result = jdbcTemplate.query(sql, streetRowMapper, id);
        return result.isEmpty() ? "" : result.get(0);
    }

    private final RowMapper<String> streetRowMapper = (rs, rowNum) ->
            rs.getString("street");

    public Node getNodeByStreetName(String name) {
        String sql = "SELECT nodes.id, ST_X(ST_Centroid(ST_Transform(geom, 4326))) AS long, ST_Y(ST_Centroid(ST_Transform(geom, 4326))) AS lat FROM nodes JOIN edges ON edges.source = nodes.id AND edges.tags->'name' = ?";
        List<Node> result = jdbcTemplate.query(sql, nodeRowMapper, name);
        int len = result.size();
        return result.isEmpty() ? null : result.get(len / 2);
    }

    public List<Double> getNodesByLonLat(double lon, double lat) {
        String sql = "SELECT id FROM nodes ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint(?, ?), 4326)) LIMIT 5";
        return jdbcTemplate.query(sql, idRowMapper, lon, lat);
    }

    private final RowMapper<Double> idRowMapper = (rs, rowNum) ->
        rs.getDouble("id");

    public List<GeneratedPath> generatePaths(Point pointFrom, Point pointTo, String type) {
        double fromId = getNodeId(pointFrom.lng, pointFrom.lat, type);
        double toId = getNodeId(pointTo.lng, pointTo.lat, type);
        List<GeneratedPath> paths = new ArrayList<>();
        String edgeSql = switch (type) {
            case "walk", "bicycle" -> "SELECT id, source, target, cost FROM edges";
            case "car", "bus" -> "SELECT id, source, target, cost FROM edges WHERE edges.tags -> 'highway' = ANY(ARRAY['residential', 'primary', 'secondary', 'service', 'tertiary', 'motorway'])";
            default -> "";
        };
        if (edgeSql.isEmpty()) throw new RuntimeException();
        String sql = "SELECT * from pgr_dijkstra(?, ?, ?, false)";
        paths.add(new GeneratedPath(jdbcTemplate.query(sql, generatedPathMapper, edgeSql, (long) fromId, (long) toId)));
        return paths;
    }

    private final RowMapper<Node> generatedPathMapper = (rs, rowNum) ->
            getNodeById(rs.getDouble("node"));

    public Long getPathLength(String string) {
        String sql = "SELECT ST_Length(ST_GeogFromText(?)) AS length";
        return jdbcTemplate.query(sql, lengthRowMapper, string).get(0);
    }

    private final RowMapper<Long> lengthRowMapper = (rs, rowNum) ->
            rs.getLong("length");
}
