
from pathlib import Path
import numpy as np
import pandas as pd

# EDUCATIONAL SIMULATION ONLY.
# These generated associations are not medical evidence.

OUT = Path(__file__).parent / "data"
OUT.mkdir(parents=True, exist_ok=True)

rng = np.random.default_rng(42)

symptoms = [
    "fever", "cough", "runny_nose", "headache",
    "stomach_pain", "nausea", "sore_throat", "fatigue"
]

# Synthetic categories for demonstrating ML workflows.
# They must never be used to diagnose real patients.
patterns = {
    "Demo_Fever_Pattern": [0, 3, 7],
    "Demo_Cold_Pattern": [1, 2, 6],
    "Demo_Headache_Pattern": [3, 7],
    "Demo_Stomach_Pattern": [4, 5],
}

rows = []

for category, preferred in patterns.items():
    for _ in range(250):
        x = np.zeros(len(symptoms), dtype=int)

        for j in range(len(symptoms)):
            probability = 0.72 if j in preferred else 0.12
            x[j] = int(rng.random() < probability)

        # Avoid empty feature vectors in this demonstration.
        if x.sum() == 0:
            x[rng.integers(0, len(symptoms))] = 1

        # Artificial educational target, NOT a medical severity score.
        complexity = float(
            np.clip(1 + 1.5 * x.sum() + rng.normal(0, 0.8), 0, 10)
        )

        row = dict(zip(symptoms, x.tolist()))
        row["demo_category"] = category
        row["synthetic_complexity"] = complexity
        rows.append(row)

df = pd.DataFrame(rows)
df.to_csv(OUT / "synthetic_cases.csv", index=False)

print("Created:", OUT / "synthetic_cases.csv")
print("Rows:", len(df))
print(df["demo_category"].value_counts())
print("Reminder: synthetic data is not clinical evidence.")
