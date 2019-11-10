#!/usr/bin/python3

import math
import traceback


##################################################
# Problem:
#
# Write a function that takes a natural number as
# input (0, 1, 2, ...), and returns as output the
# number of digits that number has.
#
# For example: digitLength(69420) == 5
##################################################


##################################################
# Functions
##################################################

# Fails on n == 0
def digitLengthNaive(n):
    count = 0
    while n != 0:
        n //= 10
        count += 1
    return count


# Naive, but handles n == 0 case
def digitLengthNaive2(n):
    if n == 0:
        return 1

    count = 0
    while n != 0:
        n //= 10
        count += 1
    return count


# Cheating solution -- no strings allowed!
def digitLengthCheating(n):
    return len(str(n))


# Clever, but fails on n == 10**x case and n == 0 case
def digitLengthClever(n):
    return math.ceil(math.log10(n))


# The best clever solution
def digitLengthClever2(n):
    return 1 if n == 0 else (math.floor(math.log10(n)) + 1)


##################################################
# Tests
##################################################

def runTests(digitLength):
    try:
        assert(digitLength(2) == 1)
        assert(digitLength(123) == 3)
        assert(digitLength(12039) == 5)
        assert(digitLength(10001) == 5)
        assert(digitLength(1000) == 4)
        assert(digitLength(123456789) == 9)
        assert(digitLength(0) == 1)
    except AssertionError as e:
        print(digitLength.__name__, "failed the following test:")
        traceback.print_exc()
        print()


if __name__ == "__main__":
    runTests(digitLengthNaive) # Fails
    runTests(digitLengthNaive2)
    runTests(digitLengthCheating)
    runTests(digitLengthClever) # Fails
    runTests(digitLengthClever2)
