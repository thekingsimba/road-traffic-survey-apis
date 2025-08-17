# Road Traffic Survey APIs

Backend of the road survey API for counting vehicles (cars, motorcycles) passing on roads during statistical surveys.

## Features

### Role-Based Access Control
- **Admin Role**: Full access to create, manage, and view all surveys and users
- **Agent Role**: Limited access to assigned surveys and vehicle counting functionality

### Survey Management
- Create surveys with start/end points, scheduled times, and assigned agents
- Manage survey status (inactive → active → archived)
- Track actual start/end times
- Assign agents to specific counting posts (start or end point)
- Both admin and assigned agents can start/end surveys

### Vehicle Counting
- Real-time vehicle counting for active surveys
- Separate tracking for motorcycles and cars
- Automatic validation that surveys are active and within time constraints
- Incremental counting (+1 for each vehicle)

### User Management
- Admin can create agent accounts with initial passwords
- Agent accounts include counting post assignments
- Secure authentication with JWT tokens

## API Endpoints

### Survey Management
- `POST /api/surveys/create` - Create new survey (Admin only)
- `GET /api/surveys` - List surveys (filtered by role)
- `GET /api/surveys/:id` - Get survey details
- `PUT /api/surveys/:id` - Update survey (Admin only)
- `DELETE /api/surveys/:id` - Delete survey (Admin only)
- `PUT /api/surveys/:id/start` - Start survey (Admin only)
- `PUT /api/surveys/:id/end` - End survey (Admin only)
- `POST /api/surveys/count-vehicle` - Count vehicle (Agent only)
- `GET /api/surveys/stats/overview` - Get survey statistics

### User Management
- `POST /api/users/create-agent` - Create agent account (Admin only)
- `POST /api/users/email_signup` - User registration
- `POST /api/users/email_login` - User authentication
- `GET /api/users/list` - List users
- `GET /api/users/details` - Get user details
- `PUT /api/users/update` - Update user profile
- `DELETE /api/users/delete` - Delete user account

### Authentication
- `POST /api/auth/forgot_password` - Password reset request
- `POST /api/auth/reset_password` - Password reset
- `POST /api/auth/resend_code` - Resend reset code

## Survey Workflow

1. **Admin creates survey** with route details, scheduled times, and assigned agent
2. **Admin or assigned Agent starts survey** when ready to begin counting
3. **Agent counts vehicles** using the count-vehicle endpoint
4. **Admin or assigned Agent ends survey** when counting period is complete
5. **Survey is archived** and no further counting is allowed

## Data Models

### Survey Schema
- Basic info: name, start/end points, counting post
- Timing: scheduled and actual start/end times
- Status: inactive, active, archived
- Counts: motorcycle and car counts
- Relationships: assigned agent, creator

### User Schema
- Basic info: name, email, phone
- Role: admin or agent
- Counting post: start or end point assignment
- Authentication: password, reset tokens

## Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Secure password handling with bcrypt
- Rate limiting protection

## Environment Variables

Required environment variables:
- `PORT` - Server port
- `DB_USER` - MongoDB username
- `DB_PASSWORD` - MongoDB password
- `DB_HOST` - MongoDB host
- `DB_PARAMS` - MongoDB connection parameters
- `SENDGRID_API_KEY` - Email service API key
- `SECRET` - JWT secret key

## Installation & Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start the server: `npm run dev` (development) or `npm start` (production)

## API Documentation

Interactive API documentation is available at `/api_docs` when the server is running. 
