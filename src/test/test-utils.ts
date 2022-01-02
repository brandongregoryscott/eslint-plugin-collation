import { uniqueId } from "lodash";
import { Project, SourceFile } from "ts-morph";

const createInMemoryProject = (): Project =>
    new Project({ useInMemoryFileSystem: true });

const createSourceFile = (content: string): SourceFile =>
    createInMemoryProject().createSourceFile(
        // Always use .tsx to support JSX whether or not fixture requires it
        `${uniqueId("source-file")}.tsx`,
        content
    );

export { createInMemoryProject, createSourceFile };
