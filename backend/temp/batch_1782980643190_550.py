class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        num_map = {}

        for i, num in enumerate(nums):
            complement = target - num

            if complement in num_map:
                return [num_map[complement], i]

            num_map[num] = i
nums = [2, 7, 11, 15]
target = 9

print(Solution().twoSum(nums, target))
nums = [3, 2, 4]
target = 6

print(Solution().twoSum(nums, target))