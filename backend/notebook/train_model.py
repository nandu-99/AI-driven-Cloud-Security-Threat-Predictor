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