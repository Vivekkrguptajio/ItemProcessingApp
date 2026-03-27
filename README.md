# ItemProcessingApp

A hierarchical **Item Processing** web application built with **ASP.NET Core 8 MVC** and **SQL Server**. This application allows users to manage items, process them into parent-child hierarchies, and view the relationships in a tree structure.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Project Structure](#project-structure)
5. [Database Setup](#database-setup)
6. [How to Run in Visual Studio](#how-to-run-in-visual-studio)
7. [Application Workflow](#application-workflow)
8. [API Endpoints](#api-endpoints)
9. [Troubleshooting](#troubleshooting)

---

## Features

- **User Authentication** — Login and Logout functionality using Email & Password.
- **Item Management (CRUD)** — Add, Edit, Delete, and Search items.
- **Item Processing** — Mark items as "processed" and link child items to a parent item.
- **Tree View** — View the parent-child hierarchy of items in a tree structure.
- **Processed Items List** — View all processed parent items along with their children and total child weight.
- **Dashboard** — Central dashboard to navigate between all features.

---

## Tech Stack

| Technology         | Version / Details                  |
|--------------------|------------------------------------|
| Framework          | ASP.NET Core 8.0 (MVC)            |
| Language           | C# (.NET 8)                       |
| Database           | SQL Server (SQLEXPRESS)            |
| ORM / Data Access  | ADO.NET (`Microsoft.Data.SqlClient`) |
| Frontend           | Razor Views, HTML, CSS, JavaScript |
| IDE                | Visual Studio 2022                 |

---

## Prerequisites

Before running this project, make sure you have the following installed on your machine:

1. **Visual Studio 2022** (Community, Professional, or Enterprise)
   - Download from: https://visualstudio.microsoft.com/downloads/
   - During installation, select the **"ASP.NET and web development"** workload.

2. **.NET 8.0 SDK**
   - Download from: https://dotnet.microsoft.com/download/dotnet/8.0
   - Visual Studio 2022 (latest version) usually includes this.

3. **SQL Server Express** (or any SQL Server edition)
   - Download from: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
   - Install **SQL Server Management Studio (SSMS)** for managing databases: https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms

---

## Project Structure

```
ItemProcessingApp-master/
│
├── ItemProcessingApp.sln                  # Solution file (open this in Visual Studio)
│
├── ItemProcessingApp/                     # Main project folder
│   ├── Controllers/
│   │   ├── AccountController.cs           # Handles Login / Logout
│   │   ├── HomeController.cs              # Dashboard (Index page)
│   │   ├── ItemController.cs              # Item CRUD operations
│   │   └── ProcessController.cs           # Item processing & tree view
│   │
│   ├── Models/
│   │   ├── Item.cs                        # Item model (Id, Name, Weight, Status, ParentId)
│   │   ├── ProcessedItem.cs               # Processed item model (Parent + Children)
│   │   ├── LoginViewModel.cs              # Login form model (Email, Password)
│   │   └── ErrorViewModel.cs              # Error display model
│   │
│   ├── Views/
│   │   ├── Account/
│   │   │   └── Login.cshtml               # Login page
│   │   ├── Home/
│   │   │   ├── Index.cshtml               # Main dashboard page
│   │   │   └── Privacy.cshtml             # Privacy page
│   │   └── Shared/
│   │       ├── _Layout.cshtml             # Master layout template
│   │       ├── _ValidationScriptsPartial.cshtml
│   │       └── Error.cshtml               # Error page
│   │
│   ├── wwwroot/                           # Static files (CSS, JS, images)
│   │   ├── css/
│   │   ├── js/
│   │   └── lib/
│   │
│   ├── Program.cs                         # Application entry point & configuration
│   ├── appsettings.json                   # Connection string & app settings
│   └── ItemProcessingApp.csproj           # Project file (.NET 8)
```

---

## Database Setup

You must create the database and tables manually in SQL Server before running the application.

### Step 1: Open SQL Server Management Studio (SSMS)

1. Open **SSMS**.
2. Connect to your SQL Server instance (e.g., `YOURPC\SQLEXPRESS` or `localhost`).

### Step 2: Create the Database

Run the following SQL script in SSMS:

```sql
CREATE DATABASE ItemProcessingDB;
GO
```

### Step 3: Create the Tables

Select the `ItemProcessingDB` database and run:

```sql
USE ItemProcessingDB;
GO

-- Users table for login authentication
CREATE TABLE Users (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Email NVARCHAR(100) NOT NULL,
    Password NVARCHAR(100) NOT NULL
);
GO

-- Items table for item management
CREATE TABLE Items (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(200) NOT NULL,
    Weight DECIMAL(18,2) NOT NULL,
    Status NVARCHAR(50) DEFAULT 'unprocessed',
    ParentId INT NULL,
    CONSTRAINT FK_Items_ParentId FOREIGN KEY (ParentId) REFERENCES Items(Id)
);
GO
```

### Step 4: Insert a Default User

```sql
INSERT INTO Users (Email, Password) VALUES ('admin@example.com', 'admin123');
GO
```

### Step 5: Update the Connection String

Open the file `ItemProcessingApp/appsettings.json` and update the connection string to match your SQL Server instance name:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER_NAME\\SQLEXPRESS;Database=ItemProcessingDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

> **Note:** Replace `YOUR_SERVER_NAME` with your actual computer name. You can find it by running `hostname` in Command Prompt.

---

## How to Run in Visual Studio

Follow these steps carefully to open and run the project in Visual Studio:

### Step 1: Download / Clone the Project

- Download the project ZIP and extract it, **OR**
- Clone the repository using Git:
  ```
  git clone <repository-url>
  ```

### Step 2: Open the Solution in Visual Studio

1. Open **Visual Studio 2022**.
2. Click on **"Open a project or solution"** from the start screen.
3. Navigate to the extracted folder:
   ```
   ItemProcessingApp-master/
   ```
4. Select the file **`ItemProcessingApp.sln`** and click **Open**.

### Step 3: Restore NuGet Packages

1. Visual Studio will automatically restore NuGet packages when you open the solution.
2. If it doesn't, go to:
   - **Tools** → **NuGet Package Manager** → **Package Manager Console**
   - Type the following command and press Enter:
     ```
     dotnet restore
     ```
3. Or right-click the Solution in **Solution Explorer** → Click **"Restore NuGet Packages"**.

### Step 4: Verify the Connection String

1. In **Solution Explorer**, expand the `ItemProcessingApp` project.
2. Open the file **`appsettings.json`**.
3. Make sure the `DefaultConnection` string points to your SQL Server instance:
   ```json
   "DefaultConnection": "Server=YOUR_SERVER_NAME\\SQLEXPRESS;Database=ItemProcessingDB;Trusted_Connection=True;TrustServerCertificate=True;"
   ```

### Step 5: Set the Startup Project

1. In **Solution Explorer**, right-click on **`ItemProcessingApp`** (the project, not the solution).
2. Click **"Set as Startup Project"**.

### Step 6: Build the Project

1. Go to **Build** menu → Click **"Build Solution"** (or press `Ctrl + Shift + B`).
2. Check the **Output** window at the bottom. It should show:
   ```
   Build succeeded.
   ```
3. If there are errors, check the **Error List** window and resolve them.

### Step 7: Run the Application

1. Click the **green play button (▶)** in the toolbar (it will say **"https"** or **"IIS Express"**).
   - Or press **`F5`** to run with debugging.
   - Or press **`Ctrl + F5`** to run without debugging.
2. Your default browser will open automatically.
3. The application will start at the **Login page**.

### Step 8: Login to the Application

1. Enter the default credentials:
   - **Email:** `admin@example.com`
   - **Password:** `admin123`
2. Click **Login**.
3. You will be redirected to the **Dashboard** (Home page).

---

## Application Workflow

Once logged in, the application works as follows:

### 1. Add Items
- From the dashboard, add new items by entering a **Name** and **Weight**.
- Each item starts with the status **"unprocessed"**.

### 2. Edit / Delete Items
- You can **edit** an item's name and weight.
- You can **delete** an item (its children will be unlinked automatically).

### 3. Search Items
- Search for items by name using the search functionality.

### 4. Process Items (Parent-Child Linking)
- Select a **parent item** and one or more **child items**.
- Click **Process** to:
  - Mark the parent item as **"processed"**.
  - Link the selected children to the parent.

### 5. Tree View
- View the hierarchical structure of all items in a **tree format**.
- Parent items are shown at the top level, with their children nested below.

### 6. Processed Items List
- View a summary of all processed items showing:
  - **Parent Name** and **Parent Weight**
  - **Child Items** (comma-separated names)
  - **Total Child Weight**

### 7. Logout
- Click **Logout** to return to the Login page.

---

## API Endpoints

| Method | URL                              | Description                          |
|--------|----------------------------------|--------------------------------------|
| GET    | `/Account/Login`                 | Show login page                      |
| POST   | `/Account/Login`                 | Authenticate user                    |
| GET    | `/Account/Logout`                | Logout and redirect to login         |
| GET    | `/Home/Index`                    | Dashboard page                       |
| GET    | `/Item/Index`                    | Get all items (JSON)                 |
| POST   | `/Item/Add`                      | Add a new item                       |
| POST   | `/Item/Edit`                     | Edit an existing item                |
| POST   | `/Item/Delete`                   | Delete an item                       |
| GET    | `/Item/Search?query=...`         | Search items by name                 |
| GET    | `/Process/ProcessItem`           | Process item page                    |
| POST   | `/Process/ProcessItem`           | Process (link parent + children)     |
| GET    | `/Process/TreeView`              | Get tree view data (JSON)            |
| GET    | `/Process/ProcessedList`         | Get processed items summary (JSON)   |

---

## Troubleshooting

| Problem                                  | Solution                                                                                 |
|------------------------------------------|------------------------------------------------------------------------------------------|
| **Build fails with missing SDK**         | Install .NET 8.0 SDK from https://dotnet.microsoft.com/download/dotnet/8.0               |
| **Cannot connect to database**           | Check your SQL Server instance is running. Verify the connection string in `appsettings.json`. |
| **Login fails with "Invalid login"**     | Make sure you have inserted the default user in the `Users` table (see Database Setup).   |
| **NuGet packages not restored**          | Right-click Solution → "Restore NuGet Packages" or run `dotnet restore` in terminal.     |
| **Port conflict**                        | Change the port in `Properties/launchSettings.json` if another app is using the same port.|
| **SQL Server not found**                 | Make sure SQL Server Express is installed and the SQL Server Browser service is running.   |

---

## License

This project is for educational / assignment purposes.
