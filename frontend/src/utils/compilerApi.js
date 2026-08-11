const WANDBOX_API_URL = 'https://wandbox.org/api/compile.json';

export const executeCode = async (language, sourceCode, stdin = "") => {
  // Map our UI languages to Wandbox compiler names
  const compilerMap = {
    python: 'cpython-3.10.15',
    cpp: 'gcc-head',
    c: 'gcc-head-c',
    java: 'openjdk-jdk-22+36'
  };

  const compiler = compilerMap[language] || 'cpython-3.10.15';

  const payload = {
    compiler: compiler,
    code: sourceCode,
    stdin: stdin,
    save: false
  };

  try {
    const response = await fetch(WANDBOX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Execution Engine Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Standardize Wandbox response format to match what our UI expects
    // Wandbox returns status "0" for success, non-zero for error
    const isError = data.status !== "0";
    
    return {
      compile: {
        code: data.compiler_error ? 1 : 0,
        output: data.compiler_output || '',
        stderr: data.compiler_error || ''
      },
      run: {
        code: isError && !data.compiler_error ? 1 : 0,
        output: data.program_output || '',
        stderr: data.program_error || ''
      }
    };
  } catch (error) {
    console.error("Code Execution Error:", error);
    return {
      run: {
        output: '',
        stderr: error.message || 'Failed to connect to execution server.',
        code: -1
      }
    };
  }
};
