
from pathlib import Path
import json
import joblib
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

BASE = Path(__file__).parent
DATA = BASE / "data"
MODELS = BASE / "models"
REPORTS = BASE / "reports"

MEDICINE_FILE = DATA / "medicine_reference.csv"

app = FastAPI(title="Doctor–Drug Assistance | Academic Demo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://doctor-drug-assistance.vercel.app/"
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# Load the existing synthetic models.
try:
    classifier = joblib.load(MODELS / "demo_classifier.joblib")
    regressor = joblib.load(MODELS / "demo_regressor.joblib")
except FileNotFoundError as exc:
    raise RuntimeError(
        "Demo models are missing. Run generate_data.py and train.py first."
    ) from exc


SYMPTOMS = [
    "fever",
    "cough",
    "runny_nose",
    "headache",
    "stomach_pain",
    "nausea",
    "sore_throat",
    "fatigue",
]

# This is text-search configuration for an educational reference catalog.
# It is NOT a clinical symptom-to-drug recommendation map.
#
# Only explicit words in a medicine's recorded-use field are searched.
# Do not add broad guesses or use the result to select treatment.
SYMPTOM_SEARCH_TERMS = {
    "fever": ["fever"],
    "cough": ["cough"],
    "runny_nose": ["runny nose", "nasal discharge"],
    "headache": ["headache"],
    "stomach_pain": ["stomach pain", "abdominal pain"],
    "nausea": ["nausea"],
    "sore_throat": ["sore throat"],
    "fatigue": ["fatigue"],
}


class SymptomInput(BaseModel):
    symptoms: list[str] = Field(min_length=1, max_length=8)

    @model_validator(mode="after")
    def validate_symptoms(self):
        if len(set(self.symptoms)) != len(self.symptoms):
            raise ValueError("Duplicate symptoms are not allowed.")

        invalid = set(self.symptoms) - set(SYMPTOMS)
        if invalid:
            raise ValueError(
                f"Unsupported symptom keys: {sorted(invalid)}"
            )

        return self


def load_medicine_data():
    """Load medicine reference records from the CSV."""
    if not MEDICINE_FILE.exists():
        return []

    try:
        df = pd.read_csv(MEDICINE_FILE).fillna("")
        return df.to_dict(orient="records")
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not read medicine reference CSV: {exc}",
        ) from exc


def search_reference_records(selected_symptoms):
    """
    Search the recorded-use text for exact configured terms.

    These are text-search matches only. They do not establish clinical
    relevance, suitability, safety, effectiveness, or dosage.
    """
    records = load_medicine_data()
    matches = []

    selected_terms = []
    for symptom in selected_symptoms:
        selected_terms.extend(SYMPTOM_SEARCH_TERMS.get(symptom, []))

    for record in records:
        recorded_use = str(record.get("approved_use", "")).lower()

        # Ignore empty use fields and unreviewed placeholder descriptions.
        if not recorded_use or recorded_use.startswith("draft:"):
            continue

        matched_terms = [
            term for term in selected_terms
            if term in recorded_use
        ]

        if not matched_terms:
            continue

        matches.append({
            "medicine_id": record.get("medicine_id", ""),
            "generic_name": record.get("generic_name", ""),
            "approved_use": record.get("approved_use", ""),
            "contraindications": record.get("contraindications", ""),
            "source_name": record.get("source_name", ""),
            "source_url": record.get("source_url", ""),
            "review_status": record.get("review_status", "pending"),
            "matched_terms": matched_terms,
            "match_type": "reference_text_search_only",
            "dosage": None,
            "drug_relevance_percentage": None,
        })

    return matches


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "mode": "synthetic educational demo",
    }


@app.get("/api/analysis")
def analysis():
    path = REPORTS / "metrics.json"

    if not path.exists():
        raise HTTPException(
            status_code=503,
            detail="Training metrics unavailable. Run train.py first.",
        )

    return json.loads(path.read_text(encoding="utf-8"))


@app.get("/api/medicines")
def get_medicines():
    """Catalog endpoint for browsing reference records."""
    records = load_medicine_data()

    return {
        "medicines": records,
        "count": len(records),
        "message": (
            "Catalog records are reference data, not treatment "
            "recommendations. Review status must be checked."
        ),
    }


@app.post("/api/assess")
def assess(payload: SymptomInput):
    # Synthetic model prediction only.
    row = {
        symptom: int(symptom in payload.symptoms)
        for symptom in SYMPTOMS
    }
    X = pd.DataFrame([row], columns=SYMPTOMS)

    predicted = str(classifier.predict(X)[0])
    probabilities = classifier.predict_proba(X)[0]
    labels = classifier.classes_

    ranked = sorted(
        [
            {
                "label": str(label),
                "model_score": round(float(score), 4),
            }
            for label, score in zip(labels, probabilities)
        ],
        key=lambda item: item["model_score"],
        reverse=True,
    )

    complexity = float(regressor.predict(X)[0])

    # This searches text in the reference catalog.
    # It is NOT a clinical drug-matching algorithm.
    reference_matches = search_reference_records(payload.symptoms)

    return {
        "mode": "synthetic educational demo",
        "selected_symptoms": payload.symptoms,
        "predicted_demo_category": predicted,
        "category_scores": ranked,
        "synthetic_complexity_estimate": round(complexity, 2),
        "drug_relevance_percentage": None,
        "drug_relevance_status": (
            "Not established. Text-search matches are not validated "
            "clinical drug-relevance scores."
        ),
        "medicine_references": reference_matches,
        "medicine_reference_count": len(reference_matches),
        "medicine_reference_status": (
            "Text matches found; clinical suitability is not established."
            if reference_matches
            else
            "No recorded-use text matches were found for these symptoms."
        ),
        "explanation": (
            "The category is predicted from generated symptom patterns. "
            "Medicine references are filtered by text search only. "
            "Neither output is a clinical diagnosis or treatment recommendation."
        ),
        "warnings": [
            "Do not use this result to select or prescribe a medicine.",
            "Model scores are not probabilities of drug effectiveness.",
            "Text matches do not establish that a medicine treats the selected symptoms.",
            "Dosage is not generated by this system.",
            "A clinician must independently assess the patient.",
        ],
    }
