package cz.spse.mapo.dto;

import lombok.Data;
import lombok.Value;

import java.awt.*;
import java.util.Map;

@Data
public class GenerationRequest {
    Object from;
    Object to;
    String time;
    String type;
}
