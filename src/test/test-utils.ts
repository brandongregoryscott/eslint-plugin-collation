import { uniqueId } from "lodash";
import { Project, SourceFile } from "ts-morph";
import * as tags from "common-tags";

export interface CreateSourceFileOptions {
    /**
     * File extension of the `SourceFile`.
     * @default .tsx
     */
    extension?: string;
    /**
     * `Project` to create the `SoruceFile` in. If not provided, a new one will be created.
     */
    project?: Project;
}

const createInMemoryProject = (): Project =>
    new Project({ useInMemoryFileSystem: true });

const createSourceFile = (
    content: string,
    options?: CreateSourceFileOptions
): SourceFile => {
    const { project = createInMemoryProject(), extension = ".tsx" } =
        options ?? {};

    return project.createSourceFile(
        `${uniqueId("source-file")}${extension}`,
        tags.stripIndent(content)
    );
};

export { createInMemoryProject, createSourceFile };
