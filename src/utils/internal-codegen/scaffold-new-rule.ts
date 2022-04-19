import {
    Project,
    PropertyAssignment,
    StructureKind,
    SyntaxKind,
} from "ts-morph";
import { sortBy, kebabCase, startCase, toLower, camelCase } from "lodash";
import { Logger } from "../logger";
import { alphabetizeEnums } from "../../rules/alphabetize-enums";
import * as tags from "common-tags";

const scaffoldNewRule = async (project: Project, name: string) => {
    name = kebabCase(name);

    addRuleFunction(project, name);
    addRuleFunctionTest(project, name);
    addEnum(project, name);
    addToRuleMap(project, name);

    await project.save();
};

const addEnum = async (project: Project, name: string) => {
    const ruleNameEnumFile = project.getSourceFileOrThrow("rule-name.ts");
    const _enum = ruleNameEnumFile?.getFirstDescendantByKindOrThrow(
        SyntaxKind.EnumDeclaration
    );

    _enum.addMember({
        name: kebabToSentenceCase(name),
        value: name,
    });

    await alphabetizeEnums(ruleNameEnumFile);

    Logger.info(`Adding enum member to ${ruleNameEnumFile.getBaseName()}`);
};

const addRuleFunction = (project: Project, name: string) => {
    const functionName = getFunctionName(name);
    const file = project.createSourceFile(
        `src/rules/${name}.ts`,
        tags.stripIndent`
            const ${functionName}: RuleFunction = async (
                file: SourceFile
            ): Promise<RuleResult> => {
                const originalFileContent = file.getText();
                const errors = stub();
                const endingFileContent = file.getText();

                return {
                    errors,
                    diff: diffLines(originalFileContent, endingFileContent),
                    file,
                };
            };

            ${functionName}._name = ${getFullyQualifiedEnumValue(name)};

            const stub = (): RuleViolation[] => {
                return [];
            }
        `
    );

    file.addImportDeclarations([
        { namedImports: ["diffLines"], moduleSpecifier: "diff" },
        { namedImports: ["RuleName"], moduleSpecifier: "../enums/rule-name" },
        {
            namedImports: ["RuleResult"],
            moduleSpecifier: "../interfaces/rule-result",
        },
        {
            namedImports: ["RuleViolation"],
            moduleSpecifier: "../models/rule-violation",
        },
        {
            namedImports: ["RuleFunction"],
            moduleSpecifier: "../types/rule-function",
        },
        { namedImports: ["Logger"], moduleSpecifier: "../utils/logger" },
        { namedImports: ["SourceFile"], moduleSpecifier: "ts-morph" },
    ]);

    file.addExportDeclaration({ namedExports: [functionName] });

    Logger.info(
        `Creating stub function ${functionName} in ${file.getBaseName()}`
    );
};

const addRuleFunctionTest = (project: Project, name: string) => {
    const functionName = getFunctionName(name);
    const file = project.createSourceFile(
        `src/rules/${name}.test.ts`,
        tags.stripIndent`
            describe("${functionName}", () => {
                it("should return errors", async () => {
                    // Arrange
                    const input = createSourceFile(\`\`);

                    const expected = createSourceFile(\`\`);

                    // Act
                    const result = await ${functionName}(input);

                    // Assert
                    expect(result).toHaveErrors();
                    expect(result).toMatchSourceFile(expected);
                });
            });
        `
    );

    file.addImportDeclarations([
        { namedImports: [functionName], moduleSpecifier: `./${name}` },
        {
            namedImports: ["createSourceFile"],
            moduleSpecifier: `../test/test-utils`,
        },
    ]);

    Logger.info(
        `Creating stub test file for ${functionName} in ${file.getBaseName()}`
    );
};

const addToRuleMap = (project: Project, name: string) => {
    const ruleMapFile = project.getSourceFileOrThrow("rule-map.ts");

    const objectLiteral = ruleMapFile.getFirstDescendantByKindOrThrow(
        SyntaxKind.ObjectLiteralExpression
    );

    objectLiteral.addProperty({
        name: `[${getFullyQualifiedEnumValue(name)}]`,
        initializer: getFunctionName(name),
        kind: StructureKind.PropertyAssignment,
    });

    const propertyAssignments =
        objectLiteral.getProperties() as PropertyAssignment[];

    const propertyStructures = sortBy(
        propertyAssignments.map((property) => property.getStructure()),
        (property) => property.name
    );

    propertyAssignments.forEach((property) => property.remove());

    objectLiteral.addProperties(propertyStructures);

    ruleMapFile.addImportDeclaration({
        namedImports: [getFunctionName(name)],
        moduleSpecifier: `../rules/${name}`,
    });

    Logger.info(
        `Adding enum to function mapping in ${ruleMapFile?.getBaseName()}`
    );
};

const getFullyQualifiedEnumValue = (name: string): string =>
    `RuleName.${kebabToSentenceCase(name)}`;

const getFunctionName = (name: string): string =>
    camelCase(kebabToSentenceCase(name));

const kebabToSentenceCase = (name: string): string =>
    startCase(toLower(name)).replace(/ /gi, "");

export { scaffoldNewRule };
