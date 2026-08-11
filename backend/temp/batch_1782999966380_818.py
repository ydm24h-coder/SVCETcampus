class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        num_map = {}

        for i in range(len(nums)):
            complement = target - nums[i]

            if complement in num_map:
                return [num_map[complement], i]

            num_map[nums[i]] = i


