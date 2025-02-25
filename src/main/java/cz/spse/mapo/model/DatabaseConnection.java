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

    public Double getNodeId(double lon, double lat) {
        String sql = "SELECT id FROM nodes ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint(?, ?), 4326)) LIMIT 1";
        return jdbcTemplate.query(sql, idNodeMapper, lon, lat).get(0);
    }

    private final RowMapper<Double> idNodeMapper = (rs, rowNum) ->
            rs.getDouble("id");

    public String getNodesStreetName(double id) {
        String sql = "SELECT edges.tags->'name' as street FROM edges JOIN nodes n ON n.id = edges.source WHERE edges.tags->'name' IS NOT NULL AND n.id = ?";
        List<String> result = jdbcTemplate.query(sql, streetRowMapper, id);
        return result.isEmpty() ? "" : result.get(0);
    }

    private final RowMapper<String> streetRowMapper = (rs, rowNum) ->
            rs.getString("street");

    public List<Double> getNodesByLonLat(double lon, double lat) {
        String sql = "SELECT id FROM nodes ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint(?, ?), 4326)) LIMIT 5";
        return jdbcTemplate.query(sql, idRowMapper, lon, lat);
    }

    private final RowMapper<Double> idRowMapper = (rs, rowNum) ->
        rs.getDouble("id");

    public List<GeneratedPath> generatePaths(Point pointFrom, Point pointTo) {
        double fromId = getNodeId(pointFrom.lng, pointFrom.lat);
        double toId = getNodeId(pointTo.lng, pointTo.lat);
        List<GeneratedPath> paths = new ArrayList<>();
        String edgeSql = "SELECT id, source, target, cost FROM edges";
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
