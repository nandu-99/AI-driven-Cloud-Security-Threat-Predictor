import csv
import os
from typing import Any, Dict, List

try:
    import pandas as pd
except ImportError:
    pd = None


class DatasetRepository:
    def __init__(self, data_dir: str = None) -> None:
        base_dir = os.path.dirname(os.path.dirname(__file__))
        self.data_dir = data_dir or os.path.join(base_dir, "data")

    def load_security_rows(self) -> List[Dict[str, Any]]:
        merged_rows: List[Dict[str, Any]] = []
        merged_rows.extend(self._load_logon_device_http())
        merged_rows.extend(self._load_insiders())
        merged_rows.extend(self._load_ldap())

        if not merged_rows:
            merged_rows = self._dummy_rows_from_frontend_mock()

        return [self._normalize_row(r, idx) for idx, r in enumerate(merged_rows, start=1)]

    def _read_csv(self, path: str) -> List[Dict[str, Any]]:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.DictReader(f)
            return [dict(r) for r in reader]

    def _load_logon_device_http(self) -> List[Dict[str, Any]]:
        rows: List[Dict[str, Any]] = []
        for name in ["logon.csv", "device.csv", "http.csv"]:
            path = os.path.join(self.data_dir, name)
            if os.path.exists(path):
                rows.extend(self._read_csv(path))
        return rows

    def _load_insiders(self) -> List[Dict[str, Any]]:
        path = os.path.join(self.data_dir, "insiders.csv")
        if not os.path.exists(path):
            return []
        return self._read_csv(path)

    def _load_ldap(self) -> List[Dict[str, Any]]:
        # User shared ldap as xlsx schema: employee_user_id, Domain, Email, Role
        path_xlsx = os.path.join(self.data_dir, "ldap.xlsx")
        path_csv = os.path.join(self.data_dir, "ldap.csv")
        if os.path.exists(path_xlsx):
            if pd is None:
                print("Warning: pandas not installed, skipping ldap.xlsx. Use ldap.csv if possible.")
                return []
            frame = pd.read_excel(path_xlsx)
            return frame.fillna("").to_dict(orient="records")
        if os.path.exists(path_csv):
            return self._read_csv(path_csv)
        return []

    def _normalize_row(self, row: Dict[str, Any], idx: int) -> Dict[str, Any]:
        dummy = self._dummy_rows_from_frontend_mock()[idx % len(self._dummy_rows_from_frontend_mock())]

        def pick(keys, default):
            for k in keys:
                if k in row and row[k] not in (None, ""):
                    return row[k]
            return default

        user_id = str(pick(["user_id", "user", "id", "username", "employee_user_id"], dummy["user_id"]))
        activity = str(pick(["activity", "details", "scenario"], "normal")).lower()
        role = str(pick(["role", "Role"], "user")).lower()
        url = str(pick(["url"], ""))

        failed = self._to_float(pick(["failed_logins", "failed"], dummy["failed_logins"]))
        if failed == 0 and "fail" in activity:
            failed = max(1.0, dummy["failed_logins"] * 0.5)

        geo = self._to_float(pick(["geo_anomalies", "geo"], dummy["geo_anomalies"]))
        off_hours = self._to_float(pick(["off_hours_access", "off_hours"], dummy["off_hours_access"]))
        if "off-hour" in activity or "after hour" in activity:
            off_hours = 1.0

        file_access = self._to_float(pick(["file_access", "access_count", "count"], dummy["file_access"]))
        if "download" in activity or "usb" in activity:
            file_access += 5
        if url:
            file_access += 2

        return {
            "user_id": user_id,
            "login_attempts": self._to_float(pick(["login_attempts", "attempts"], dummy["login_attempts"])),
            "failed_logins": failed,
            "file_access": file_access,
            "session_minutes": self._to_float(pick(["session_minutes", "duration"], dummy["session_minutes"])),
            "geo_anomalies": geo,
            "off_hours_access": off_hours,
            "restricted_access_attempts": self._to_float(
                pick(["restricted_access_attempts", "restricted_attempts"], dummy["restricted_access_attempts"])
            ),
            "baseline_session_minutes": self._to_float(
                pick(["baseline_session_minutes", "baseline_minutes"], dummy["baseline_session_minutes"])
            ),
            "role": role,
            "source": str(pick(["dataset", "Domain"], "mixed")),
            "activity": activity,
            "url": url,
            "raw_details": str(pick(["details"], "")),
            "start": str(pick(["start"], "")),
            "end": str(pick(["end"], "")),
        }

    def _to_float(self, v: Any) -> float:
        try:
            return float(v)
        except (TypeError, ValueError):
            return 0.0

    def _dummy_rows_from_frontend_mock(self) -> List[Dict[str, Any]]:
        return [
            {"user_id": "USR-1021", "login_attempts": 14, "failed_logins": 8, "file_access": 47, "session_minutes": 262, "geo_anomalies": 2, "off_hours_access": 1, "restricted_access_attempts": 3, "baseline_session_minutes": 77},
            {"user_id": "USR-1043", "login_attempts": 6, "failed_logins": 2, "file_access": 18, "session_minutes": 105, "geo_anomalies": 1, "off_hours_access": 0, "restricted_access_attempts": 1, "baseline_session_minutes": 58},
            {"user_id": "USR-1055", "login_attempts": 2, "failed_logins": 0, "file_access": 7, "session_minutes": 38, "geo_anomalies": 0, "off_hours_access": 0, "restricted_access_attempts": 0, "baseline_session_minutes": 42},
            {"user_id": "USR-1072", "login_attempts": 19, "failed_logins": 12, "file_access": 83, "session_minutes": 370, "geo_anomalies": 3, "off_hours_access": 1, "restricted_access_attempts": 5, "baseline_session_minutes": 90},
            {"user_id": "USR-1088", "login_attempts": 5, "failed_logins": 1, "file_access": 22, "session_minutes": 132, "geo_anomalies": 0, "off_hours_access": 0, "restricted_access_attempts": 0, "baseline_session_minutes": 66},
        ]
