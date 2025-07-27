# Video Meeting Room Application

A real-time video conferencing application built with WebRTC, Socket.IO, Node.js, and modern web technologies. This application provides a Google Meet-like experience with camera sharing, screen sharing, and audio controls.

## 🚀 Features

- **Real-time Video Conferencing**: Support for multiple participants with high-quality video
- **Screen Sharing**: Share your screen with all participants
- **Audio Controls**: Mute/unmute microphone
- **Video Controls**: Turn camera on/off
- **Responsive Design**: Works on desktop and mobile devices
- **Automatic Connection Management**: Robust WebRTC connection handling
- **Visual Status Indicators**: See when participants are muted or sharing screen
- **Connection Status**: Real-time connection status indicators

## 🛠️ Fixed Issues

### 1. Camera Distribution/Sharing Issue ✅
**Problem**: Users with cameras on were not visible to other participants.

**Solution Implemented**:
- Enhanced remote stream handling with multiple retry mechanisms
- Improved video autoplay with fallback options
- Added comprehensive track event handling (mute/unmute/ended)
- Implemented proper stream merging for multiple tracks
- Added loading indicators and connection status feedback
- Enhanced error handling for video playback failures

### 2. Screen Sharing Distribution Issue ✅
**Problem**: Screen sharing was not properly transmitted to other participants.

**Solution Implemented**:
- Improved screen capture stream configuration with optimal settings
- Enhanced track replacement logic with error recovery
- Better handling of screen audio and microphone audio fallback
- Comprehensive promise handling for track replacements
- Proper stream restoration when stopping screen share
- Added visual indicators for screen sharing status

### 3. Connection Reliability Issues ✅
**Problem**: Unstable WebRTC connections and ICE candidate handling.

**Solution Implemented**:
- Added ICE candidate queuing system
- Improved signaling sequence with proper timing
- Enhanced peer connection state management
- Better error handling and recovery mechanisms
- Optimized offer/answer exchange process

### 4. Audio/Voice Sharing Issue ✅
**Problem**: Participants could not hear each other's voices during video calls.

**Solution Implemented**:
- Fixed video element muted property - only local video is muted to prevent feedback
- Remote videos are unmuted to allow audio playback
- Proper distinction between local (muted) and remote (unmuted) audio streams
- Enhanced audio track handling for better voice transmission
- Ensured audio tracks are properly transmitted through WebRTC peer connections

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Modern web browser with WebRTC support

### Installation
1. Clone or download the project
2. Navigate to the project directory:
   ```bash
   cd video-chat-app
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open your browser and navigate to `http://localhost:3001`

## How to Use

### Joining a Meeting
1. Open `http://localhost:3001` in your browser
2. Allow camera and microphone permissions when prompted
3. Enter your name (or use the default "Guest User")
4. Click "Join Meeting"

### During the Meeting
- **Mute/Unmute**: Click the microphone button
- **Camera On/Off**: Click the camera button
- **Screen Share**: Click the screen share button
- **Leave Meeting**: Click the red phone button
- **Fullscreen Video**: Click on any video tile to expand it

### Testing with Multiple Users
1. Open multiple browser tabs or different browsers
2. Navigate to `http://localhost:3001` in each
3. Join the same meeting room
4. All participants will see each other automatically

## Features Breakdown

### 🎥 Video Grid Layout
- **1 participant**: Large centered video
- **2 participants**: Side-by-side layout
- **3 participants**: Featured speaker + 2 smaller videos
- **4+ participants**: Automatic grid layout

### 🖥️ Screen Sharing
- Click the screen share button to share your screen
- Shared screen appears in fullscreen overlay
- Other participants see your screen in real-time

### 📱 Responsive Design
- Works on desktop, tablet, and mobile
- Touch-friendly controls
- Adaptive video layouts

### 🔒 Security
- API credentials are stored securely on the server
- No sensitive information exposed to frontend
- Secure token-based authentication

## File Structure

```
video-chat-app/
├── .env                 # Environment variables (API credentials)
├── server.js            # Express server
├── package.json         # Node.js dependencies
├── index.html          # Main HTML file
├── style.css           # Google Meet-like styling
├── script.js           # Video calling functionality
└── README.md           # This file
```

## Troubleshooting

### Camera/Microphone Issues
- Make sure to allow camera and microphone permissions
- Check if other applications are using your camera
- Try refreshing the page

### Connection Issues
- Ensure you have a stable internet connection
- Check if the server is running (`npm start`)
- Verify the Stream API credentials are correct

