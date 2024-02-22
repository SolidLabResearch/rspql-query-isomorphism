/**
 * ParsedQuery class.
 * @class ParsedQuery
 */
export class ParsedQuery {
    public prefixes: Map<string, string>;
    public aggregation_thing_in_context: Array<string>;
    public projection_variables: Array<string>;
    public aggregation_function: string;
    public sparql: string;
    public r2s: R2S;
    public s2r: Array<WindowDefinition>;
    /**
     * Constructor for the ParsedQuery class.
     */
    constructor() {
        this.sparql = "Select * WHERE{?s ?p ?o}";
        this.r2s = { operator: "RStream", name: "undefined" };
        this.s2r = new Array<WindowDefinition>();
        this.prefixes = new Map<string, string>();
        this.aggregation_thing_in_context = new Array<string>();
        this.projection_variables = new Array<string>();
        this.aggregation_function = "";
    }
    /**
     * Set the sparql string.
     * @param {string} sparql - The sparql string to be set.
     */
    set_sparql(sparql: string) {
        this.sparql = sparql;
    }
    /**
     * Set the r2s object.
     * @param {R2S} r2s - The r2s object to be set.
     */
    set_r2s(r2s: R2S) {
        this.r2s = r2s;
    }
    /**
     *  Add a prefix to the prefix map.
     * @param {WindowDefinition} s2r - The window definition to be added.
     */
    add_s2r(s2r: WindowDefinition) {
        this.s2r.push(s2r);
    }
}

export type WindowDefinition = {
    window_name: string,
    stream_name: string,
    width: number,
    slide: number
}
type R2S = {
    operator: "RStream" | "IStream" | "DStream",
    name: string
}
