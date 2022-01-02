import { uniqueId } from "lodash";
import { Project, SourceFile } from "ts-morph";

const createInMemoryProject = (): Project =>
    new Project({ useInMemoryFileSystem: true });

const createSourceFile = (content: string): SourceFile =>
    createInMemoryProject().createSourceFile(
        `${uniqueId("source-file")}.ts`,
        content
    );

export { createInMemoryProject, createSourceFile };
