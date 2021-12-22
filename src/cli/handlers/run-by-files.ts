import chalk from "chalk";
import { compact, flatMap, flatten, isEmpty } from "lodash";
import { Context } from "../../models/context";
import { alphabetizeInterfaces } from "../../rules/alphabetize-interfaces";
import { alphabetizeJsxProps } from "../../rules/alphabetize-jsx-props";
import { Logger } from "../../utils/logger";
import { printRuleResults } from "../../utils/print-rule-results";

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

    const results = await Promise.all(
        flatten(
            files.map((file) => [
                alphabetizeInterfaces(file),
                alphabetizeJsxProps(file),
            ])
        )
    );

    printRuleResults(results);

    await Context.saveIfNotDryRun();
    process.exit(0);
};

export { runByFiles };
