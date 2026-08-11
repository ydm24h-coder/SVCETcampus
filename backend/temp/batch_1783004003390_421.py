class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}

        for index, value in enumerate(nums):
            required = target - value

            if required in seen:
                return [seen[required], index]

            seen[value] = index