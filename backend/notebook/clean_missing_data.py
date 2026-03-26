# notebooks/clean_missing_data.py

import pandas as pd
import os

# Absolute path to your datasets folder
DATA_FOLDER = r'D:\Insiderthreatproject\data'

# List of datasets
datasets = {
    'logon': 'logon.csv',
    'devices': 'device.csv',
    'http': 'http.csv',
    'ldap': 'ldap.xlsx',  # Make sure the file exists
    'insiders': 'insiders.csv'
}

# Function to clean a dataset
def clean_dataset(file_path, dataset_name):
    print(f"\n--- Cleaning {dataset_name} ---")
    
    # Check if file exists
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return None
    
    # Read dataset
    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path, encoding="latin-1", engine="python", on_bad_lines="skip")
    elif file_path.endswith('.xlsx'):
        df = pd.read_excel(file_path)
    else:
       df = pd.read_csv(file_path, encoding="latin-1", engine="python", on_bad_lines="skip")

    # Show missing values before cleaning
    print("Missing values BEFORE cleaning:")
    print(df.isnull().sum())
    
    # Drop rows with missing values
    df = df.dropna()
    
    # Show missing values after cleaning
    print("Missing values AFTER cleaning:")
    print(df.isnull().sum())
    
    # Show first rows
    print("First 3 rows after cleaning:")
    print(df.head(3))

    print(f"✅ Finished cleaning {dataset_name}")

    return df

# Loop through all datasets
cleaned_data = {}
for name, filename in datasets.items():
    path = os.path.join(DATA_FOLDER, filename)
    cleaned_data[name] = clean_dataset(path, name)

# Save cleaned datasets
cleaned_folder = os.path.join(DATA_FOLDER, 'cleaned')
os.makedirs(cleaned_folder, exist_ok=True)

for name, df in cleaned_data.items():
    if df is not None:
        save_path = os.path.join(cleaned_folder, f"{name}_cleaned.csv")
        df.to_csv(save_path, index=False)

print("\nAll datasets cleaned and saved to 'data/cleaned/' folder.")
