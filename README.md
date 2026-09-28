# Student AI Performance Analytics

A web application that helps teachers analyze student performance using data analytics, Machine Learning, and AI.

The application brings student marks, attendance, study hours, and assignment performance together in one place. Teachers can view performance trends, get predictions and recommendations, generate reports, and interact with an AI chatbot for additional insights.

**Features**

- Student performance analysis
- Performance graphs and visualizations
- ML-based performance prediction
- AI-based recommendations
- AI chatbot for performance-related queries
- Student performance reports
- Teacher dashboard
- Optimized study schedule

**How It Works**

The teacher manages student performance data through the application.

The backend processes the data and stores it in PostgreSQL. The ML service uses the available performance data to generate predictions, while the Groq API is used for the AI chatbot and AI-based insights.

Teacher
   ↓
React Frontend
   ↓
Spring Boot Backend
   ↓
PostgreSQL
   ↓
ML Service

Spring Boot
   ↓
Groq API
   ↓
AI Chatbot

Tech Stack

Frontend

- React

Backend

- Java
- Spring Boot

Database

- PostgreSQL

Machine Learning

- Python
- Machine Learning Service

AI

- Groq API

Deployment

- Render

Run Locally

Backend

Navigate to the backend directory and run:

./mvnw spring-boot:run

You can also run the Spring Boot application directly from your IDE.

Frontend

Navigate to the frontend directory:

npm install
npm run dev

ML Service

Navigate to the ML service directory and start the Python service using the project's configured setup.

Before running the application, make sure PostgreSQL is running and the required database and environment variables are configured.

# Demo Account

Teacher

Email: rinky@gmail.com 

Password: pass123

Live Demo

https://student-ai-frontend-3tz9.onrender.com/login

*Project Structure*

Student-AI-Performance-Analytics/
│
├── frontend/       # React frontend
├── backend/        # Spring Boot backend
├── ml-service/     # Machine Learning service
└── database/       # Database files

*Project Objective*

The objective of this project is to make student performance data easier for teachers to understand and use.

It combines a web application with Machine Learning and AI so that teachers can view student data and get predictions, recommendations, and insights from it.

*Future Improvements*

- Improve prediction accuracy
- Add more performance metrics
- Improve AI recommendations
- Add more interactive charts
- Improve student progress reports
- Add more analytics features
- Improve the optimized study schedule

---

Built with React, Spring Boot, PostgreSQL, Machine Learning, and Groq API.
