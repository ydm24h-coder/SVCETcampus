const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const pty = require('node-pty');

module.exports = function setupExecutionService(io) {
  io.on('connection', (socket) => {
    let activeProcess = null;
    let isPty = false;

    socket.on('run-code', async ({ language, code }) => {
      if (activeProcess) {
        if (isPty) {
          activeProcess.kill();
        } else {
          activeProcess.kill();
        }
        activeProcess = null;
        isPty = false;
      }

      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

      const filename = `main_${socket.id.replace(/[^a-zA-Z0-9]/g, '')}`;
      
      try {
        let exeCommand = '';
        let exeArgs = [];

        if (language === 'python') {
          const filePath = path.join(tempDir, `${filename}.py`);
          fs.writeFileSync(filePath, code);
          exeCommand = os.platform() === 'win32' ? 'python' : 'python3';
          exeArgs = ['-u', filePath];
        } 
        else if (language === 'cpp' || language === 'c') {
            const ext = language === 'cpp' ? 'cpp' : 'c';
            const compiler = language === 'cpp' ? 'g++' : 'gcc';
            const filePath = path.join(tempDir, `${filename}.${ext}`);
            const outPath = path.join(tempDir, `${filename}.exe`);
            fs.writeFileSync(filePath, code);
            
            socket.emit('output', `Compiling ${ext} file...\r\n`);
            const compile = spawn(compiler, [filePath, '-o', outPath]);
            
            await new Promise((resolve, reject) => {
                compile.stderr.on('data', data => socket.emit('output', data.toString().replace(/\n/g, '\r\n')));
                compile.on('close', code => {
                    if (code !== 0) reject(new Error('Compilation failed'));
                    else resolve();
                });
            });

            exeCommand = outPath;
            exeArgs = [];
        } 
        else if (language === 'java') {
            const dirPath = path.join(tempDir, `java_${filename}`);
            if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath);
            const filePath = path.join(dirPath, `Main.java`);
            fs.writeFileSync(filePath, code);
            
            socket.emit('output', `Compiling Java file...\r\n`);
            const compile = spawn('javac', [filePath]);
            
            await new Promise((resolve, reject) => {
                compile.stderr.on('data', data => socket.emit('output', data.toString().replace(/\n/g, '\r\n')));
                compile.on('close', code => {
                    if (code !== 0) reject(new Error('Compilation failed'));
                    else resolve();
                });
            });

            exeCommand = 'java';
            exeArgs = ['-cp', dirPath, 'Main'];
        }

        if (exeCommand) {
            activeProcess = pty.spawn(exeCommand, exeArgs, {
                name: 'xterm-color',
                cols: 80,
                rows: 24,
                cwd: tempDir,
                env: process.env,
                useConpty: false // Fallback to winpty to avoid AttachConsole failed error
            });
            isPty = true;

            let outputBuffer = '';
            let flushTimeout = null;

            const flushOutput = () => {
                if (outputBuffer.length > 0) {
                    socket.emit('output', outputBuffer);
                    outputBuffer = '';
                }
                flushTimeout = null;
            };

            activeProcess.on('data', (data) => {
                outputBuffer += data;
                if (!flushTimeout) {
                    flushTimeout = setTimeout(flushOutput, 16); // ~60fps
                }
                // Hard limit to prevent memory ballooning
                if (outputBuffer.length > 8192) {
                    clearTimeout(flushTimeout);
                    flushOutput();
                }
            });

            // pty.js uses 'exit' rather than 'close'
            activeProcess.on('exit', (code) => {
                if (flushTimeout) clearTimeout(flushTimeout);
                flushOutput();
                socket.emit('output', `\r\n[Process exited with code ${code}]\r\n`);
                activeProcess = null;
                isPty = false;
                socket.emit('process-exit', code);
            });
        }
      } catch (err) {
         socket.emit('output', `\r\n[Error: ${err.message}]\r\n`);
         socket.emit('process-exit', 1);
         activeProcess = null;
         isPty = false;
      }
    });

    socket.on('input', (data) => {
        if (activeProcess) {
            if (isPty) {
                activeProcess.write(data);
            } else if (activeProcess.stdin) {
                if (data === '\r') data = '\n';
                activeProcess.stdin.write(data);
            }
        }
    });
    
    socket.on('stop-code', () => {
        if (activeProcess) {
            activeProcess.kill();
            socket.emit('output', '\r\n[Process forcefully terminated by user]\r\n');
            activeProcess = null;
            isPty = false;
            socket.emit('process-exit', -1);
        }
    });

    socket.on('disconnect', () => {
        if (activeProcess) {
            activeProcess.kill();
            activeProcess = null;
            isPty = false;
        }
    });
  });
};
