"""
Transaction categorization engine.
Priority: exact merchant match → keyword rules → AI fallback → Miscellaneous.
"""
import re
from typing import Optional

# ── merchant → category mapping ───────────────────────────────────────────────
MERCHANT_MAP: dict[str, str] = {
    # Food & Dining
    "swiggy": "Food & Dining", "zomato": "Food & Dining",
    "blinkit": "Food & Dining", "dunzo": "Food & Dining",
    "swiggy instamart": "Food & Dining",
    "mcdonald's": "Food & Dining", "mcdonalds": "Food & Dining",
    "domino's": "Food & Dining", "dominos": "Food & Dining",
    "kfc": "Food & Dining", "pizza hut": "Food & Dining",
    "cafe coffee day": "Food & Dining", "ccd": "Food & Dining",
    "starbucks": "Food & Dining", "haldiram's": "Food & Dining",
    "haldirams": "Food & Dining", "subway": "Food & Dining",
    "burger king": "Food & Dining", "barbeque nation": "Food & Dining",
    "behrouz biryani": "Food & Dining", "box8": "Food & Dining",
    "freshmenu": "Food & Dining", "licious": "Food & Dining",
    "faasos": "Food & Dining", "rebel foods": "Food & Dining",

    # Groceries
    "dmart": "Groceries", "reliance fresh": "Groceries",
    "big basket": "Groceries", "bigbasket": "Groceries",
    "spencer's": "Groceries", "spencers": "Groceries",
    "more supermarket": "Groceries", "zepto": "Groceries",
    "nature's basket": "Groceries", "natures basket": "Groceries",
    "jiomart": "Groceries", "grofers": "Groceries",
    "star bazaar": "Groceries", "hypercity": "Groceries",
    "vishal mega mart": "Groceries",

    # Shopping
    "amazon": "Shopping", "flipkart": "Shopping",
    "myntra": "Shopping", "ajio": "Shopping",
    "nykaa": "Shopping", "meesho": "Shopping",
    "tata cliq": "Shopping", "tatacliq": "Shopping",
    "snapdeal": "Shopping", "shopclues": "Shopping",
    "jabong": "Shopping", "westside": "Shopping",
    "max fashion": "Shopping", "pantaloons": "Shopping",
    "shoppers stop": "Shopping", "lifestyle": "Shopping",
    "h&m": "Shopping", "zara": "Shopping", "uniqlo": "Shopping",
    "croma": "Shopping", "vijay sales": "Shopping",
    "reliance digital": "Shopping", "apple": "Shopping",

    # Travel
    "uber": "Travel", "ola": "Travel", "rapido": "Travel",
    "namma yatri": "Travel", "bmtc": "Travel",
    "irctc": "Travel", "makemytrip": "Travel",
    "goibibo": "Travel", "yatra": "Travel",
    "cleartrip": "Travel", "ixigo": "Travel",
    "redbus": "Travel", "abhibus": "Travel",
    "oyo": "Travel", "treebo": "Travel",
    "fabhotels": "Travel", "airbnb": "Travel",

    # Fuel
    "indian oil": "Fuel", "indianoil": "Fuel",
    "hp petrol pump": "Fuel", "hpcl": "Fuel",
    "bpcl": "Fuel", "shell": "Fuel",
    "essar oil": "Fuel", "reliance petroleum": "Fuel",

    # Utilities
    "bescom": "Utilities", "bwssb": "Utilities",
    "airtel": "Utilities", "jio": "Utilities",
    "vi mobile": "Utilities", "vodafone": "Utilities",
    "idea": "Utilities", "bsnl": "Utilities",
    "tata sky": "Utilities", "dish tv": "Utilities",
    "sun direct": "Utilities", "igl": "Utilities",
    "piped gas": "Utilities", "mahanagar gas": "Utilities",
    "tata power": "Utilities", "adani electricity": "Utilities",

    # Entertainment
    "netflix": "Entertainment", "amazon prime": "Entertainment",
    "hotstar": "Entertainment", "disney+": "Entertainment",
    "spotify": "Entertainment", "youtube premium": "Entertainment",
    "sonyliv": "Entertainment", "zee5": "Entertainment",
    "voot": "Entertainment", "mxplayer": "Entertainment",
    "bookmyshow": "Entertainment", "pvr": "Entertainment",
    "inox": "Entertainment", "cinepolis": "Entertainment",

    # Healthcare
    "apollo pharmacy": "Healthcare", "medplus": "Healthcare",
    "netmeds": "Healthcare", "1mg": "Healthcare",
    "pharmeasy": "Healthcare", "practo": "Healthcare",
    "lenskart": "Healthcare", "dr. lal pathlabs": "Healthcare",
    "dr lal pathlabs": "Healthcare", "thyrocare": "Healthcare",
    "manipal hospital": "Healthcare", "apollo hospitals": "Healthcare",
    "fortis": "Healthcare", "max healthcare": "Healthcare",
    "cloudnine": "Healthcare", "cure.fit": "Healthcare",

    # Education
    "udemy": "Education", "coursera": "Education",
    "icai": "Education", "unacademy": "Education",
    "byju's": "Education", "byjus": "Education",
    "vedantu": "Education", "khan academy": "Education",
    "great learning": "Education", "upgrad": "Education",
    "simplilearn": "Education",

    # Insurance
    "lic": "Insurance", "hdfc life": "Insurance",
    "icici prudential": "Insurance", "sbi life": "Insurance",
    "max life": "Insurance", "star health": "Insurance",
    "niva bupa": "Insurance", "care health": "Insurance",
    "hdfc ergo": "Insurance", "bajaj allianz": "Insurance",
    "tata aig": "Insurance", "new india assurance": "Insurance",

    # Investments
    "zerodha": "Investments", "groww": "Investments",
    "upstox": "Investments", "coin": "Investments",
    "axis mutual fund": "Investments", "mirae asset": "Investments",
    "parag parikh": "Investments", "sbi mutual fund": "Investments",
    "hdfc mutual fund": "Investments", "icici prudential mf": "Investments",
    "nse": "Investments", "bse": "Investments",
    "national pension system": "Investments", "nps": "Investments",
    "ppf": "Investments", "ssy": "Investments",

    # Salary / Income
    "salary": "Salary", "payroll": "Salary",

    # Rent
    "rent": "Rent",
}

