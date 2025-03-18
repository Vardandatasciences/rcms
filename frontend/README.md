# Regulatory Compliance Management System (RCMS)

A full-stack application for managing regulatory compliance across entities.

## Project Structure

The project is divided into two main parts:

- **Backend**: Flask-based REST API with MySQL database
- **Frontend**: React-based user interface

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows:
     ```
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```
     source venv/bin/activate
     ```

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Configure the database:
   - Create a MySQL database named `rcms`
   - Update the database connection string in `config.py` if needed

6. Run the application:
   ```
   python app.py
   ```

The backend API will be available at http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend/rcms
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

The frontend application will be available at http://localhost:3000

## Features

- Entity Management
- User Management
- Category Management
- Regulation Management
- Compliance Tracking

## Technologies Used

### Backend
- Flask (Python web framework)
- SQLAlchemy (ORM)
- MySQL (Database)
- Flask-CORS (Cross-Origin Resource Sharing)

### Frontend
- React
- Axios (HTTP client)
- React Router
- Material-UI (Component library) 