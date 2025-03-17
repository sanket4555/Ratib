## Ratib - Newspaper Distribution and Management System

A comprehensive web application for managing newspaper distribution, built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Features

- Multi-panel system (Admin, Agency, Employee, Customer)
- User authentication and authorization
- Real-time delivery tracking
- Subscription management
- Revenue analytics
- Employee management
- Customer relationship management

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB
- Authentication: JWT
- Email Service: Nodemailer

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a .env file with the following variables:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
ratib/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   └── routes/
├── frontend/
│   ├── public/
│   └── src/
└── package.json
```

## License

ISC 
