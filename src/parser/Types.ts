export interface Prefix {
    prefix: string;
    uri: string;
}

export interface SelectExpression {
    expression: string;
    alias: string;
}

export interface WindowSource {
    windowName: string;
    stream: string;
    range: number;
    step: number;
}

export interface WherePattern {
    window: string;
    patterns: string[];
}

export interface RSPQLQuery {
    prefixes: Prefix[];
    registerStream: string;
    select: SelectExpression;
    fromNamedWindows: WindowSource[];
    whereClauses: WherePattern[];
}