import { uniqueId } from "lodash";
import { Project, SourceFile } from "ts-morph";
import * as tags from "common-tags";

const createInMemoryProject = (): Project =>
    new Project({ useInMemoryFileSystem: true });

const createSourceFile = (content: string): SourceFile =>
    createInMemoryProject().createSourceFile(
        // Always use .tsx to support JSX whether or not fixture requires it
        `${uniqueId("source-file")}.tsx`,
        tags.stripIndent(content)
    );

export { createInMemoryProject, createSourceFile };
