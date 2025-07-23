# File Transfer Application

A modern, secure file transfer application built with React, Socket.IO, and Node.js. This application enables users to register, login, and transfer files in real-time with end-to-end encryption and progress tracking.

## Features

### 🔐 Authentication & Security
- User registration and login system
- JWT-based authentication
- Password hashing with bcrypt
- Secure socket connections
- File encryption during transfer

### 📁 File Transfer
- Real-time file transfer using Socket.IO
- Support for files up to 100MB
- Progress indicators and status updates
- Drag-and-drop file selection
- File chunking for reliable transfer

### 🎨 User Interface
- Responsive design with Tailwind CSS
- Dark mode support
- Smooth animations with Framer Motion
- Real-time user list
- Transfer status notifications

### 🔧 Technical Features
- React 19 with hooks
- Socket.IO for real-time communication
- Express.js backend
- File validation and type detection
- Encrypted data transmission

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository and navigate to the project directory**
   ```bash
   cd fileTransferApplication
   ```

2. **Install client dependencies**
   ```bash
   npm install
   ```

3. **Install server dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

### Running the Application

#### Method 1: Run separately (recommended for development)

1. **Start the server** (in one terminal):
   ```bash
   npm run server:dev
   ```
   The server will start on `http://localhost:3001`

2. **Start the client** (in another terminal):
   ```bash
   npm run dev
   ```
   The client will start on `http://localhost:5173`

#### Method 2: Production mode

1. **Start the server**:
   ```bash
   npm run server
   ```

2. **Start the client**:
   ```bash
   npm run dev
   ```

## Usage

1. **Registration/Login**
   - Open `http://localhost:5173` in your browser
   - Create a new account or login with existing credentials
   - Minimum password length: 6 characters

2. **File Transfer**
   - Select a file by dragging and dropping or clicking to browse
   - Choose a recipient from the online users list
   - Click "Send" to initiate transfer
   - Recipients will see a notification and can accept/reject the transfer
   - Monitor progress in real-time

3. **Security Features**
   - All file data is encrypted during transmission
   - Secure authentication with JWT tokens
   - Password hashing for user security

## File Size Limits

- Maximum file size: 100MB
- Supported file types: All file types
- Files are transferred in encrypted chunks

## Architecture

### Frontend (React)
- **Context API**: Authentication and Socket management
- **Components**: Modular UI components
- **Pages**: Authentication and Dashboard views
- **Utils**: File handling utilities

### Backend (Node.js)
- **Express Server**: HTTP API and static file serving
- **Socket.IO**: Real-time communication
- **Authentication**: JWT-based auth middleware
- **File Handling**: Multer for file uploads
- **Encryption**: Crypto module for data encryption

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification

## Socket Events

### Client → Server
- `fileTransferRequest` - Initiate file transfer
- `fileTransferResponse` - Accept/reject transfer
- `fileChunk` - Send file chunk

### Server → Client
- `userListUpdate` - Updated online users
- `incomingFileTransfer` - Incoming transfer request
- `transferAccepted/Rejected` - Transfer response
- `transferProgress` - Transfer progress update
- `transferCompleted` - Transfer completion
- `fileChunk` - Receive file chunk

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens for session management
- File data encrypted during transmission
- Input validation and sanitization
- File size and type restrictions

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Troubleshooting

### Common Issues

1. **Connection Issues**
   - Ensure both server and client are running
   - Check firewall settings
   - Verify port availability (3001, 5173)
   - If you see "EADDRINUSE" error, run: `taskkill /f /im node.exe` to kill existing Node processes

2. **File Transfer Fails**
   - Check file size (max 100MB)
   - Ensure stable internet connection
   - Verify both users are online
   - Check browser console for JavaScript errors

3. **Authentication Problems**
   - Clear browser local storage
   - Check server logs for errors
   - Verify JWT token validity
   - Ensure server environment variables are set correctly

4. **Socket Connection Issues**
   - Check browser console for Socket.IO connection errors
   - Verify server is running on correct port (3001)
   - Ensure CORS settings are configured properly
   - Try refreshing the page if connection seems stuck

5. **"Max Depth Reached" Errors**
   - This was fixed by removing circular dependencies in useEffect hooks
   - If you encounter this, check for infinite re-renders in React components

### Development Tips

- Use browser developer tools to monitor network activity
- Check both client and server console logs for errors
- Test with small files first before trying larger transfers
- Use multiple browser windows/tabs to simulate multiple users

### Support

If you encounter any issues, please check the browser console and server logs for error messages.+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
