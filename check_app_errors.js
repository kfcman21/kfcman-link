const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');

const jsPath = path.join(__dirname, 'public', 'js', 'app.js');
const code = fs.readFileSync(jsPath, 'utf8');

// Parse the code into an AST
console.log("Parsing app.js AST...");
const ast = acorn.parse(code, { ecmaVersion: 2020, sourceType: 'script' });

const declaredGlobals = new Set([
  'window', 'document', 'console', 'localStorage', 'sessionStorage',
  'fetch', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
  'navigator', 'location', 'history', 'URLSearchParams', 'Math', 'Date',
  'parseInt', 'parseFloat', 'isNaN', 'confirm', 'alert', 'encodeURIComponent',
  'Event', 'Promise', 'Image', 'Audio', 'lucide', 'QRious', 'bootstrap', 'Swiper',
  'Object', 'Array', 'JSON', 'String', 'Number', 'RegExp', 'Boolean', 'Error'
]);

const undeclaredGlobals = new Set();

walk.ancestor(ast, {
  Identifier(node, ancestors) {
    const name = node.name;
    const parent = ancestors[ancestors.length - 2];
    if (parent && parent.type === 'MemberExpression' && parent.property === node && !parent.computed) {
      return;
    }
    if (parent && parent.type === 'Property' && parent.key === node && !parent.shorthand) {
      return;
    }
    if (parent && parent.type === 'MethodDefinition' && parent.key === node) {
      return;
    }

    let isDeclared = false;
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const scopeNode = ancestors[i];
      if (scopeNode.type === 'VariableDeclarator' && scopeNode.id.name === name) {
        isDeclared = true;
        break;
      }
      if (scopeNode._declared && scopeNode._declared.has(name)) {
        isDeclared = true;
        break;
      }
    }

    if (!isDeclared && !declaredGlobals.has(name)) {
      undeclaredGlobals.add(name);
    }
  },
  
  VariableDeclarator(node, ancestors) {
    const scope = findScope(ancestors);
    if (scope) {
      scope._declared = scope._declared || new Set();
      if (node.id.type === 'Identifier') {
        scope._declared.add(node.id.name);
      } else if (node.id.type === 'ObjectPattern') {
        node.id.properties.forEach(prop => {
          if (prop.value && prop.value.type === 'Identifier') {
            scope._declared.add(prop.value.name);
          }
        });
      } else if (node.id.type === 'ArrayPattern') {
        node.id.elements.forEach(el => {
          if (el && el.type === 'Identifier') {
            scope._declared.add(el.name);
          }
        });
      }
    }
  },
  
  FunctionDeclaration(node, ancestors) {
    const scope = findScope(ancestors);
    if (scope && node.id) {
      scope._declared = scope._declared || new Set();
      scope._declared.add(node.id.name);
    }
    
    node._declared = node._declared || new Set();
    node.params.forEach(param => {
      if (param.type === 'Identifier') {
        node._declared.add(param.name);
      } else if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') {
        node._declared.add(param.left.name);
      }
    });
  },

  FunctionExpression(node, ancestors) {
    node._declared = node._declared || new Set();
    node.params.forEach(param => {
      if (param.type === 'Identifier') {
        node._declared.add(param.name);
      } else if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') {
        node._declared.add(param.left.name);
      }
    });
  },

  ArrowFunctionExpression(node, ancestors) {
    node._declared = node._declared || new Set();
    node.params.forEach(param => {
      if (param.type === 'Identifier') {
        node._declared.add(param.name);
      } else if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') {
        node._declared.add(param.left.name);
      }
    });
  }
});

function findScope(ancestors) {
  for (let i = ancestors.length - 2; i >= 0; i--) {
    const type = ancestors[i].type;
    if (type === 'FunctionDeclaration' || type === 'FunctionExpression' || type === 'ArrowFunctionExpression' || type === 'Program' || type === 'BlockStatement') {
      return ancestors[i];
    }
  }
  return null;
}

console.log("\n--- Undeclared Global Variable References in app.js ---");
if (undeclaredGlobals.size === 0) {
  console.log("None! All variables are properly declared.");
} else {
  undeclaredGlobals.forEach(name => {
    const lines = code.split('\n');
    const occurrences = [];
    lines.forEach((line, idx) => {
      if (new RegExp(`[^a-zA-Z0-9_]${name}[^a-zA-Z0-9_]`).test(line)) {
        occurrences.push(`Line ${idx + 1}: ${line.trim()}`);
      }
    });
    console.log(`\nVariable: "${name}" (${occurrences.length} occurrences)`);
    occurrences.slice(0, 3).forEach(occ => console.log(`  ${occ}`));
    if (occurrences.length > 3) console.log(`  ... and ${occurrences.length - 3} more`);
  });
}
