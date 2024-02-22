import { ParsedQuery } from "./ParsedQuery";
const { Parser: SparqlParser } = require('sparqljs');
const sparql_parser = new SparqlParser();

/**
 * Parses the RSP-QL query and returns the parsed query object.
 * @param {string} rspql_query - The RSP-QL query to be parsed.
 * @returns {ParsedQuery} - The parsed query object.
 */
export function parse(rspql_query: string): ParsedQuery {
    const parsed = new ParsedQuery();
    const split = rspql_query.split(/\r?\n/);
    const sparqlLines = new Array<string>();
    const prefixMapper = new Map<string, string>();
    split.forEach((line) => {
        const trimmed_line = line.trim();
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
    parse_sparql_query(parsed.sparql, parsed);
    return parsed;
}

/**
 * Unwraps the prefixed IRI to the full IRI.
 * @param {string} prefixedIRI - The prefixed IRI to be unwrapped.
 * @param {Map<string, string>} prefixMapper - The prefix mapper.
 * @returns {string} - The unwrapped IRI.
 */
export function unwrap(prefixedIRI: string, prefixMapper: Map<string, string>) {
    if (prefixedIRI.trim().startsWith("<")) {
        return prefixedIRI.trim().slice(1, -1);
    }
    const split = prefixedIRI.trim().split(":");
    const iri = split[0];
    if (prefixMapper.has(iri)) {
        return prefixMapper.get(iri) + split[1];
    }
    else {
        return "";
    }
}

/**
 * Parses the SPARQL query and adds the parsed information to the parsed query object.
 * @param {string} sparqlQuery - The SPARQL query to be parsed.
 * @param {ParsedQuery} parsed - The parsed query object.
 */
export function parse_sparql_query(sparqlQuery: string, parsed: ParsedQuery) {
    const parsed_sparql_query = sparql_parser.parse(sparqlQuery);
    const prefixes = parsed_sparql_query.prefixes;
    Object.keys(prefixes).forEach((key) => {
        parsed.prefixes.set(key, prefixes[key]);
    });
    for (let i = 0; i <= parsed_sparql_query.variables.length; i++) {
        if (parsed_sparql_query.variables[i] !== undefined) {
            parsed.projection_variables.push(parsed_sparql_query.variables[i].variable.value);
            parsed.aggregation_function = parsed_sparql_query.variables[i].expression.aggregation;
        }
    }
}
