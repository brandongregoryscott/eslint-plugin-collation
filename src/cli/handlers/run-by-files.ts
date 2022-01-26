import chalk from "chalk";
import { compact, flatMap, isEmpty } from "lodash";
import { Context } from "../../models/context";
import { fuzzyFindFile } from "../../utils/fuzzy-find-file";
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
        );

        missingFiles.forEach((fileName) => {
            const potentialMatchingFiles = fuzzyFindFile(fileName, project);
            const baseMessage = `File ${chalk.magenta(fileName)} not found.`;
            if (isEmpty(potentialMatchingFiles)) {
                Logger.warn(baseMessage);
                return;
            }

            Logger.warn(
                `${baseMessage} Did you mean one of these?`,
                fuzzyFindFile(fileName, project)
            );
        });
    }

    await ruleRunner(files);
    await Context.saveIfNotDryRun();
    process.exit(0);
};

export { runByFiles };
