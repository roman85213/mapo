use std::collections::{BTreeMap, HashMap};
use std::env;
use osmpbf::{ElementReader, Element};
use postgres::{Client, NoTls};

struct MyNode {
    id: i64,
    lat: f64,
    lon: f64,
    tags: HashMap<String, String>
}

const WHITELIST: [&str; 10] = ["residential", "crossing", "service", "footway", "cycleway", "primary", "secondary", "track", "tertiary", "motorway"];

fn main() {
    let mut client = Client::connect(env::var("CONNECTION").unwrap().as_str(), NoTls).unwrap();

    let file_path = env::var("FILEPATH").unwrap().as_str();

    let node_reader = ElementReader::from_path(file_path).expect("Failed to reopen PBF file");
    let mut nodes= BTreeMap::new();
    node_reader.for_each(|element| {
        let Element::DenseNode(node) = element else { return; };
        let my_node = MyNode {id: node.id, lat: node.lat(), lon: node.lon(), tags: node.tags().map(|(k, v)| (k.to_string(), v.to_string())).collect()};
        nodes.insert(my_node.id, my_node);
    }).unwrap();
    
    let reader = ElementReader::from_path(file_path).expect("Failed to open PBF file");
    
    reader.for_each(|element| {
        let Element::Way(way) = element else { return; };
        let Some((_, highway_value)) =  way.tags().find(|(tag, _)| *tag == "highway") else {
            return;
        };
        if !WHITELIST.contains(&highway_value) { return; };
        let node_ids: Vec<i64> = way.refs().collect();

        let tags_way: HashMap<String, Option<String>> = way
            .tags()
            .map(|(k, v)| (k.to_string(), Some(v.to_string())))
            .collect();

        let way_nodes = node_ids.iter().map(|id| nodes.get(id)).collect::<Option<Vec<_>>>();
        // let way_nodes = nodes.iter().filter(|node| node_ids.contains(&node.id)).collect::<Vec<_>>();
        
        let Some(way_nodes) = way_nodes else { return; };

        for way_node in &way_nodes {
            let tags = way_node.tags.iter()
                .map(|(k, v)| (k.clone(), Some(v.clone())))
                .collect::<HashMap<_, _>>();
            client.execute(
                "INSERT INTO nodes (id, geom, tags) VALUES ($1, st_point($2, $3), $4) ON CONFLICT (id) DO NOTHING",
                &[&way_node.id, &way_node.lon, &way_node.lat, &tags]
            ).unwrap();
        }

        for (first, second) in way_nodes.iter().zip(way_nodes.iter().skip(1)) {
            client.execute(
                "INSERT INTO edges (tags, source, target) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
                &[&tags_way.clone(), &first.id, &second.id]
            ).unwrap();
        }

    }).expect("Failed to process ways");
}

