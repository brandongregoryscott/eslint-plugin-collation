import chalk from "chalk";
import { compact, flatMap, isEmpty } from "lodash";
import { Context } from "../../models/context";
import { Logger } from "../../utils/logger";
import { ruleRunner } from "../../utils/rule-runner";

const runByFiles = async () => {
    const { cliOptions, project } = Context;
    const { files: filePaths } = cliOptions;

    if (
        (filePaths != null && !Array.isArray(filePaths)) ||
        isEmpty(filePaths)
    ) {
        Logger.warn(
            `${chalk.bold(
                "--files"
            )} specified without any file names or paths.`
        );
        process.exit(0);
    }

    const files = compact(
        flatMap(filePaths, (filePath) => project.getSourceFile(filePath))
    );

    if (files.length !== filePaths?.length) {
        const missingFiles = compact(
            flatMap(filePaths, (filePath) =>
                project.getSourceFile(filePath) != null ? undefined : filePath
            )
        );
        Logger.warn(
            "Some of the specified files could not be found in the project."
        ).json(missingFiles);
    }

    await ruleRunner(files);
    await Context.saveIfNotDryRun();
    process.exit(0);
};

export { runByFiles };
