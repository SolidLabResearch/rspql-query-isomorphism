import { ParsedQuery } from "./parser/ParsedQuery";
import { parse } from "./parser/RSPQLParser";
import { DataFactory, Quad } from "rdf-data-factory";
import { BlankNode } from "n3";
import { isomorphic } from "rdf-isomorphic";
const sparqlParser = require('sparqljs').Parser;
const SPARQLParser = new sparqlParser();

export function is_equivalent(query_one: string, query_two: string): boolean {

    let query_one_parsed = parse(query_one);
    let query_two_parsed = parse(query_two);

    if (check_if_stream_parameters_are_equal(query_one_parsed, query_two_parsed) && check_if_window_name_are_equal(query_one_parsed, query_two_parsed)) {
        let query_one_bgp = generate_bgp_quads_from_query(query_one_parsed.sparql);
        let query_two_bgp = generate_bgp_quads_from_query(query_two_parsed.sparql);
        if (check_if_queries_are_isomorphic(query_one_bgp, query_two_bgp)) {
            return true;
        }
        else {
            return false;
        }
    }
    return false;
}

function check_if_stream_parameters_are_equal(query_one_parsed: ParsedQuery, query_two_parsed: ParsedQuery) {
    if (query_one_parsed.s2r[0].stream_name === query_two_parsed.s2r[0].stream_name && query_one_parsed.s2r[0].width === query_two_parsed.s2r[0].width && query_one_parsed.s2r[0].slide === query_two_parsed.s2r[0].slide) {
        return true;
    }
    else {
        return false;
    }
}

function check_if_window_name_are_equal(query_one_parsed: ParsedQuery, query_two_parsed: ParsedQuery) {
    if (query_one_parsed.s2r[0].window_name === query_two_parsed.s2r[0].window_name) {
        return true;
    }
    else {
        return false;
    }
}

function generate_bgp_quads_from_query(query: string) {
    let sparql_parsed = SPARQLParser.parse(query);
    let basic_graph_pattern = sparql_parsed.where[0].patterns[0].triples;
    let graph = convert_to_graph(basic_graph_pattern);
    return graph;
}

function convert_to_graph(basic_graph_pattern: any) {
    let graph: Quad[] = [];
    for (let i = 0; i < basic_graph_pattern.length; i++) {
        let subject = basic_graph_pattern[i].subject;
        let predicate = basic_graph_pattern[i].predicate;
        let object = basic_graph_pattern[i].object;
        if (subject.termType === 'Variable') {
            subject = new BlankNode(subject);
        }
        if (object.termType === 'Variable') {
            object = new BlankNode(object);
        }
        let quad = new DataFactory().quad(subject, predicate, object);
        graph.push(quad);
    }
    return graph;
}

function check_if_queries_are_isomorphic(query_one: Quad[], query_two: Quad[]) {
    return isomorphic(query_one, query_two);
}