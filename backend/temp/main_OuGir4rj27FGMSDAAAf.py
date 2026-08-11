class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        num_map = {}

        for i, num in enumerate(nums):
            complement = target - num

            if complem
