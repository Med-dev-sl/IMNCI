# Supabase Database Setup Guide

## Overview
This guide explains how to set up your Supabase database for the IMNCI Digital Diagnosis Platform.

## Steps to Set Up the Database

### 1. Access Supabase Console
- Go to [Supabase Dashboard](https://app.supabase.com)
- Sign in with your account
- Select your project (rlldtclutanjnkqeppti)

### 2. Create the Users Table
Copy and run the SQL from `database/setup.sql` in the Supabase SQL Editor:

1. Navigate to **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy the entire contents of `database/setup.sql`
4. Paste into the SQL editor
5. Click **Run** button

This will create:
- `users` table with columns for username, email, password, role, etc.
- `diagnosis` table for storing patient diagnosis records
- Proper indexes for performance
- Row-level security (RLS) policies

### 3. Verify the Setup
After running the SQL:

1. Go to **Table Editor** in the left sidebar
2. You should see the `users` table listed
3. Click on `users` to view the table
4. You should see the superadmin user already inserted:
   - **Username**: IMNCI_00001
   - **Email**: superadmin@imnci.local
   - **Password**: P@$$W0RD
   - **Role**: superadmin
   - **Status**: active

## Using the Custom Authentication

### Superadmin Login
The application uses custom authentication with hardcoded superadmin credentials:
- **Username**: `IMNCI_00001`
- **Password**: `P@$$W0RD`

When logging in with these credentials, the user will automatically be routed to the SuperAdmin Dashboard.

### Adding More Users
You can add more users directly in the Supabase table or through the SuperAdmin Dashboard:

#### Method 1: Direct SQL Insert
```sql
INSERT INTO public.users (username, email, password, name, role, status)
VALUES (
  'doctor_001',
  'doctor@imnci.com',
  'password123',
  'Dr. John Smith',
  'doctor',
  'active'
);
```

#### Method 2: Supabase Table Editor
1. Go to **Table Editor**
2. Click on the `users` table
3. Click **Insert row**
4. Fill in the required fields
5. Click **Save**

## Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| username | VARCHAR(50) | Unique username |
| email | VARCHAR(255) | Unique email address |
| password | VARCHAR(255) | User password |
| name | VARCHAR(255) | Full name |
| role | VARCHAR(50) | User role (superadmin, doctor, nurse, admin) |
| status | VARCHAR(20) | active/inactive |
| join_date | TIMESTAMP | When user joined |
| last_login | TIMESTAMP | Last login time |
| is_active | BOOLEAN | Account status |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### Diagnosis Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to users table |
| patient_name | VARCHAR(255) | Patient name |
| diagnosis_type | VARCHAR(100) | Type of diagnosis |
| symptoms | TEXT | Patient symptoms |
| diagnosis_result | TEXT | Diagnosis result |
| confidence_score | FLOAT | Confidence percentage |
| status | VARCHAR(20) | pending/completed/archived |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## Important Notes

⚠️ **Security**: The superadmin password is hardcoded in the frontend for demonstration purposes. In a production environment, implement proper authentication with:
- Hashed passwords
- JWT tokens
- Session management
- Rate limiting
- Two-factor authentication

## Environment Variables
No additional environment variables are needed for the custom authentication. The Supabase connection is already configured through `src/supabaseClient.js`.

## Troubleshooting

**Issue**: "Invalid username or password"
- **Solution**: Ensure you've run the SQL setup script and the users table has been created
- Check that the username and password match exactly (case-sensitive)

**Issue**: Users table doesn't exist
- **Solution**: Re-run the SQL setup script from `database/setup.sql`

**Issue**: Superadmin user not found
- **Solution**: Check the users table has the superadmin record with username "IMNCI_00001"

## Next Steps

1. Set up the database following the steps above
2. Test login with superadmin credentials
3. Create additional users as needed
4. Configure role-based access control in the application
5. Implement proper password hashing before production
