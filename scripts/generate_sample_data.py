"""
MoneyMirror – Sample Data Generator (Phase 0)
Generates ~1,500 realistic Indian personal finance transactions over 6 months.
Output: backend/data/sample_transactions.csv  (unified transaction schema)
Run:    python scripts/generate_sample_data.py
No extra packages needed — pure Python standard library.
"""

import csv
import random
import os
import calendar
from datetime import date, timedelta
from dataclasses import dataclass, fields
from collections import Counter

random.seed(42)

# ── date helpers ──────────────────────────────────────────────────────────────
START_DATE = date(2025, 1, 1)
END_DATE   = date(2025, 6, 30)
MONTHS     = [(2025, m) for m in range(1, 7)]   # Jan–Jun 2025

def rand_date_in_month(year: int, month: int) -> date:
    last = calendar.monthrange(year, month)[1]
    return date(year, month, random.randint(1, last))

def pick(lst):
    return random.choice(lst)

def ramt(lo: float, hi: float) -> float:
    return round(random.uniform(lo, hi), 2)

def small_upi(lo=20, hi=199) -> float:
    return round(random.uniform(lo, hi), 2)

# ── schema ────────────────────────────────────────────────────────────────────
@dataclass
class Txn:
    date:        str
    description: str
    amount:      float
    type:        str       # debit | credit
    source:      str       # UPI | NEFT | IMPS | Credit Card | Salary | Cash | SIP | EMI
    account:     str       # HDFC Savings | SBI Savings | HDFC Credit Card
    category:    str
    merchant:    str

def mkr(d, desc, amt, typ, src, acc, cat, mer) -> Txn:
    return Txn(str(d), desc, round(float(amt), 2), typ, src, acc, cat, mer)

ACCOUNTS = ["HDFC Savings", "SBI Savings"]
CC       = "HDFC Credit Card"

# ── merchant tables ───────────────────────────────────────────────────────────
FOOD_UPI = [
    ("Swiggy", 180, 650), ("Zomato", 200, 750), ("Swiggy Instamart", 300, 900),
    ("Blinkit", 250, 800), ("Dunzo", 150, 500), ("McDonald's", 180, 480),
    ("Domino's", 250, 700), ("KFC", 200, 550), ("Cafe Coffee Day", 120, 350),
    ("Starbucks", 250, 600), ("Haldiram's", 150, 400), ("Subway", 180, 450),
]
GROCERY_UPI = [
    ("DMart", 800, 3500), ("Reliance Fresh", 400, 2200), ("Big Basket", 500, 3000),
    ("Spencer's", 300, 1800), ("More Supermarket", 400, 2000),
    ("Zepto", 200, 1200), ("Nature's Basket", 600, 2500),
]
SHOPPING_ONLINE = [
    ("Amazon", 299, 8000), ("Flipkart", 399, 6000), ("Myntra", 499, 3500),
    ("Ajio", 399, 2500), ("Nykaa", 250, 2000), ("Meesho", 199, 1500),
    ("Tata Cliq", 599, 5000),
]
TRAVEL_UPI = [
    ("Uber", 80, 650), ("Ola", 80, 600), ("Rapido", 40, 250),
    ("Namma Yatri", 60, 300), ("BMTC", 10, 60),
    ("IRCTC", 200, 2500), ("MakeMyTrip", 1500, 18000), ("Goibibo", 1200, 15000),
]
FUEL_LIST = [
    ("Indian Oil", 500, 3500), ("HP Petrol Pump", 500, 3500),
    ("BPCL", 500, 3500), ("Shell", 600, 3500),
]
UTILITY_LIST = [
    ("BESCOM", 900, 2200), ("Airtel Mobile", 299, 599),
    ("Jio Broadband", 699, 999), ("Piped Gas (IGL)", 350, 750),
]
ENTERTAINMENT_LIST = [
    ("Netflix", 649, 649), ("Amazon Prime", 179, 179),
    ("Hotstar", 299, 499), ("Spotify", 119, 119),
    ("YouTube Premium", 189, 189), ("SonyLIV", 199, 299),
    ("BookMyShow", 150, 1200), ("PVR Cinemas", 200, 1200),
]
HEALTHCARE_LIST = [
    ("Apollo Pharmacy", 200, 2500), ("MedPlus", 150, 2000),
    ("Practo", 200, 1500), ("Lenskart", 800, 5000),
    ("Dr. Lal PathLabs", 300, 3000), ("Manipal Hospital", 500, 8000),
    ("Thyrocare", 299, 1999),
]
EDUCATION_LIST = [
    ("Udemy", 399, 2999), ("Coursera", 799, 2999),
    ("ICAI Online", 500, 3000), ("Unacademy", 999, 4999),
]

