import chalk from "chalk";
import { compact, flatMap, isEmpty } from "lodash";
import { Context } from "../../models/context";
import { alphabetizeInterfaces } from "../../rules/alphabetize-interfaces";
import { alphabetizeJsxProps } from "../../rules/alphabetize-jsx-props";
import { Logger } from "../../utils/logger";

const runByFiles = async (context: Context) => {
    const { cliOptions, project } = context;
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

    files.forEach((file) => {
        alphabetizeInterfaces(file);
        alphabetizeJsxProps(file);
    });

    await context.saveIfNotDryRun();
    process.exit(0);
};

export { runByFiles };
