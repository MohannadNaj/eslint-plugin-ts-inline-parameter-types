import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (_) =>
    `https://github.com/MohannadNaj/eslint-plugin-ts-inline-parameter-types/blob/main/README.md#rule-prefer-inline-type-parameters`,
);

export default createRule({
  name: "prefer-inline-type-parameters",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer inline TypeScript types in function parameters instead of separate type definitions",
    },
    messages: {
      preferInlineType:
        'Type "{{typeName}}" is only used once. Consider inlining it in the function parameters.',
    },
    schema: [],
    fixable: "code",
  },
  defaultOptions: [],
  create(context) {
    const typeUsageCount = new Map();
    const typeDefinitions = new Map();
    const typeReferences = new Map();

    return {
      TSTypeAliasDeclaration(node) {
        const typeName = node.id.name;

        if (node.typeParameters) {
          return;
        }

        typeDefinitions.set(typeName, node);
        if (!typeUsageCount.has(typeName)) {
          typeUsageCount.set(typeName, 0);
        }
      },

      TSInterfaceDeclaration(node) {
        const typeName = node.id.name;

        if (node.typeParameters) {
          return;
        }

        typeDefinitions.set(typeName, node);
        if (!typeUsageCount.has(typeName)) {
          typeUsageCount.set(typeName, 0);
        }
      },

      TSTypeReference(node) {
        if (node.typeName?.type === "Identifier") {
          const typeName = node.typeName.name;
          const currentCount = typeUsageCount.get(typeName) || 0;
          typeUsageCount.set(typeName, currentCount + 1);

          if (!typeReferences.has(typeName)) {
            typeReferences.set(typeName, []);
          }
          typeReferences.get(typeName).push(node);
        }
      },

      "Program:exit"() {
        for (const [typeName, count] of typeUsageCount.entries()) {
          const typeDefNode = typeDefinitions.get(typeName);
          if (!typeDefNode) continue;

          if (count !== 1) continue;

          if (isExported(typeDefNode)) continue;

          const references = typeReferences.get(typeName);
          if (!references || references.length !== 1) continue;

          const reference = references[0];

          const inFuncParam = isInFunctionParameter(reference);
          if (!inFuncParam) continue;

          context.report({
            node: typeDefNode,
            messageId: "preferInlineType",
            data: { typeName },
            fix(fixer) {
              const sourceCode = context.sourceCode || context.getSourceCode();
              const programNode = sourceCode.ast;
              const typeDefStatement = getTopLevelStatement(
                typeDefNode,
                programNode,
              );
              const typeBody = getTypeBody(typeDefNode, sourceCode);

              if (!typeBody) return null;

              const typeReferenceNode = reference.parent;
              if (
                !typeReferenceNode ||
                typeReferenceNode.type !== "TSTypeAnnotation"
              ) {
                return null;
              }

              const text = sourceCode.getText();
              let endPos = typeDefStatement.range[1];

              if (endPos < text.length && text[endPos] === "\n") {
                endPos++;
              } else if (endPos < text.length && text[endPos] === "\r") {
                endPos++;
                if (endPos < text.length && text[endPos] === "\n") {
                  endPos++;
                }
              }

              const fixes = [
                fixer.removeRange([typeDefStatement.range[0], endPos]),
                fixer.replaceText(typeReferenceNode.typeAnnotation, typeBody),
              ];

              return fixes;
            },
          });
        }
      },
    };
  },
});

function isInFunctionParameter(node) {
  let current = node;
  while (current) {
    if (current.type === "TSTypeAnnotation") {
      const parent = current.parent;

      if (parent?.type === "ObjectPattern" || parent?.type === "ArrayPattern") {
        let ancestor = parent.parent;
        while (ancestor) {
          if (
            ancestor.type === "FunctionDeclaration" ||
            ancestor.type === "FunctionExpression" ||
            ancestor.type === "ArrowFunctionExpression"
          ) {
            return ancestor.params && ancestor.params.includes(parent);
          }
          if (ancestor.type === "VariableDeclarator") {
            const init = ancestor.init;
            if (
              init?.type === "FunctionExpression" ||
              init?.type === "ArrowFunctionExpression"
            ) {
              return init.params && init.params.includes(parent);
            }
          }
          ancestor = ancestor.parent;
        }
      }

      if (parent?.type === "Identifier") {
        let ancestor = parent.parent;
        while (ancestor) {
          if (
            ancestor.type === "FunctionDeclaration" ||
            ancestor.type === "FunctionExpression" ||
            ancestor.type === "ArrowFunctionExpression"
          ) {
            return ancestor.params && ancestor.params.some((p) => p === parent);
          }
          if (ancestor.type === "VariableDeclarator") {
            const init = ancestor.init;
            if (
              init?.type === "FunctionExpression" ||
              init?.type === "ArrowFunctionExpression"
            ) {
              return init.params && init.params.some((p) => p === parent);
            }
          }
          ancestor = ancestor.parent;
        }
      }
    }
    current = current.parent;
  }
  return false;
}

function isExported(node) {
  return (
    node.parent?.type === "ExportNamedDeclaration" ||
    node.parent?.type === "ExportDefaultDeclaration"
  );
}

function getTopLevelStatement(node, programNode) {
  let current = node;
  while (current.parent && current.parent !== programNode) {
    current = current.parent;
  }
  return current;
}

function getTypeBody(typeDefNode, sourceCode) {
  if (typeDefNode.type === "TSTypeAliasDeclaration") {
    return sourceCode.getText(typeDefNode.typeAnnotation);
  }

  if (typeDefNode.type === "TSInterfaceDeclaration") {
    return sourceCode.getText(typeDefNode.body);
  }

  return null;
}
