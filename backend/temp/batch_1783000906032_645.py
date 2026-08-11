class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        num_map = {}

        for i in range(len(nums)):
            complement = target - nums[i]

            if complement in num_map:
                return [num_map[complement], i]

            num_map[nums[i]] = i

# -------------------------
# Test Cases
# -------------------------

solution = Solution()

# Test Case 1
nums = [2, 7, 11, 15]
target = 19
print(solution.twoSum(nums, target))   # Output: [0, 1]

# Test Case 2
nums = [3, 2, 4]
target = 6
print(solution.twoSum(nums, target))   # Output: [1, 2]

# Test Case 3
nums = [3, 3]
target = 6
print(solution.twoSum(nums, target))   # Output: [0, 1]