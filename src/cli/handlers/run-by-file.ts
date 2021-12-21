import { isEmpty } from "lodash";
import { alphabetizeInterfaces } from "rules/alphabetize-interfaces";
import { alphabetizeJsxProps } from "rules/alphabetize-jsx-props";
import { Project } from "ts-morph";
import { fuzzyFindFile } from "utils/fuzzy-find-file";
import { Logger } from "utils/logger";

const runByFile = async (project: Project, filePath: string) => {
    const file = project.getSourceFile(filePath);
    if (file == null) {
        const similarResults = fuzzyFindFile(filePath, project);
        const notFoundError = `File ${filePath} not found in project.`;
        if (isEmpty(similarResults)) {
            Logger.error(notFoundError);
            process.exit(1);
        }

        Logger.error(`${notFoundError} Did you mean one of these?`).json(
            similarResults
        );
        process.exit(1);
    }

    if (file != null) {
        alphabetizeInterfaces(file);
        alphabetizeJsxProps(file);
    }

    await project.save();
    process.exit(0);
};

export { runByFile };