FOOD_SET    = {m for m, _, _ in FOOD_UPI}
GROCERY_SET = {m for m, _, _ in GROCERY_UPI}
TRAVEL_SET  = {m for m, _, _ in TRAVEL_UPI}

def infer_cat(merchant: str) -> str:
    if merchant in FOOD_SET:    return "Food & Dining"
    if merchant in GROCERY_SET: return "Groceries"
    if merchant in TRAVEL_SET:  return "Travel"
    return "Miscellaneous"

# ── build transactions ────────────────────────────────────────────────────────
txns: list[Txn] = []
add = txns.append

# 1. SALARY (1st–3rd of every month)
# Persona: Senior Software Engineer / CA Manager, 8 years exp, Bengaluru
MONTHLY_SALARY = 2_00_000   # Senior professional / CA manager, Bengaluru
for y, m in MONTHS:
    d = date(y, m, random.randint(1, 3))
    add(mkr(d, "Salary Credit - TechCorp Solutions Pvt Ltd", MONTHLY_SALARY,
            "credit", "NEFT", "HDFC Savings", "Salary", "TechCorp Solutions"))

# 2. RENT (1st–5th)
for y, m in MONTHS:
    d = date(y, m, random.randint(1, 5))
    add(mkr(d, "Rent Payment - Prestige Residency", 22_000,
            "debit", "NEFT", "HDFC Savings", "Rent", "Prestige Residency"))

# 3. HOME LOAN EMI (5th)
for y, m in MONTHS:
    add(mkr(date(y, m, 5), "Home Loan EMI - HDFC Bank HL2023", 18_450,
            "debit", "EMI", "HDFC Savings", "EMI", "HDFC Bank"))

# 4. PERSONAL LOAN EMI (10th)
for y, m in MONTHS:
    add(mkr(date(y, m, 10), "Personal Loan EMI - ICICI Bank PL2024", 6_200,
            "debit", "EMI", "HDFC Savings", "EMI", "ICICI Bank"))

# 5. SIPs – three mutual funds (7th)
SIPS = [
    ("SIP - Axis Bluechip Fund",   3_000, "Axis Bluechip Fund"),
    ("SIP - Mirae Asset ELSS",     2_000, "Mirae Asset ELSS"),
    ("SIP - Parag Parikh Flexi",   5_000, "Parag Parikh Flexi Cap"),
]
for y, m in MONTHS:
    for desc, amt, mer in SIPS:
        add(mkr(date(y, m, 7), desc, amt, "debit", "SIP", "HDFC Savings", "Investments", mer))

# 6. INSURANCE PREMIUMS
insurance_txns = [
    (date(2025, 1, 15), "Term Insurance Premium - LIC",         14_500, "LIC"),
    (date(2025, 1, 20), "Health Insurance - Star Health Annual", 12_800, "Star Health"),
    (date(2025, 4, 15), "Term Insurance Premium - LIC",         14_500, "LIC"),
    (date(2025, 4, 20), "Health Insurance - Star Health Annual", 12_800, "Star Health"),
    (date(2025, 1, 22), "Vehicle Insurance - Bajaj Allianz",     5_200,  "Bajaj Allianz"),
]
for d, desc, amt, mer in insurance_txns:
    add(mkr(d, desc, amt, "debit", "NEFT", "HDFC Savings", "Insurance", mer))

# 7. FOOD & DINING
for y, m in MONTHS:
    for _ in range(random.randint(6, 10)):
        mer, lo, hi = pick(FOOD_UPI)
        add(mkr(rand_date_in_month(y, m), f"UPI/{mer}/Food Order", ramt(lo, hi),
                "debit", "UPI", pick(ACCOUNTS), "Food & Dining", mer))
    for _ in range(random.randint(4, 8)):   # small-ticket impulse
        mer, _, _ = pick(FOOD_UPI[:6])
        add(mkr(rand_date_in_month(y, m), f"UPI/{mer}/Quick Bite", small_upi(40, 199),
                "debit", "UPI", pick(ACCOUNTS), "Food & Dining", mer))

