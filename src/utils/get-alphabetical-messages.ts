import { RuleViolation } from "../models/rule-violation";

interface GetHintOptions<TElement, TElementStructure = TElement> {
    index: number;
    expectedIndex: number;
    parentName: string;
    elementName: string;
    original: TElement[];
    sorted: TElementStructure[];
    getElementName: (element: TElement) => string;
    getElementStructureName: (elementStructure: TElementStructure) => string;
}

const getAlphabeticalMessages = <TElement, TElementStructure = TElement>(
    options: GetHintOptions<TElement, TElementStructure>
): Pick<RuleViolation, "hint" | "message"> => {
    const {
        index,
        expectedIndex,
        parentName,
        elementName,
        original,
        sorted,
        getElementName,
        getElementStructureName,
    } = options;

    const propertyName = getElementName(original[index]);
    const propertyMovedToLastPosition = expectedIndex + 1 === sorted.length;
    const relativePropertyName = getElementStructureName(
        sorted[
            propertyMovedToLastPosition ? expectedIndex - 1 : expectedIndex + 1
        ]
    );
    const relativePosition = propertyMovedToLastPosition ? "after" : "before";
    const hint = `'${propertyName}' should appear alphabetically ${relativePosition} '${relativePropertyName}'.`;
    const message = `Expected ${elementName} '${propertyName}' in '${parentName}' (index ${index}) to be at index ${expectedIndex}.`;

    return { hint, message };
};

export { getAlphabeticalMessages };
