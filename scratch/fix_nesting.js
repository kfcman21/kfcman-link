const fs = require('fs');

const htmlPath = 'public/index.html';
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Target the boundary between shortener-modal end and auth-modal start
// and insert a closing </div>.
const target = "  <!-- 1. Authentication Modal (Login/Register Tab Switcher) -->";
const insertion = "</div>\n\n";

if (htmlContent.includes(target)) {
  const index = htmlContent.indexOf(target);
  htmlContent = htmlContent.substring(0, index) + insertion + htmlContent.substring(index);
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log("Inserted closing </div> successfully.");
} else {
  console.error("Could not find the insertion target in index.html");
}
