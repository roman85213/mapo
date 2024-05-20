package cz.spse.mapo.dto;

import cz.spse.mapo.model.Node;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class GeneratedPath {
    private List<Node> points;
}
