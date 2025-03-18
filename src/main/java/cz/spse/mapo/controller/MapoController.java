package cz.spse.mapo.controller;

import cz.spse.mapo.dto.GeneratedPath;
import cz.spse.mapo.dto.GenerationRequest;
import cz.spse.mapo.dto.GenerationResponse;
import cz.spse.mapo.model.Node;
import cz.spse.mapo.model.DatabaseConnection;
import cz.spse.mapo.model.Point;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Objects;

@Controller
public class MapoController {
    private final DatabaseConnection nodeRepository;

    public MapoController(DatabaseConnection nodeRepository) {
        this.nodeRepository = nodeRepository;
    }
    @CrossOrigin
    @PostMapping("/")
    public ResponseEntity<GenerationResponse> index(@RequestBody GenerationRequest generationRequest) {
        Point pointFrom = generationRequest.getParameters().getFrom();
        String from = getName(pointFrom);
        Point pointTo = generationRequest.getParameters().getEnd();
        String to = getName(pointTo);
        String type = generationRequest.getParameters().getTransportType();
        List<GeneratedPath> paths = getPaths(pointFrom, pointTo, type);
//        int time = generationRequest.getParameters().getTime();

        long length = 0L;
        if (paths.size() == 1) {
            length = getLength(paths.get(0));
        }

        return ResponseEntity.ok(new GenerationResponse(paths, from, to, length));
    }

    public String getName(Point point) {
        if (point.getLng() == null || point.getLat() == null) return "wroong";
        List<Double> nodes = nodeRepository.getNodesByLonLat(point.getLng(), point.getLat());
        String name;
        for (Double node : nodes) {
            name = nodeRepository.getNodesStreetName(node);
            if (!Objects.equals(name, "")) return name;
        }
        return String.format("x=%.5f, y=%.5f", point.getLng(), point.getLat());
    }

    private List<GeneratedPath> getPaths(Point pointFrom, Point pointTo, String type) {
        return nodeRepository.generatePaths(pointFrom, pointTo, type);
    }

    public Long getLength(GeneratedPath path) {
        List<Node> nodes = path.getPoints();
        if (nodes.isEmpty()) return 0L;
        StringBuilder sql = new StringBuilder("SRID=4326;LINESTRING(");
        for (Node node : nodes) {
            sql.append(node.getLon());
            sql.append(" ");
            sql.append(node.getLat());
            sql.append(",");
        }
        sql.deleteCharAt(sql.length() - 1);
        sql.append(")");
        return nodeRepository.getPathLength(sql.toString());
    }

    @CrossOrigin
    @PostMapping("/streetName")
    public ResponseEntity<Node> getNodeByStreetName(@RequestBody String name) {
        Node res = nodeRepository.getNodeByStreetName(name);
        return ResponseEntity.ok(res);
    }

    @CrossOrigin
    @PostMapping("/pointName")
    public ResponseEntity<String> getNodeByPoint(@RequestBody Point point) {
        return ResponseEntity.ok(getName(point));
    }
}
