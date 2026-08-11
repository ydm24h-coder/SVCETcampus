const fs = require('fs');
const path = require('path');

const templates = [
  {
    title: "Two Sum",
    difficulty: "Easy",
    problemStatement: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
    python: "def twoSum(nums, target):\n    # Write your code here\n    pass",
    cpp: "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n        return {};\n    }\n};",
    c: "#include <stdlib.h>\n\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    // Write your code here\n    *returnSize = 2;\n    return NULL;\n}",
    java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        return new int[]{};\n    }\n}"
  },
  {
    title: "Reverse Array",
    difficulty: "Easy",
    problemStatement: "Given an array of integers, reverse the array in-place without using extra memory.",
    python: "def reverseArray(arr):\n    # Write your code here\n    pass",
    cpp: "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    void reverseArray(vector<int>& arr) {\n        // Write your code here\n    }\n};",
    c: "void reverseArray(int* arr, int arrSize) {\n    // Write your code here\n}",
    java: "class Solution {\n    public void reverseArray(int[] arr) {\n        // Write your code here\n    }\n}"
  },
  {
    title: "Valid Palindrome",
    difficulty: "Easy",
    problemStatement: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.",
    python: "def isPalindrome(s):\n    # Write your code here\n    return False",
    cpp: "#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isPalindrome(string s) {\n        // Write your code here\n        return false;\n    }\n};",
    c: "#include <stdbool.h>\n\nbool isPalindrome(char* s) {\n    // Write your code here\n    return false;\n}",
    java: "class Solution {\n    public boolean isPalindrome(String s) {\n        // Write your code here\n        return false;\n    }\n}"
  }
];

const genericNames = [
    "Find Maximum Element", "Check Prime Number", "Fibonacci Sequence", "Merge Sorted Arrays", "Rotate Array",
    "Binary Search Implementation", "String Anagrams", "Count Vowels", "Matrix Transpose", "Find Missing Number",
    "Longest Substring", "Valid Parentheses", "Climbing Stairs", "Maximum Subarray", "Remove Duplicates",
    "Power of Two", "Intersection of Arrays", "Majority Element", "Reverse Linked List", "Cycle Detection"
];

const tasks = [];

// Seed the first few with specific detailed ones
templates.forEach((t, i) => {
    tasks.push({
        id: i + 1,
        title: t.title,
        difficulty: t.difficulty,
        problemStatement: t.problemStatement,
        starterCode: {
            python: t.python,
            cpp: t.cpp,
            c: t.c,
            java: t.java
        }
    });
});

// Generate the rest using generic algorithmic names
for(let i = templates.length; i < 100; i++) {
    const genericName = genericNames[i % genericNames.length];
    const modifier = Math.floor(i / genericNames.length) > 0 ? ` (Variant ${Math.floor(i / genericNames.length)})` : "";
    
    tasks.push({
        id: i + 1,
        title: `${genericName}${modifier}`,
        difficulty: i % 3 === 0 ? "Hard" : (i % 2 === 0 ? "Medium" : "Easy"),
        problemStatement: `Implement an efficient algorithm to solve the ${genericName} problem.\n\nEnsure your solution handles edge cases such as empty inputs or large constraints.`,
        starterCode: {
            python: `def solve_${i}(input_data):\n    # Write your Python solution here\n    pass`,
            cpp: `#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        // Write your C++ solution here\n    }\n};`,
            c: `#include <stdio.h>\n\nvoid solve() {\n    // Write your C solution here\n}`,
            java: `class Solution {\n    public void solve() {\n        // Write your Java solution here\n    }\n}`
        }
    });
}

const fileContent = `export const dailyTasks = ${JSON.stringify(tasks, null, 2)};\n`;
fs.writeFileSync('d:/clg-project/frontend/src/data/dailyTasks.js', fileContent);
console.log('dailyTasks.js generated successfully with 100 tasks.');
