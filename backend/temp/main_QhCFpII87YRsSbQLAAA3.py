class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        num_map = {}

        for i, num in enumerate(nums):
            complement = target - num

            if complement in num_map:
                return [num_map[complement], i]

            num_map[num] = i

        return []


# -----------------------------
# Test Cases
# -----------------------------
test_cases = [
    {
        "id": 1,
        "nums": [2, 7, 11, 15],
        "target": 9,
        "expected": [0, 1]
    },
    {
        "id": 2,
        "nums": [3, 2, 4],
        "target": 6,
        "expected": [1, 2]
    },
    {
        "id": 3,
        "nums": [3, 3],
        "target": 6,
        "expected": [0, 1]
    }
]