# README.md

# API Lokerin

API Lokerin is a job board notification system that allows users to subscribe for job alerts via email. The application uses a JSON server to manage job listings and subscriber data.

## Project Structure

- **public/images**: This folder is intended to store image files that you want to upload to GitHub.
- **server.js**: Contains the main server logic for the application, including configuration for email notifications, file uploads, and handling API requests.
- **db.json**: Serves as the database for the JSON server, storing data for the application.
- **package.json**: Configuration file for npm, listing the dependencies and scripts for the project.

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd api-Lokerin
   ```

3. Install the dependencies:
   ```
   npm install
   ```

## Usage

To start the server, run:
```
npm start
```

The server will be running on `http://localhost:5000`.

## API Endpoints

- **POST /api/subscribe**: Subscribe an email for job notifications.
- **POST /api/notify-new-job**: Notify all subscribers about a new job listing.
- **POST /upload**: Upload an image file.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.