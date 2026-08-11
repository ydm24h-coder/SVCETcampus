def add(a, b): return a + b

print("===== Simple Calculator =====")
print("1. Addition (+)")
print("2. Subtraction (-)")
print("3. Multiplication (*)")
print("4. Division (/)")

choice = input("Enter your choice (1/2/3/4): ")
if choice in ("1", "2", "3", "4"):
    num1 = float(input("Enter the first number: "))
    num2 = float(input("Enter the second number: "))
    print("Result!")