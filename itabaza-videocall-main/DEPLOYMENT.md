# Deployment Guide for Video Chat App

## 🚀 Deploying to Render

### Prerequisites
- Render account
- Git repository with your code

### Step 1: Deploy to Render

1. **Connect your repository to Render**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub/GitLab repository

2. **Configure the service**
   - **Name**: `video-chat-app` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Port**: `10000`

3. **Environment Variables**
   - Add `NODE_ENV=production`
   - Add `PORT=10000`

### Step 2: Fix Video Call Issues

The main issue with video calls not working on Render is **WebRTC connectivity**. Here's what we've fixed:

#### ✅ Enhanced STUN/TURN Servers
- Added multiple STUN servers for better NAT traversal
- Added free TURN servers as fallback when STUN fails
- Improved ICE candidate handling

#### ✅ Better Connection Monitoring
- Added connection status indicators
- Automatic connection restart on failure
- Connection quality monitoring

#### ✅ Improved Error Handling
- Better socket.io configuration
- Enhanced error logging
- Graceful fallbacks

### Step 3: Test Your Deployment

1. **Open your deployed URL** (e.g., `https://your-app.onrender.com`)
2. **Allow camera/microphone permissions**
3. **Test with multiple browser tabs** or different devices
4. **Check browser console** for connection logs

### Step 4: Troubleshooting

#### If video still doesn't work:

1. **Check HTTPS**: Ensure your Render deployment uses HTTPS
2. **Browser Compatibility**: Use Chrome, Firefox, or Edge (latest versions)
3. **Network Restrictions**: Some corporate networks block WebRTC
4. **Firewall**: Ensure ports 80, 443, and WebRTC ports are open

#### Debug Steps:

1. **Open Browser Console** (F12)
2. **Look for these messages**:
   - ✅ "Connected to signaling server"
   - ✅ "ICE connection established"
   - ✅ "Video playing successfully"

3. **If you see errors**:
   - ❌ "ICE connection failed" → Network/firewall issue
   - ❌ "Socket connection error" → Server connectivity issue
   - ❌ "Camera not available" → Permission issue

### Step 5: Advanced Configuration

#### For Better Reliability (Optional):

1. **Add Custom TURN Server**:
   - Sign up for a TURN service (Twilio, Agora, etc.)
   - Update the `iceServers` configuration in `script.js`

2. **Environment Variables**:
   ```bash
   NODE_ENV=production
   PORT=10000
   TURN_SERVER_URL=turn:your-server.com:3478
   TURN_USERNAME=your-username
   TURN_CREDENTIAL=your-password
   ```

### Step 6: Monitor Your App

1. **Health Check**: Visit `/health` endpoint
2. **Logs**: Check Render dashboard logs
3. **Metrics**: Monitor connection success rates

## 🔧 Local Testing

Before deploying, test locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open multiple browser tabs to http://localhost:3001
```

## 📱 Mobile Testing

- **iOS Safari**: Limited WebRTC support
- **Android Chrome**: Good support
- **Mobile browsers**: May have restrictions

## 🚨 Common Issues & Solutions

### Issue: "Video not showing on deployed app"
**Solution**: 
- Check HTTPS is enabled
- Verify STUN/TURN servers are accessible
- Test with different browsers

### Issue: "Connection failed"
**Solution**:
- Check network connectivity
- Disable VPN/proxy
- Try different network

### Issue: "Camera not available"
**Solution**:
- Grant camera permissions
- Check if camera is used by other apps
- Try refreshing the page

## 📞 Support

If issues persist:
1. Check browser console for specific errors
2. Test with different browsers/devices
3. Verify network connectivity
4. Check Render deployment logs

## 🎯 Success Indicators

Your deployment is working correctly when:
- ✅ Video streams appear for all participants
- ✅ Audio is working (no echo)
- ✅ Screen sharing works
- ✅ Connection status shows "Connected"
- ✅ No console errors

---

**Note**: This app uses peer-to-peer connections, so video quality depends on participants' network conditions and browser capabilities. 