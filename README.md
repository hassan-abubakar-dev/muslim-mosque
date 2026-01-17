# Muslim Mosque Backend API

A robust Node.js backend application for managing mosque operations, user authentication, and community management.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Database](#database)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Contributing](#contributing)

## 🎯 Project Overview

Muslim Mosque is a comprehensive backend solution designed to manage mosque operations, including user management, authentication, email verification, mosque profiles, and community relationships. The application prioritizes security, data integrity, and seamless user experience.

## ✨ Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Email Verification**: Automated email verification for new accounts
- **Transaction Support**: Database transactions with rollback capability for data consistency
- **User Profiles**: Automated profile creation with gender-based avatars
- **Mosque Management**: Mosque profile and information management
- **Input Validation**: Comprehensive Joi validation middleware
- **Error Handling**: Centralized error handling with custom error classes
- **Role-Based Access**: Support for different user roles
- **Token Management**: Access and refresh token generation and validation

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Sequelize ORM (supports MySQL, PostgreSQL, etc.)
- **Authentication**: JWT (JSON Web Tokens), bcryptjs
- **Validation**: Joi
- **Email**: Nodemailer (via email config)
- **Environment**: dotenv

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd muslim-mosque
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install required packages** (if not already installed)
   ```bash
   npm install express sequelize joi bcryptjs dotenv nodemailer
   ```

## ⚙️ Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_NAME=mosque_db
DATABASE_USERNAME=root
DATABASE_PASSWORD=your_password
DATABASE_HOST=localhost
DATABASE_DIALECT=mysql

# JWT Tokens
ACCESS_TOKEN_KEY=your_access_token_secret
ACCESS_TOKEN_EXPERY=15m
REFRESH_TOKEN_KEY=your_refresh_token_secret
REFRESH_TOKEN_EXPERY=7d

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_SERVICE=gmail

# Avatar URLs
MALE_AVATER_PROFILE=https://example.com/avatars/male.jpg
FEMALE_AVATER_PROFILE=https://example.com/avatars/female.jpg
```

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Register a new user
- `POST /login` - Login user
- `POST /refresh-token` - Request new access token

### Verification Routes
- `POST /verify` - Verify user email with verification code

### Mosque Routes (`/api/mosque`)
- `GET /` - Get all mosques
- `POST /` - Create new mosque
- `GET /:id` - Get mosque details
- `PUT /:id` - Update mosque information

## 📁 Project Structure

```
muslim-mosque/
├── app.js                    # Main application file
├── package.json              # Project dependencies
├── config/
│   ├── db.js                # Database configuration
│   ├── email.js             # Email service configuration
│   └── superAdmin.js        # Super admin configuration
├── controllers/
│   ├── auth.js              # Authentication controller
│   ├── mosque.js            # Mosque controller
│   └── verification.js      # Email verification controller
├── middleware/
│   ├── errorHandler.js      # Global error handling middleware
│   └── validation.js        # Joi validation middleware
├── models/
│   ├── user.js              # User model
│   ├── userProfile.js       # User profile model
│   ├── mosque.js            # Mosque model
│   ├── mosqueProfile.js     # Mosque profile model
│   ├── relationship.js      # User-mosque relationship model
│   └── verificationCode.js  # Verification code model
├── routes/
│   └── auth.js              # Authentication routes
├── utils/
│   ├── AppError.js          # Custom error class
│   ├── token.js             # JWT token generation
│   ├── verificationCode.js  # Verification code generator
│   └── experyTime.js        # Token expiry time helper
└── validation/
    └── auth.js              # Authentication validation schemas
```

## 🗄️ Database

### Models

**User Model**
- Stores user credentials and information
- Fields: firstName, surName, email, password, gender, isVerified, role

**UserProfile Model**
- User profile information with avatar
- Fields: image, bio, userId

**Mosque Model**
- Mosque details and information
- Fields: name, address, phone, email, capacity

**MosqueProfile Model**
- Mosque profile with images and description
- Fields: image, description, mosqueId

**VerificationCode Model**
- Temporary verification codes for email verification
- Fields: code, expiryTime, userEmail

### Transactions

Database transactions are implemented in critical operations:
- **User Registration**: Creates user and verification code in a single transaction
- **Email Verification**: Updates user status and creates profile in a single transaction

## 🔐 Authentication

### Registration Flow
1. User submits registration form
2. Email validation and password hashing
3. User account created
4. Verification code generated and sent via email
5. Transaction rolls back if any step fails

### Verification Flow
1. User submits verification code
2. Code validation and expiry check
3. User marked as verified
4. User profile created with avatar
5. Access and refresh tokens generated
6. Transaction rolls back if any step fails

### Login Flow
1. User submits email and password
2. Email existence check
3. Password validation
4. JWT tokens generated
5. Refresh token stored in secure cookie

## ⚠️ Error Handling

The application uses a centralized error handling system:

- **AppError Class**: Custom error class for consistent error responses
- **Error Middleware**: Global error handler catching all errors
- **Validation Errors**: Clear validation messages from Joi schemas
- **HTTP Status Codes**: Appropriate status codes for different error types

Example error response:
```json
{
  "status": "error",
  "message": "Invalid email format"
}
```

## 🔄 Data Validation

All inputs are validated using Joi schemas:

- **Registration**: firstName, surName, email, password (with strength requirements), gender
- **Login**: email, password
- **Verification**: verificationCode (6 characters)

## 🚀 Running the Application

```bash
# Development mode
npm start

# With nodemon for auto-reload
npm run dev
```

The server will start on the port specified in `.env` (default: 3000).

## 📧 Email Service

Emails are sent automatically for:
- Account verification
- Password reset (when implemented)
- Notification (when implemented)

Customize email templates in the controllers.

## 🤝 Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📝 License

This project is proprietary and confidential.


