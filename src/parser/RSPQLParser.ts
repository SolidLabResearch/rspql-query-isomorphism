
import { Prefix, RSPQLQuery, SelectExpression, WindowSource, WherePattern } from "./Types";

export class RSPQLParser {
    parseAST(query: string): RSPQLQuery {
        const prefixRegex = /PREFIX\s+(\w+):\s+<([^>]+)>/g;
        const registerRegex = /REGISTER\s+RStream\s+<([^>]+)>/;
        const selectRegex = /SELECT\s+\(([^)]+)\s+AS\s+(\?\w+)\)/;
        const fromRegex = /FROM\s+NAMED\s+WINDOW\s+:(\w+)\s+ON\s+STREAM\s+<([^>]+)>\s+\[RANGE\s+(\d+)\s+STEP\s+(\d+)\]/g;
        const whereRegex = /WINDOW\s+:(\w+)\s+{([^}]+)}/g;

        let match;

        // Extract PREFIXes
        const prefixes: Prefix[] = [];
        while ((match = prefixRegex.exec(query)) !== null) {
            prefixes.push({ prefix: match[1], uri: match[2] });
        }

        // Extract REGISTER stream name
        const registerStreamMatch = query.match(registerRegex);
        const registerStream = registerStreamMatch ? registerStreamMatch[1] : "";

        // Extract SELECT expression
        const selectMatch = query.match(selectRegex);
        const select: SelectExpression = selectMatch
            ? { expression: selectMatch[1], alias: selectMatch[2] }
            : { expression: "", alias: "" };

        // Extract FROM NAMED WINDOW clauses
        const fromNamedWindows: WindowSource[] = [];
        while ((match = fromRegex.exec(query)) !== null) {
            fromNamedWindows.push({
                windowName: match[1],
                stream: match[2],
                range: parseInt(match[3], 10),
                step: parseInt(match[4], 10),
            });
        }

        // Extract WHERE clause patterns
        const whereClauses: WherePattern[] = [];
        while ((match = whereRegex.exec(query)) !== null) {
            const windowName = match[1];
            const patterns = match[2].trim().split("\n").map((s) => s.trim());
            whereClauses.push({ window: windowName, patterns });
        }

        return {
            prefixes,
            registerStream,
            select,
            fromNamedWindows,
            whereClauses,
        };
    }
    parseToSMT(ast: RSPQLQuery): string {
        let smt = "";

        smt += `; SMT representation of RSP-QL query\n`;

        smt += `; DECLARING VARIABLES\n`;
        smt += `(declare-const ${ast.select.alias} Real) ; SELECT alias\n`;

        const variableSet = new Set<string>();
        const predicateSet = new Set<string>();

        ast.whereClauses.forEach(where => {
            where.patterns.forEach(pattern => {
                const variables = pattern.match(/\?(\w+)/g);
                if (variables) {
                    variables.forEach(v => variableSet.add(v.replace("?", "")));
                }

                const predicates = pattern.match(/(\w+:\w+)/g);
                if (predicates) {
                    predicates.forEach(p => predicateSet.add(p.replace(":", "_")));
                }
            });
        });

        variableSet.forEach(variable => {
            smt += `(declare-const ${variable} Real) ; Query variable\n`;
        });

        ast.fromNamedWindows.forEach(window => {
            smt += `(declare-const ${window.windowName} (Array Int Real)) ; Stream: ${window.stream}\n`;
        });

        smt += `\n; DECLARING FUNCTIONS\n`;
        predicateSet.forEach(predicate => {
            smt += `(declare-fun ${predicate} (Real Real) Bool)\n`;
        });

        smt += `\n; ASSERTIONS\n`;
        ast.whereClauses.forEach(where => {
            smt += `; WINDOW ${where.window}\n`;
            where.patterns.forEach(pattern => {
                let formattedPattern = pattern
                    .replace(/\?/g, "")
                    .replace(/\s*\.\s*$/, "");

                predicateSet.forEach(predicate => {
                    const predRegex = new RegExp(`(\w+)\s+${predicate}\s+(\S+)`, "g");
                    formattedPattern = formattedPattern.replace(predRegex, `(${predicate} $1 $2)`);
                });

                smt += `(assert ${formattedPattern})\n`;
            });
        });

        smt += `\n; CONSTRAINTS\n`;
        smt += `(declare-const result Real) ; Computed result\n`;
        smt += `(assert (= result (sqrt (+ ${Array.from(variableSet).map(v => `(* ${v} ${v})`).join(" ")}))))\n`;

        return smt;
    }
}


// Example usage
const query = `PREFIX saref: <https://saref.etsi.org/core/>
    PREFIX func: <http://extension.org/functions#>
    PREFIX dahccsensors: <https://dahcc.idlab.ugent.be/Homelab/SensorsAndActuators/>
    PREFIX : <https://rsp.js/>
    REGISTER RStream <output> AS
    SELECT (func:sqrt(?o * ?o + ?o2 * ?o2 + ?o3 * ?o3) AS ?activityIndex)
    FROM NAMED WINDOW :w1 ON STREAM <e> [RANGE 60000 STEP 20000]
    FROM NAMED WINDOW :w2 ON STREAM <f> [RANGE 60000 STEP 20000]
    FROM NAMED WINDOW :w3 ON STREAM <g> [RANGE 60000 STEP 20000]
    WHERE {
        WINDOW :w1 {
            ?s saref:hasValue ?o .
            ?s saref:relatesToProperty dahccsensors:wearable.acceleration.x .
        }
        WINDOW :w2 {
            ?s saref:hasValue ?o2 .
            ?s saref:relatesToProperty dahccsensors:wearable.acceleration.x .
        }
        WINDOW :w3 {
            ?s saref:hasValue ?o3 .
            ?s saref:relatesToProperty dahccsensors:wearable.acceleration.x .
        }
    }`;


// Example usage
const parser = new RSPQLParser();
// console.log(parser.parseAST(query));
console.log(parser.parseToSMT(parser.parseAST(query)));





