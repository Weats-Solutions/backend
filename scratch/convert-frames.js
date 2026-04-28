const fs = require('fs');
const path = require('path');

const framesDir = path.resolve(__dirname, '..', 'libs', 'common', 'src', 'qr', 'frames');

for (let i = 1; i <= 10; i++) {
  const filePath = path.join(framesDir, `frame-${i}.svg`);
  let svg = fs.readFileSync(filePath, 'utf-8');

  // 1. Handle <text> elements: replace fill and content
  // Match <text ... fill="..." ...>Scan me!</text>
  svg = svg.replace(
    /(<text\s[^>]*?)fill="[^"]*"([^>]*>)Scan me!(<\/text>)/g,
    '$1fill="{{TEXT_COLOR}}"$2{{FRAME_TEXT}}$3'
  );

  // 2. Replace accent color fills (#595959)
  svg = svg.replace(/fill="#595959"/g, 'fill="{{ACCENT_COLOR}}"');

  // 3. Replace primary color fills (#000000, black)
  svg = svg.replace(/fill="#000000"/g, 'fill="{{FRAME_COLOR}}"');
  svg = svg.replace(/fill="black"/g, 'fill="{{FRAME_COLOR}}"');

  // 4. Also handle #ffffff fills on non-text elements (some frames have white rect fills)
  // We DON'T replace these since they're background elements, not frame color

  // 5. Update font-family
  svg = svg.replace(/font-family="sans-serif"/g, 'font-family="Arial, Helvetica, sans-serif"');

  fs.writeFileSync(filePath, svg, 'utf-8');
  console.log(`✅ frame-${i}.svg converted`);
}

console.log('\nDone! All frames converted to placeholders.');