# 8. GROCERIES
for y, m in MONTHS:
    for _ in range(random.randint(4, 6)):
        mer, lo, hi = pick(GROCERY_UPI)
        add(mkr(rand_date_in_month(y, m), f"UPI/{mer}/Grocery", ramt(lo, hi),
                "debit", "UPI", pick(ACCOUNTS), "Groceries", mer))

# 9. ONLINE SHOPPING
for y, m in MONTHS:
    for _ in range(random.randint(5, 8)):
        mer, lo, hi = pick(SHOPPING_ONLINE)
        src = random.choice(["UPI", "Credit Card"])
        acc = CC if src == "Credit Card" else pick(ACCOUNTS)
        add(mkr(rand_date_in_month(y, m), f"{mer}/Online Purchase", ramt(lo, hi),
                "debit", src, acc, "Shopping", mer))

# 10. TRAVEL – daily commute
for y, m in MONTHS:
    for _ in range(random.randint(10, 15)):
        mer, lo, hi = pick(TRAVEL_UPI[:4])
        add(mkr(rand_date_in_month(y, m), f"UPI/{mer}/Ride", ramt(lo, hi),
                "debit", "UPI", pick(ACCOUNTS), "Travel", mer))
    for _ in range(random.randint(3, 6)):
        add(mkr(rand_date_in_month(y, m), "UPI/BMTC/Bus Ticket", small_upi(10, 60),
                "debit", "UPI", pick(ACCOUNTS), "Travel", "BMTC"))

# 11. GOA TRIP (March)
goa_trip = [
    (date(2025, 3, 14), "MakeMyTrip/Flight BLR-GOA",     4_850, "Travel",        "MakeMyTrip"),
    (date(2025, 3, 14), "MakeMyTrip/Hotel Goa 3 Nights", 9_200, "Travel",        "MakeMyTrip"),
    (date(2025, 3, 15), "Uber/Goa Airport Transfer",        450, "Travel",        "Uber"),
    (date(2025, 3, 15), "Fisherman's Wharf/Dinner",       2_100, "Food & Dining", "Fisherman's Wharf"),
    (date(2025, 3, 16), "Calangute/Water Sports",         1_800, "Entertainment", "Calangute Sports"),
    (date(2025, 3, 17), "Goa Bazaar/Souvenirs",           1_200, "Shopping",      "Goa Bazaar"),
    (date(2025, 3, 17), "Uber/Hotel to Airport",            520, "Travel",        "Uber"),
]
for d, desc, amt, cat, mer in goa_trip:
    add(mkr(d, desc, amt, "debit", "Credit Card", CC, cat, mer))

# 12. FUEL
for y, m in MONTHS:
    for _ in range(random.randint(2, 3)):
        mer, lo, hi = pick(FUEL_LIST)
        add(mkr(rand_date_in_month(y, m), f"UPI/{mer}/Fuel", ramt(lo, hi),
                "debit", "UPI", pick(ACCOUNTS), "Fuel", mer))

# 13. UTILITIES
for y, m in MONTHS:
    for mer, lo, hi in UTILITY_LIST:
        add(mkr(rand_date_in_month(y, m), f"Bill/{mer}", ramt(lo, hi),
                "debit", "UPI", pick(ACCOUNTS), "Utilities", mer))
    if m % 2 == 0:
        add(mkr(rand_date_in_month(y, m), "BWSSB/Water Bill", ramt(250, 550),
                "debit", "UPI", pick(ACCOUNTS), "Utilities", "BWSSB"))

# 14. ENTERTAINMENT / SUBSCRIPTIONS
SUBSCRIPTIONS = [("Netflix", 649), ("Spotify", 119), ("Amazon Prime", 179), ("YouTube Premium", 189)]
for y, m in MONTHS:
    for mer, amt in SUBSCRIPTIONS:
        add(mkr(rand_date_in_month(y, m), f"Subscription/{mer}", amt,
                "debit", "Credit Card", CC, "Entertainment", mer))
    if random.random() > 0.4:
        mer, lo, hi = pick(ENTERTAINMENT_LIST[-2:])
        add(mkr(rand_date_in_month(y, m), f"{mer}/Movie Tickets", ramt(lo, hi),
                "debit", "Credit Card", CC, "Entertainment", mer))

