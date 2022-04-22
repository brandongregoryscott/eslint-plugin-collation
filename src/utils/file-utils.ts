import { isEmpty } from "lodash";
import { Project, SourceFile } from "ts-morph";
import { RuleResult } from "../interfaces/rule-result";
import { Logger } from "./logger";

const safelySafeChangesFromResult = async (
    result: RuleResult
): Promise<RuleResult> => {
    safelySaveChanges(result.file);
    return result;
};

const safelySaveChanges = async (fileOrProject: SourceFile | Project) => {
    if (isSourceFile(fileOrProject) && fileOrProject.isSaved()) {
        return;
    }

    const diagnostics = fileOrProject.getPreEmitDiagnostics();

    if (isEmpty(diagnostics)) {
        await fileOrProject.save();
        if (isSourceFile(fileOrProject)) {
            await fileOrProject.refreshFromFileSystem();
        }

        return;
    }

    const typeName = isSourceFile(fileOrProject)
        ? fileOrProject.getBaseName()
        : "project";

    Logger.error(
        `Found pre-emit diagnostics when attempting to save ${typeName}\n`,
        getProject(fileOrProject).formatDiagnosticsWithColorAndContext(
            diagnostics
        )
    );

    return;
};

const getProject = (fileOrProject: SourceFile | Project): Project =>
    isSourceFile(fileOrProject) ? fileOrProject.getProject() : fileOrProject;

const isSourceFile = (
    fileOrProject: SourceFile | Project
): fileOrProject is SourceFile => fileOrProject instanceof SourceFile;

export { safelySafeChangesFromResult, safelySaveChanges };
