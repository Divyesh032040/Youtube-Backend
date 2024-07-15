# YouTube-Backend 
This is a mini ``YOUTUBE+TBACKEND`` project that covers the major functionalities of youtube

## Table of Contents

1. [Introduction](#introduction)
2. [Links](#important-links)
3. [Features](#features)
4. [Technologies Used](#technologies-used)
5. [Installtion](#installation-and-setup)
6. [Contribution](#contributing)

## Introduction
 This comprehensive backend application replicates the core functionality of YouTube, providing a robust foundation for video platform. Find more about his project in the documentaion below.


## Important links

| Content                          | Link                                                                     |
| -------------------------------- | ------------------------------------------------------------------------ |
| Postman collection Documentation | [click here](https://documenter.getpostman.com/view/34002199/2sA3kPpjpG) |
| Model                            | [click here ](https://app.eraser.io/workspace/k7s2NXrkP0dMxSzX7Cjl?origin=share)      |

## Features

### User Management:

- Registration, login, logout, change-current-password, delete-user-account
- Profile management (avatar, cover image, details).
- Session Management using JWT (JSON Web Tokens) and signedCookies:
- Managing Watch history

### Video Management:

- Video upload and publishing
- Video search, sorting, and pagination
- Video editing and deletion
- Visibility control (publish/unpublish)

### Tweet Management:

- Tweet creation and publishing
- Viewing user tweets
- Updating and deleting tweets

### Subscription Management:

- Subscribing to channels
- Viewing subscriber and subscribed channel lists

### Playlist Management:

- Creating, updating, and deleting playlists
- Adding and removing videos from playlists
- Viewing user playlists

### Like Management:

- Liking and unliking videos, comments, and tweets
- Viewing liked videos

### Comment Management:

- Adding, updating, and deleting comments on videos

### Dashboard:

- Viewing channel statistics (views, subscribers, videos, likes)
- Accessing all uploaded videos by user

### Health Check:

- Endpoint to verify the backend's health

### Api Docs:

- Api documention using POSTMAN

### external Pkgs Used

- "bcryptjs": "^2.4.3",
- "cloudinary": "^2.1.0",
- "cookie-parser": "^1.4.6",
- "cors": "^2.8.5",
- "dotenv": "^16.4.5",
- "express": "^4.19.2",
- "jsonwebtoken": "^9.0.2",
- "mongoose": "^8.2.4",
- "mongoose-aggregate-paginate-v2": "^1.0.7",
- "multer": "^1.4.5-lts.1"


## Technologies Used

- Node.js (v21.1.0) 
- Express.js (4.18.2)
- MongoDB
- Cloudinary

## Installation and Setup

1. **Clone the repository:**

    ```bash
    git clone https://github.com/Divyesh032040/Youtube-Backend.git
    ```

2. **Install dependencies:**

    ```bash
    # change direactory
    cd Youtube-Backend
    npm i
    ```

3. **Set up environment variables:**
    Create a .env in root of project and fill in the required values

    ```bash
    # Create .env file for environment variables
    touch .env
    ```
    
    ```
    PORT=3000
    NODE_ENV=<development> # if you want stack and seeding functionality
    MONGO_URI=<mongodb connection string>
    CORS_ORIGIN=*
    ACCESS_TOKEN_SECRET=<your token secret>
    ACCESS_TOKEN_EXPIRY=1d
    REFRESH_TOKEN_SECRET=< your refresh token secret>
    REFRESH_TOKEN_EXPIRY=10d
    CLOUDINARY_CLOUD_NAME=<your cloud name>
    CLOUDINARY_API_KEY=<your api key>
    CLOUDINARY_API_SECRET=<your api secret>
    ```

4. **Start the server:**

    ```bash
    # Start the server using npm
    npm run dev
    ```
    Server will start on Port:3000

## Contributing

  If you wish to contribute to this project, please feel free to contribute.

