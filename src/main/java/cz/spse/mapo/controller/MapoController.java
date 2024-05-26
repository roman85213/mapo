package cz.spse.mapo.controller;

import cz.spse.mapo.dto.GeneratedPath;
import cz.spse.mapo.dto.GenerationRequest;
import cz.spse.mapo.dto.GenerationResponse;
import cz.spse.mapo.model.Node;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


import java.util.List;
import java.util.Map;

@Controller
public class MapoController {
    @CrossOrigin
    @PostMapping("/")
    public ResponseEntity<GenerationResponse> index(@RequestBody GenerationRequest generationRequest) {
        System.out.println(generationRequest);
        GeneratedPath gp = new GeneratedPath(List.of(new Node(50.04272, 15.80979), new Node(50.04310, 15.80923), new Node(50.04466, 15.80713), new Node(50.04513,15.80789)));
        GeneratedPath gp1 = new GeneratedPath(List.of(new Node(50.04402,15.80753), new Node(50.04442,15.80824), new Node(50.04393,15.80905)));
        return ResponseEntity.ok(new GenerationResponse(List.of(gp, gp1)));
    }
}
