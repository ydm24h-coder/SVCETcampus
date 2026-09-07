// database/testCases.js

// Mock repository for Test Cases based on problem ID
// In a real application, this would come from a PostgreSQL database.

const testCases = {
    // Problem 1: Two Sum
    1: [
        {
            testCase: 1,
            input: { nums: [2, 7, 11, 15], target: 9 },
            expectedOutput: [0, 1],
            hidden: false
        },
        {
            testCase: 2,
            input: { nums: [3, 2, 4], target: 6 },
            expectedOutput: [1, 2],
            hidden: false
        },
        {
            testCase: 3,
            input: { nums: [3, 3], target: 6 },
            expectedOutput: [0, 1],
            hidden: false
        },
        {
            testCase: 4,
            input: { nums: [-1, -2, -3, -4, -5], target: -8 },
            expectedOutput: [2, 4],
            hidden: true
        },
        {
            testCase: 5,
            input: { nums: [1000000000, 1000000000], target: 2000000000 },
            expectedOutput: [0, 1],
            hidden: true
        }
    ],
    // Problem 2: Reverse String
    2: [
        {
            testCase: 1,
            input: { s: ["h", "e", "l", "l", "o"] },
            expectedOutput: ["o", "l", "l", "e", "h"],
            hidden: false
        }
    ]
};

const getTestCasesForProblem = (problemId) => {
    return testCases[problemId] || [];
};

module.exports = {
    getTestCasesForProblem
};
