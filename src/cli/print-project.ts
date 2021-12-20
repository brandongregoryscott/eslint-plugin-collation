import { Project } from "ts-morph";

const printProject = (project: Project) => {
    console.log("Compiler options:");
    console.log("-".repeat(80));
    console.log();
    console.log(JSON.stringify(project.compilerOptions, undefined, 4));

    console.log();
    console.log("-".repeat(80));
    console.log("Source files:");
    console.log("-".repeat(80));
    console.log();
    console.log(
        JSON.stringify(
            project.getSourceFiles().map((file) => file.getFilePath()),
            undefined,
            4
        )
    );
};

export { printProject };
