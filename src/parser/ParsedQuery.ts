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

export class ParsedQuery {
    sparql: string;
    r2s: R2S;
    s2r: Array<WindowDefinition>;
    constructor() {
        this.sparql = "Select * WHERE{?s ?p ?o}";
        this.r2s = { operator: "RStream", name: "undefined" };
        this.s2r = new Array<WindowDefinition>();

    }
    set_r2s(r2s: R2S) {
        this.r2s = r2s;
    }
    add_s2r(s2r: WindowDefinition) {
        this.s2r.push(s2r);
    }
}