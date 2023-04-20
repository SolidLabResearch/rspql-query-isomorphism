# RSPQL Query Equivalence

This is a library to determine equivalence between two RSPQL queries.

## Usage
Install the library using npm : 
```
npm install rspql-query-equivalence
```
Then, import the library in your code : 
```
import { isEquivalent } from 'rspql-query-equivalence';

const query_one = `
    PREFIX : <https://rsp.js/>
    REGISTER RStream <output> AS
    SELECT (AVG(?v) as ?avgTemp)
    FROM NAMED WINDOW :w1 ON STREAM :stream1 [RANGE 10 STEP 2]
    WHERE{
        WINDOW :w1 { ?sensor :value ?v ; :measurement: ?m }
    }`;

const query_two = `
    PREFIX : <https://rsp.js/>
    REGISTER RStream <output> AS
    SELECT (AVG(?v) as ?avgTemp)
    FROM NAMED WINDOW :w1 ON STREAM :stream2 [RANGE 10 STEP 2]
    WHERE{
        WINDOW :w1 { ?sensor :value ?v ; :measurement: ?m }
    }`;

const result = isEquivalent(query_one, query_two); // result = false
```


## License
MIT License. Copyright (c) Kushagra Singh Bisen 2023. All rights reserved. 