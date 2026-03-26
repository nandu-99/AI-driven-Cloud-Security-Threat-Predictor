import pandas as pd
import os

DATA_FOLDER = r'D:\Insiderthreatproject\data\cleaned'

print("Loading datasets...")

logon = pd.read_csv(os.path.join(DATA_FOLDER, "logon_cleaned.csv"))
devices = pd.read_csv(os.path.join(DATA_FOLDER, "devices_cleaned.csv"))
http = pd.read_csv(os.path.join(DATA_FOLDER, "http_cleaned.csv"))

print("Datasets loaded")

# -----------------------------
# Convert timestamps
# -----------------------------

logon['date'] = pd.to_datetime(logon['date'])
devices['date'] = pd.to_datetime(devices['date'])


# -----------------------------
# LOGIN ATTEMPTS
# -----------------------------

login_attempts = logon.groupby('user').size().reset_index(name='login_attempts')

# -----------------------------
# FAILED LOGINS
# -----------------------------

logon['failed_login'] = logon['activity'].apply(lambda x: 1 if "fail" in str(x).lower() else 0)

failed_logins = logon.groupby('user')['failed_login'].sum().reset_index(name='failed_logins')

# -----------------------------
# FILE ACCESS
# -----------------------------

file_access = http.groupby('user').size().reset_index(name='file_access')

# -----------------------------
# OFF HOURS LOGIN
# -----------------------------

logon['hour'] = logon['date'].dt.hour

logon['off_hours'] = logon['hour'].apply(lambda x: 1 if x < 8 or x > 18 else 0)

off_hours = logon.groupby('user')['off_hours'].sum().reset_index(name='off_hours')

# -----------------------------
# SESSION DURATION (estimate)
# -----------------------------

logon = logon.sort_values(['user','date'])

logon['next_event'] = logon.groupby('user')['date'].shift(-1)

logon['session_time'] = (logon['next_event'] - logon['date']).dt.total_seconds()

session_duration = logon.groupby('user')['session_time'].mean().reset_index(name='session_duration')

# -----------------------------
# GEO ANOMALIES (placeholder)
# -----------------------------

geo_anomalies = devices.groupby('user').size().reset_index(name='geo_anomalies')
geo_anomalies['geo_anomalies'] = geo_anomalies['geo_anomalies'] % 3

# -----------------------------
# MERGE FEATURES
# -----------------------------

features = login_attempts

features = features.merge(failed_logins, on='user', how='left')
features = features.merge(file_access, on='user', how='left')
features = features.merge(off_hours, on='user', how='left')
features = features.merge(session_duration, on='user', how='left')
features = features.merge(geo_anomalies, on='user', how='left')

features = features.fillna(0)

# -----------------------------
# BASELINE DEVIATION
# -----------------------------

baseline = features['login_attempts'].mean()

features['baseline_dev'] = features['login_attempts'] / baseline

# -----------------------------
# SAVE FEATURE DATASET
# -----------------------------

save_path = os.path.join(DATA_FOLDER, "user_features.csv")

features.to_csv(save_path, index=False)

print("Feature dataset saved successfully")
print(features.head())

# ---- Additional behavioural features ----

import numpy as np

# failed logins (simulated if not present)
if "failed_logins" not in features.columns:
    features["failed_logins"] = np.random.randint(0,3,len(features))

# file access
if "file_access" not in features.columns:
    features["file_access"] = np.random.randint(0,20,len(features))

# session duration
if "session_duration" not in features.columns:
    features["session_duration"] = np.random.randint(30,500,len(features))

# geo anomalies
features["geo_anomalies"] = features["device_count"] % 3

# baseline deviation
baseline = features["login_count"].mean()
features["baseline_deviation"] = features["login_count"] / baseline