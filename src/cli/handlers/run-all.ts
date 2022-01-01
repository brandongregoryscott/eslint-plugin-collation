import { Context } from "../../models/context";
import { ruleRunner } from "../../utils/rule-runner";

const runAll = async () => {
    const { project } = Context;

    await ruleRunner(project.getSourceFiles());
    await Context.saveIfNotDryRun();
    process.exit(0);
};

export { runAll };
