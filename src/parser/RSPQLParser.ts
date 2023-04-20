import { ParsedQuery } from "./ParsedQuery";

let r2s: Map<string, string> = new Map<string, string>();
let s2r: Array<string> = new Array<string>();

export function parse(rspql_query: string): ParsedQuery {
    let parsed = new ParsedQuery();
    let split = rspql_query.split(/\r?\n/);
    let sparqlLines = new Array<string>();
    let prefixMapper = new Map<string, string>();
    split.forEach((line) => {
        let trimmed_line = line.trim();
        if (trimmed_line.startsWith("REGISTER")) {
            const regexp = /REGISTER +([^ ]+) +<([^>]+)> AS/g;
            const matches = trimmed_line.matchAll(regexp);
            for (const match of matches) {
                if (match[1] === "RStream" || match[1] === "DStream" || match[1] === "IStream") {
                    parsed.set_r2s({ operator: match[1], name: match[2] });
                }
            }
        }
        else if (trimmed_line.startsWith("FROM NAMED WINDOW")) {
            const regexp = /FROM +NAMED +WINDOW +([^ ]+) +ON +STREAM +([^ ]+) +\[RANGE +([^ ]+) +STEP +([^ ]+)\]/g;
            const matches = trimmed_line.matchAll(regexp);
            for (const match of matches) {
                parsed.add_s2r({
                    window_name: unwrap(match[1], prefixMapper),
                    stream_name: unwrap(match[2], prefixMapper),
                    width: Number(match[3]),
                    slide: Number(match[4])
                });
            }
        } else {
            let sparqlLine = trimmed_line;
            if (sparqlLine.startsWith("WINDOW")) {
                sparqlLine = sparqlLine.replace("WINDOW", "GRAPH");
            }
            if (sparqlLine.startsWith("PREFIX")) {
                const regexp = /PREFIX +([^:]*): +<([^>]+)>/g;
                const matches = trimmed_line.matchAll(regexp);
                for (const match of matches) {
                    prefixMapper.set(match[1], match[2]);
                }
            }
            sparqlLines.push(sparqlLine);
        }
    });
    parsed.sparql = sparqlLines.join("\n");
    return parsed;
}

function unwrap(prefixedIRI: string, prefixMapper: Map<string, string>) {
    if (prefixedIRI.trim().startsWith("<")) {
        return prefixedIRI.trim().slice(1, -1);
    }
    let split = prefixedIRI.trim().split(":");
    let iri = split[0];
    if (prefixMapper.has(iri)) {
        return prefixMapper.get(iri) + split[1];
    }
    else {
        return "";
    }
}