# 15. HEALTHCARE (sporadic events)
healthcare_txns = [
    (date(2025, 2, 12), "Apollo Pharmacy/Medicines",       850,  "Apollo Pharmacy"),
    (date(2025, 2, 14), "Practo/Doctor Consultation",      400,  "Practo"),
    (date(2025, 3, 5),  "Dr. Lal PathLabs/Blood Test",     780,  "Dr. Lal PathLabs"),
    (date(2025, 4, 18), "Manipal Hospital/OPD Visit",    1_200,  "Manipal Hospital"),
    (date(2025, 4, 19), "Apollo Pharmacy/Prescription",    620,  "Apollo Pharmacy"),
    (date(2025, 5, 22), "Thyrocare/Full Body Checkup",   1_999,  "Thyrocare"),
    (date(2025, 6, 8),  "Lenskart/Spectacles",           4_200,  "Lenskart"),
    (date(2025, 6, 10), "MedPlus/Vitamins & Supplements",  340,  "MedPlus"),
]
for d, desc, amt, mer in healthcare_txns:
    add(mkr(d, desc, amt, "debit", "UPI", pick(ACCOUNTS), "Healthcare", mer))

# 16. EDUCATION (random months)
for y, m in MONTHS:
    if random.random() > 0.65:
        mer, lo, hi = pick(EDUCATION_LIST)
        add(mkr(rand_date_in_month(y, m), f"{mer}/Online Course", ramt(lo, hi),
                "debit", "Credit Card", CC, "Education", mer))

# 17. CREDIT CARD BILL PAYMENT (15th)
for y, m in MONTHS:
    add(mkr(date(y, m, 15), "Credit Card Bill Payment - HDFC CC", ramt(12_000, 28_000),
            "debit", "NEFT", "HDFC Savings", "Transfers", "HDFC Credit Card"))

# 18. ATM / CASH WITHDRAWALS
for y, m in MONTHS:
    for _ in range(random.randint(1, 3)):
        add(mkr(rand_date_in_month(y, m), "ATM Withdrawal - HDFC Bank", ramt(2_000, 10_000),
                "debit", "Cash", "HDFC Savings", "Cash Withdrawal", "HDFC ATM"))

# 19. UPI TRANSFERS (split bills, money to friends)
friend_names = ["Rahul S", "Priya K", "Vikram M", "Sneha R", "Ankit J", "Pooja N"]
for y, m in MONTHS:
    for _ in range(random.randint(5, 10)):
        name = pick(friend_names)
        add(mkr(rand_date_in_month(y, m), f"UPI/Pay/{name}", small_upi(50, 1500),
                "debit", "UPI", pick(ACCOUNTS), "Transfers", name))
    for _ in range(random.randint(2, 4)):
        name = pick(friend_names)
        add(mkr(rand_date_in_month(y, m), f"UPI/Received/{name}", small_upi(100, 2000),
                "credit", "UPI", pick(ACCOUNTS), "Transfers", name))

# 20. ADVANCE TAX
for d, amt in [(date(2025, 3, 14), 8_500), (date(2025, 6, 14), 9_200)]:
    add(mkr(d, "Advance Tax Payment - Income Tax Dept", amt,
            "debit", "NEFT", "HDFC Savings", "Taxes", "Income Tax Dept"))

# 21. MISCELLANEOUS
for y, m in MONTHS:
    add(mkr(rand_date_in_month(y, m), "UPI/EasyPark/Parking Fee", small_upi(30, 150),
            "debit", "UPI", pick(ACCOUNTS), "Miscellaneous", "EasyPark"))
    if random.random() > 0.5:
        add(mkr(rand_date_in_month(y, m), "UPI/GiveIndia/Donation", ramt(500, 2000),
                "debit", "UPI", pick(ACCOUNTS), "Miscellaneous", "GiveIndia"))
    add(mkr(rand_date_in_month(y, m), "Mobile Recharge/Jio", ramt(239, 499),
            "debit", "UPI", pick(ACCOUNTS), "Utilities", "Jio"))

