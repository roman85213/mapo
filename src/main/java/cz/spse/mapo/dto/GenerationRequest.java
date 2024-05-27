package cz.spse.mapo.dto;

import cz.spse.mapo.model.RequestParameters;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerationRequest {
    RequestParameters parameters;
}
