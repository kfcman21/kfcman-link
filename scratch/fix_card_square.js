const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('public/js/wall.js');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Update cardPadding to include min-h-0 and w-full
content = content.replace(
  "const cardPadding = isDefaultGrid ? 'p-3.5 rounded-2xl aspect-square overflow-hidden' : 'p-5 rounded-3xl';",
  "const cardPadding = isDefaultGrid ? 'p-3.5 rounded-2xl aspect-square overflow-hidden min-h-0 w-full' : 'p-5 rounded-3xl';"
);

// 2. Reduce image height in grid mode from h-20 to h-14, and change margin mb-3 to mb-1.5
content = content.replace(
  "const imgHeight = isDefaultGrid ? 'h-20' : 'h-32';\n        imgHTML = `<img src=\"${escapeHTML(card.image)}\" alt=\"card-img\" class=\"w-full ${imgHeight} object-cover rounded-xl border-2 border-slate-950/20 mb-3 shadow-sm hover:opacity-90 transition-opacity cursor-zoom-in\" onclick=\"event.stopPropagation(); openLightbox('${card.image}')\" onerror=\"this.remove()\">`;",
  "const imgHeight = isDefaultGrid ? 'h-14' : 'h-32';\n        const imgMargin = isDefaultGrid ? 'mb-1.5' : 'mb-3';\n        imgHTML = `<img src=\"${escapeHTML(card.image)}\" alt=\"card-img\" class=\"w-full ${imgHeight} object-cover rounded-xl border-2 border-slate-950/20 ${imgMargin} shadow-sm hover:opacity-90 transition-opacity cursor-zoom-in\" onclick=\"event.stopPropagation(); openLightbox('${card.image}')\" onerror=\"this.remove()\">`;"
);

// 3. Make line-clamp in grid mode line-clamp-2 for tighter spacing
content = content.replace(
  "class=\"${isDefaultGrid ? 'text-[9px] line-clamp-3 mb-2' : 'text-xs mb-4'}\"",
  "class=\"${isDefaultGrid ? 'text-[9px] line-clamp-2 mb-1.5' : 'text-xs mb-4'}\""
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully modified wall.js to enforce square card boundaries.');