# 22. FREELANCE INCOME (CA-style consulting)
freelance_txns = [
    (date(2025, 2, 20), "Freelance/Tax Filing - Client A",      8_000),
    (date(2025, 3, 28), "Freelance/GST Return - Client B",      5_500),
    (date(2025, 5, 10), "Freelance/Financial Audit - Client C", 12_000),
]
for d, desc, amt in freelance_txns:
    add(mkr(d, desc, amt, "credit", "NEFT", "HDFC Savings", "Business Income", "Freelance Client"))

# 23. BANK INTEREST & DIVIDENDS
for y, m in [(2025, 3), (2025, 6)]:
    add(mkr(date(y, m, 30), "Interest Credit - HDFC Savings", ramt(180, 450),
            "credit", "Bank Credit", "HDFC Savings", "Business Income", "HDFC Bank"))
    add(mkr(date(y, m, 28), "Mutual Fund Dividend - Axis", ramt(200, 800),
            "credit", "Bank Credit", "HDFC Savings", "Investments", "Axis Mutual Fund"))

# 24. PAD TO ~1,500 with balanced UPI noise across categories
# Weight: Food 30%, Groceries 15%, Travel 35%, Fuel 10%, Misc 10%
print(f"Base transactions: {len(txns)}")
shortfall  = max(0, 1_500 - len(txns))
print(f"Generating {shortfall} UPI noise transactions to reach 1,500 target...")

# Weighted noise pool: (merchant_tuple, weight, small_ticket_cap)
NOISE_POOLS = [
    (FOOD_UPI,     0.30, True),    # food — many small orders
    ([(m, lo, min(hi, 800)) for m, lo, hi in GROCERY_UPI[:4]], 0.10, False),  # grocery — capped
    (TRAVEL_UPI[:4], 0.40, True), # rides — lots of small ones
    (FUEL_LIST,    0.10, False),   # fuel — medium
    ([(f"UPI Misc {i}", 30, 300) for i in range(5)], 0.10, True),  # misc
]

def weighted_pick():
    r = random.random()
    cumul = 0.0
    for pool, weight, small in NOISE_POOLS:
        cumul += weight
        if r <= cumul:
            if pool and isinstance(pool[0], tuple) and len(pool[0]) == 3:
                mer, lo, hi = pick(pool)
            else:
                mer, lo, hi = pick(pool)
            return mer, lo, hi, small
    mer, lo, hi = pick(FOOD_UPI)
    return mer, lo, hi, True

for _ in range(shortfall):
    y, m = pick(MONTHS)
    mer, lo, hi, can_be_small = weighted_pick()
    is_small = can_be_small and (random.random() < 0.35)
    amt  = small_upi(30, min(190, hi)) if is_small else ramt(max(lo, 50), hi)
    desc = f"UPI/{mer}/" + random.choice(["Pay", "Order", "Purchase", "Quick Pay"])
    add(mkr(rand_date_in_month(y, m), desc, amt,
            "debit", "UPI", pick(ACCOUNTS), infer_cat(mer), mer))

# ── sort + write CSV ──────────────────────────────────────────────────────────
txns.sort(key=lambda x: x.date)

out_dir  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend", "data")
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "sample_transactions.csv")

COLS = [f.name for f in fields(Txn)]
with open(out_path, "w", newline="", encoding="utf-8") as fh:
    writer = csv.DictWriter(fh, fieldnames=COLS)
    writer.writeheader()
    for txn in txns:
        writer.writerow({f.name: getattr(txn, f.name) for f in fields(Txn)})

print(f"\n✓ Done! Wrote {len(txns):,} transactions → {out_path}")

cats = Counter(txn.category for txn in txns)
print("\nCategory breakdown:")
for cat, cnt in sorted(cats.items(), key=lambda x: -x[1]):
    print(f"  {cat:<25} {cnt:>5} txns")

cred = sum(t.amount for t in txns if t.type == "credit")
deb  = sum(t.amount for t in txns if t.type == "debit")
print(f"\nTotal Credits : ₹{cred:>12,.2f}")
print(f"Total Debits  : ₹{deb:>12,.2f}")
print(f"Net Cash Flow : ₹{cred - deb:>12,.2f}")
