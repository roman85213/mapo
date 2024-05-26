local nodes = osm2pgsql.define_table({
    name = 'nodes',
    ids = { type = 'any', type_column = 'type', id_column = 'id' },
    columns = {
        { column = 'geom', type = 'point', not_null = true },
        { column = 'tags', type = 'jsonb', not_null = true }
    }
})
                            -- local ways = osm2pgsql.define_table({
                            --     name = 'ways',
                            --     ids = { type = 'any', type_column = 'type', id_column = 'id' },
                            --     columns = {
                            --         { column = 'geom', type = 'linestring', not_null = true },
                            --         { column = 'tags', type = 'jsonb', not_null = true }
                            --     }
                            -- })

local edges = osm2pgsql.define_table({
    name = 'edges',
    ids = { type = 'any', type_column = 'type', id_column = 'idw' },
    columns = {
        { column = 'id', sql_type = 'serial', create_only = true },
        { column = 'tags', type = 'jsonb', not_null = true },
        { column = 'n1', type = 'INT', not_null = true },
        { column = 'n2', type = 'INT', not_null = true },
    }
})
function process_nodes(object, geom)
    local n = {
        geom = geom,
        tags = object.tags
    }
    nodes:insert(n)
end

function process_ways(object)
    for index, value in ipairs(object.nodes) do
        if index > 1 then
            edges:insert({
                tags = object.tags,
                n1 = object.nodes[index - 1],
                n2 = object.nodes[index]
            })
        end
    end
end
 
WAY_BLACKLIST = {"motorway", "trunk"};
 
local function has_value (tab, val)
    for value in pairs(tab) do
        if value == val then
            return true
        end
    end
 
    return false
end
 
function osm2pgsql.process_node(object)
    if object then
        process_nodes(object, object:as_point())
    end
end
 
function osm2pgsql.process_way(object)
    if object.tags.highway and not has_value(WAY_BLACKLIST, object.tags.highway) then
        process_ways(object)
    end
end