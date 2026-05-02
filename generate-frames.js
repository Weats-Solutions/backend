const fs = require('fs');
const path = require('path');
const framesDir = path.join(process.cwd(), 'libs/common/src/qr/frames');
let output = 'export const FRAME_SVGS: Record<number, string> = {\n';
for (let i = 1; i <= 10; i++) {
  const file = path.join(framesDir, `frame-${i}.svg`);
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    output += `  ${i}: \`${content}\`,\n`;
  }
}
output += '};\n';
fs.writeFileSync(path.join(process.cwd(), 'libs/common/src/qr/frame-svgs.ts'), output);
console.log('done');
