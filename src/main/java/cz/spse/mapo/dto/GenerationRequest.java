package cz.spse.mapo.dto;

import cz.spse.mapo.model.Point;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Value;

import java.awt.*;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerationRequest {
    Point from;
    Point end;
    String time;
    String transportType;
}
