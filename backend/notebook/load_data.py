import pandas as pd

print("Starting dataset loading...\n")

logon = pd.read_csv("data/logon.csv", encoding="latin1", on_bad_lines="skip")
devices = pd.read_csv("data/device.csv", encoding="latin1", on_bad_lines="skip")
http = pd.read_csv("data/http.csv", header=None, encoding="latin1", on_bad_lines="skip")
http.columns = ["id","date","user","pc","url"]

# LDAP is actually Excel
ldap = pd.read_excel("data/ldap.xlsx")

insiders = pd.read_csv("data/insiders.csv", encoding="latin1", on_bad_lines="skip")

print("Datasets loaded successfully.\n")

print("Logon dataset shape:", logon.shape)
print("Devices dataset shape:", devices.shape)
print("HTTP dataset shape:", http.shape)
print("LDAP dataset shape:", ldap.shape)
print("Insiders dataset shape:", insiders.shape)

print("\nColumns Information:\n")

print("Logon columns:", list(logon.columns))
print("Devices columns:", list(devices.columns))
print("HTTP columns:", list(http.columns))
print("LDAP columns:", list(ldap.columns))
print("Insiders columns:", list(insiders.columns))
