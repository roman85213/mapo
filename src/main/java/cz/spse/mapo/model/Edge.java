package cz.spse.mapo.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class Edge {
    Node start;
    Node end;
}