# ── keyword rules for description matching ────────────────────────────────────
KEYWORD_RULES: list[tuple[str, str]] = [
    # pattern → category  (checked in order; first match wins)
    (r"\bsalary\b|\bpayroll\b|\bctc\b",                    "Salary"),
    (r"\bfreelance\b|\bconsulting fee\b|\bclient payment\b","Business Income"),
    (r"\binterest credit\b|\bdividend\b",                   "Business Income"),
    (r"\bsip\b|\bmutual fund\b|\bdemat\b|\bzerodha\b|\bgroww\b|\bupstox\b", "Investments"),
    (r"\binsurance\b|\bpremium\b|\bterm plan\b",            "Insurance"),
    (r"\bemi\b|\bhome loan\b|\bpersonal loan\b|\bcar loan\b|\brepayment\b", "EMI"),
    (r"\brent\b|\blease\b|\bpg\b|\bpaying guest\b",        "Rent"),
    (r"\bswiggy\b|\bzomato\b|\bblinkit\b|\bdunzo\b|\bfood order\b|\brestaurant\b|\bcafe\b|\bdining\b|\bquick bite\b", "Food & Dining"),
    (r"\bdmart\b|\breliance fresh\b|\bbig basket\b|\bzepto\b|\bgrocery\b|\bsupermarket\b|\bvegetable\b|\bfruit\b", "Groceries"),
    (r"\bamazon\b|\bflipkart\b|\bmyntra\b|\bajio\b|\bonline purchase\b|\bshopping\b", "Shopping"),
    (r"\buber\b|\bola\b|\brapido\b|\birctc\b|\bmakemytrip\b|\bflight\b|\btrain\b|\bhotel\b|\btaxi\b|\bbus\b|\btravel\b", "Travel"),
    (r"\bpetrol\b|\bdiesel\b|\bfuel\b|\bgas station\b|\bpetrol pump\b",    "Fuel"),
    (r"\belectricity\b|\bbescom\b|\bbwssb\b|\bwater bill\b|\bgas bill\b|\bbroadband\b|\bmobile recharge\b|\brecharge\b|\bpostpaid\b|\butility\b", "Utilities"),
    (r"\bnetflix\b|\bspotify\b|\bhotstar\b|\bamazon prime\b|\bsubscription\b|\bmovie\b|\bcinema\b|\bpvr\b|\binox\b", "Entertainment"),
    (r"\bpharmacy\b|\bmedicine\b|\bdoctor\b|\bclinic\b|\bhospital\b|\bhealth\b|\bpathlab\b|\bblood test\b|\bconsultation\b", "Healthcare"),
    (r"\beducation\b|\bcourse\b|\btuition\b|\bcollege\b|\bschool\b|\bicai\b|\budemy\b|\bcoursera\b",  "Education"),
    (r"\batm\b|\bcash withdrawal\b|\bwithdrawal\b",         "Cash Withdrawal"),
    (r"\btax\b|\badvance tax\b|\bgst\b|\btds\b|\bincome tax\b",            "Taxes"),
    (r"\btransfer\b|\bneft\b|\bimps\b|\brtgs\b|\bupi.*pay\b|\bpay.*upi\b|\bcredit card bill\b|\bcc bill\b", "Transfers"),
]

