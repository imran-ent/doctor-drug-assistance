
from pathlib import Path
from urllib.parse import quote

import pandas as pd

# Create the data directory
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = DATA_DIR / "medicine_reference.csv"

COLUMNS = [
    "medicine_id",
    "generic_name",
    "approved_use",
    "contraindications",
    "source_name",
    "source_url",
    "review_status",
    "reviewer",
    "review_date",
    "data_type",
]

# Starter records only. Clinical details must be verified against
# the specific product's official drug label before approval.
MEDICINES = [
    {
        "name": "Paracetamol",
        "use": "Draft: pain and fever relief.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Amoxicillin",
        "use": "Draft: treatment of certain susceptible bacterial infections.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Metformin",
        "use": "Draft: blood glucose management in type 2 diabetes.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Atorvastatin",
        "use": "Draft: cholesterol management and cardiovascular risk reduction.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Omeprazole",
        "use": "Draft: acid-related gastrointestinal conditions.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Ibuprofen",
        "use": "Draft: pain, fever, and inflammation relief.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Lisinopril",
        "use": "Draft: hypertension and selected cardiovascular conditions.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Amlodipine",
        "use": "Draft: hypertension and certain types of angina.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Albuterol",
        "use": "Draft: relief of bronchospasm in selected respiratory conditions.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Gabapentin",
        "use": "Draft: selected seizure disorders and neuropathic pain conditions.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Hydrochlorothiazide",
        "use": "Draft: hypertension and selected fluid-retention conditions.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Sertraline",
        "use": "Draft: selected depressive and anxiety-related disorders.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Losartan",
        "use": "Draft: hypertension and selected cardiovascular or kidney conditions.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Levothyroxine",
        "use": "Draft: thyroid hormone replacement for hypothyroidism.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Azithromycin",
        "use": "Draft: selected infections caused by susceptible bacteria.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Ciprofloxacin",
        "use": "Draft: selected infections caused by susceptible bacteria.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Metoprolol",
        "use": "Draft: selected cardiovascular conditions.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Prednisone",
        "use": "Draft: selected inflammatory and immune-related conditions.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Clopidogrel",
        "use": "Draft: prevention of certain blood-clot-related cardiovascular events.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Montelukast",
        "use": "Draft: selected asthma and allergic-rhinitis indications.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Pantoprazole",
        "use": "Draft: selected acid-related gastrointestinal conditions.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Escitalopram",
        "use": "Draft: selected depressive and anxiety-related disorders.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Rosuvastatin",
        "use": "Draft: cholesterol management and cardiovascular risk reduction.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Furosemide",
        "use": "Draft: selected fluid-retention conditions.",
        "contraindications": "Pending verification against the specific product label.",
    },
    {
        "name": "Doxycycline",
        "use": "Draft: selected infections caused by susceptible organisms.",
        "contraindications": "Pending verification against the specific product label.",
    },
]

rows = []

for number, medicine in enumerate(MEDICINES, start=1):
    name = medicine["name"]

    # Opens a DailyMed search for this drug, not a claim that
    # this particular record has already been verified.
    source_url = (
        "https://dailymed.nlm.nih.gov/dailymed/search.cfm?query="
        + quote(name)
    )

    rows.append({
        "medicine_id": f"MED{number:03d}",
        "generic_name": name,
        "approved_use": medicine["use"],
        "contraindications": medicine["contraindications"],
        "source_name": "DailyMed search - verification required",
        "source_url": source_url,
        "review_status": "pending",
        "reviewer": "",
        "review_date": "",
        "data_type": "draft_reference_pending_review",
    })

df = pd.DataFrame(rows, columns=COLUMNS)

# Avoid accidentally duplicating medicine names.
df = df.drop_duplicates(
    subset=["generic_name"],
    keep="first"
)

df.to_csv(OUTPUT_FILE, index=False)

print(f"Created: {OUTPUT_FILE}")
print(f"Unique medicine records: {len(df)}")
print("Review status: All records are pending")
print("\nSample records:")
print(df[["medicine_id", "generic_name", "review_status"]].head())
