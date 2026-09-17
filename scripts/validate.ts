/**
 * CLI-Gate: führt die Schema- und Policy-Prüfungen aus §13.1/§13.2 gegen den
 * Seed-Datensatz aus und beendet mit Exit-Code 1, sobald ein Verstoß vorliegt.
 */
import { seedDataset } from "../src/data/seed.js";
import { formatViolations, validateSchema, validatePolicies } from "../src/policy/validate.js";

const schema = validateSchema(seedDataset);
const policy = validatePolicies(seedDataset);

console.log("§13.1 Schema-Tests:");
console.log(formatViolations(schema));
console.log("\n§13.2 Policy-Tests:");
console.log(formatViolations(policy));

const total = schema.length + policy.length;
console.log(`\n${total} Verstoß/Verstöße.`);
process.exit(total === 0 ? 0 : 1);
