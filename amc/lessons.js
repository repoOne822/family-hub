window.AMC_LESSONS = [
 {
  "id": "factors",
  "n": 1,
  "emoji": "🧱",
  "title": "Factors & Primes",
  "zh": "因数与质因数分解",
  "pages": "3–36",
  "six": [
   "Factors are the ways to split a number into equal teams with nobody left over. 12 kids can make teams of 1, 2, 3, 4, 6 or 12. Those are the factors of 12.",
   "A prime number is a grumpy number. It only lets you make one big team, or teams of 1. 2, 3, 5, 7, 11 and 13 are primes.",
   "Every number is built from prime LEGO bricks: 12 = 2 × 2 × 3. That brick list is called its prime factorization."
  ],
  "moves": [
   {
    "m": "Factor tree: keep splitting until every branch ends in a prime.",
    "why": "Any composite number splits into two smaller numbers. Keep splitting and you must end at primes. Example: 60 → 6 × 10 → 2 × 3 × 2 × 5."
   },
   {
    "m": "Count factors fast: write the bricks with powers (72 = 2³ × 3²), add 1 to each power, and multiply: (3+1) × (2+1) = 12 factors.",
    "why": "Any factor of 72 = 2³ × 3² is made by choosing how many 2s (0, 1, 2 or 3: 4 ways) and how many 3s (0, 1 or 2: 3 ways). 4 × 3 = 12 different choices."
   },
   {
    "m": "GCF = the bricks two numbers share. LCM = every brick, using the most of each.",
    "why": "To divide both numbers, a factor may only use bricks both have. To be a multiple of both, a number needs every brick from each. 12 = 2² × 3 and 18 = 2 × 3²: GCF = 2 × 3 = 6, LCM = 2² × 3² = 36."
   },
   {
    "m": "Is n prime? Only test primes up to √n. For 97, test 2, 3, 5, 7 (because 10 × 10 = 100).",
    "why": "Factors come in pairs that multiply to n, like 4 × 25 = 100. One number in every pair is at most √n. So if nothing up to √n divides n, nothing bigger will either."
   }
  ],
  "ex": [
   {
    "q": "How many positive factors does 72 have?",
    "steps": [
     "We need to count factors, not list them.",
     "Use prime bricks and the add-1-and-multiply trick.",
     "72 = 8 × 9 = 2³ × 3². Powers are 3 and 2, so (3+1) × (2+1) = 4 × 3 = 12.",
     "Quick list: 1,2,3,4,6,8,9,12,18,24,36,72. Twelve! ✅"
    ]
   },
   {
    "q": "Bus A comes every 12 minutes, bus B every 18 minutes. They both come at 8:00. When do they next come together?",
    "steps": [
     "'Together again' means a time that's a multiple of 12 AND of 18.",
     "That's the LCM.",
     "12 = 2² × 3 and 18 = 2 × 3². Use the most of each brick: 2² × 3² = 36. So 8:36.",
     "36 ÷ 12 = 3 and 36 ÷ 18 = 2. Both work. ✅"
    ]
   }
  ],
  "pr": [
   {
    "q": "Which number is prime?",
    "c": [
     "57",
     "61",
     "91",
     "63",
     "51"
    ],
    "a": 1,
    "hint": "Try dividing each by 3 and by 7.",
    "why": "51 = 3×17, 57 = 3×19, 63 = 7×9, 91 = 7×13. Only 61 is left with no team splits.",
    "steps": [
     "We want the one number whose only factors are 1 and itself.",
     "Test the small primes 2, 3, 5 and 7 on each number. √91 is less than 10, so testing up to 7 is enough.",
     "51: digits add to 6, so 3 divides it (51 = 3 × 17). 57: digits add to 12 (57 = 3 × 19). 63 = 7 × 9. 91 = 7 × 13. 61: not ÷2, not ÷3 (digits add to 7), not ÷5, not ÷7 (7 × 8 = 56, 7 × 9 = 63). So 61 is prime.",
     "61's only factors are 1 and 61."
    ],
    "trap": "91 looks prime, but it's 7 × 13. Always test 7!"
   },
   {
    "q": "How many positive factors does 36 have?",
    "c": [
     "8",
     "6",
     "12",
     "10",
     "9"
    ],
    "a": 4,
    "hint": "36 = 2² × 3². Add 1 to each power, then multiply.",
    "why": "(2+1) × (2+1) = 9: 1, 2, 3, 4, 6, 9, 12, 18, 36.",
    "steps": [
     "Count how many numbers divide 36 evenly.",
     "Break 36 into prime bricks, add 1 to each power, then multiply.",
     "36 = 6 × 6 = 2² × 3². The powers are 2 and 2, so (2 + 1) × (2 + 1) = 9.",
     "List the pairs: 1 × 36, 2 × 18, 3 × 12, 4 × 9, 6 × 6 → 1, 2, 3, 4, 6, 9, 12, 18, 36. Nine!"
    ],
    "trap": "6 × 6 pairs with itself, so count 6 only once. That's why square numbers have an odd number of factors."
   },
   {
    "q": "What is the greatest common factor of 84 and 126?",
    "c": [
     "28",
     "14",
     "84",
     "21",
     "42"
    ],
    "a": 4,
    "hint": "Break both into prime bricks and keep the shared ones.",
    "why": "84 = 2²×3×7, 126 = 2×3²×7. Shared: 2 × 3 × 7 = 42.",
    "steps": [
     "Find the biggest number that divides both 84 and 126.",
     "Break both into prime bricks and keep only the bricks they share.",
     "84 = 2 × 2 × 3 × 7. 126 = 2 × 3 × 3 × 7. Shared: one 2, one 3, one 7 → 2 × 3 × 7 = 42.",
     "84 ÷ 42 = 2 and 126 ÷ 42 = 3. 2 and 3 share no factor, so 42 really is the biggest."
    ],
    "trap": "84 divides itself but not 126 (126 ÷ 84 isn't whole)."
   },
   {
    "q": "What is the smallest positive number that 1, 2, 3, 4, 5 and 6 all divide evenly?",
    "c": [
     "60",
     "30",
     "120",
     "720",
     "90"
    ],
    "a": 0,
    "hint": "That's the LCM. You need 2², 3 and 5.",
    "why": "2² × 3 × 5 = 60. (720 works too, but it isn't the smallest.)",
    "steps": [
     "Find the smallest number that every number from 1 to 6 divides.",
     "That's the LCM: use every prime brick, the most times it appears in any one number.",
     "4 = 2² needs two 2s. 3 needs a 3. 5 needs a 5. (6 = 2 × 3 is already covered.) 2² × 3 × 5 = 4 × 3 × 5 = 60.",
     "60 ÷ 4 = 15, 60 ÷ 5 = 12, 60 ÷ 6 = 10. All whole. 30 fails because 30 ÷ 4 isn't whole."
    ],
    "trap": "1 × 2 × 3 × 4 × 5 × 6 = 720 works, but it isn't the SMALLEST."
   },
   {
    "q": "What is the sum of the different prime factors of 360?",
    "c": [
     "12",
     "8",
     "5",
     "15",
     "10"
    ],
    "a": 4,
    "hint": "Build the factor tree. Count each prime only once.",
    "why": "360 = 2³ × 3² × 5. Different primes: 2 + 3 + 5 = 10.",
    "steps": [
     "Find the different primes that divide 360, then add them.",
     "Build a factor tree for 360.",
     "360 = 36 × 10 = (2 × 2 × 3 × 3) × (2 × 5) = 2³ × 3² × 5. The different primes are 2, 3 and 5. 2 + 3 + 5 = 10.",
     "2 × 2 × 2 × 3 × 3 × 5 = 360. ✅"
    ],
    "trap": "'Different' means count 2 just once. 2 + 2 + 2 + 3 + 3 + 5 = 17 is wrong."
   }
  ],
  "words": [
   [
    "Factor",
    "因数",
    "A number that divides another number with nothing left over.",
    "4 is a factor of 12, because 12 ÷ 4 = 3."
   ],
   [
    "Multiple",
    "倍数",
    "What you get when you multiply a number by 1, 2, 3, …",
    "Multiples of 4: 4, 8, 12, 16, …"
   ],
   [
    "Prime",
    "质数",
    "A whole number bigger than 1 with exactly two factors: 1 and itself.",
    "7 is prime (only 1 and 7). 1 is NOT prime."
   ],
   [
    "Composite",
    "合数",
    "A whole number bigger than 1 with more than two factors.",
    "9 is composite: 1, 3, 9."
   ],
   [
    "Prime factorization",
    "质因数分解",
    "Writing a number as primes multiplied together.",
    "60 = 2 × 2 × 3 × 5 = 2² × 3 × 5"
   ],
   [
    "GCF / LCM",
    "最大公因数 / 最小公倍数",
    "GCF: the biggest number that divides both. LCM: the smallest number that both divide into.",
    "8 and 12: GCF = 4, LCM = 24."
   ]
  ]
 },
 {
  "id": "parity",
  "n": 2,
  "emoji": "🧦",
  "title": "Even, Odd & Divisibility",
  "zh": "奇数、偶数和整除",
  "pages": "37–62",
  "six": [
   "Even numbers can be split into pairs, like socks. Odd numbers always have one lonely sock left over.",
   "Even + even = even. Odd + odd = even, because two lonely socks make a pair! Odd + even = odd.",
   "Divisibility rules are shortcuts that tell you if a number splits evenly, without doing long division."
  ],
  "moves": [
   {
    "m": "÷3 or ÷9: add the digits. If the digit sum divides by 3 (or 9), so does the number.",
    "why": "10, 100 and 1000 are each 1 more than a multiple of 9 (9, 99, 999). So a number and its digit sum leave the same remainder when you divide by 9 or by 3."
   },
   {
    "m": "÷4: look at the last two digits. ÷8: last three digits. ÷5: ends in 0 or 5.",
    "why": "100 is divisible by 4 (and 1000 is divisible by 8), so the bigger places never matter. Example: 3716 → 16 ÷ 4 = 4, so 3716 is divisible by 4."
   },
   {
    "m": "÷11: alternate add and subtract the digits (1 − 3 + 3 − 1 = 0, so 1331 works).",
    "why": "10 is 1 less than 11, so the places act like +1, −1, +1, −1, … Example: 2453 → 2 − 4 + 5 − 3 = 0, which is divisible by 11."
   },
   {
    "m": "Odd × odd = odd. Anything × even = even.",
    "why": "Odd = even + 1. Two odds multiplied: (even + 1)(even + 1) = even + even + even + 1 = odd. If any factor is even, the whole product is even."
   }
  ],
  "ex": [
   {
    "q": "Is 4,572 divisible by 9? By 4?",
    "steps": [
     "Two separate checks.",
     "Use the digit-sum rule for 9 and the last-two-digits rule for 4.",
     "4+5+7+2 = 18, and 18 ÷ 9 = 2, so yes for 9. The last two digits are 72, and 72 ÷ 4 = 18, so yes for 4.",
     "4572 ÷ 36 = 127, a whole number. ✅"
    ]
   },
   {
    "q": "Add any 3 numbers in a row, like 4 + 5 + 6. What number always divides the total?",
    "steps": [
     "'Always' means we need a reason, not just one example.",
     "Call the middle number n.",
     "(n − 1) + n + (n + 1) = 3n. That's 3 times something, so 3 always divides it.",
     "4+5+6 = 15 and 10+11+12 = 33. Both divide by 3. ✅"
    ]
   }
  ],
  "pr": [
   {
    "q": "Which number is divisible by 9?",
    "c": [
     "2345",
     "1234",
     "5678",
     "4567",
     "3456"
    ],
    "a": 4,
    "hint": "Add the digits of each one.",
    "why": "Digit sums: 10, 14, 18, 22, 26. Only 18 divides by 9, so 3456.",
    "steps": [
     "Which number divides evenly by 9?",
     "Digit-sum rule: the digit sum must be a multiple of 9.",
     "Digit sums: 1234 → 10, 2345 → 14, 3456 → 18, 4567 → 22, 5678 → 26. Only 18 is a multiple of 9.",
     "3456 ÷ 9 = 384. ✅"
    ],
    "trap": "Don't mix it up with the ÷3 test: a digit sum of 12 passes for 3 but not for 9."
   },
   {
    "q": "a is odd and b is even. Which one MUST be odd?",
    "c": [
     "b × b",
     "a + b",
     "2(a + b)",
     "2a + b",
     "a × b"
    ],
    "a": 1,
    "hint": "Try a = 3 and b = 2 in each.",
    "why": "Odd + even = odd. Every other choice has an even part multiplied in.",
    "steps": [
     "'MUST be odd' means odd for every odd a and every even b.",
     "Test with small numbers (a = 3, b = 2), then use the odd/even rules.",
     "a + b = 5 (odd). a × b = 6, 2a + b = 8, b × b = 4, 2(a + b) = 10 are all even. Rule: odd + even = odd, and anything × even = even.",
     "Try other numbers, a = 1 and b = 4: a + b = 5, still odd. ✅"
    ],
    "trap": "2a + b: 2a is always even, and even + even = even."
   },
   {
    "q": "52d4 is a four-digit number with missing digit d. It is divisible by 3. What is the smallest d?",
    "c": [
     "2",
     "0",
     "1",
     "4",
     "3"
    ],
    "a": 2,
    "hint": "Digit sum = 5 + 2 + d + 4. Make it a multiple of 3.",
    "why": "11 + d must divide by 3, so d = 1, 4 or 7. Smallest is 1.",
    "steps": [
     "A digit is missing, the number must divide by 3, and we want the smallest digit.",
     "Divisible by 3 → the digit sum must be a multiple of 3.",
     "5 + 2 + 4 = 11, so 11 + d must be 12, 15 or 18. That makes d = 1, 4 or 7. The smallest is 1.",
     "5214: digit sum 12, and 5214 ÷ 3 = 1738. ✅"
    ],
    "trap": "d = 0 gives 5204, with digit sum 11: not a multiple of 3."
   },
   {
    "q": "How many whole numbers from 1 to 100 are divisible by 3 or by 5?",
    "c": [
     "40",
     "45",
     "53",
     "47",
     "50"
    ],
    "a": 3,
    "hint": "Count multiples of 3, add multiples of 5, then remove the ones you counted twice (multiples of 15).",
    "why": "33 + 20 − 6 = 47.",
    "steps": [
     "Count numbers from 1 to 100 divisible by 3 OR 5 (or both).",
     "Count each list, then subtract the overlap, which was counted twice.",
     "Multiples of 3: 100 ÷ 3 = 33 (and a bit) → 33. Multiples of 5: 20. Both, meaning multiples of 15: 100 ÷ 15 = 6 (and a bit) → 6. 33 + 20 − 6 = 47.",
     "15, 30, 45, 60, 75, 90: those are the 6 numbers that got counted twice. ✅"
    ],
    "trap": "33 + 20 = 53 forgets that 15, 30, … were counted twice."
   },
   {
    "q": "Which number is divisible by 11?",
    "c": [
     "2453",
     "3141",
     "4567",
     "1352",
     "5432"
    ],
    "a": 0,
    "hint": "Alternate: first − second + third − fourth.",
    "why": "2 − 4 + 5 − 3 = 0, so 2453 = 11 × 223.",
    "steps": [
     "Which number divides evenly by 11?",
     "Alternating sum (+ − + −) must be 0 or a multiple of 11.",
     "1352: 1 − 3 + 5 − 2 = 1. 2453: 2 − 4 + 5 − 3 = 0 ✓. 3141: 5. 4567: −2. 5432: 2.",
     "11 × 223 = 2453. ✅"
    ],
    "trap": "The plain digit sum works for 3 and 9, not 11."
   }
  ],
  "words": [
   [
    "Even",
    "偶数",
    "Divisible by 2. Ends in 0, 2, 4, 6 or 8.",
    "38"
   ],
   [
    "Odd",
    "奇数",
    "Not divisible by 2. Ends in 1, 3, 5, 7 or 9.",
    "47"
   ],
   [
    "Divisible",
    "整除",
    "a is divisible by b when a ÷ b leaves no remainder.",
    "35 is divisible by 7 (35 ÷ 7 = 5)."
   ],
   [
    "Remainder",
    "余数",
    "What's left over after dividing.",
    "17 ÷ 5 = 3 remainder 2."
   ],
   [
    "Digit sum",
    "数字和",
    "Add up all the digits.",
    "4572 → 4 + 5 + 7 + 2 = 18"
   ],
   [
    "Consecutive",
    "连续的",
    "Numbers in a row with no gaps.",
    "8, 9, 10"
   ]
  ]
 },
 {
  "id": "bases",
  "n": 3,
  "emoji": "👽",
  "title": "Bases & Digits",
  "zh": "进制与数位",
  "pages": "63–88",
  "six": [
   "We count in tens because we have 10 fingers. 345 means 3 hundreds + 4 tens + 5 ones.",
   "A different base is like an alien with a different number of fingers. An alien with 2 fingers counts in base 2: only 0 and 1, and each place is worth double the one before: 1, 2, 4, 8, 16…",
   "Digit puzzles get easy when you write a two-digit number 'ab' as 10 × a + b."
  ],
  "moves": [
   {
    "m": "Base b to normal: multiply each digit by its place value (1, b, b², b³…) and add.",
    "why": "In base b, each place is worth b times the place to its right, just like base 10 uses × 10. 212 in base 3 = 2 × 9 + 1 × 3 + 2 × 1 = 23."
   },
   {
    "m": "Normal to base b: keep dividing by b and read the remainders from bottom to top.",
    "why": "Dividing by b peels off the last digit as the remainder, like 345 ÷ 10 leaves 5. Example, 6 in base 2: 6 ÷ 2 = 3 r 0, 3 ÷ 2 = 1 r 1, 1 ÷ 2 = 0 r 1. Read the remainders from the bottom up: 110."
   },
   {
    "m": "Two-digit number 'ab' = 10a + b. Reversed 'ba' = 10b + a.",
    "why": "The tens digit is worth 10 each. 47 = 10 × 4 + 7. Writing it this way turns digit puzzles into equations you can solve."
   },
   {
    "m": "Last digits of powers repeat in a cycle. 7, 9, 3, 1, 7, 9, 3, 1… Find where you land.",
    "why": "The last digit of a product only depends on the last digits. 7 × 7 = 49 → 9, 9 × 7 = 63 → 3, 3 × 7 = 21 → 1, 1 × 7 → 7 again. Divide the power by the cycle length and use the remainder."
   }
  ],
  "ex": [
   {
    "q": "What is 1011 in base 2, written as a normal number?",
    "steps": [
     "Base 2 places are 8, 4, 2, 1 (from left to right).",
     "Multiply each digit by its place and add.",
     "1×8 + 0×4 + 1×2 + 1×1 = 11.",
     "11 = 8 + 2 + 1, which matches the 1s in 1011. ✅"
    ]
   },
   {
    "q": "A two-digit number equals 4 times the sum of its digits. How many such numbers are there?",
    "steps": [
     "Unknown digits: call the number 10a + b.",
     "Turn the sentence into an equation.",
     "10a + b = 4(a + b) → 6a = 3b → b = 2a. So 12, 24, 36, 48. Four numbers.",
     "24: 4 × (2+4) = 24. ✅"
    ]
   }
  ],
  "pr": [
   {
    "q": "What is 212 in base 3, written as a normal number?",
    "c": [
     "25",
     "21",
     "22",
     "24",
     "23"
    ],
    "a": 4,
    "hint": "Base 3 places are 9, 3, 1.",
    "why": "2×9 + 1×3 + 2×1 = 23.",
    "steps": [
     "Turn a base-3 number into a normal number.",
     "The places in base 3 are 9, 3, 1 (each 3 times the one to its right).",
     "2 × 9 = 18, 1 × 3 = 3, 2 × 1 = 2. 18 + 3 + 2 = 23.",
     "Base 3 only uses the digits 0, 1 and 2, so 212 is a real base-3 number. ✅"
    ],
    "trap": "Don't read it as 'two hundred twelve'. The places are 9, 3, 1, not 100, 10, 1."
   },
   {
    "q": "What is 25 written in base 2?",
    "c": [
     "11100",
     "10011",
     "11001",
     "10101",
     "11010"
    ],
    "a": 2,
    "hint": "25 = 16 + 8 + 1.",
    "why": "16, 8, 4, 2, 1 → 1, 1, 0, 0, 1 → 11001.",
    "steps": [
     "Write 25 using the base-2 places 16, 8, 4, 2, 1.",
     "Take the biggest place that fits, subtract it, and repeat.",
     "25 − 16 = 9 → 9 − 8 = 1 → 4 doesn't fit (0) → 2 doesn't fit (0) → 1 fits (1). Digits: 1 1 0 0 1 → 11001.",
     "16 + 8 + 1 = 25. ✅"
    ],
    "trap": "10011 = 16 + 2 + 1 = 19. The biggest place goes on the LEFT."
   },
   {
    "q": "What is the ones digit of 7²⁰²⁶?",
    "c": [
     "9",
     "1",
     "7",
     "5",
     "3"
    ],
    "a": 0,
    "hint": "Ones digits of 7, 7², 7³, 7⁴ are 7, 9, 3, 1, and then it repeats.",
    "why": "2026 ÷ 4 leaves remainder 2, so it's the 2nd in the cycle: 9.",
    "steps": [
     "We only need the last digit of a gigantic number.",
     "Find the cycle of last digits, then use the remainder.",
     "7¹ → 7, 7² → 9, 7³ → 3, 7⁴ → 1, then it repeats every 4. 2026 ÷ 4 = 506 remainder 2 → the 2nd in the cycle → 9.",
     "7² = 49 ends in 9. ✅"
    ],
    "trap": "A remainder of 0 would mean the 4th item (1), not a 'zeroth' one."
   },
   {
    "q": "Take a two-digit number, reverse its digits, and subtract the smaller from the bigger. The answer is always divisible by:",
    "c": [
     "7",
     "9",
     "5",
     "11",
     "4"
    ],
    "a": 1,
    "hint": "(10a + b) − (10b + a) = ?",
    "why": "It equals 9a − 9b = 9(a − b), so 9 always divides it.",
    "steps": [
     "It must be true for EVERY two-digit number.",
     "Write the number as 10a + b and the reversed number as 10b + a.",
     "(10a + b) − (10b + a) = 9a − 9b = 9 × (a − b). It's always 9 times something.",
     "72 − 27 = 45 = 9 × 5. ✅"
    ],
    "trap": "One example can fool you. The algebra shows 9 works every time."
   },
   {
    "q": "What is the sum of the digits of 10¹⁰ − 1?",
    "c": [
     "10",
     "90",
     "81",
     "9",
     "100"
    ],
    "a": 1,
    "hint": "Try smaller: 10² − 1 = 99, 10³ − 1 = 999.",
    "why": "10¹⁰ − 1 is ten 9s in a row, so the digit sum is 90.",
    "steps": [
     "A huge number. Look for a pattern instead of calculating.",
     "Try smaller powers of 10.",
     "10 − 1 = 9, 100 − 1 = 99, 1000 − 1 = 999. So 10¹⁰ − 1 is ten 9s: 9999999999. 10 × 9 = 90.",
     "10¹⁰ is a 1 followed by ten 0s. Minus 1 gives ten 9s. ✅"
    ],
    "trap": "It's ten 9s, not eleven."
   }
  ],
  "words": [
   [
    "Digit",
    "数字",
    "One symbol: 0 to 9.",
    "345 has the digits 3, 4 and 5."
   ],
   [
    "Place value",
    "位值",
    "What a digit is worth because of where it sits.",
    "In 345, the 4 is worth 40."
   ],
   [
    "Base",
    "进制",
    "How many digits a number system uses. Each place is worth 'base' times the place to its right.",
    "Base 10 places: 1, 10, 100, 1000"
   ],
   [
    "Binary (base 2)",
    "二进制",
    "Uses only 0 and 1. Places: 1, 2, 4, 8, 16, …",
    "101 in base 2 = 4 + 1 = 5"
   ],
   [
    "Units digit",
    "个位数",
    "The last (ones) digit.",
    "The units digit of 347 is 7."
   ],
   [
    "Cycle",
    "循环",
    "A pattern that repeats.",
    "Last digits of 2, 4, 8, 16, 32, …: 2, 4, 8, 6, 2, 4, 8, 6, …"
   ]
  ]
 },
 {
  "id": "sequences",
  "n": 4,
  "emoji": "🪜",
  "title": "Sequences & Series",
  "zh": "数列与求和",
  "pages": "89–106",
  "six": [
   "A sequence is a line of numbers that follows a rule, like stairs.",
   "Arithmetic: every step adds the same amount (2, 5, 8, 11: add 3 each time). Geometric: every step multiplies (3, 6, 12, 24: times 2).",
   "To add a long arithmetic list fast, pair the first with the last: 1 + 100, 2 + 99, 3 + 98… Every pair makes the same total!"
  ],
  "moves": [
   {
    "m": "nth term = first + (n − 1) × step.",
    "why": "To reach term n you take (n − 1) steps from the first term. Term 5 of 2, 5, 8, … = 2 + 4 × 3 = 14."
   },
   {
    "m": "How many terms? (last − first) ÷ step + 1. Don't forget the +1!",
    "why": "(last − first) ÷ step counts the GAPS. There's always one more number than gaps, like fence posts. 3, 5, 7, 9: (9 − 3) ÷ 2 = 3 gaps, so 4 numbers."
   },
   {
    "m": "Sum = (first + last) × number of terms ÷ 2.",
    "why": "Pair first + last, second + second-to-last, and so on. Every pair has the same total, and there are (count ÷ 2) pairs. 2 + 5 + 8 + 11 = (2 + 11) × 4 ÷ 2 = 26."
   },
   {
    "m": "Repeating patterns: divide the position by the pattern length and look at the remainder.",
    "why": "After every full round of the pattern you're back at the start, so only the leftover (remainder) matters. Remainder 0 means the LAST item of the pattern."
   }
  ],
  "ex": [
   {
    "q": "What is 1 + 2 + 3 + … + 100?",
    "steps": [
     "100 terms, each step adds 1.",
     "Pair first with last.",
     "1 + 100 = 101, and there are 50 pairs. 101 × 50 = 5050.",
     "Formula: (1 + 100) × 100 ÷ 2 = 5050. ✅"
    ]
   },
   {
    "q": "How many numbers are in the list 7, 11, 15, …, 99?",
    "steps": [
     "The step is 4.",
     "Use (last − first) ÷ step + 1.",
     "(99 − 7) ÷ 4 + 1 = 23 + 1 = 24.",
     "Term 24 = 7 + 23 × 4 = 99. ✅"
    ]
   }
  ],
  "pr": [
   {
    "q": "What is the 20th term of 3, 7, 11, 15, …?",
    "c": [
     "75",
     "80",
     "83",
     "79",
     "87"
    ],
    "a": 3,
    "hint": "first + (n − 1) × step",
    "why": "3 + 19 × 4 = 79.",
    "steps": [
     "First term 3, step +4, we want term 20.",
     "Use first + (n − 1) × step.",
     "3 + 19 × 4 = 3 + 76 = 79.",
     "Check the formula on term 2: 3 + 1 × 4 = 7. ✅"
    ],
    "trap": "3 + 20 × 4 = 83 takes one step too many."
   },
   {
    "q": "What is 2 + 4 + 6 + … + 50?",
    "c": [
     "675",
     "650",
     "1300",
     "625",
     "600"
    ],
    "a": 1,
    "hint": "How many even numbers from 2 to 50? Then pair them.",
    "why": "25 terms. (2 + 50) × 25 ÷ 2 = 650.",
    "steps": [
     "Add the even numbers from 2 to 50.",
     "Count the terms, then use (first + last) × count ÷ 2.",
     "Count = (50 − 2) ÷ 2 + 1 = 25. Sum = (2 + 50) × 25 ÷ 2 = 52 × 25 ÷ 2 = 650.",
     "It's also 2 × (1 + 2 + … + 25) = 2 × 325 = 650. ✅"
    ],
    "trap": "There are 25 terms, not 24. Don't forget the +1."
   },
   {
    "q": "What comes next: 2, 6, 18, 54, …?",
    "c": [
     "108",
     "148",
     "216",
     "324",
     "162"
    ],
    "a": 4,
    "hint": "What do you multiply by each time?",
    "why": "Times 3 each step: 54 × 3 = 162.",
    "steps": [
     "The jumps get bigger each time, so it's probably multiplying.",
     "Divide each term by the one before it.",
     "6 ÷ 2 = 3, 18 ÷ 6 = 3, 54 ÷ 18 = 3. Next: 54 × 3 = 162.",
     "The gaps 4, 12, 36 also triple each time. ✅"
    ],
    "trap": "108 is 54 × 2. The rule is × 3."
   },
   {
    "q": "In 1, 1, 2, 3, 5, 8, … each term is the sum of the two before it. What is the 10th term?",
    "c": [
     "34",
     "55",
     "44",
     "89",
     "144"
    ],
    "a": 1,
    "hint": "Keep going: 13, 21, …",
    "why": "1, 1, 2, 3, 5, 8, 13, 21, 34, 55.",
    "steps": [
     "Each term is the sum of the two before it.",
     "Keep adding carefully and write down each term's number.",
     "1 (1st), 1 (2nd), 2, 3, 5, 8, 13 (7th), 21 (8th), 34 (9th), 55 (10th).",
     "21 + 34 = 55. ✅"
    ],
    "trap": "Number your terms! 34 is the 9th term, an easy off-by-one slip."
   },
   {
    "q": "The letters ABCDE repeat forever: ABCDEABCDE… What is the 2026th letter?",
    "c": [
     "C",
     "A",
     "E",
     "D",
     "B"
    ],
    "a": 1,
    "hint": "2026 ÷ 5 = ? Look at the remainder.",
    "why": "2026 = 5 × 405 + 1. Remainder 1 means the 1st letter: A.",
    "steps": [
     "A pattern of 5 letters repeats.",
     "Divide the position by 5 and use the remainder.",
     "2026 ÷ 5 = 405 remainder 1. After 405 full rounds there's 1 more letter → A.",
     "Position 6 also leaves remainder 1, and the 6th letter is A. ✅"
    ],
    "trap": "A remainder of 0 would mean E, the last letter."
   }
  ],
  "words": [
   [
    "Sequence",
    "数列",
    "A list of numbers in order.",
    "2, 5, 8, 11"
   ],
   [
    "Term",
    "项",
    "One number in the list.",
    "The 3rd term of 2, 5, 8, 11 is 8."
   ],
   [
    "Common difference",
    "公差",
    "The amount added at every step.",
    "In 2, 5, 8, 11 it's 3."
   ],
   [
    "Arithmetic sequence",
    "等差数列",
    "Add the same number each time.",
    "10, 7, 4, 1 (adds −3)"
   ],
   [
    "Geometric sequence",
    "等比数列",
    "Multiply by the same number each time.",
    "5, 10, 20, 40 (× 2)"
   ],
   [
    "Series (sum)",
    "求和",
    "Adding up the terms.",
    "2 + 5 + 8 + 11 = 26"
   ]
  ]
 },
 {
  "id": "ratios",
  "n": 5,
  "emoji": "🧃",
  "title": "Ratios, Rates & Percents",
  "zh": "比率、速率和比例",
  "pages": "107–151",
  "six": [
   "A ratio compares amounts, like 2 cups of juice to 3 cups of water (2 : 3). For a bigger pitcher, multiply BOTH numbers by the same amount.",
   "A rate is 'how much for one': miles per hour, dollars per apple.",
   "Distance = speed × time. Drive 30 miles per hour for 2 hours and you go 60 miles."
  ],
  "moves": [
   {
    "m": "Ratio a : b → think in 'parts'. Total parts = a + b. One part = total ÷ (a + b).",
    "why": "A ratio like 3 : 5 means the groups grow together in equal 'parts'. Find the size of one part, then multiply. 40 people in 3 : 5 → 8 parts → 5 people each."
   },
   {
    "m": "Find the unit rate first (the price of 1), then scale up.",
    "why": "Once you know the amount for ONE, any amount is just one multiplication. 4 apples for $3 → $0.75 each → 10 apples cost $7.50."
   },
   {
    "m": "Average speed = total distance ÷ total time. Never just average the two speeds!",
    "why": "Speed = distance ÷ time. If you spend more TIME at one speed, that speed counts more. That's why you can't just average the two speeds."
   },
   {
    "m": "25% off means you pay 75%. A % change always uses the ORIGINAL amount.",
    "why": "25% off removes a quarter, so 75% is left. A percent always works on the amount right before that change. $40 → 25% off → $30 → + 10% → $33."
   }
  ],
  "ex": [
   {
    "q": "A class has boys and girls in the ratio 3 : 5. There are 40 students. How many boys?",
    "steps": [
     "3 parts boys, 5 parts girls.",
     "Find the size of one part.",
     "3 + 5 = 8 parts. 40 ÷ 8 = 5 students per part. Boys = 3 × 5 = 15.",
     "Girls = 25, and 15 : 25 = 3 : 5. ✅"
    ]
   },
   {
    "q": "Mom drives 30 miles to school at 60 mph and back at 30 mph. What is her average speed?",
    "steps": [
     "It's NOT (60 + 30) ÷ 2 = 45!",
     "Total distance ÷ total time.",
     "Going takes 30 ÷ 60 = ½ hour. Back takes 30 ÷ 30 = 1 hour. 60 miles ÷ 1½ hours = 40 mph.",
     "She spent more time going slowly, so the average sits closer to 30. ✅"
    ]
   }
  ],
  "pr": [
   {
    "q": "Red and blue marbles are in the ratio 2 : 7. There are 36 marbles. How many are red?",
    "c": [
     "6",
     "12",
     "4",
     "8",
     "9"
    ],
    "a": 3,
    "hint": "How many parts in total?",
    "why": "9 parts, so 36 ÷ 9 = 4 per part. Red = 2 × 4 = 8.",
    "steps": [
     "2 parts red for every 7 parts blue, and 36 marbles in total.",
     "Total parts → size of one part → red parts.",
     "2 + 7 = 9 parts. 36 ÷ 9 = 4 marbles per part. Red = 2 × 4 = 8.",
     "Blue = 7 × 4 = 28. 8 + 28 = 36, and 8 : 28 = 2 : 7. ✅"
    ],
    "trap": "36 ÷ 2 or 36 ÷ 7 ignores the total number of parts."
   },
   {
    "q": "5 pencils cost $1.25. How much do 12 pencils cost?",
    "c": [
     "$2.75",
     "$2.50",
     "$3.50",
     "$3.00",
     "$3.25"
    ],
    "a": 3,
    "hint": "Find the price of 1 pencil first.",
    "why": "$1.25 ÷ 5 = $0.25 each. 12 × $0.25 = $3.00.",
    "steps": [
     "Each pencil costs the same amount.",
     "Find the price of ONE pencil first.",
     "$1.25 ÷ 5 = $0.25 each. 12 × $0.25 = $3.00.",
     "10 pencils = $2.50, plus 2 more = $0.50 → $3.00. ✅"
    ],
    "trap": "Don't guess from $1.25. Find the price of one."
   },
   {
    "q": "A $40 shirt is 25% off. Then you pay 10% tax on the sale price. What do you pay?",
    "c": [
     "$35",
     "$31",
     "$34",
     "$33",
     "$32"
    ],
    "a": 3,
    "hint": "Sale price first, then add 10%.",
    "why": "25% off $40 = $30. 10% of $30 = $3. Total $33.",
    "steps": [
     "Two changes in order: the discount first, then tax on the NEW price.",
     "25% off means you pay 75%. Then 10% tax adds 10% of the sale price.",
     "75% of $40 = $30. 10% of $30 = $3. $30 + $3 = $33.",
     "40 × 0.75 × 1.10 = 33. ✅"
    ],
    "trap": "Don't combine them into '15% off' ($34). The 10% is of $30, not $40."
   },
   {
    "q": "You walk at 3 mph for 2 hours, then run at 6 mph for 1 hour. What is your average speed?",
    "c": [
     "5.5 mph",
     "5 mph",
     "4.5 mph",
     "6 mph",
     "4 mph"
    ],
    "a": 4,
    "hint": "Total distance ÷ total time.",
    "why": "3×2 + 6×1 = 12 miles in 3 hours = 4 mph.",
    "steps": [
     "The average over the WHOLE trip.",
     "Total distance ÷ total time.",
     "Walking: 3 × 2 = 6 miles. Running: 6 × 1 = 6 miles. 12 miles in 3 hours = 4 mph.",
     "4 is closer to 3 because you walked for longer. ✅"
    ],
    "trap": "(3 + 6) ÷ 2 = 4.5 ignores that you walked twice as long."
   },
   {
    "q": "3 painters paint a fence in 6 hours. How long would 9 painters take, working at the same speed?",
    "c": [
     "1",
     "18",
     "3",
     "2",
     "4"
    ],
    "a": 3,
    "hint": "Total work = 3 painters × 6 hours.",
    "why": "18 painter-hours ÷ 9 painters = 2 hours.",
    "steps": [
     "More painters → LESS time. The two go in opposite directions.",
     "Find the total work in 'painter-hours'.",
     "3 painters × 6 hours = 18 painter-hours of work. 18 ÷ 9 painters = 2 hours.",
     "3 times as many painters → one third of the time. ✅"
    ],
    "trap": "18 hours would mean more workers are slower!"
   }
  ],
  "words": [
   [
    "Ratio",
    "比",
    "Compares two amounts.",
    "2 : 3, like 2 cups juice for every 3 cups water"
   ],
   [
    "Part",
    "份",
    "One equal 'share' in a ratio.",
    "2 : 3 has 5 parts in total."
   ],
   [
    "Rate",
    "速率",
    "How much of one thing per 1 of another.",
    "60 miles per hour"
   ],
   [
    "Unit price / unit rate",
    "单价",
    "The amount for exactly 1.",
    "$3 for 4 apples → $0.75 per apple"
   ],
   [
    "Proportion",
    "比例",
    "Two ratios that are equal.",
    "2/3 = 4/6"
   ],
   [
    "Percent",
    "百分比",
    "Out of 100.",
    "25% = 25/100 = 1/4"
   ]
  ]
 },
 {
  "id": "equations",
  "n": 6,
  "emoji": "⚖️",
  "title": "Equations & Inequalities",
  "zh": "方程与不等式",
  "pages": "152–183",
  "six": [
   "An equation is a balance scale. Whatever you do to one side, do to the other, and it stays balanced.",
   "To find the mystery box x, peel away the stuff around it: undo + with −, and undo × with ÷.",
   "An inequality is a tipped scale. The same moves work, but if you multiply or divide by a negative number, the tip flips."
  ],
  "moves": [
   {
    "m": "Turn words into math: 'is' means =, 'of' means ×, 'more than' means +.",
    "why": "Once the words become an equation, you can use balance moves to solve it. 'Mom is 3 times as old as Eric' → m = 3e."
   },
   {
    "m": "Stuck? Try the answer choices. AMC gives you 5, and one of them works.",
    "why": "AMC is multiple choice, so exactly one choice makes the equation true. Try the middle choice first, then go up or down."
   },
   {
    "m": "Always check by plugging your answer back in.",
    "why": "Plugging back in takes seconds and catches arithmetic slips."
   },
   {
    "m": "Ages: everyone gets older by the SAME number of years.",
    "why": "Time passes the same for everyone. In 10 years, EVERY age goes up by 10."
   }
  ],
  "ex": [
   {
    "q": "Solve 3x + 7 = 22.",
    "steps": [
     "x is inside: times 3, then plus 7.",
     "Undo in reverse: first −7, then ÷3.",
     "3x = 15, so x = 5.",
     "3 × 5 + 7 = 22. ✅"
    ]
   },
   {
    "q": "Mom is 3 times as old as Eric. In 10 years she'll be 2 times as old. How old is Eric now?",
    "steps": [
     "Let Eric = e. Mom = 3e.",
     "Add 10 to BOTH ages for 'in 10 years'.",
     "3e + 10 = 2(e + 10) → 3e + 10 = 2e + 20 → e = 10.",
     "Now 10 and 30. In 10 years, 20 and 40. 40 = 2 × 20. ✅"
    ]
   }
  ],
  "pr": [
   {
    "q": "Solve 5x − 3 = 2x + 12.",
    "c": [
     "3",
     "5",
     "15",
     "4",
     "6"
    ],
    "a": 1,
    "hint": "Get all the x's on one side first.",
    "why": "3x = 15, so x = 5.",
    "steps": [
     "There are x's on both sides.",
     "Move the x's to one side and the plain numbers to the other, doing the same thing to both sides.",
     "Subtract 2x: 3x − 3 = 12. Add 3: 3x = 15. Divide by 3: x = 5.",
     "5 × 5 − 3 = 22 and 2 × 5 + 12 = 22. ✅"
    ],
    "trap": "15 is 3x, not x. Don't forget the last step, ÷ 3."
   },
   {
    "q": "Three numbers in a row add up to 72. What is the largest?",
    "c": [
     "26",
     "24",
     "23",
     "27",
     "25"
    ],
    "a": 4,
    "hint": "The middle one is 72 ÷ 3.",
    "why": "Middle = 24, so 23 + 24 + 25. Largest is 25.",
    "steps": [
     "Three numbers in a row add to 72. We want the biggest.",
     "The middle number = total ÷ 3, because the three balance around it.",
     "72 ÷ 3 = 24 is the middle. The numbers are 23, 24, 25. The largest is 25.",
     "23 + 24 + 25 = 72. ✅"
    ],
    "trap": "24 is the middle, not the largest. Read what the question asks!"
   },
   {
    "q": "How many positive whole numbers x make 2x + 3 < 20 true?",
    "c": [
     "8",
     "10",
     "9",
     "7",
     "17"
    ],
    "a": 0,
    "hint": "Solve like an equation: 2x < 17.",
    "why": "x < 8.5, so x = 1 to 8: eight numbers.",
    "steps": [
     "Count the positive whole numbers that make it true.",
     "Solve it like an equation, then count.",
     "2x + 3 < 20 → 2x < 17 → x < 8.5. Positive whole numbers below 8.5: 1, 2, …, 8 → 8 numbers.",
     "x = 8: 19 < 20 ✓. x = 9: 21 < 20 ✗. ✅"
    ],
    "trap": "'Positive' starts at 1, not 0, and 9 doesn't work."
   },
   {
    "q": "Pens cost $2 and notebooks cost $5. Eric buys 10 items for $35. How many notebooks?",
    "c": [
     "3",
     "6",
     "7",
     "4",
     "5"
    ],
    "a": 4,
    "hint": "If n are notebooks, then 10 − n are pens.",
    "why": "2(10 − n) + 5n = 35 → 20 + 3n = 35 → n = 5.",
    "steps": [
     "Two kinds of items: 10 items for $35 in total.",
     "Let n = notebooks. Then pens = 10 − n. Write the cost equation.",
     "5n + 2(10 − n) = 35 → 5n + 20 − 2n = 35 → 3n = 15 → n = 5.",
     "5 notebooks ($25) + 5 pens ($10) = $35. ✅"
    ],
    "trap": "Guess-and-check also works: try the middle answer choice first."
   },
   {
    "q": "Solve 4(x − 2) = x + 10.",
    "c": [
     "7",
     "4",
     "5",
     "8",
     "6"
    ],
    "a": 4,
    "hint": "Open the brackets: 4x − 8.",
    "why": "4x − 8 = x + 10 → 3x = 18 → x = 6.",
    "steps": [
     "There are brackets on the left.",
     "Open the brackets (4 times EACH part inside), then balance.",
     "4x − 8 = x + 10. Subtract x: 3x − 8 = 10. Add 8: 3x = 18. Divide by 3: x = 6.",
     "4 × (6 − 2) = 16 and 6 + 10 = 16. ✅"
    ],
    "trap": "4(x − 2) = 4x − 8, not 4x − 2."
   }
  ],
  "words": [
   [
    "Variable",
    "未知数",
    "A letter that stands for an unknown number.",
    "x"
   ],
   [
    "Equation",
    "方程",
    "A math sentence saying two things are equal.",
    "3x + 7 = 22"
   ],
   [
    "Solve",
    "解",
    "Find the value that makes the equation true.",
    "x = 5"
   ],
   [
    "Expression",
    "代数式",
    "Math with no equals sign.",
    "3x + 7"
   ],
   [
    "Inequality",
    "不等式",
    "Compares with <, >, ≤ or ≥.",
    "2x + 3 < 20"
   ],
   [
    "Integer",
    "整数",
    "A whole number: positive, negative or zero.",
    "−2, 0, 7"
   ]
  ]
 },
 {
  "id": "venn",
  "n": 7,
  "emoji": "⭕",
  "title": "Sets & Venn Diagrams",
  "zh": "集合与韦恩图",
  "pages": "184–209",
  "six": [
   "Put two hula hoops on the floor so they overlap.",
   "Kids who like pizza stand in one hoop, kids who like tacos in the other. Kids who like BOTH stand in the middle part.",
   "If you just add the two hoops, the middle kids get counted twice, so subtract them once."
  ],
  "moves": [
   {
    "m": "Total in A or B = A + B − both.",
    "why": "The 'both' group sits inside A AND inside B, so A + B counts it twice. Subtract it once."
   },
   {
    "m": "Neither = everyone − (A or B).",
    "why": "Everyone is either inside the circles or outside them."
   },
   {
    "m": "Fill the middle (both) first, then the 'only' parts.",
    "why": "The 'only' amounts depend on the middle: A only = A − both."
   },
   {
    "m": "'Divisible by 3 or 4' problems are Venn problems too: the middle is the LCM.",
    "why": "'Divisible by 3 and by 4' means divisible by 12 (their LCM). That's the overlap."
   }
  ],
  "ex": [
   {
    "q": "30 students: 18 play soccer, 15 play basketball, 7 play both. How many play neither?",
    "steps": [
     "Two hoops overlapping. Middle = 7.",
     "Find how many are in at least one hoop.",
     "18 + 15 − 7 = 26 play something. 30 − 26 = 4 play neither.",
     "Soccer only 11, basketball only 8, both 7, neither 4: 11 + 8 + 7 + 4 = 30. ✅"
    ]
   },
   {
    "q": "How many numbers from 1 to 30 are divisible by 2 or 3?",
    "steps": [
     "Hoop A: multiples of 2. Hoop B: multiples of 3. Middle: multiples of 6.",
     "A + B − both.",
     "15 + 10 − 5 = 20.",
     "Leftover: 1, 5, 7, 11, 13, 17, 19, 23, 25, 29 = 10 numbers, and 30 − 10 = 20. ✅"
    ]
   }
  ],
  "pr": [
   {
    "q": "25 kids: 14 have a cat, 12 have a dog, 5 have both. How many have neither?",
    "c": [
     "4",
     "3",
     "5",
     "6",
     "1"
    ],
    "a": 0,
    "hint": "Cat or dog = 14 + 12 − 5.",
    "why": "21 have at least one pet, so 25 − 21 = 4.",
    "steps": [
     "25 kids, two overlapping groups. We want 'neither'.",
     "Find 'cat or dog' first, then subtract from 25.",
     "14 + 12 − 5 = 21 kids have a pet. 25 − 21 = 4.",
     "Cat only 9, dog only 7, both 5, neither 4: 9 + 7 + 5 + 4 = 25. ✅"
    ],
    "trap": "25 − 14 − 12 = −1 is impossible. That's the double-count."
   },
   {
    "q": "40 kids all do piano, swimming or both. 22 do piano and 25 swim. How many do both?",
    "c": [
     "9",
     "7",
     "18",
     "5",
     "15"
    ],
    "a": 1,
    "hint": "22 + 25 counts the 'both' kids twice.",
    "why": "22 + 25 − 40 = 7.",
    "steps": [
     "Everyone does at least one, so 'neither' = 0.",
     "Piano + swim − both = everyone.",
     "22 + 25 − both = 40 → both = 7.",
     "Piano only 15, swim only 18, both 7: 15 + 18 + 7 = 40. ✅"
    ],
    "trap": "22 + 25 = 47, which is more than 40 kids. The extra 7 are the double-counted ones."
   },
   {
    "q": "How many numbers from 1 to 60 are divisible by 4 or 6?",
    "c": [
     "25",
     "30",
     "35",
     "20",
     "22"
    ],
    "a": 3,
    "hint": "The middle is multiples of 12 (the LCM).",
    "why": "15 + 10 − 5 = 20.",
    "steps": [
     "Count numbers up to 60 divisible by 4 or 6.",
     "Multiples of 4 + multiples of 6 − multiples of 12 (both).",
     "60 ÷ 4 = 15, 60 ÷ 6 = 10, 60 ÷ 12 = 5. 15 + 10 − 5 = 20.",
     "The overlap is 12, the LCM of 4 and 6. ✅"
    ],
    "trap": "Using 24 (4 × 6) for the overlap misses 12, 36 and 60."
   },
   {
    "q": "30 kids are each in chess, art or both. 18 are in chess and 21 are in art. How many are in art only?",
    "c": [
     "9",
     "10",
     "18",
     "21",
     "12"
    ],
    "a": 4,
    "hint": "Find 'both' first.",
    "why": "Both = 18 + 21 − 30 = 9. Art only = 21 − 9 = 12.",
    "steps": [
     "30 kids, each in at least one club.",
     "Find 'both' first. Then art only = art − both.",
     "Both = 18 + 21 − 30 = 9. Art only = 21 − 9 = 12.",
     "Chess only 9, art only 12, both 9: 9 + 12 + 9 = 30. ✅"
    ],
    "trap": "The 21 art kids include the 'both' kids."
   },
   {
    "q": "In a class, 20 like math, 15 like art, 8 like both, and 5 like neither. How many students are in the class?",
    "c": [
     "48",
     "32",
     "35",
     "30",
     "28"
    ],
    "a": 1,
    "hint": "Math or art = 20 + 15 − 8. Then add 'neither'.",
    "why": "27 + 5 = 32.",
    "steps": [
     "We need everyone: the kids inside the circles AND outside.",
     "Math or art = 20 + 15 − 8. Then add 'neither'.",
     "20 + 15 − 8 = 27. 27 + 5 = 32.",
     "Math only 12, art only 7, both 8, neither 5: 32. ✅"
    ],
    "trap": "Forgetting the 5 'neither' kids gives 27."
   }
  ],
  "words": [
   [
    "Set",
    "集合",
    "A group of things.",
    "{2, 4, 6}"
   ],
   [
    "Element",
    "元素",
    "One member of a set.",
    "4 is an element of {2, 4, 6}."
   ],
   [
    "Union (A or B)",
    "并集",
    "Everything in A, in B, or in both.",
    "{1, 2} or {2, 3} → {1, 2, 3}"
   ],
   [
    "Intersection (A and B)",
    "交集",
    "Only what's in BOTH.",
    "{1, 2} and {2, 3} → {2}"
   ],
   [
    "Venn diagram",
    "韦恩图",
    "Overlapping circles that show sets.",
    "Two hoops on the floor"
   ],
   [
    "Neither",
    "都不",
    "Outside every circle.",
    "Kids with no pets"
   ]
  ]
 },
 {
  "id": "triangles",
  "n": 8,
  "emoji": "🔺",
  "title": "Triangles & Similarity",
  "zh": "三角形与相似",
  "pages": "210–249",
  "six": [
   "The three angles inside ANY triangle add up to 180°. Tear off the corners and they make a straight line.",
   "A triangle's area is half a rectangle: base × height ÷ 2.",
   "Right triangles have a secret code: a² + b² = c². 3, 4, 5 is the famous one: 9 + 16 = 25.",
   "Similar triangles are the same shape in different sizes, like a photo and its zoomed-in copy. Every side grows by the same number."
  ],
  "moves": [
   {
    "m": "Angle sum = 180°. Isosceles (two equal sides) → two equal base angles.",
    "why": "Tear off the three corners and line them up: they make a straight line, 180°. For an isosceles triangle, fold it in half and the two base angles match."
   },
   {
    "m": "Area = ½ × base × height. The height must meet the base at a right angle.",
    "why": "Two copies of a triangle fit together into a parallelogram (base × height), so one triangle is half of that."
   },
   {
    "m": "Remember the triples: 3-4-5, 5-12-13, 8-15-17, and their doubles (6-8-10).",
    "why": "Whole numbers that fit a² + b² = c² are rare. These are the common ones, and their multiples work too: 6-8-10 = 2 × (3-4-5)."
   },
   {
    "m": "Similar → set up a ratio: small side / big side is the same for every pair.",
    "why": "Zooming multiplies every side by the same number, so small ÷ big is the same for every pair of matching sides."
   }
  ],
  "ex": [
   {
    "q": "A right triangle has legs 6 and 8. Find the long side and the area.",
    "steps": [
     "Legs are the two sides that make the right angle.",
     "Pythagoras for the long side, ½bh for the area.",
     "6² + 8² = 36 + 64 = 100, so the long side is 10. Area = ½ × 6 × 8 = 24.",
     "6-8-10 is just 3-4-5 doubled. ✅"
    ]
   },
   {
    "q": "A 6-foot dad casts a 4-foot shadow. At the same moment a tree casts a 20-foot shadow. How tall is the tree?",
    "steps": [
     "Sun rays make two similar triangles.",
     "height / shadow is the same for both.",
     "6 / 4 = h / 20 → h = 30 feet.",
     "The tree's shadow is 5 times longer, so it's 5 × 6 = 30. ✅"
    ]
   }
  ],
  "pr": [
   {
    "q": "Two angles of a triangle are 47° and 68°. What is the third angle?",
    "c": [
     "70°",
     "65°",
     "55°",
     "75°",
     "60°"
    ],
    "a": 1,
    "hint": "All three add to 180°.",
    "why": "180 − 47 − 68 = 65°.",
    "steps": [
     "Two angles are known.",
     "All three angles add to 180°.",
     "47 + 68 = 115. 180 − 115 = 65°.",
     "47 + 68 + 65 = 180. ✅"
    ],
    "trap": "Subtract from 180, not 360 (360 is for four-sided shapes)."
   },
   {
    "q": "A right triangle has legs 5 and 12. How long is the longest side?",
    "c": [
     "169",
     "13",
     "14",
     "17",
     "15"
    ],
    "a": 1,
    "hint": "5² + 12² = ?",
    "why": "25 + 144 = 169, and √169 = 13.",
    "steps": [
     "A right triangle with both legs known.",
     "a² + b² = c², then take the square root.",
     "5² + 12² = 25 + 144 = 169. √169 = 13.",
     "5-12-13 is a famous triple. ✅"
    ],
    "trap": "169 is c², not c. Take the square root."
   },
   {
    "q": "A triangle has base 10 and height 7. What is its area?",
    "c": [
     "30",
     "35",
     "70",
     "24",
     "17"
    ],
    "a": 1,
    "hint": "Half of base × height.",
    "why": "½ × 10 × 7 = 35.",
    "steps": [
     "Base and height are given.",
     "Area = ½ × base × height.",
     "10 × 7 = 70. Half of 70 = 35.",
     "The rectangle around it has area 70, and the triangle is half. ✅"
    ],
    "trap": "70 forgets the ½."
   },
   {
    "q": "An isosceles triangle has a top angle of 40°. What is each base angle?",
    "c": [
     "50°",
     "70°",
     "40°",
     "60°",
     "140°"
    ],
    "a": 1,
    "hint": "The two base angles are equal and share 180 − 40.",
    "why": "140 ÷ 2 = 70°.",
    "steps": [
     "Two equal base angles, and the top angle is 40°.",
     "The base angles share what's left of 180°.",
     "180 − 40 = 140. 140 ÷ 2 = 70°.",
     "40 + 70 + 70 = 180. ✅"
    ],
    "trap": "140° is both base angles together."
   },
   {
    "q": "A triangle with sides 3, 4, 5 is similar to a bigger triangle whose shortest side is 9. What is the bigger triangle's perimeter?",
    "c": [
     "60",
     "27",
     "45",
     "24",
     "36"
    ],
    "a": 4,
    "hint": "How many times bigger is it?",
    "why": "9 ÷ 3 = 3 times bigger. Sides 9, 12, 15. Perimeter 36.",
    "steps": [
     "Same shape: the shortest side goes from 3 to 9.",
     "Find the zoom factor and apply it to every side.",
     "9 ÷ 3 = 3 times bigger. Sides 9, 12, 15. Perimeter = 9 + 12 + 15 = 36.",
     "Small perimeter 3 + 4 + 5 = 12, and 12 × 3 = 36. ✅"
    ],
    "trap": "Adding 6 to every side (9, 10, 11) doesn't keep the same shape."
   }
  ],
  "words": [
   [
    "Angle (degrees °)",
    "角",
    "How much something turns.",
    "A right angle is 90°."
   ],
   [
    "Right triangle",
    "直角三角形",
    "A triangle with one 90° angle.",
    "The 3-4-5 triangle"
   ],
   [
    "Hypotenuse",
    "斜边",
    "The longest side, opposite the right angle.",
    "5 in a 3-4-5 triangle"
   ],
   [
    "Leg",
    "直角边",
    "One of the two sides that make the right angle.",
    "3 and 4 in a 3-4-5 triangle"
   ],
   [
    "Isosceles",
    "等腰",
    "Two equal sides, and two equal angles.",
    "Sides 5, 5, 8"
   ],
   [
    "Similar",
    "相似",
    "Same shape, different size: equal angles, sides in the same ratio.",
    "3-4-5 and 6-8-10"
   ],
   [
    "Height (altitude)",
    "高",
    "The straight distance from the top down to the base line, at 90°.",
    "Not the slanted side!"
   ]
  ]
 },
 {
  "id": "polygons",
  "n": 9,
  "emoji": "🛑",
  "title": "Polygons",
  "zh": "多边形",
  "pages": "250–278",
  "six": [
   "A polygon is a shape made of straight sides. A stop sign is an octagon (8 sides).",
   "Any polygon can be cut into triangles from one corner. A shape with n sides makes n − 2 triangles, so its inside angles add to (n − 2) × 180°.",
   "Walk all the way around any shape and you turn one full circle. So the outside angles always add to 360°."
  ],
  "moves": [
   {
    "m": "Inside-angle sum = (n − 2) × 180°.",
    "why": "From one corner, draw diagonals that cut the shape into n − 2 triangles, each 180°. A pentagon makes 3 triangles: 540°."
   },
   {
    "m": "Regular polygon (all sides equal): each inside angle = sum ÷ n, each outside angle = 360° ÷ n.",
    "why": "Equal angles share the total equally. The outside turns always add to one full turn, 360°."
   },
   {
    "m": "Number of diagonals = n × (n − 3) ÷ 2.",
    "why": "Each of the n corners connects to n − 3 others (not itself, not its 2 neighbors). Divide by 2 because each diagonal has two ends."
   },
   {
    "m": "Weird area? Cut it into rectangles and triangles, or draw a big box and subtract the extra.",
    "why": "Area is easy for rectangles and triangles. Split a weird shape into those, or take a big rectangle and subtract the missing pieces."
   }
  ],
  "ex": [
   {
    "q": "What is each inside angle of a regular hexagon?",
    "steps": [
     "Hexagon: 6 equal sides.",
     "Total of the inside angles, then share equally.",
     "(6 − 2) × 180 = 720°. 720 ÷ 6 = 120°.",
     "Outside angle = 360 ÷ 6 = 60°, and 120 + 60 = 180. ✅"
    ]
   },
   {
    "q": "How many diagonals does an octagon have?",
    "steps": [
     "Each corner connects to every corner except itself and its 2 neighbors.",
     "n(n − 3) ÷ 2. Divide by 2 because each diagonal gets counted from both ends.",
     "8 × 5 ÷ 2 = 20.",
     "A square: 4 × 1 ÷ 2 = 2 diagonals. Correct! ✅"
    ]
   }
  ],
  "pr": [
   {
    "q": "What is the sum of the inside angles of a pentagon?",
    "c": [
     "540°",
     "720°",
     "360°",
     "900°",
     "450°"
    ],
    "a": 0,
    "hint": "(n − 2) × 180 with n = 5.",
    "why": "3 × 180 = 540°.",
    "steps": [
     "A shape with 5 sides.",
     "Use (n − 2) × 180.",
     "(5 − 2) × 180 = 3 × 180 = 540°.",
     "A pentagon splits into 3 triangles from one corner. ✅"
    ],
    "trap": "360° is for 4 sides. Each extra side adds 180°."
   },
   {
    "q": "Each outside angle of a regular polygon is 30°. How many sides does it have?",
    "c": [
     "10",
     "15",
     "12",
     "6",
     "8"
    ],
    "a": 2,
    "hint": "The outside angles add to 360°.",
    "why": "360 ÷ 30 = 12.",
    "steps": [
     "A regular polygon whose outside turn is 30° at every corner.",
     "The outside angles add to 360°, and they're all equal.",
     "360 ÷ 30 = 12 sides.",
     "Inside angle = 180 − 30 = 150°, and 12 × 150 = 1800 = (12 − 2) × 180. ✅"
    ],
    "trap": "30° is the OUTSIDE turn, not the inside angle."
   },
   {
    "q": "How many diagonals does a hexagon have?",
    "c": [
     "9",
     "15",
     "6",
     "8",
     "12"
    ],
    "a": 0,
    "hint": "n(n − 3) ÷ 2",
    "why": "6 × 3 ÷ 2 = 9.",
    "steps": [
     "A hexagon: n = 6.",
     "Use n(n − 3) ÷ 2.",
     "6 × 3 ÷ 2 = 9.",
     "Each corner has 3 diagonals. 6 × 3 = 18 ends, and each diagonal has 2 ends → 9. ✅"
    ],
    "trap": "18 counts every diagonal twice."
   },
   {
    "q": "What is each inside angle of a regular decagon (10 sides)?",
    "c": [
     "150°",
     "108°",
     "135°",
     "120°",
     "144°"
    ],
    "a": 4,
    "hint": "Total = 8 × 180. Share among 10.",
    "why": "1440 ÷ 10 = 144°.",
    "steps": [
     "A regular shape with 10 sides.",
     "Find the total of the inside angles, then share it equally.",
     "(10 − 2) × 180 = 1440°. 1440 ÷ 10 = 144°.",
     "Outside angle = 180 − 144 = 36°, and 36 × 10 = 360. ✅"
    ],
    "trap": "1440° is all ten angles together."
   },
   {
    "q": "An 8 by 6 rectangle has a 2 by 2 square cut from each corner. What area is left?",
    "c": [
     "40",
     "24",
     "36",
     "32",
     "28"
    ],
    "a": 3,
    "hint": "Big area minus the four little squares.",
    "why": "48 − 4 × 4 = 32.",
    "steps": [
     "A big rectangle with 4 small squares cut away.",
     "Big area minus the cut pieces.",
     "8 × 6 = 48. Each square is 2 × 2 = 4, and 4 squares = 16. 48 − 16 = 32.",
     "The leftover is a plus shape: a middle strip 8 × 2 = 16 plus top and bottom pieces 4 × 2 = 8 each → 32. ✅"
    ],
    "trap": "There are FOUR corners. Cutting only one gives 44."
   }
  ],
  "words": [
   [
    "Polygon",
    "多边形",
    "A closed shape with straight sides.",
    "Triangle, pentagon, stop sign"
   ],
   [
    "Regular polygon",
    "正多边形",
    "All sides AND all angles are equal.",
    "A square"
   ],
   [
    "Interior angle",
    "内角",
    "The angle inside, at a corner.",
    "A square's is 90°."
   ],
   [
    "Exterior angle",
    "外角",
    "The turn you make at a corner when walking around. Interior + exterior = 180°.",
    "A square's is 90°."
   ],
   [
    "Diagonal",
    "对角线",
    "A line joining two corners that aren't next to each other.",
    "A square has 2."
   ],
   [
    "Names",
    "名称",
    "pentagon 5, hexagon 6, octagon 8, decagon 10",
    "五边形、六边形、八边形、十边形"
   ]
  ]
 },
 {
  "id": "circles",
  "n": 10,
  "emoji": "🍕",
  "title": "Circles",
  "zh": "圆",
  "pages": "279–302",
  "six": [
   "A circle is every point the same distance from the middle, like a dog on a leash running around a stake. That distance is the radius.",
   "All the way across is the diameter: 2 radii.",
   "Going around the edge is a bit more than 3 diameters. That magic number (3.14…) is π. Area = π × r × r."
  ],
  "moves": [
   {
    "m": "Circumference = 2πr = πd. Area = πr².",
    "why": "π is defined as circumference ÷ diameter, so C = πd = 2πr. For the area, cut a circle into thin slices and rearrange them into a near-rectangle about πr wide and r tall: πr²."
   },
   {
    "m": "A slice (sector) is a fraction of the circle: angle ÷ 360.",
    "why": "A full turn is 360°, so a 90° slice is 90/360 = ¼ of the circle."
   },
   {
    "m": "Leave answers 'in π' (like 25π). AMC usually does too.",
    "why": "It's exact, it's faster, and the answer choices are usually written like 25π."
   },
   {
    "m": "Shaded ring or region = big area − small area.",
    "why": "A ring is a big circle with a small circle removed from the middle."
   }
  ],
  "ex": [
   {
    "q": "A circle has radius 5. Find its circumference and area.",
    "steps": [
     "r = 5, so d = 10.",
     "Use the two formulas.",
     "Circumference = 2π × 5 = 10π. Area = π × 5² = 25π.",
     "Area ≈ 78.5, which fits inside a 10 × 10 box (100). ✅"
    ]
   },
   {
    "q": "A pizza with radius 6 is cut into 8 equal slices. What is the area of one slice?",
    "steps": [
     "Whole pizza first, then share.",
     "πr² ÷ 8.",
     "π × 36 = 36π. 36π ÷ 8 = 4.5π.",
     "8 slices × 4.5π = 36π. ✅"
    ]
   }
  ],
  "pr": [
   {
    "q": "A circle has diameter 10. What is its area?",
    "c": [
     "25π",
     "100π",
     "50π",
     "20π",
     "10π"
    ],
    "a": 0,
    "hint": "Radius is half the diameter.",
    "why": "r = 5, so the area is 25π.",
    "steps": [
     "The diameter is given, and the area is asked.",
     "Radius = diameter ÷ 2, then area = πr².",
     "r = 10 ÷ 2 = 5. 5 × 5 = 25 → 25π.",
     "25π ≈ 78.5, which fits inside a 10 × 10 square (100). ✅"
    ],
    "trap": "100π uses the diameter instead of the radius."
   },
   {
    "q": "A circle's circumference is 12π. What is its radius?",
    "c": [
     "12",
     "3",
     "24",
     "6",
     "36"
    ],
    "a": 3,
    "hint": "2πr = 12π",
    "why": "r = 6.",
    "steps": [
     "The circumference is given.",
     "C = 2πr. Solve for r.",
     "2πr = 12π → 2r = 12 → r = 6.",
     "2π × 6 = 12π. ✅"
    ],
    "trap": "12 is the diameter (πd = 12π), not the radius."
   },
   {
    "q": "What is the area of a quarter circle with radius 4?",
    "c": [
     "16π",
     "8π",
     "2π",
     "π",
     "4π"
    ],
    "a": 4,
    "hint": "Full circle ÷ 4.",
    "why": "16π ÷ 4 = 4π.",
    "steps": [
     "A quarter of a circle.",
     "Full area ÷ 4.",
     "π × 4² = 16π. 16π ÷ 4 = 4π.",
     "A quarter is a 90° sector: 90/360 = ¼. ✅"
    ],
    "trap": "16π is the whole circle."
   },
   {
    "q": "What is the area of the ring between circles of radius 5 and radius 3 (same center)?",
    "c": [
     "4π",
     "16π",
     "8π",
     "9π",
     "25π"
    ],
    "a": 1,
    "hint": "Big circle − small circle.",
    "why": "25π − 9π = 16π.",
    "steps": [
     "A ring = big circle minus small circle.",
     "Subtract the areas.",
     "π × 5² − π × 3² = 25π − 9π = 16π.",
     "16π is less than 25π, so it makes sense. ✅"
    ],
    "trap": "π × (5 − 3)² = 4π subtracts first, in the wrong order."
   },
   {
    "q": "If a circle's radius doubles, its area becomes how many times bigger?",
    "c": [
     "3",
     "8",
     "2",
     "4",
     "6"
    ],
    "a": 3,
    "hint": "Try r = 1, then r = 2.",
    "why": "π × 2² = 4π versus π × 1² = π. That's 4 times.",
    "steps": [
     "Compare the areas before and after.",
     "Try r = 1, then r = 2.",
     "r = 1: π. r = 2: 4π. 4π ÷ π = 4 times.",
     "r = 3 gives 9π, 9 times. Area grows with the SQUARE of the radius. ✅"
    ],
    "trap": "'2 times' is true for the circumference, not the area."
   }
  ],
  "words": [
   [
    "Radius (r)",
    "半径",
    "From the center to the edge.",
    "A dog's leash length"
   ],
   [
    "Diameter (d)",
    "直径",
    "Edge to edge through the center. d = 2r.",
    "r = 5 → d = 10"
   ],
   [
    "Circumference",
    "周长",
    "The distance around the circle.",
    "C = 2πr"
   ],
   [
    "π (pi)",
    "圆周率",
    "Circumference ÷ diameter. The same for every circle, about 3.14.",
    "A wheel rolls about 3.14 diameters in one turn."
   ],
   [
    "Area",
    "面积",
    "The space inside: πr².",
    "r = 3 → 9π"
   ],
   [
    "Sector",
    "扇形",
    "A pizza-slice part of a circle.",
    "A 90° sector is ¼ of the circle."
   ]
  ]
 },
 {
  "id": "volumes",
  "n": 11,
  "emoji": "🧊",
  "title": "Volumes",
  "zh": "体积",
  "pages": "303–332",
  "six": [
   "Volume is how many little sugar cubes fit inside something.",
   "A box 3 long, 2 wide and 4 tall holds 3 × 2 × 4 = 24 cubes.",
   "Boxes, prisms and cans: bottom area × height. Cones and pyramids hold exactly ⅓ of the matching can or box."
  ],
  "moves": [
   {
    "m": "Box: l × w × h. Cube: s³. Cylinder: πr² × h.",
    "why": "Stack it in layers: the bottom area tells you how many cubes are in one layer, and the height tells you how many layers."
   },
   {
    "m": "Cone and pyramid: ⅓ × base area × height.",
    "why": "You can test this with water: 3 full cones exactly fill the matching cylinder."
   },
   {
    "m": "Surface area of a cube = 6 × s² (6 square faces).",
    "why": "A cube has 6 faces, and each one is an s × s square."
   },
   {
    "m": "Make a shape k times bigger and its volume grows k × k × k times.",
    "why": "Length, width and height ALL grow by k, so the volume grows k × k × k. Double the size → 8 times the volume."
   }
  ],
  "ex": [
   {
    "q": "A cylinder has radius 3 and height 5. What is its volume?",
    "steps": [
     "Bottom is a circle.",
     "Circle area × height.",
     "π × 3² = 9π. 9π × 5 = 45π.",
     "A box around it, 6 × 6 × 5 = 180, is bigger. Makes sense. ✅"
    ]
   },
   {
    "q": "A cube has edge 2. Its edges double to 4. How many times bigger is the volume?",
    "steps": [
     "Old volume and new volume.",
     "Compare them, or use k³.",
     "2³ = 8 and 4³ = 64. 64 ÷ 8 = 8 times.",
     "k = 2, and 2³ = 8. ✅"
    ]
   }
  ],
  "pr": [
   {
    "q": "What is the volume of a box that is 4 by 5 by 6?",
    "c": [
     "240",
     "120",
     "150",
     "60",
     "100"
    ],
    "a": 1,
    "hint": "Multiply all three.",
    "why": "4 × 5 × 6 = 120.",
    "steps": [
     "A box.",
     "Volume = length × width × height.",
     "4 × 5 = 20 cubes per layer, × 6 layers = 120.",
     "6 × 5 × 4 in any order = 120. ✅"
    ],
    "trap": "4 + 5 + 6 = 15 adds instead of multiplying."
   },
   {
    "q": "A cube has volume 27. What is its surface area?",
    "c": [
     "81",
     "54",
     "36",
     "9",
     "27"
    ],
    "a": 1,
    "hint": "Find the edge first: what number cubed is 27?",
    "why": "Edge 3. Six faces of 3 × 3 = 9 gives 54.",
    "steps": [
     "Volume → edge → surface area.",
     "Find the edge: what number × itself × itself = 27?",
     "3 × 3 × 3 = 27, so the edge is 3. One face = 3 × 3 = 9. Six faces = 54.",
     "The volume is 27. ✅"
    ],
    "trap": "27 is the volume. The surface area counts the 6 faces."
   },
   {
    "q": "What is the volume of a cylinder with radius 2 and height 10?",
    "c": [
     "80π",
     "20π",
     "100π",
     "40π",
     "400π"
    ],
    "a": 3,
    "hint": "πr² × h",
    "why": "4π × 10 = 40π.",
    "steps": [
     "A cylinder.",
     "πr² × h.",
     "π × 2² = 4π per layer, × 10 layers = 40π.",
     "40π ≈ 126, less than the box around it (4 × 4 × 10 = 160). ✅"
    ],
    "trap": "π × 2 × 10 = 20π uses r instead of r²."
   },
   {
    "q": "A cone has the same base and height as a cylinder of volume 60. What is the cone's volume?",
    "c": [
     "180",
     "15",
     "20",
     "60",
     "30"
    ],
    "a": 2,
    "hint": "A cone holds ⅓ of the matching cylinder.",
    "why": "60 ÷ 3 = 20.",
    "steps": [
     "Same base and the same height.",
     "A cone holds ⅓ of the matching cylinder.",
     "60 ÷ 3 = 20.",
     "3 cones of 20 fill 60. ✅"
    ],
    "trap": "180 multiplies instead of dividing."
   },
   {
    "q": "A 3×3×3 cube is painted on the outside, then cut into 27 small cubes. How many small cubes have exactly 2 painted faces?",
    "c": [
     "24",
     "18",
     "8",
     "12",
     "6"
    ],
    "a": 3,
    "hint": "Corner cubes have 3 painted faces. Look at the middle of each edge.",
    "why": "Each of the 12 edges has 1 middle cube with 2 painted faces: 12.",
    "steps": [
     "27 small cubes. Count the ones with EXACTLY 2 painted faces.",
     "Sort the small cubes by where they sit: corners (3 painted faces), edges (2), face centers (1), the very middle (0).",
     "The 2-face cubes sit in the middle of each edge. A cube has 12 edges with 1 middle cube each → 12.",
     "8 corners + 12 edges + 6 face centers + 1 middle = 27. ✅"
    ],
    "trap": "The 8 corner cubes have 3 painted faces, not 2."
   }
  ],
  "words": [
   [
    "Volume",
    "体积",
    "The space inside, measured in cubes.",
    "A 2 × 2 × 2 cube holds 8 unit cubes."
   ],
   [
    "Prism",
    "棱柱",
    "The same shape all the way up.",
    "A box, a triangular prism"
   ],
   [
    "Cylinder",
    "圆柱",
    "A can: circle on the bottom and top.",
    "V = πr²h"
   ],
   [
    "Cone / Pyramid",
    "圆锥 / 棱锥",
    "Comes to a point at the top.",
    "An ice-cream cone"
   ],
   [
    "Surface area",
    "表面积",
    "The total area of all the outside faces.",
    "A cube has 6 faces."
   ],
   [
    "Edge / Face",
    "棱 / 面",
    "Edge: where two faces meet. Face: a flat side.",
    "A cube has 12 edges and 6 faces."
   ]
  ]
 },
 {
  "id": "stats",
  "n": 12,
  "emoji": "📊",
  "title": "Statistics",
  "zh": "统计",
  "pages": "333–359",
  "six": [
   "Mean is sharing fairly: pour everyone's candy into one pile and give everybody an equal share.",
   "Median is the middle kid when everyone lines up by height.",
   "Mode is the most popular one. Range is tallest minus shortest."
  ],
  "moves": [
   {
    "m": "Total = mean × how many. Most mean problems are really total problems!",
    "why": "Mean = total ÷ count, so total = mean × count. Many problems give you means, but you need the totals."
   },
   {
    "m": "Median: SORT first. With an even count, average the middle two.",
    "why": "'Middle' only makes sense in order. With an even count there are two middles, so take their average."
   },
   {
    "m": "Adding or removing a number: compare the totals before and after.",
    "why": "Comparing the totals before and after tells you exactly which number came in or went out."
   },
   {
    "m": "Range = biggest − smallest.",
    "why": "It measures the spread from the smallest number to the biggest."
   }
  ],
  "ex": [
   {
    "q": "Eric scored 80, 90, 85 and 95. What does he need on test 5 to average 88?",
    "steps": [
     "Average of 5 tests = 88.",
     "Turn the average into a total.",
     "He needs 5 × 88 = 440 in total. So far 350. He needs 440 − 350 = 90.",
     "(80 + 90 + 85 + 95 + 90) ÷ 5 = 88. ✅"
    ]
   },
   {
    "q": "What is the median of 3, 9, 4, 7, 9, 2?",
    "steps": [
     "6 numbers, an even count.",
     "Sort, then average the middle two.",
     "2, 3, 4, 7, 9, 9 → middle two are 4 and 7 → 5.5.",
     "3 numbers below 5.5 and 3 above. ✅"
    ]
   }
  ],
  "pr": [
   {
    "q": "What is the mean of 4, 8, 9, 11, 13?",
    "c": [
     "45",
     "8",
     "10",
     "11",
     "9"
    ],
    "a": 4,
    "hint": "Add them up, then divide by 5.",
    "why": "45 ÷ 5 = 9.",
    "steps": [
     "5 numbers.",
     "Add them up, then divide by 5.",
     "4 + 8 + 9 + 11 + 13 = 45. 45 ÷ 5 = 9.",
     "9 sits between 4 and 13. ✅"
    ],
    "trap": "45 is the total, not the mean."
   },
   {
    "q": "What is the median of 12, 3, 7, 9, 15, 6, 10?",
    "c": [
     "6",
     "7",
     "12",
     "9",
     "10"
    ],
    "a": 3,
    "hint": "Sort them first.",
    "why": "3, 6, 7, 9, 10, 12, 15 → the middle (4th) is 9.",
    "steps": [
     "7 numbers, not in order.",
     "Sort them, then take the 4th one (3 on each side).",
     "3, 6, 7, 9, 10, 12, 15 → the 4th is 9.",
     "3 numbers below 9 and 3 above. ✅"
    ],
    "trap": "Always sort first. With 7 numbers, take the 4th, not the 3rd."
   },
   {
    "q": "The mean of 5 numbers is 20. One number is removed, and the mean of the other 4 is 18. Which number was removed?",
    "c": [
     "20",
     "26",
     "28",
     "18",
     "22"
    ],
    "a": 2,
    "hint": "Compare the totals before and after.",
    "why": "Before: 100. After: 72. Removed: 28.",
    "steps": [
     "Mean 20 for 5 numbers, then mean 18 for the 4 that are left.",
     "Compare the totals.",
     "Before: 5 × 20 = 100. After: 4 × 18 = 72. Removed: 100 − 72 = 28.",
     "(72 + 28) ÷ 5 = 20. ✅"
    ],
    "trap": "20 − 18 = 2 compares the means, not the totals."
   },
   {
    "q": "What is the mode of 2, 3, 3, 5, 7, 7, 7, 9?",
    "c": [
     "7",
     "5",
     "9",
     "no mode",
     "3"
    ],
    "a": 0,
    "hint": "Which appears most often?",
    "why": "7 appears three times.",
    "steps": [
     "The most frequent number.",
     "Count how many times each one appears.",
     "2 once, 3 twice, 5 once, 7 three times, 9 once → 7.",
     "7 appears the most. ✅"
    ],
    "trap": "The mode isn't the middle or the biggest. It's the most common."
   },
   {
    "q": "What is the range of 14, 3, 22, 9, 17?",
    "c": [
     "11",
     "22",
     "14",
     "8",
     "19"
    ],
    "a": 4,
    "hint": "Biggest − smallest.",
    "why": "22 − 3 = 19.",
    "steps": [
     "Biggest − smallest.",
     "Find the biggest and the smallest.",
     "Biggest 22, smallest 3. 22 − 3 = 19.",
     "Every number fits between 3 and 22. ✅"
    ],
    "trap": "22 − 14 uses the first number, not the smallest."
   }
  ],
  "words": [
   [
    "Mean (average)",
    "平均数",
    "Total ÷ how many.",
    "2, 4, 9 → 15 ÷ 3 = 5"
   ],
   [
    "Median",
    "中位数",
    "The middle number once they're sorted.",
    "3, 8, 1 → 1, 3, 8 → 3"
   ],
   [
    "Mode",
    "众数",
    "The number that appears most often.",
    "1, 2, 2, 5 → 2"
   ],
   [
    "Range",
    "极差",
    "Biggest − smallest.",
    "3, 9, 4 → 9 − 3 = 6"
   ],
   [
    "Data",
    "数据",
    "The list of numbers you're studying.",
    "Test scores"
   ]
  ]
 },
 {
  "id": "counting",
  "n": 13,
  "emoji": "👕",
  "title": "Permutations & Combinations",
  "zh": "排列与组合",
  "pages": "360–397",
  "six": [
   "Counting choices is like getting dressed: 3 shirts and 4 pants make 3 × 4 = 12 outfits. When you pick one of each, MULTIPLY.",
   "When order matters, like who gets gold, silver and bronze, it's a permutation: 5 × 4 × 3.",
   "When order doesn't matter, like picking 2 friends for a team, count it in order and then divide out the repeats."
  ],
  "moves": [
   {
    "m": "One from each group → multiply.",
    "why": "For each of the a first choices there are b second choices. That's a rows of b, which is a × b. Draw a tree diagram to see it."
   },
   {
    "m": "Arrange n different things in a row: n! = n × (n − 1) × … × 1.",
    "why": "n choices for the first spot, then n − 1 left for the second, and so on down to 1."
   },
   {
    "m": "Choose r from n, order doesn't matter: (n × (n − 1) × …, r numbers) ÷ r!.",
    "why": "Counting in order counts each group r! times (once for every way to order it), so divide by r!."
   },
   {
    "m": "'At least one' → count everything, then subtract the ones with none.",
    "why": "'At least one' has lots of cases. 'None' has one simple case. Total − none = at least one."
   }
  ],
  "ex": [
   {
    "q": "How many ways can you arrange the letters C, A, T?",
    "steps": [
     "3 spots, all letters different.",
     "Fill the spots one at a time.",
     "3 choices, then 2, then 1: 3 × 2 × 1 = 6.",
     "CAT, CTA, ACT, ATC, TCA, TAC. Six! ✅"
    ]
   },
   {
    "q": "You can invite 2 of your 5 friends. How many different pairs are there?",
    "steps": [
     "Order doesn't matter: Ann & Bo is the same as Bo & Ann.",
     "Count in order, then divide by 2.",
     "5 × 4 = 20 in order. ÷ 2 = 10 pairs.",
     "Each friend is in 4 pairs: 5 × 4 ÷ 2 = 10. ✅"
    ]
   }
  ],
  "pr": [
   {
    "q": "4 shirts, 3 pants and 2 hats. How many outfits use one of each?",
    "c": [
     "12",
     "9",
     "18",
     "36",
     "24"
    ],
    "a": 4,
    "hint": "Pick one from each group: multiply.",
    "why": "4 × 3 × 2 = 24.",
    "steps": [
     "Pick one shirt, one pair of pants and one hat.",
     "Picking one from each group → multiply.",
     "4 × 3 × 2 = 24.",
     "12 shirt-and-pants outfits, each with 2 hat choices → 24. ✅"
    ],
    "trap": "4 + 3 + 2 = 9 adds instead of multiplying."
   },
   {
    "q": "In how many ways can 5 different books be lined up on a shelf?",
    "c": [
     "720",
     "100",
     "120",
     "60",
     "25"
    ],
    "a": 2,
    "hint": "5!",
    "why": "5 × 4 × 3 × 2 × 1 = 120.",
    "steps": [
     "Arrange 5 different books in a row.",
     "5! (5 choices, then 4, then 3, …).",
     "5 × 4 × 3 × 2 × 1 = 120.",
     "Small case: 3 books → 3 × 2 × 1 = 6 ways, and you can list them. ✅"
    ],
    "trap": "5 × 5 = 25 lets the same book be used twice."
   },
   {
    "q": "From 6 kids, choose a captain AND a co-captain. How many ways?",
    "c": [
     "12",
     "720",
     "15",
     "30",
     "36"
    ],
    "a": 3,
    "hint": "Order matters here: captain is different from co-captain.",
    "why": "6 × 5 = 30.",
    "steps": [
     "Two DIFFERENT jobs, so order matters.",
     "6 choices for captain, then 5 left for co-captain.",
     "6 × 5 = 30.",
     "Ann captain + Bo co-captain is different from Bo captain + Ann co-captain, so don't divide. ✅"
    ],
    "trap": "15 divides by 2. Only do that when order doesn't matter."
   },
   {
    "q": "A pizza place has 6 toppings. How many ways can you pick 3 different toppings?",
    "c": [
     "20",
     "216",
     "18",
     "36",
     "120"
    ],
    "a": 0,
    "hint": "Order doesn't matter: 6 × 5 × 4, then ÷ 3!.",
    "why": "120 ÷ 6 = 20.",
    "steps": [
     "Pick 3 toppings. Order doesn't matter.",
     "Count in order, then divide by 3! = 6.",
     "6 × 5 × 4 = 120 in order. 120 ÷ 6 = 20.",
     "Each group of 3 toppings appears 6 times in the ordered count. ✅"
    ],
    "trap": "120 counts pepperoni-mushroom-olive and olive-mushroom-pepperoni as different."
   },
   {
    "q": "How many three-digit numbers have at least one digit 7?",
    "c": [
     "243",
     "225",
     "280",
     "252",
     "271"
    ],
    "a": 3,
    "hint": "Count all three-digit numbers, then subtract the ones with no 7.",
    "why": "900 total. No 7: 8 × 9 × 9 = 648. 900 − 648 = 252.",
    "steps": [
     "'At least one' has lots of cases, so use the complement.",
     "Total − numbers with no 7 at all.",
     "Three-digit numbers 100–999: 900. With no 7: first digit 8 choices (1–9 except 7), second 9 (0–9 except 7), third 9 → 8 × 9 × 9 = 648. 900 − 648 = 252.",
     "Counting directly by cases also gives 252. ✅"
    ],
    "trap": "The first digit can't be 0, so it has 8 choices, not 9."
   }
  ],
  "words": [
   [
    "Outcome",
    "结果",
    "One possible result.",
    "Rolling a 4"
   ],
   [
    "Multiplication principle",
    "乘法原理",
    "a ways for one choice and b ways for the next → a × b ways together.",
    "3 shirts × 4 pants = 12 outfits"
   ],
   [
    "Factorial (n!)",
    "阶乘",
    "n × (n − 1) × … × 1",
    "4! = 24"
   ],
   [
    "Permutation",
    "排列",
    "An arrangement where ORDER matters.",
    "Gold, silver, bronze"
   ],
   [
    "Combination",
    "组合",
    "A choice where order does NOT matter.",
    "Picking 2 friends"
   ],
   [
    "Complement",
    "反面",
    "Everything that is NOT what you want.",
    "'No 7s' is the complement of 'at least one 7'."
   ]
  ]
 },
 {
  "id": "probability",
  "n": 14,
  "emoji": "🎲",
  "title": "Probability",
  "zh": "概率",
  "pages": "398–428",
  "six": [
   "Probability is how likely something is, from 0 (never) to 1 (always).",
   "Count the good ways and divide by all the ways. A bag with 3 red and 2 blue marbles: the chance of red is 3/5.",
   "Two things in a row → multiply their chances. For 'at least one', find the chance of NONE and subtract it from 1."
  ],
  "moves": [
   {
    "m": "P = good outcomes ÷ all outcomes (when each is equally likely).",
    "why": "When the outcomes are equally likely, each one gets an equal share of the chance."
   },
   {
    "m": "Two dice: draw the 6 × 6 table of 36 outcomes.",
    "why": "(1, 6) and (6, 1) are different outcomes. The 6 × 6 table shows all 36 equally likely pairs."
   },
   {
    "m": "Independent things in a row → multiply. Without putting back → the second count changes!",
    "why": "Half of the time A happens, and in half of THOSE times B happens: ½ × ½ = ¼. Without replacement, the second fraction changes."
   },
   {
    "m": "P(at least one) = 1 − P(none).",
    "why": "Either at least one happens, or none does. Together they make 1."
   }
  ],
  "ex": [
   {
    "q": "Flip two coins. What is the chance of two heads?",
    "steps": [
     "List the outcomes: HH, HT, TH, TT.",
     "Good ÷ total.",
     "1 good out of 4, so 1/4.",
     "Multiply: ½ × ½ = ¼. ✅"
    ]
   },
   {
    "q": "Roll two dice. What is the chance the sum is 7?",
    "steps": [
     "36 equally likely outcomes.",
     "Count the pairs that make 7.",
     "(1,6) (2,5) (3,4) (4,3) (5,2) (6,1): 6 pairs. 6/36 = 1/6.",
     "7 is the most common sum, and 1/6 is the biggest chance of any sum. ✅"
    ]
   }
  ],
  "pr": [
   {
    "q": "A spinner has 8 equal parts numbered 1 to 8. What is the chance of landing on a prime number?",
    "c": [
     "5/8",
     "3/8",
     "3/4",
     "1/4",
     "1/2"
    ],
    "a": 4,
    "hint": "Which of 1 to 8 are prime?",
    "why": "2, 3, 5, 7: 4 out of 8 = 1/2.",
    "steps": [
     "8 equal parts. Count the good ones.",
     "Which numbers from 1 to 8 are prime?",
     "2, 3, 5, 7 → 4 out of 8 = 1/2.",
     "1 is not prime, so it isn't counted. ✅"
    ],
    "trap": "Counting 1 as prime gives 5/8."
   },
   {
    "q": "Roll two dice. What is the chance the sum is 10?",
    "c": [
     "1/4",
     "1/9",
     "1/6",
     "1/18",
     "1/12"
    ],
    "a": 4,
    "hint": "List the pairs that make 10.",
    "why": "(4,6) (5,5) (6,4): 3/36 = 1/12.",
    "steps": [
     "Two dice: 36 equally likely pairs.",
     "List the pairs that add to 10.",
     "(4, 6), (5, 5), (6, 4) → 3/36 = 1/12.",
     "(5, 5) can only happen one way, so it's counted once. ✅"
    ],
    "trap": "Forgetting that (4, 6) and (6, 4) are different gives 2/36."
   },
   {
    "q": "A bag has 4 red and 6 blue marbles. Take 2 without putting the first back. What is the chance both are red?",
    "c": [
     "4/15",
     "1/5",
     "2/15",
     "4/25",
     "2/5"
    ],
    "a": 2,
    "hint": "First red: 4/10. Then only 3 reds are left out of 9.",
    "why": "4/10 × 3/9 = 12/90 = 2/15.",
    "steps": [
     "Two draws, and the first marble is NOT put back.",
     "Multiply, but the second fraction changes.",
     "First red: 4/10. Then 3 reds are left out of 9: 3/9. 4/10 × 3/9 = 12/90 = 2/15.",
     "Counting pairs: (4 × 3 ÷ 2) red pairs ÷ (10 × 9 ÷ 2) pairs = 6/45 = 2/15. ✅"
    ],
    "trap": "4/10 × 4/10 = 4/25 pretends the marble went back in."
   },
   {
    "q": "Flip 3 coins. What is the chance of at least one head?",
    "c": [
     "1/2",
     "7/8",
     "3/8",
     "1/8",
     "3/4"
    ],
    "a": 1,
    "hint": "What is the chance of NO heads?",
    "why": "No heads (TTT) = 1/8, so at least one = 1 − 1/8 = 7/8.",
    "steps": [
     "'At least one' → use the complement.",
     "1 − P(no heads).",
     "P(TTT) = ½ × ½ × ½ = 1/8. So 1 − 1/8 = 7/8.",
     "Of the 8 outcomes, only TTT has no heads. ✅"
    ],
    "trap": "3/8 is the chance of EXACTLY one head."
   },
   {
    "q": "A whole number from 1 to 20 is picked at random. What is the chance it is divisible by 3 or by 4?",
    "c": [
     "11/20",
     "1/2",
     "2/5",
     "1/4",
     "9/20"
    ],
    "a": 1,
    "hint": "Venn trick: 3s + 4s − 12s.",
    "why": "6 + 5 − 1 = 10 numbers. 10/20 = 1/2.",
    "steps": [
     "Count the good numbers out of 20.",
     "Venn trick: multiples of 3 + multiples of 4 − multiples of 12.",
     "3s: 6 (3, 6, …, 18). 4s: 5 (4, 8, …, 20). 12s: 1. 6 + 5 − 1 = 10 → 10/20 = 1/2.",
     "List: 3, 4, 6, 8, 9, 12, 15, 16, 18, 20 = 10 numbers. ✅"
    ],
    "trap": "11/20 counts 12 twice."
   }
  ],
  "words": [
   [
    "Probability",
    "概率",
    "The chance something happens, from 0 (never) to 1 (always).",
    "A fair coin: 1/2 heads"
   ],
   [
    "Outcome / Event",
    "结果 / 事件",
    "Outcome: one possible result. Event: the outcomes you care about.",
    "Event 'even roll' = {2, 4, 6}"
   ],
   [
    "Equally likely",
    "等可能",
    "Every outcome has the same chance.",
    "Each face of a fair die"
   ],
   [
    "Independent",
    "独立",
    "One result doesn't change the other.",
    "Two coin flips"
   ],
   [
    "Without replacement",
    "不放回",
    "The first pick isn't put back, so the second pick has fewer choices.",
    "Drawing 2 marbles"
   ],
   [
    "Complement",
    "对立事件",
    "P(not A) = 1 − P(A).",
    "P(not 6) = 5/6"
   ]
  ]
 }
];
