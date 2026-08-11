const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

router.post('/batch', async (req, res) => {
    const { language, code, stdin } = req.body;
    
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    
    const filename = `batch_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    let activeProcess = null;
    let output = '';
    let errorOutput = '';
    let isTimeout = false;

    try {
        let cmd = '';
        let args = [];
        
        if (language === 'python') {
            const filePath = path.join(tempDir, `${filename}.py`);
            fs.writeFileSync(filePath, code);
            cmd = 'python';
            args = ['-u', filePath];
        } 
        else if (language === 'cpp' || language === 'c') {
            const ext = language === 'cpp' ? 'cpp' : 'c';
            const compiler = language === 'cpp' ? 'g++' : 'gcc';
            const filePath = path.join(tempDir, `${filename}.${ext}`);
            const outPath = path.join(tempDir, `${filename}.exe`);
            fs.writeFileSync(filePath, code);
            
            const compileResult = await new Promise((resolve) => {
                const compile = spawn(compiler, [filePath, '-o', outPath]);
                let compileErr = '';
                compile.stderr.on('data', data => compileErr += data.toString());
                compile.on('close', code => resolve({ code, compileErr }));
            });
            
            if (compileResult.code !== 0) {
                return res.json({ 
                    compile: { output: compileResult.compileErr },
                    run: { output: '', code: 1 }
                });
            }
            cmd = outPath;
            args = [];
        } 
        else if (language === 'java') {
            const dirPath = path.join(tempDir, `java_${filename}`);
            if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath);
            const filePath = path.join(dirPath, `Main.java`);
            fs.writeFileSync(filePath, code);
            
            const compileResult = await new Promise((resolve) => {
                const compile = spawn('javac', [filePath]);
                let compileErr = '';
                compile.stderr.on('data', data => compileErr += data.toString());
                compile.on('close', code => resolve({ code, compileErr }));
            });
            
            if (compileResult.code !== 0) {
                return res.json({ 
                    compile: { output: compileResult.compileErr },
                    run: { output: '', code: 1 }
                });
            }
            cmd = 'java';
            args = ['-cp', dirPath, 'Main'];
        }

        activeProcess = spawn(cmd, args);
        
        const timeout = setTimeout(() => {
            isTimeout = true;
            if (activeProcess) {
                activeProcess.kill();
            }
        }, 5000); // 5 seconds timeout

        if (stdin) {
            activeProcess.stdin.write(stdin);
            activeProcess.stdin.end(); // close stdin to simulate EOF
        } else {
            activeProcess.stdin.end();
        }

        activeProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        activeProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        activeProcess.on('close', (code) => {
            clearTimeout(timeout);
            if (isTimeout) {
                return res.json({
                    compile: { output: '' },
                    run: { output: 'Time Limit Exceeded (5s)', code: 1 }
                });
            }
            res.json({
                compile: { output: '' },
                run: { output: (output + errorOutput).trim(), code: code === 0 ? 0 : 1 }
            });
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
