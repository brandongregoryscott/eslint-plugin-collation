import { Project } from "ts-morph";
import { Logger } from "./logger";

const printProject = (project: Project) => {
    Logger.divider()
        .info("Compiler options:")
        .divider()
        .newLine()
        .json(project.compilerOptions)
        .newLine();

    Logger.divider()
        .info("Source files:")
        .divider()
        .newLine()
        .json(project.getSourceFiles().map((file) => file.getFilePath()));
};

export { printProject };
