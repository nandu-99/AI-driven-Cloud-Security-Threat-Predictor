Place your training datasets in this folder:

- `logon.csv` with columns: `id,date,user,pc,activity`
- `device.csv` with columns: `id,date,user,pc,activity`
- `http.csv` with columns: `id,date,user,pc,activity,url`
- `insiders.csv` with columns: `dataset,scenario,details,user,start,end`
- `ldap.xlsx` with columns: `employee_user_id,Domain,Email,Role`

Notes:
- Missing columns are automatically filled with dummy values mapped from frontend mock behavior.
- `ldap.csv` is also supported as fallback if you do not provide `ldap.xlsx`.
