package cz.spse.mapo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;
@Data
@AllArgsConstructor
public class GenerationResponse {
    private List<GeneratedPath> paths;
    private String from, to;
    private Long pathLength; // pathTime
}
