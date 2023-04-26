# RSPQL Query Equivalence

This is a library to determine equivalence between two RSPQL queries.

## Usage
Install the library using npm : 
```
npm install rspql-query-equivalence
```
Then, import the library in your code : 
```
import { is_equivalent } from 'rspql-query-equivalence';

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

const result = is_equivalent(query_one, query_two); // result = false
```
## License
This code is copyrighted by [Ghent University - imec](https://www.ugent.be/ea/idlab/en) and released under the [MIT Licence](./LICENCE)
