# Community Safety Network 

Backend API for the **Community Safety Network** platform, providing incident reporting and a Smart Emergency SOS system. Built with Node.js, Express, and MongoDB, with real-time updates via Socket.IO and SMS/email alerting via Twilio and Nodemailer.

## Features

- 🚨 **Incident Reporting** — Create, view, and manage community safety incident reports, including file/photo uploads (via Multer)
- 🆘 **Smart Emergency SOS** — Trigger emergency alerts that can notify contacts/authorities via SMS (Twilio) and email (Nodemailer)
- 🔐 **Authentication & Authorization** — JWT-based auth with password hashing (bcrypt)
- ⚡ **Real-time Updates** — Live incident/alert broadcasting with Socket.IO
- ✅ **Input Validation** — Request validation via `express-validator`
- 🛡️ **Security** — Hardened HTTP headers via Helmet, CORS support
- 📝 **Logging** — Request logging via Morgan
- 🗄️ **Database** — MongoDB with Mongoose ODM

## Tech Stack

| Layer            | Technology                        |
|-------------------|------------------------------------|
| Runtime           | Node.js (>=18.0.0)                |
| Framework         | Express.js                        |
| Database          | MongoDB + Mongoose                |
| Real-time         | Socket.IO                         |
| Auth              | JWT (jsonwebtoken) + bcryptjs      |
| File uploads      | Multer                            |
| SMS notifications | Twilio                            |
| Email notifications | Nodemailer                      |
| Validation        | express-validator                 |
| Security          | Helmet, CORS                      |
| Logging           | Morgan                            |
| Dev tooling       | Nodemon                           |

## Prerequisites

Before you begin, make sure you have the following installed on your machine:

- **Node.js** v18 or higher — [Download here](https://nodejs.org/)
- **npm** (comes bundled with Node.js)
- **MongoDB** — either:
  - A local MongoDB instance ([install guide](https://www.mongodb.com/docs/manual/installation/)), or
  - A free cloud cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- A **Twilio** account (for SMS alerts) — [Sign up](https://www.twilio.com/try-twilio)
- An **email account/app password** for sending notifications (e.g., a Gmail account with an App Password, or an SMTP provider)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/AkshadGiri/YellowFlag-v2v.git
cd YellowFlag-v2v
```

> If the backend lives in a subfolder (e.g., `server/` or `backend/`), `cd` into that folder before continuing.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root (next to `server.js`) and add the following variables:

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
MONGO_URI=mongodb://localhost:27017/community-safety-network

# Auth
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Twilio (SMS alerts)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

> ⚠️ Never commit your `.env` file. Make sure it's listed in `.gitignore`.
> Replace the placeholder values with your actual MongoDB URI, JWT secret, Twilio credentials, and email credentials.

### 4. Run the server

**Development mode** (auto-restarts on file changes via Nodemon):

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

By default, the server should be available at:

```
http://localhost:5000
```

### 5. Verify it's running

Open your browser or use a tool like Postman/curl to hit a health-check or base route (e.g., `http://localhost:5000/`) and confirm you get a response from the API.

## Project Structure

A typical structure for this kind of Express + Mongoose backend looks like this (adjust to match the actual repo layout):

```
YellowFlag-v2v/
├── config/          # DB connection, Twilio/Nodemailer setup
├── controllers/      # Route handler logic
├── middleware/        # Auth, error handling, validation
├── models/           # Mongoose schemas (User, Incident, SOSAlert, etc.)
├── routes/            # Express route definitions
├── uploads/           # Uploaded files (via Multer)
├── utils/             # Helper functions
├── .env               # Environment variables (not committed)
├── server.js          # App entry point
└── package.json
```

## Available Scripts

| Command       | Description                                  |
|---------------|-----------------------------------------------|
| `npm start`   | Runs the server with plain Node.js            |
| `npm run dev` | Runs the server with Nodemon for live reload  |

## Troubleshooting

- **MongoDB connection errors** — Double-check `MONGO_URI` in `.env` and that your MongoDB service (local or Atlas) is running and accessible.
- **Port already in use** — Change the `PORT` value in `.env` or stop the process using that port.
- **SMS/Email not sending** — Verify your Twilio and email credentials are correct and that your Twilio number/email account is active and not in trial restrictions.
- **CORS errors from frontend** — Confirm `CLIENT_URL` in `.env` matches the URL your frontend is running on.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project currently has no specified license. Add a `LICENSE` file (e.g., MIT) if you intend to open-source it.
