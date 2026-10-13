
from pathlib import Path
import json
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    mean_absolute_error, mean_squared_error, r2_score,
)

BASE = Path(__file__).parent
DATA = BASE / "data" / "synthetic_cases.csv"
MODELS = BASE / "models"
REPORTS = BASE / "reports"

MODELS.mkdir(exist_ok=True)
REPORTS.mkdir(exist_ok=True)

df = pd.read_csv(DATA)

symptoms = [
    "fever", "cough", "runny_nose", "headache",
    "stomach_pain", "nausea", "sore_throat", "fatigue"
]

X = df[symptoms]
y = df["demo_category"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

classifier = make_pipeline(
    StandardScaler(),
    LogisticRegression(max_iter=1000)
)
classifier.fit(X_train, y_train)

pred = classifier.predict(X_test)

classification = {
    "accuracy": float(accuracy_score(y_test, pred)),
    "macro_precision": float(
        precision_score(y_test, pred, average="macro", zero_division=0)
    ),
    "macro_recall": float(
        recall_score(y_test, pred, average="macro", zero_division=0)
    ),
    "macro_f1": float(
        f1_score(y_test, pred, average="macro", zero_division=0)
    ),
}

joblib.dump(classifier, MODELS / "demo_classifier.joblib")

# Separate educational regression task.
# Predicts an artificial synthetic target, not clinical severity.
Xr_train, Xr_test, yr_train, yr_test = train_test_split(
    X, df["synthetic_complexity"],
    test_size=0.2, random_state=42
)

regressor = make_pipeline(
    StandardScaler(),
    Ridge(alpha=1.0)
)
regressor.fit(Xr_train, yr_train)

reg_pred = regressor.predict(Xr_test)

regression = {
    "mae": float(mean_absolute_error(yr_test, reg_pred)),
    "rmse": float(mean_squared_error(yr_test, reg_pred) ** 0.5),
    "r2": float(r2_score(yr_test, reg_pred)),
}

joblib.dump(regressor, MODELS / "demo_regressor.joblib")

metrics = {
    "dataset_type": "synthetic educational data",
    "records": int(len(df)),
    "symptoms": symptoms,
    "classification": classification,
    "regression": regression,
    "clinical_validation": False,
}

(REPORTS / "metrics.json").write_text(
    json.dumps(metrics, indent=2)
)

print(json.dumps(metrics, indent=2))
print("Models saved. These results do not measure clinical performance.")
