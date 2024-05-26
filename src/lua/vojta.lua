local pois = osm2pgsql.define_table({
    name = 'pois',
    ids = { type = 'any', type_column = 'type', id_column = 'id' },
    columns = {
        { column = 'geom', type = 'point', not_null = true },
        { column = 'tags', type = 'jsonb', not_null = true },
        { column = 'tags_brand' },
        { column = 'tags_brand_wikidata' },
        { column = 'tags_name' },
        { column = 'tags_operator' },
        { column = 'tags_ref' },
        -- lookup cache
        { column = 'class', not_null = true },
        { column = 'subclass', not_null = true },
}})
 
function process_poi(object, geom)
    local a = {
        geom = geom,
        tags = object.tags,
        tags_brand = object.tags.brand,
        tags_brand_wikidata = object.tags['brand:wikidata'],
        tags_name = object.tags.name,
        tags_operator = object.tags.operator,
        tags_ref = object.tags.ref
    }
 
    if object.tags.amenity then
        a.class = 'amenity'
        a.subclass = object.tags.amenity
    elseif object.tags.shop then
        a.class = 'shop'
        a.subclass = object.tags.shop
    else
        return
    end
 
    pois:insert(a)
end
 
AMENITY_BLACKLIST = {"parking", "parking_space", "bench", "waste_basket", "bicycle_parking"};
 
local function has_value (tab, val)
    for value in pairs(tab) do
        if value == val then
            return true
        end
    end
 
    return false
end
 
function osm2pgsql.process_node(object)
    if ((object.tags.amenity and not has_value(AMENITY_BLACKLIST, object.tags.amenity)) or object.tags.shop) then
        process_poi(object, object:as_point())
    end
end
 
function osm2pgsql.process_way(object)
    if object.tags.building and ((object.tags.amenity and not has_value(AMENITY_BLACKLIST, object.tags.amenity)) or object.tags.shop) then
        process_poi(object, object:as_polygon():centroid())
    end
end