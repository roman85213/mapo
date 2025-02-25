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


import java.util.Date;
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
        List<GeneratedPath> paths = getPaths(pointFrom, pointTo);

        int speed = 4; //generationRequest.getParameters().getSpeed();
        long length = 0L;
        long time = 0L;
        if (paths.size() == 1) {
            length = getLength(paths.get(0));
            time = getTime(length, speed);
        }

//        GeneratedPath gp = new GeneratedPath(List.of(new Node(50.04272, 15.80979), new Node(50.04310, 15.80923), new Node(50.04466, 15.80713), new Node(50.04513,15.80789)));
//        GeneratedPath gp1 = new GeneratedPath(List.of(new Node(50.04402,15.80753), new Node(50.04442,15.80824), new Node(50.04393,15.80905)));
//        return ResponseEntity.ok(new GenerationResponse(List.of(gp), from, to));
        return ResponseEntity.ok(new GenerationResponse(paths, from, to, time, length));
    }

    public String getName(Point point) {
        List<Double> nodes = nodeRepository.getNodesByLonLat(point.getLng(), point.getLat());
        String name;
        for (Double node : nodes) {
            name = nodeRepository.getNodesStreetName(node);
            if (!Objects.equals(name, "")) return name;
        }
        return String.format("x=%.5f, y=%.5f", point.getLng(), point.getLat());
    }

    private List<GeneratedPath> getPaths(Point pointFrom, Point pointTo) {
        return nodeRepository.generatePaths(pointFrom, pointTo);
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

    private Long getTime(long length, int speed) {
        double km = (double)length / 1000;
        return (long) ((km / speed) * 60);
    }
}
