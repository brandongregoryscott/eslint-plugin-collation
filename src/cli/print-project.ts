import { Project } from "ts-morph";
import shell from "shelljs";

const printProject = (project: Project) => {
    shell.echo("Compiler options:");
    shell.echo("-".repeat(80));
    shell.echo();
    shell.echo(JSON.stringify(project.compilerOptions, undefined, 4));

    shell.echo();
    shell.echo("-".repeat(80));
    shell.echo("Source files:");
    shell.echo("-".repeat(80));
    shell.echo();
    shell.echo(
        JSON.stringify(
            project.getSourceFiles().map((file) => file.getFilePath()),
            undefined,
            4
        )
    );
};

export { printProject };
