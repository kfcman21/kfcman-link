const fs = require('fs');
const path = require('path');

const filesToEdit = [
  'public/wall.html',
  'public/docs.html'
];

filesToEdit.forEach(file => {
  const absolutePath = path.resolve(file);
  if (!fs.existsSync(absolutePath)) {
    console.warn(`File ${file} does not exist.`);
    return;
  }
  let content = fs.readFileSync(absolutePath, 'utf8');

  // Check if tetris styles are already present
  if (content.includes('.active#nav-item-tetris-side')) {
    console.log(`${file} already has active styles for tetris.`);
    return;
  }

  // Replace active styles list
  content = content.replace(
    '.active#nav-item-docs-side {',
    '.active#nav-item-docs-side,\n    .active#nav-item-tetris-side {'
  );

  content = content.replace(
    '.dark .active#nav-item-docs-side {',
    '.dark .active#nav-item-docs-side,\n    .dark .active#nav-item-tetris-side {'
  );

  content = content.replace(
    '#left-sidebar:not(.collapsed) .active#nav-item-docs-side {',
    '#left-sidebar:not(.collapsed) .active#nav-item-docs-side,\n    #left-sidebar:not(.collapsed) .active#nav-item-tetris-side {'
  );

  content = content.replace(
    '.dark #left-sidebar:not(.collapsed) .active#nav-item-docs-side {',
    '.dark #left-sidebar:not(.collapsed) .active#nav-item-docs-side,\n    .dark #left-sidebar:not(.collapsed) .active#nav-item-tetris-side {'
  );

  content = content.replace(
    '.active#nav-item-docs-side i {',
    '.active#nav-item-docs-side i,\n    .active#nav-item-tetris-side i, .active#nav-item-tetris-side svg {'
  );

  // Fallback for docs.html might use different tags or spacing
  content = content.replace(
    '.active#nav-item-docs-side i,\n    .active#nav-item-docs-side svg {',
    '.active#nav-item-docs-side i,\n    .active#nav-item-docs-side svg,\n    .active#nav-item-tetris-side i,\n    .active#nav-item-tetris-side svg {'
  );

  fs.writeFileSync(absolutePath, content, 'utf8');
  console.log(`Successfully added active style classes to ${file}`);
});
