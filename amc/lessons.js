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
   "Factor tree: keep splitting until every branch ends in a prime.",
   "Count factors fast: write the bricks with powers (72 = 2³ × 3²), add 1 to each power, and multiply: (3+1) × (2+1) = 12 factors.",
   "GCF = the bricks two numbers share. LCM = every brick, using the most of each.",
   "Is n prime? Only test primes up to √n. For 97, test 2, 3, 5, 7 (because 10 × 10 = 100)."
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
    "why": "51 = 3×17, 57 = 3×19, 63 = 7×9, 91 = 7×13. Only 61 is left with no team splits."
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
    "why": "(2+1) × (2+1) = 9: 1, 2, 3, 4, 6, 9, 12, 18, 36."
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
    "why": "84 = 2²×3×7, 126 = 2×3²×7. Shared: 2 × 3 × 7 = 42."
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
    "why": "2² × 3 × 5 = 60. (720 works too, but it isn't the smallest.)"
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
    "why": "360 = 2³ × 3² × 5. Different primes: 2 + 3 + 5 = 10."
   }
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
   "÷3 or ÷9: add the digits. If the digit sum divides by 3 (or 9), so does the number.",
   "÷4: look at the last two digits. ÷8: last three digits. ÷5: ends in 0 or 5.",
   "÷11: alternate add and subtract the digits (1 − 3 + 3 − 1 = 0, so 1331 works).",
   "Odd × odd = odd. Anything × even = even."
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
    "why": "Digit sums: 10, 14, 18, 22, 26. Only 18 divides by 9, so 3456."
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
    "why": "Odd + even = odd. Every other choice has an even part multiplied in."
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
    "why": "11 + d must divide by 3, so d = 1, 4 or 7. Smallest is 1."
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
    "why": "33 + 20 − 6 = 47."
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
    "why": "2 − 4 + 5 − 3 = 0, so 2453 = 11 × 223."
   }
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
   "Base b to normal: multiply each digit by its place value (1, b, b², b³…) and add.",
   "Normal to base b: keep dividing by b and read the remainders from bottom to top.",
   "Two-digit number 'ab' = 10a + b. Reversed 'ba' = 10b + a.",
   "Last digits of powers repeat in a cycle. 7, 9, 3, 1, 7, 9, 3, 1… Find where you land."
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
    "why": "2×9 + 1×3 + 2×1 = 23."
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
    "why": "16, 8, 4, 2, 1 → 1, 1, 0, 0, 1 → 11001."
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
    "why": "2026 ÷ 4 leaves remainder 2, so it's the 2nd in the cycle: 9."
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
    "why": "It equals 9a − 9b = 9(a − b), so 9 always divides it."
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
    "why": "10¹⁰ − 1 is ten 9s in a row, so the digit sum is 90."
   }
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
   "nth term = first + (n − 1) × step.",
   "How many terms? (last − first) ÷ step + 1. Don't forget the +1!",
   "Sum = (first + last) × number of terms ÷ 2.",
   "Repeating patterns: divide the position by the pattern length and look at the remainder."
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
    "why": "3 + 19 × 4 = 79."
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
    "why": "25 terms. (2 + 50) × 25 ÷ 2 = 650."
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
    "why": "Times 3 each step: 54 × 3 = 162."
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
    "why": "1, 1, 2, 3, 5, 8, 13, 21, 34, 55."
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
    "why": "2026 = 5 × 405 + 1. Remainder 1 means the 1st letter: A."
   }
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
   "Ratio a : b → think in 'parts'. Total parts = a + b. One part = total ÷ (a + b).",
   "Find the unit rate first (the price of 1), then scale up.",
   "Average speed = total distance ÷ total time. Never just average the two speeds!",
   "25% off means you pay 75%. A % change always uses the ORIGINAL amount."
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
    "why": "9 parts, so 36 ÷ 9 = 4 per part. Red = 2 × 4 = 8."
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
    "why": "$1.25 ÷ 5 = $0.25 each. 12 × $0.25 = $3.00."
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
    "why": "25% off $40 = $30. 10% of $30 = $3. Total $33."
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
    "why": "3×2 + 6×1 = 12 miles in 3 hours = 4 mph."
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
    "why": "18 painter-hours ÷ 9 painters = 2 hours."
   }
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
   "Turn words into math: 'is' means =, 'of' means ×, 'more than' means +.",
   "Stuck? Try the answer choices. AMC gives you 5, and one of them works.",
   "Always check by plugging your answer back in.",
   "Ages: everyone gets older by the SAME number of years."
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
    "why": "3x = 15, so x = 5."
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
    "why": "Middle = 24, so 23 + 24 + 25. Largest is 25."
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
    "why": "x < 8.5, so x = 1 to 8: eight numbers."
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
    "why": "2(10 − n) + 5n = 35 → 20 + 3n = 35 → n = 5."
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
    "why": "4x − 8 = x + 10 → 3x = 18 → x = 6."
   }
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
   "Total in A or B = A + B − both.",
   "Neither = everyone − (A or B).",
   "Fill the middle (both) first, then the 'only' parts.",
   "'Divisible by 3 or 4' problems are Venn problems too: the middle is the LCM."
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
    "why": "21 have at least one pet, so 25 − 21 = 4."
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
    "why": "22 + 25 − 40 = 7."
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
    "why": "15 + 10 − 5 = 20."
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
    "why": "Both = 18 + 21 − 30 = 9. Art only = 21 − 9 = 12."
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
    "why": "27 + 5 = 32."
   }
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
   "Angle sum = 180°. Isosceles (two equal sides) → two equal base angles.",
   "Area = ½ × base × height. The height must meet the base at a right angle.",
   "Remember the triples: 3-4-5, 5-12-13, 8-15-17, and their doubles (6-8-10).",
   "Similar → set up a ratio: small side / big side is the same for every pair."
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
    "why": "180 − 47 − 68 = 65°."
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
    "why": "25 + 144 = 169, and √169 = 13."
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
    "why": "½ × 10 × 7 = 35."
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
    "why": "140 ÷ 2 = 70°."
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
    "why": "9 ÷ 3 = 3 times bigger. Sides 9, 12, 15. Perimeter 36."
   }
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
   "Inside-angle sum = (n − 2) × 180°.",
   "Regular polygon (all sides equal): each inside angle = sum ÷ n, each outside angle = 360° ÷ n.",
   "Number of diagonals = n × (n − 3) ÷ 2.",
   "Weird area? Cut it into rectangles and triangles, or draw a big box and subtract the extra."
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
    "why": "3 × 180 = 540°."
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
    "why": "360 ÷ 30 = 12."
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
    "why": "6 × 3 ÷ 2 = 9."
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
    "why": "1440 ÷ 10 = 144°."
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
    "why": "48 − 4 × 4 = 32."
   }
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
   "Circumference = 2πr = πd. Area = πr².",
   "A slice (sector) is a fraction of the circle: angle ÷ 360.",
   "Leave answers 'in π' (like 25π). AMC usually does too.",
   "Shaded ring or region = big area − small area."
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
    "why": "r = 5, so the area is 25π."
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
    "why": "r = 6."
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
    "why": "16π ÷ 4 = 4π."
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
    "why": "25π − 9π = 16π."
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
    "why": "π × 2² = 4π versus π × 1² = π. That's 4 times."
   }
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
   "Box: l × w × h. Cube: s³. Cylinder: πr² × h.",
   "Cone and pyramid: ⅓ × base area × height.",
   "Surface area of a cube = 6 × s² (6 square faces).",
   "Make a shape k times bigger and its volume grows k × k × k times."
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
    "why": "4 × 5 × 6 = 120."
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
    "why": "Edge 3. Six faces of 3 × 3 = 9 gives 54."
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
    "why": "4π × 10 = 40π."
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
    "why": "60 ÷ 3 = 20."
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
    "why": "Each of the 12 edges has 1 middle cube with 2 painted faces: 12."
   }
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
   "Total = mean × how many. Most mean problems are really total problems!",
   "Median: SORT first. With an even count, average the middle two.",
   "Adding or removing a number: compare the totals before and after.",
   "Range = biggest − smallest."
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
    "why": "45 ÷ 5 = 9."
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
    "why": "3, 6, 7, 9, 10, 12, 15 → the middle (4th) is 9."
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
    "why": "Before: 100. After: 72. Removed: 28."
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
    "why": "7 appears three times."
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
    "why": "22 − 3 = 19."
   }
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
   "One from each group → multiply.",
   "Arrange n different things in a row: n! = n × (n − 1) × … × 1.",
   "Choose r from n, order doesn't matter: (n × (n − 1) × …, r numbers) ÷ r!.",
   "'At least one' → count everything, then subtract the ones with none."
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
    "why": "4 × 3 × 2 = 24."
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
    "why": "5 × 4 × 3 × 2 × 1 = 120."
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
    "why": "6 × 5 = 30."
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
    "why": "120 ÷ 6 = 20."
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
    "why": "900 total. No 7: 8 × 9 × 9 = 648. 900 − 648 = 252."
   }
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
   "P = good outcomes ÷ all outcomes (when each is equally likely).",
   "Two dice: draw the 6 × 6 table of 36 outcomes.",
   "Independent things in a row → multiply. Without putting back → the second count changes!",
   "P(at least one) = 1 − P(none)."
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
    "why": "2, 3, 5, 7: 4 out of 8 = 1/2."
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
    "why": "(4,6) (5,5) (6,4): 3/36 = 1/12."
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
    "why": "4/10 × 3/9 = 12/90 = 2/15."
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
    "why": "No heads (TTT) = 1/8, so at least one = 1 − 1/8 = 7/8."
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
    "why": "6 + 5 − 1 = 10 numbers. 10/20 = 1/2."
   }
  ]
 }
];
