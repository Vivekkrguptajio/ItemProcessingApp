# Database Setup Guide — ItemProcessingApp

This document explains the complete database setup required to run the **ItemProcessingApp** project.

---

## Database Details

| Property            | Value                        |
|---------------------|------------------------------|
| **Database Name**   | `ItemProcessingDB`           |
| **Server Type**     | SQL Server (SQLEXPRESS)      |
| **Authentication**  | Windows Authentication (Trusted Connection) |
| **Data Access**     | ADO.NET (`Microsoft.Data.SqlClient`) |

---

## Step 1: Install SQL Server Express

1. Download **SQL Server Express** from:
   👉 https://www.microsoft.com/en-us/sql-server/sql-server-downloads
2. Install it with default settings.
3. Note your **Server Instance Name** (e.g., `YOURPC\SQLEXPRESS`).

---

## Step 2: Install SQL Server Management Studio (SSMS)

1. Download **SSMS** from:
   👉 https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms
2. Install and open it.
3. Connect to your SQL Server using **Windows Authentication**.

---

## Step 3: Create the Database

Open a **New Query** window in SSMS and run:

```sql
CREATE DATABASE ItemProcessingDB;
GO
```

---

## Step 4: Create the Tables

Select the `ItemProcessingDB` database from the dropdown, then run:

```sql
USE ItemProcessingDB;
GO
```

### 4.1 — Users Table

This table stores login credentials for authentication.

```sql
CREATE TABLE Users (
    Id        INT PRIMARY KEY IDENTITY(1,1),
    Email     NVARCHAR(100) NOT NULL,
    Password  NVARCHAR(100) NOT NULL
);
GO
```

| Column     | Type           | Description              |
|------------|----------------|--------------------------|
| `Id`       | INT (PK, Auto) | Unique user ID           |
| `Email`    | NVARCHAR(100)  | User email for login     |
| `Password` | NVARCHAR(100)  | User password (plain text) |

---

### 4.2 — Items Table

This is the main table that stores all items (both parent and child).

```sql
CREATE TABLE Items (
    Id        INT PRIMARY KEY IDENTITY(1,1),
    Name      NVARCHAR(200) NOT NULL,
    Weight    DECIMAL(18,2) NOT NULL,
    Status    NVARCHAR(50)  DEFAULT 'unprocessed',
    ParentId  INT NULL,
    CONSTRAINT FK_Items_ParentId FOREIGN KEY (ParentId) REFERENCES Items(Id)
);
GO
```

| Column     | Type            | Description                                         |
|------------|-----------------|-----------------------------------------------------|
| `Id`       | INT (PK, Auto)  | Unique item ID                                      |
| `Name`     | NVARCHAR(200)   | Item name (e.g., Wheat, Maida, Suji)                |
| `Weight`   | DECIMAL(18,2)   | Item weight in kg                                   |
| `Status`   | NVARCHAR(50)    | `'unprocessed'` (default) or `'processed'`          |
| `ParentId` | INT (Nullable)  | Foreign key to self — links child to parent item    |

**Key Points:**
- When an item is first added, `Status = 'unprocessed'` and `ParentId = NULL`.
- When an item is **processed**, its `Status` changes to `'processed'` and it becomes the **parent**.
- Child items get their `ParentId` set to the parent's `Id`.

---

## Step 5: Insert a Default User

Run this to create a default login account:

```sql
INSERT INTO Users (Email, Password)
VALUES ('admin@example.com', 'admin123');
GO
```

**Default Login Credentials:**

| Field      | Value               |
|------------|---------------------|
| Email      | `admin@example.com` |
| Password   | `admin123`          |

---

## Step 6: Update Connection String in the Project

Open the file: `ItemProcessingApp/appsettings.json`

Update the `DefaultConnection` value:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER_NAME\\SQLEXPRESS;Database=ItemProcessingDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

> ⚠️ Replace `YOUR_SERVER_NAME` with your actual computer name.
>
> **How to find your computer name:**
> Open Command Prompt and type: `hostname`

---

## Database Diagram (ER Diagram)

```
┌──────────────────────────┐
│         Users            │
├──────────────────────────┤
│ Id        INT (PK)       │
│ Email     NVARCHAR(100)  │
│ Password  NVARCHAR(100)  │
└──────────────────────────┘

┌──────────────────────────────┐
│           Items              │
├──────────────────────────────┤
│ Id        INT (PK)           │
│ Name      NVARCHAR(200)      │
│ Weight    DECIMAL(18,2)      │
│ Status    NVARCHAR(50)       │
│ ParentId  INT (FK → Items.Id)│──── Self-referencing FK
└──────────────────────────────┘
```

---

## How the Database is Used in Code

| Controller           | Table Used | Operations                              |
|----------------------|------------|-----------------------------------------|
| `AccountController`  | `Users`    | SELECT — Login authentication           |
| `ItemController`     | `Items`    | INSERT, UPDATE, DELETE, SELECT — CRUD   |
| `ProcessController`  | `Items`    | UPDATE — Mark processed, link children  |

### Query Examples Used in Code

**Login Check (AccountController):**
```sql
SELECT COUNT(*) FROM Users WHERE Email=@Email AND Password=@Password
```

**Add Item (ItemController):**
```sql
INSERT INTO Items (Name, Weight, Status) VALUES (@Name, @Weight, 'unprocessed');
SELECT SCOPE_IDENTITY();
```

**Edit Item (ItemController):**
```sql
UPDATE Items SET Name=@Name, Weight=@Weight WHERE Id=@Id
```

**Delete Item (ItemController):**
```sql
-- Step 1: Unlink children
UPDATE Items SET ParentId=NULL WHERE ParentId=@Id
-- Step 2: Delete item
DELETE FROM Items WHERE Id=@Id
```

**Process Item (ProcessController):**
```sql
-- Mark parent as processed
UPDATE Items SET Status='processed' WHERE Id=@Id
-- Link each child to parent
UPDATE Items SET ParentId=@ParentId WHERE Id=@ChildId
```

**Search Items (ItemController):**
```sql
SELECT * FROM Items WHERE Name LIKE @Query
```

---

## Optional: Sample Data for Testing

```sql
-- Add some test items
INSERT INTO Items (Name, Weight, Status) VALUES ('Wheat', 100, 'unprocessed');
INSERT INTO Items (Name, Weight, Status) VALUES ('Rice', 80, 'unprocessed');
INSERT INTO Items (Name, Weight, Status) VALUES ('Sugar', 50, 'unprocessed');
GO
```

---

## Troubleshooting

| Problem                              | Solution                                                     |
|--------------------------------------|--------------------------------------------------------------|
| Cannot connect to SQL Server         | Make sure SQL Server Express is running (check Services)      |
| Login failed for user                | Use Windows Authentication (Trusted_Connection=True)          |
| Database does not exist              | Run the `CREATE DATABASE` script above                        |
| Table does not exist                 | Run the `CREATE TABLE` scripts above                          |
| Foreign key error on delete          | The app handles this — it unlinks children before deleting    |
| Connection string not working        | Verify your server name using `hostname` in Command Prompt    |
