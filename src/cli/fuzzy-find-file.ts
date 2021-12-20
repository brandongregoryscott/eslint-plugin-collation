import { filter } from "fuzzaldrin";
import { Project } from "ts-morph";
import { flatMap, sumBy } from "lodash";

const fuzzyFindFile = (query: string, project: Project) => {
    const fileNames = project
        .getSourceFiles()
        .map((file) => file.getBaseName());

    if (!query.includes("-")) {
        return filter(fileNames, query, { maxResults: 10 });
    }

    // When query contains dashes, it's likely a multi-part file name that we could try to
    // do some better matching/scoring on than what fuzzaldrin gives us out of the box.
    // i.e. instrument-setings-dialog.tsx will match instrument-settings-dialog.tsx vs. nothing at
    // all in above implementation
    const queryParts = query.split("-");
    return flatMap(queryParts, (part) =>
        filter(fileNames, part, { maxResults: 5 })
    ).sort((a, b) => {
        const sumMatchingParts = (match: string) =>
            sumBy(queryParts, (part) => (match.includes(part) ? 1 : 0));
        return sumMatchingParts(b) - sumMatchingParts(a);
    });
};

export { fuzzyFindFile };
