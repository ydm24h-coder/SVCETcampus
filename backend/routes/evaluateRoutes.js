const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { getTestCasesForProblem } = require('../../database/testCases');

router.post('/', async (req, res) => {
    const { problemId, language, code } = req.body;

    if (!problemId || !language || !code) {
        return res.status(400).json({ error: "problemId, language, and code are required." });
    }

    if (language !== 'python') {
        return res.status(400).json({ error: "Only python is supported initially." });
    }

    const testCases = getTestCasesForProblem(problemId);
    if (!testCases || testCases.length === 0) {
        return res.status(404).json({ error: "Test cases not found for problemId: " + problemId });
    }

    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const runId = `eval_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const solutionPath = path.join(tempDir, `${runId}_solution.py`);
    const runnerPath = path.join(tempDir, `${runId}_runner.py`);

    try {
        // Write the student's code to a file
        fs.writeFileSync(solutionPath, code);

        // Python runner script
        const runnerScript = `
import sys
import json
import time
import traceback
import importlib.util

def run_tests():
    input_data = sys.stdin.read()
    if not input_data:
        return
        
    try:
        data = json.loads(input_data)
        test_cases = data.get("testCases", [])
        code_path = data.get("codePath")
        
        spec = importlib.util.spec_from_file_location("solution", code_path)
        solution_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(solution_module)
        
        if not hasattr(solution_module, 'Solution'):
            print(json.dumps({"error": "Class 'Solution' not found in submitted code."}))
            return
            
        solution_instance = solution_module.Solution()
        
        methods = [m for m in dir(solution_instance) if not m.startswith('_')]
        if not methods:
            print(json.dumps({"error": "No public methods found in Solution class."}))
            return
            
        target_method_name = methods[0]
        target_method = getattr(solution_instance, target_method_name)
        
        results = []
        for tc in test_cases:
            tc_input = tc.get("input", {})
            tc_expected = tc.get("expectedOutput")
            tc_id = tc.get("testCase")
            
            args = list(tc_input.values())
            
            start_time = time.time()
            actual_output = None
            error_msg = None
            try:
                actual_output = target_method(*args)
            except Exception as e:
                error_msg = str(type(e).__name__) + ": " + str(e)
            end_time = time.time()
            
            runtime_ms = int((end_time - start_time) * 1000)
            
            if error_msg:
                status = "Runtime Error"
            else:
                if actual_output == tc_expected:
                    status = "PASS"
                else:
                    status = "FAIL"
                    
            results.append({
                "testCase": tc_id,
                "status": status,
                "expected": tc_expected,
                "actual": actual_output,
                "error": error_msg,
                "runtime": runtime_ms,
                "hidden": tc.get("hidden", False)
            })
            
        print(json.dumps({"results": results}))
        
    except SyntaxError as e:
        print(json.dumps({"error": "Syntax Error", "details": str(e)}))
    except Exception as e:
        print(json.dumps({"error": "Initialization Error", "details": traceback.format_exc()}))

if __name__ == "__main__":
    run_tests()
`;
        fs.writeFileSync(runnerPath, runnerScript);

        const pyProcess = spawn('python', ['-u', runnerPath]);
        
        let output = '';
        let errorOutput = '';
        let isTimeout = false;

        const timeout = setTimeout(() => {
            isTimeout = true;
            pyProcess.kill();
        }, 3000); // 3 seconds Time Limit

        // Pass test cases to runner via stdin
        pyProcess.stdin.write(JSON.stringify({ testCases, codePath: solutionPath }));
        pyProcess.stdin.end();

        pyProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pyProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pyProcess.on('close', (code) => {
            clearTimeout(timeout);
            
            // Clean up temporary files
            try {
                if (fs.existsSync(solutionPath)) fs.unlinkSync(solutionPath);
                if (fs.existsSync(runnerPath)) fs.unlinkSync(runnerPath);
            } catch (e) {
                console.error("Cleanup error:", e);
            }

            if (isTimeout) {
                return res.json({
                    status: "Time Limit Exceeded",
                    passed: 0,
                    total: testCases.length,
                    results: []
                });
            }

            if (errorOutput && !output) {
                return res.json({
                    status: "Runtime Error",
                    passed: 0,
                    total: testCases.length,
                    results: [],
                    details: errorOutput
                });
            }

            try {
                const parsedOutput = JSON.parse(output.trim());
                if (parsedOutput.error) {
                     return res.json({
                        status: parsedOutput.error,
                        passed: 0,
                        total: testCases.length,
                        results: [],
                        details: parsedOutput.details
                    });
                }

                const results = parsedOutput.results || [];
                let passedCount = 0;
                let globalStatus = "Accepted";

                const formattedResults = results.map(r => {
                    if (r.status === "PASS") passedCount++;
                    else if (globalStatus === "Accepted") {
                        globalStatus = r.status === "Runtime Error" ? "Runtime Error" : "Wrong Answer";
                    }

                    // Format hidden test case outputs
                    if (r.hidden) {
                        return {
                            testCase: r.testCase,
                            status: r.status
                        };
                    }
                    return r;
                });

                res.json({
                    status: globalStatus,
                    passed: passedCount,
                    total: testCases.length,
                    results: formattedResults
                });

            } catch (parseErr) {
                res.status(500).json({ error: "Failed to parse runner output", output: output, stderr: errorOutput });
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
