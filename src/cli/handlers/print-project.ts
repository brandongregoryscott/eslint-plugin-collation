import { Project } from "ts-morph";
import { Logger } from "../../utils/logger";

const printProject = (project: Project) => {
    Logger.info("Compiler options:").json(project.compilerOptions);

    Logger.info("Source files:").json(
        project.getSourceFiles().map((file) => file.getFilePath())
    );
};

export { printProject };