### Multiple Participants Not Connecting
- All participants must join the same meeting room
- The room ID is currently fixed as 'video-meeting-room'
- Each participant gets a unique user ID automatically

## Development Notes

- Built with vanilla JavaScript (no frameworks)
- Uses Stream Video API for real-time communication
- Express.js server for serving files and API endpoints
- Material Icons for button icons
- CSS Grid for responsive video layouts

## Next Steps for Enhancement

1. **Chat Feature**: Add text messaging during calls
2. **Recording**: Add meeting recording capability
3. **Breakout Rooms**: Support for smaller group sessions
4. **Virtual Backgrounds**: Add background blur/replacement
5. **Meeting Scheduling**: Add calendar integration
6. **User Authentication**: Add proper user login system

## 🐛 Comprehensive Troubleshooting Guide

### Camera/Video Issues

**Problem**: "Camera not available" or black video
- **Solution**: 
  - Ensure camera permissions are granted
  - Check if another application is using the camera
  - Try refreshing the page and granting permissions again
  - Check browser console for specific error messages

**Problem**: Video is not visible to other participants
- **Solution**: 
  - Check network connection
  - Disable VPN if active
  - Try different browsers (Chrome/Firefox recommended)
  - Check if firewall is blocking WebRTC connections

### Screen Sharing Issues

**Problem**: Screen sharing not working
- **Solution**:
  - Use Chrome or Firefox (best support)
  - Ensure you select the correct screen/window
  - Check if browser has screen sharing permissions
  - Try refreshing the page if sharing stops working

**Problem**: Other participants can't see shared screen
- **Solution**:
  - Check network connectivity
  - Ensure all participants refresh their browsers
  - Verify screen sharing is actually active (button should be blue)
  - Check browser console for WebRTC errors

### Audio Issues

**Problem**: Audio not working
- **Solution**:
  - Check microphone permissions
  - Verify microphone is not muted at system level
  - Test microphone in other applications
  - Check audio output device selection

**Problem**: Echo or feedback
- **Solution**:
  - Use headphones to prevent feedback
  - Ensure remote videos are muted (automatic)
  - Check speaker volume levels

### Connection Issues

**Problem**: "Connection failed" or participants not connecting
- **Solution**:
  - Check internet connection stability
  - Disable VPN or proxy
  - Try different network (mobile hotspot)
  - Clear browser cache and cookies
  - Try in incognito/private browsing mode

**Problem**: Frequent disconnections
- **Solution**:
  - Check network stability
  - Ensure sufficient bandwidth (1-3 Mbps per participant)
  - Close other bandwidth-intensive applications
  - Try reducing video quality (future enhancement)

### Browser Compatibility

**Recommended Browsers**:
- Chrome 80+ (best performance)
- Firefox 75+
- Safari 14+ (macOS/iOS)
- Edge 80+

**Not Recommended**:
- Internet Explorer
- Very old browser versions
- Browsers without WebRTC support

## 🔧 Technical Details

### WebRTC Configuration
- Uses Google STUN servers for NAT traversal
- Peer-to-peer connections for low latency
- Automatic ICE candidate handling
- Support for both UDP and TCP connections

### Security Features
- No data stored on servers
- Peer-to-peer encryption
- Local media stream handling
- No recording or storage

### Performance Optimizations
- Efficient video codec selection
- Adaptive bitrate (browser dependent)
- Minimal server resource usage
- Optimized for multiple participants

## 📝 Development Notes

### Key Technologies
- **WebRTC**: Real-time communication
- **Socket.IO**: Signaling server
- **Express.js**: Web server
- **Modern JavaScript**: ES6+ features
- **CSS Grid/Flexbox**: Responsive layouts

### Recent Improvements
- Enhanced error handling and recovery
- Better video stream management
- Improved screen sharing reliability
- Added comprehensive logging
- Optimized connection establishment
- Added visual feedback for all operations

## 🚀 Future Enhancements
- Chat messaging
- Recording capabilities
- Virtual backgrounds
- Bandwidth optimization
- Mobile app versions
- Meeting rooms/persistence

## 🤝 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify network and permissions
3. Try the troubleshooting steps above
4. Test with different browsers/devices
5. Check if the issue is reproducible

## 📄 License
MIT License - Feel free to modify and distribute.

---

**Note**: This application is designed for local/private network use. For production deployment, consider implementing TURN servers for better NAT traversal and additional security measures.

Enjoy your video meetings! 🎉
