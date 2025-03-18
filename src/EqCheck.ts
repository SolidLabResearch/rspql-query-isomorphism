import * as z3 from "z3-solver";

async function checkEquivalence(smt1: string, smt2: string): Promise<boolean> {
    const { init } = require('z3-solver');
    const { Context } = await init();
    const { Solver, Int, And } = new Context('main');
    const solver = new Solver();
    const ctx = new Context('main');

     // Declare two integer variables
     const x = ctx.Int.const("x");
     const y = ctx.Int.const("y");
 
     // Define two equivalent assertions
     const expr1 = x.add(y).eq(ctx.Int.val(10)); // x + y = 10
     const expr2 = y.add(x).eq(ctx.Int.val(10)); // y + x = 10
 
     // Negate the equivalence to check if they are different
     solver.add(ctx.Not(expr1.eq(expr2)));
 
    
    const result = await solver.check();
    
    return result === "unsat"; // If unsat, the queries are equivalent
}

// Example usage
const smtQuery1 = "(assert (= x y))";
const smtQuery2 = "(assert (= x y))";

checkEquivalence(smtQuery1, smtQuery2)
    .then((isEquivalent) => console.log("Equivalent:", isEquivalent))
    .catch(console.error);
