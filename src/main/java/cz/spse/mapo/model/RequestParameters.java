package cz.spse.mapo.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @AllArgsConstructor @NoArgsConstructor
public class RequestParameters {
    Point from, end;
//    String time;
    String transportType;
}
