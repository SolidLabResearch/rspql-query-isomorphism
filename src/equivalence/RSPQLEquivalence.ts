import {ParsedQuery} from "../parser/ParsedQuery";
import {parse} from "../parser/RSPQLParser";
import {DataFactory, Quad} from "rdf-data-factory";
const factory = new DataFactory();
import {isomorphic} from "rdf-isomorphic";

const sparqlParser = require('sparqljs').Parser;
const SPARQLParser = new sparqlParser();

/**
 * Check if two RSP-QL queries are equivalent to each other.
 * @param {string} query_one - The first RSP-QL query.
 * @param {string} query_two - The second RSP-QL query.
 * @returns {boolean} - True, if the queries are equivalent and False if they are not.
 */
export function is_equivalent(query_one: string, query_two: string): boolean {
    const query_one_parsed = parse(query_one);
    const query_two_parsed = parse(query_two);
    if (check_projection_variables(query_one_parsed.projection_variables, query_two_parsed.projection_variables)) {
        if (check_if_stream_parameters_are_equal(query_one_parsed, query_two_parsed) && check_if_window_name_are_equal(query_one_parsed, query_two_parsed)) {
            const query_one_bgp = generate_bgp_quads_from_query(query_one_parsed.sparql);
            const query_two_bgp = generate_bgp_quads_from_query(query_two_parsed.sparql);
            return check_if_queries_are_isomorphic(query_one_bgp, query_two_bgp);
        }
    }
    return false;
}

/**
 * Check if the stream parameters are equal in between two queries.
 * @param {ParsedQuery} query_one_parsed - The parsed object representation of the first query.
 * @param {ParsedQuery} query_two_parsed - The parsed object representation of the second query.
 * @returns {boolean} - True, if they are equal and False if they are not.
 */
function check_if_stream_parameters_are_equal(query_one_parsed: ParsedQuery, query_two_parsed: ParsedQuery) {
    return (query_one_parsed.s2r[0].stream_name === query_two_parsed.s2r[0].stream_name && query_one_parsed.s2r[0].width === query_two_parsed.s2r[0].width && query_one_parsed.s2r[0].slide === query_two_parsed.s2r[0].slide);
}

/**
 * Check if the names of the window are equal in between two queries.
 * @param {ParsedQuery} query_one_parsed - The parsed object representation of the first query.
 * @param {ParsedQuery} query_two_parsed - The parsed object representation of the second query.
 * @returns {boolean} - True, if they are equal and False if they are not.
 */
function check_if_window_name_are_equal(query_one_parsed: ParsedQuery, query_two_parsed: ParsedQuery) {
    return (query_one_parsed.s2r[0].window_name === query_two_parsed.s2r[0].window_name);
}

/**
 * Generate Basic Graph Pattern Quad Array from the Query.
 * @param {string} query - The query to be parsed and generated BGP from.
 * @returns {Quad[]} - The Basic Graph Pattern Quad Array.
 */
export function generate_bgp_quads_from_query(query: string) {
    const sparql_parsed = SPARQLParser.parse(query);
    const basic_graph_pattern = sparql_parsed.where[0].patterns[0].triples;
    return convert_to_graph(basic_graph_pattern);
}

/**
 * Converts the basic graph pattern to a graph i.e a Quad Array.
 * @param {any} basic_graph_pattern - Basic Graph Patterns extracted from a SPARQL Query.
 * @returns {Quad[]} - Quad Array generated from the Basic Graph Patterns.
 */
export function convert_to_graph(basic_graph_pattern: any) {
    const graph: Quad[] = [];
    for (let i = 0; i < basic_graph_pattern.length; i++) {
        let subject = basic_graph_pattern[i].subject;
        let predicate = basic_graph_pattern[i].predicate;
        let object = basic_graph_pattern[i].object;
        if (subject.termType === 'Variable') {
            subject = factory.blankNode(subject.value);
        }
        if (object.termType === 'Variable') {
            object = factory.blankNode(object.value);
        }
        if (predicate.termType === 'Variable') {
            predicate = factory.blankNode(predicate.value);
        }
        const quad = new DataFactory().quad(subject, predicate, object);
        graph.push(quad);
    }
    return graph;
}

/**
 * Checks if the projection variables of the two queries are equal.
 * @param {Array<string>} query_one_projection_variables - The projection variables of the first query.
 * @param {Array<string>} query_two_projection_variables - The projection variables of the second query.
 * @returns {boolean} - True if the projection variables are equal, false otherwise.
 */
function check_projection_variables(query_one_projection_variables: Array<string>, query_two_projection_variables: Array<string>) {
    for (let i = 0; i < query_one_projection_variables.length; i++) {
        return query_two_projection_variables.includes(query_one_projection_variables[i]);
    }
}

/**
 * Uses the isomorphic function from the rdf-isomorphic package to check if two quads arrays are isomorphic.
 * @param {Quad[]} query_one - The first Quad Array to be checked.
 * @param {Quad[]}query_two - The second Quad Array to be checked.
 * @returns {boolean} - True if the two Quad Arrays are isomorphic, false otherwise.
 */
function check_if_queries_are_isomorphic(query_one: Quad[], query_two: Quad[]) {
    return isomorphic(query_one, query_two);
}