_COMPILED = [(re.compile(pat, re.IGNORECASE), cat) for pat, cat in KEYWORD_RULES]


def categorize(description: str, merchant: str = "") -> str:
    """
    Returns the best-guess category for a transaction.
    1. Exact merchant lookup
    2. Keyword scan of description + merchant
    3. Falls back to 'Miscellaneous'
    """
    combined = f"{(merchant or '').lower()} {(description or '').lower()}"

    # Step 1: merchant map
    mer_lower = (merchant or "").lower().strip()
    if mer_lower and mer_lower in MERCHANT_MAP:
        return MERCHANT_MAP[mer_lower]

    # Step 2: keyword rules
    for pattern, cat in _COMPILED:
        if pattern.search(combined):
            return cat

    return "Miscellaneous"


def extract_merchant(description: str) -> str:
    """
    Tries to pull a known merchant name from the description.
    UPI descriptions often follow the pattern 'UPI/<Merchant>/...'
    """
    if not description:
        return ""

    # UPI pattern: UPI/MerchantName/...
    m = re.match(r"(?:UPI|upi)[/\s]+([^/\s][^/]+?)(?:/|$)", description)
    if m:
        candidate = m.group(1).strip()
        if candidate.lower() in MERCHANT_MAP:
            return candidate

    # Check if any known merchant name appears in the description
    desc_lower = description.lower()
    for mer in MERCHANT_MAP:
        if len(mer) > 3 and mer in desc_lower:
            return mer.title()

    return ""


async def ai_categorize(description: str, merchant: str, api_key: str, base_url: str, model: str) -> str:
    """
    Calls an OpenAI-compatible API to categorize a transaction.
    Only called if no rule matched AND an API key is available.
    """
    import httpx
    categories = [
        "Salary", "Business Income", "Food & Dining", "Groceries", "Shopping",
        "Fuel", "Travel", "Utilities", "Rent", "EMI", "Insurance", "Investments",
        "Healthcare", "Education", "Entertainment", "Transfers", "Cash Withdrawal",
        "Taxes", "Miscellaneous",
    ]
    prompt = (
        f"Categorize this Indian bank transaction into exactly one of these categories:\n"
        f"{', '.join(categories)}\n\n"
        f"Description: {description}\nMerchant: {merchant or 'unknown'}\n\n"
        f"Reply with ONLY the category name, nothing else."
    )
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{base_url}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={"model": model, "messages": [{"role": "user", "content": prompt}], "max_tokens": 20},
            )
            result = resp.json()["choices"][0]["message"]["content"].strip()
            return result if result in categories else "Miscellaneous"
    except Exception:
        return "Miscellaneous"
