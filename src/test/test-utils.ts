import { uniqueId } from "lodash";
import { Project, ProjectOptions, SourceFile } from "ts-morph";
import * as tags from "common-tags";

interface CreateSourceFileOptions {
    /**
     * File extension of the `SourceFile`.
     * @default .tsx
     */
    extension?: string;
    /**
     * `Project` to create the `SourceFile` in. If not provided, a new one will be created.
     */
    project?: Project;
}

const createInMemoryProject = (
    options?: Exclude<ProjectOptions, "useInMemoryFileSystem">
): Project => new Project({ useInMemoryFileSystem: true, ...(options ?? {}) });

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

export { createInMemoryProject, createSourceFile, CreateSourceFileOptions };
