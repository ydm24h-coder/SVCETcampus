const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/student/PracticeTaskIDE.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove Socket.IO import
content = content.replace(/import { io } from 'socket\.io-client';\n/, '');

// 2. Remove XTerm imports
content = content.replace(/import { Terminal as XTerm } from '@xterm\/xterm';\nimport { FitAddon } from '@xterm\/addon-fit';\nimport '@xterm\/xterm\/css\/xterm\.css';\n/, '');

// 3. Remove Interactive Terminal State
content = content.replace(/\s*\/\/ Interactive Terminal State[\s\S]*?const fitAddonRef = useRef\(null\);\n/, '');

// 4. Remove Xterm UseEffects
content = content.replace(/\s*useEffect\(\(\) => {\n\s*\/\/ Initialize XTerm[\s\S]*?\}, \[isInteractiveRunning\]\);\n/, '');

// 5. Remove handlers
content = content.replace(/\s*const handleRunInteractive = \(\) => {[\s\S]*?if \(socket\) {\n\s*socket\.emit\('run-code', { language, code: codeContent }\);\n\s*}\n\s*};\n/, '');
content = content.replace(/\s*const handleClearTerminal = \(\) => {[\s\S]*?}\n\s*};\n/, '');

// 6. Remove Terminal Tab Button in renderTerminalPane
content = content.replace(/\s*<button\s*className={`px-4 py-2 text-xs font-medium flex items-center gap-2 transition-colors \${bottomTab === 'terminal' \?.*?<\/button>/s, '');

// 7. Remove Terminal Render Block
content = content.replace(/\s*\{bottomTab === 'terminal' && \([\s\S]*?<div className="h-full w-full bg-\[#0d0d0d\]" ref=\{terminalRef\} \/>[\s\S]*?\}\)/, '');

// 8. Remove Run Interactive and Clear Buttons from Header
content = content.replace(/\s*<Button\s*size="sm"\s*variant="ghost"\s*className={`h-8 rounded-md transition-colors text-xs font-medium px-2 md:px-4 \${isInteractiveRunning \?.*?<\/span>\n\s*<\/Button>/s, '');
content = content.replace(/\s*<Button\s*size="sm"\s*variant="ghost"\s*className="h-8 rounded-md transition-colors text-xs font-medium px-2 md:px-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-\[#2d2d2d\] dark:hover:bg-\[#3d3d3d\] dark:text-neutral-300"\s*onClick=\{handleClearTerminal\}[\s\S]*?<\/Button>/s, '');

// 9. Remove Mobile Terminal Button
content = content.replace(/\s*<button className={`relative flex-1 flex flex-col items-center justify-center h-12 rounded-xl transition-all duration-300 \${mobileTab === 'terminal'.*?<\/button>/s, '');

// 10. Replace setMobileTab('terminal') with setMobileTab('testcases')
content = content.replace(/mobileTab === 'terminal'/g, "mobileTab === 'testcases'");
content = content.replace(/setMobileTab\('terminal'\)/g, "setMobileTab('testcases')");
content = content.replace(/<span className="text-\[10px\] font-bold tracking-wide">Terminal<\/span>/g, '<span className="text-[10px] font-bold tracking-wide">Output</span>');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done stripping terminal');
