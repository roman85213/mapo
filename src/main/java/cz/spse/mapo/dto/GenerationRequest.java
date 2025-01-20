package cz.spse.mapo.dto;

import cz.spse.mapo.model.RequestParameters;
import lombok.Data;
import lombok.Value;

import java.awt.*;
import java.util.Map;

@Data
public class GenerationRequest {
    RequestParameters parameters;
}
