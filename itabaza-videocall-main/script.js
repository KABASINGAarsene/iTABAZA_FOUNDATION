// Global variables
let localStream;
let isScreenSharing = false;
let isMuted = false;
let isCameraOff = false;
let meetingStartTime;
let participants = new Map();
let currentUser;

// DOM elements
const preJoinScreen = document.getElementById('preJoinScreen');
const meetingScreen = document.getElementById('meetingScreen');
const joinButton = document.getElementById('joinButton');
const leaveButton = document.getElementById('leaveButton');
const muteButton = document.getElementById('muteButton');
const videoButton = document.getElementById('videoButton');
const screenShareButton = document.getElementById('screenShareButton');
const nameInput = document.getElementById('nameInput');
const previewVideo = document.getElementById('previewVideo');
const videoGrid = document.getElementById('videoGrid');
const participantCount = document.getElementById('participantCount');
const meetingTime = document.getElementById('meetingTime');
const sharedContent = document.getElementById('sharedContent');
const sharedScreen = document.getElementById('sharedScreen');

// SOCKET.IO variables
const socket = io({
    transports: ['websocket', 'polling'],
    upgrade: true,
    rememberUpgrade: true,
    timeout: 20000,
    forceNew: true
});

const roomId = 'video-meeting-room';
let peerConnections = {};
let iceCandidatesQueue = {}; // Queue for ICE candidates received before remote description


// Initialize the app
async function initializeApp() {
    try {
        console.log('Initializing video chat app...');
        // Start preview video
        await startPreview();
        initializeSocketConnection();     // Initialize socket connection after preview
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
}

// Start camera preview before joining
async function startPreview() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
        });
        previewVideo.srcObject = stream;
        localStream = stream;
        console.log('Camera preview started');
    } catch (error) {
        console.error('Failed to access camera:', error);
        // Show placeholder if camera access fails
        previewVideo.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'video-placeholder';
        placeholder.textContent = 'Camera not available';
        previewVideo.parentNode.appendChild(placeholder);
    }
}

// Initialize Socket.IO connection
function initializeSocketConnection() {
    // Handle socket connection events
    socket.on('connect', () => {
        console.log('✅ Connected to signaling server');
    });
    
    socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from signaling server:', reason);
        if (reason === 'io server disconnect') {
            // Server disconnected us, try to reconnect
            socket.connect();
        }
    });
    
    socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
    });
    
    socket.on('reconnect', (attemptNumber) => {
        console.log(`✅ Reconnected to signaling server after ${attemptNumber} attempts`);
    });
    
    socket.on('reconnect_error', (error) => {
        console.error('❌ Socket reconnection error:', error);
    });
    
    socket.on('user-connected', (userId, userName) => {
        console.log(`User ${userName} connected`);
        addParticipant(userId, userName, false);
        // New user joined, we create the offer (we are the initiator)
        createPeerConnection(userId, true);
        updateParticipantCount();
    });
    
    socket.on('existing-users', (users) => {
        users.forEach(user => {
            addParticipant(user.userId, user.userName, false);
            // These are existing users, they will create offers to us
            createPeerConnection(user.userId, false);
        });
        updateParticipantCount();
    });
    
    socket.on('user-disconnected', (userId) => {
        console.log(`User ${userId} disconnected`);
        if (peerConnections[userId]) {
            peerConnections[userId].close();
            delete peerConnections[userId];
        }
        removeParticipant(userId);
        updateParticipantCount();
    });
    
    socket.on('offer', async (offer, fromUserId) => {
        try {
            console.log(`Received offer from ${fromUserId}`);
            const pc = createPeerConnection(fromUserId, false);
            
            if (pc.signalingState !== 'stable') {
                console.log(`Peer connection not in stable state: ${pc.signalingState}`);
                return;
            }
            
            await pc.setRemoteDescription(offer);
            
            // Process any queued ICE candidates
            await processQueuedIceCandidates(fromUserId);
            
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', answer, fromUserId);
        } catch (error) {
            console.error(`Error handling offer from ${fromUserId}:`, error);
        }
    });
    
    socket.on('answer', async (answer, fromUserId) => {
        try {
            console.log(`Received answer from ${fromUserId}`);
            const pc = peerConnections[fromUserId];
            if (pc && pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(answer);
                
                // Process any queued ICE candidates
                await processQueuedIceCandidates(fromUserId);
            } else {
                console.log(`Ignoring answer from ${fromUserId}, wrong state: ${pc ? pc.signalingState : 'no connection'}`);
            }
        } catch (error) {
            console.error(`Error handling answer from ${fromUserId}:`, error);
        }
    });
    
    socket.on('ice-candidate', async (candidate, fromUserId) => {
        try {
            console.log(`Received ICE candidate from ${fromUserId}`);
            const pc = peerConnections[fromUserId];
            if (pc && pc.remoteDescription) {
                await pc.addIceCandidate(candidate);
                console.log(`✅ Added ICE candidate from ${fromUserId}`);
            } else {
                console.log(`⏳ Queuing ICE candidate from ${fromUserId} (remote description not ready)`);
                // Queue the candidate for later
                if (!iceCandidatesQueue[fromUserId]) {
                    iceCandidatesQueue[fromUserId] = [];
                }
                iceCandidatesQueue[fromUserId].push(candidate);
            }
        } catch (error) {
            console.error(`❌ Error handling ICE candidate from ${fromUserId}:`, error);
        }
    });
    
    socket.on('user-toggle-audio', (userId, isMuted) => {
        updateRemoteUserStatus(userId, 'audio', isMuted);
    });
    
    socket.on('user-toggle-video', (userId, isVideoOff) => {
        updateRemoteUserStatus(userId, 'video', isVideoOff);
    });
    
    socket.on('screen-share-started', (userId) => {
        console.log(`User ${userId} started screen sharing`);
        addScreenShareIndicator(userId);
    });
    
    socket.on('screen-share-stopped', (userId) => {
        console.log(`User ${userId} stopped screen sharing`);
        removeScreenShareIndicator(userId);
    });
}

// Create WebRTC peer connection
function createPeerConnection(userId, isInitiator = false) {
    if (peerConnections[userId]) {
        return peerConnections[userId];
    }
    
    const pc = new RTCPeerConnection({
        iceServers: [
            // Primary STUN servers
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            
            // Additional STUN servers for better reliability
            { urls: 'stun:stun.voiparound.com:3478' },
            { urls: 'stun:stun.voipbuster.com:3478' },
            { urls: 'stun:stun.voipstunt.com:3478' },
            { urls: 'stun:stun.voxgratia.org:3478' },
            { urls: 'stun:stun.xten.com:3478' },
            
            // Free TURN servers (for fallback when STUN fails)
            {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            }
        ],
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        iceTransportPolicy: 'all'
    });
    
    // Add local stream to peer connection
    if (localStream) {
        localStream.getTracks().forEach(track => {
            console.log(`Adding ${track.kind} track to peer connection for ${userId}`);
            pc.addTrack(track, localStream);
        });
    }
    
// Handle remote stream
    pc.ontrack = (event) => {
        console.log(`Received remote ${event.track.kind} track from ${userId}:`, event);
        const participantElement = document.querySelector(`#participant-${userId}`);
        const remoteVideo = participantElement?.querySelector('video');
        
        if (remoteVideo && event.streams[0]) {
            console.log(`Setting stream for ${userId}:`, event.streams[0]);
            
            // Remove any existing click-to-play buttons
            const existingPlayButton = participantElement.querySelector('.play-button');
            if (existingPlayButton) {
                existingPlayButton.remove();
            }
            
            // Remove loading indicator
            const loadingIndicator = participantElement.querySelector('.loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
            
            // Handle multiple streams or track additions
            if (remoteVideo.srcObject) {
                // Stream already exists, add tracks to existing stream
                const existingStream = remoteVideo.srcObject;
                const newTracks = event.streams[0].getTracks();
                
                newTracks.forEach(track => {
                    const existingTrack = existingStream.getTracks().find(t => t.kind === track.kind);
                    if (existingTrack) {
                        existingStream.removeTrack(existingTrack);
                    }
                    existingStream.addTrack(track);
                });
                
                console.log(`Updated existing stream for ${userId}`);
            } else {
                // Set new stream
                remoteVideo.srcObject = event.streams[0];
            }
            
            remoteVideo.style.display = 'block';
            remoteVideo.style.opacity = '1';
            remoteVideo.style.background = 'transparent';
            
            // Essential video properties for proper playback
            remoteVideo.muted = false; // Allow remote audio to be heard
            remoteVideo.autoplay = true;
            remoteVideo.playsInline = true;
            remoteVideo.controls = false;
            
            // Force video to start playing with comprehensive error handling
            const tryPlay = async () => {
                try {
                    // Ensure video is ready
                    if (remoteVideo.readyState < 2) {
                        await new Promise(resolve => {
                            remoteVideo.addEventListener('loadeddata', resolve, { once: true });
                        });
                    }
                    
                    await remoteVideo.play();
                    console.log(`✅ Video playing successfully for ${userId}`);
                    hideParticipantAvatar(userId);
                    showConnectionStatus(userId, 'connected');
                    
                    // Enable video visibility
                    remoteVideo.style.opacity = '1';
                    
                } catch (error) {
                    console.log(`Autoplay failed for ${userId}:`, error.message);
                    
                    // Try again with user interaction
                    if (error.name === 'NotAllowedError') {
                        addClickToPlay(remoteVideo, userId);
                    } else {
                        // For other errors, try again after a delay
                        setTimeout(tryPlay, 1000);
                    }
                }
            };
            
            // Multiple attempts to start video
            setTimeout(tryPlay, 100);
            
            // Try again when metadata loads
            remoteVideo.addEventListener('loadedmetadata', () => {
                console.log(`Video metadata loaded for ${userId}`);
                setTimeout(tryPlay, 50);
            }, { once: true });
            
            // Try again when data loads
            remoteVideo.addEventListener('loadeddata', () => {
                console.log(`Video data loaded for ${userId}`);
                setTimeout(tryPlay, 50);
            }, { once: true });
            
            // Handle track events
            event.track.addEventListener('ended', () => {
                console.log(`${event.track.kind} track ended for ${userId}`);
                if (event.track.kind === 'video') {
                    showParticipantAvatar(userId);
                }
            });
            
            // Handle track mute/unmute
            event.track.addEventListener('mute', () => {
                console.log(`${event.track.kind} track muted for ${userId}`);
                if (event.track.kind === 'video') {
                    remoteVideo.style.opacity = '0.3';
                }
            });
            
            event.track.addEventListener('unmute', () => {
                console.log(`${event.track.kind} track unmuted for ${userId}`);
                if (event.track.kind === 'video') {
                    remoteVideo.style.opacity = '1';
                    tryPlay();
                }
            });
            
            console.log(`✅ Video stream successfully set for ${userId}`);
        } else {
            console.warn(`Could not set video stream for ${userId}:`, {
                remoteVideo: !!remoteVideo,
                stream: !!event.streams[0],
                participantElement: !!participantElement
            });
        }
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            console.log(`Sending ICE candidate to ${userId}`);
            socket.emit('ice-candidate', event.candidate, userId);
        }
    };
    
    // Handle connection state changes
    pc.onconnectionstatechange = () => {
        console.log(`Connection state with ${userId}: ${pc.connectionState}`);
        if (pc.connectionState === 'connected') {
            console.log(`✅ Successfully connected to ${userId}`);
            showConnectionStatus(userId, 'connected');
        } else if (pc.connectionState === 'failed') {
            console.log(`❌ Connection failed with ${userId}`);
            showConnectionStatus(userId, 'failed');
            // Try to restart connection after a delay
            setTimeout(() => {
                if (peerConnections[userId] && peerConnections[userId].connectionState === 'failed') {
                    console.log(`🔄 Attempting to restart connection with ${userId}`);
                    restartConnection(userId);
                }
            }, 5000);
        } else if (pc.connectionState === 'disconnected') {
            console.log(`⚠️ Connection disconnected with ${userId}`);
            showConnectionStatus(userId, 'disconnected');
        }
    };
    
    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
        console.log(`ICE connection state with ${userId}: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === 'failed') {
            console.log(`❌ ICE connection failed with ${userId}`);
            showConnectionStatus(userId, 'ice-failed');
        } else if (pc.iceConnectionState === 'connected') {
            console.log(`✅ ICE connection established with ${userId}`);
        }
    };
    
    // Handle ICE gathering state
    pc.onicegatheringstatechange = () => {
        console.log(`ICE gathering state with ${userId}: ${pc.iceGatheringState}`);
    };
    
    // Handle signaling state
    pc.onsignalingstatechange = () => {
        console.log(`Signaling state with ${userId}: ${pc.signalingState}`);
    };
    
    peerConnections[userId] = pc;
    
    // Only create offer if we're the initiator
    if (isInitiator && currentUser) {
        setTimeout(() => createOffer(userId), 100); // Small delay to ensure everything is set up
    }
    
    return pc;
}

// Create and send offer
async function createOffer(userId) {
    try {
        const pc = peerConnections[userId];
        if (pc) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('offer', offer, userId);
        }
    } catch (error) {
        console.error('Error creating offer:', error);
    }
}

// Process queued ICE candidates
async function processQueuedIceCandidates(userId) {
    const pc = peerConnections[userId];
    const queuedCandidates = iceCandidatesQueue[userId];
    
    if (pc && pc.remoteDescription && queuedCandidates && queuedCandidates.length > 0) {
        console.log(`⏩ Processing ${queuedCandidates.length} queued ICE candidates for ${userId}`);
        
        for (const candidate of queuedCandidates) {
            try {
                await pc.addIceCandidate(candidate);
                console.log(`✅ Added queued ICE candidate for ${userId}`);
            } catch (error) {
                console.error(`❌ Failed to add queued ICE candidate for ${userId}:`, error);
            }
        }
        
        // Clear the queue
        delete iceCandidatesQueue[userId];
        console.log(`✅ Processed all queued ICE candidates for ${userId}`);
    }
}

// Update remote user status
function updateRemoteUserStatus(userId, type, isDisabled) {
    const participantElement = participants.get(userId);
    if (participantElement) {
        const statusContainer = participantElement.querySelector('.video-status');
        
        if (type === 'audio' && isDisabled) {
            // Add mute indicator
            let muteIcon = statusContainer.querySelector('.audio-muted');
            if (!muteIcon) {
                muteIcon = document.createElement('div');
                muteIcon.className = 'status-icon muted audio-muted';
                muteIcon.innerHTML = '<span class="material-icons">mic_off</span>';
                statusContainer.appendChild(muteIcon);
            }
        } else if (type === 'audio' && !isDisabled) {
            // Remove mute indicator
            const muteIcon = statusContainer.querySelector('.audio-muted');
            if (muteIcon) {
                muteIcon.remove();
            }
        }
        
        if (type === 'video') {
            const video = participantElement.querySelector('video');
            if (video) {
                video.style.opacity = isDisabled ? '0' : '1';
            }
        }
    }
}

// Join the meeting
async function joinMeeting() {
    try {
        const userName = nameInput.value.trim() || 'Guest User';
        
        // Create user
        currentUser = {
            id: 'user-' + Math.random().toString(36).substring(7),
            name: userName
        };
        
        // Get fresh media stream for the meeting
        if (!localStream || !localStream.active) {
            localStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
        }
        
        // Switch to meeting screen
        preJoinScreen.style.display = 'none';
        meetingScreen.style.display = 'block';
        
        // Start meeting timer
        meetingStartTime = new Date();
        startMeetingTimer();
        
        // Add local participant
        addParticipant(currentUser.id, currentUser.name, true);
        
        // Join the room via Socket.IO
        socket.emit('join-room', roomId, currentUser.id, currentUser.name);
        
        // Update participant count
        updateParticipantCount();
        
        // Start connection quality monitoring
        startConnectionQualityMonitoring();
        
        console.log('Successfully joined meeting');
        
    } catch (error) {
        console.error('Failed to join meeting:', error);
        alert('Failed to join meeting. Please check camera/microphone permissions.');
    }
}


// Add participant to the grid
function addParticipant(participantId, participantName, isLocal = false) {
    const participantElement = document.createElement('div');
    participantElement.className = 'video-tile';
    participantElement.id = `participant-${participantId}`;
    
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = isLocal; // Only mute local video to prevent feedback, allow remote audio
    video.playsInline = true;
    video.controls = false;
    
    // Additional properties for better video handling
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    
    // Add connection quality indicator for remote participants
    if (!isLocal) {
        const qualityIndicator = document.createElement('div');
        qualityIndicator.className = 'connection-quality';
        qualityIndicator.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #666;
            z-index: 3;
        `;
        participantElement.appendChild(qualityIndicator);
    }
    
    const nameLabel = document.createElement('div');
    nameLabel.className = 'participant-name';
    nameLabel.textContent = isLocal ? `${participantName} (You)` : participantName;
    
    const statusContainer = document.createElement('div');
    statusContainer.className = 'video-status';
    
    // Add mute indicator if needed
    if (isLocal && isMuted) {
        const muteIcon = document.createElement('div');
        muteIcon.className = 'status-icon muted';
        muteIcon.innerHTML = '<span class="material-icons">mic_off</span>';
        statusContainer.appendChild(muteIcon);
    }
    
    participantElement.appendChild(video);
    participantElement.appendChild(nameLabel);
    participantElement.appendChild(statusContainer);
    
    // Add click listener for fullscreen
    participantElement.addEventListener('click', () => toggleFullscreen(participantElement));
    
    videoGrid.appendChild(participantElement);
    participants.set(participantId, participantElement);
    
    // Set up local video stream
    if (isLocal && localStream) {
        video.srcObject = localStream;
    } else if (!isLocal) {
        // Create placeholder for remote participants
        video.style.background = `linear-gradient(45deg, hsl(${Math.random() * 360}, 70%, 50%), hsl(${Math.random() * 360}, 70%, 30%))`;
        video.style.display = 'block'; // Show video element immediately
        video.style.opacity = '0.3'; // Make it slightly transparent until stream arrives
        
        // Add an avatar that will be hidden when video stream starts
        const avatar = document.createElement('div');
        avatar.className = 'participant-avatar';
        avatar.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(45deg, hsl(${Math.random() * 360}, 70%, 50%), hsl(${Math.random() * 360}, 70%, 30%));
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: bold;
            color: white;
            z-index: 2;
        `;
        avatar.textContent = participantName.charAt(0).toUpperCase();
        participantElement.appendChild(avatar);
        
        // Add loading indicator for remote participants
        addLoadingIndicator(participantId);
    }
    
    updateVideoGrid();
}

// Remove participant from grid
function removeParticipant(participantId) {
    const participantElement = participants.get(participantId);
    if (participantElement) {
        participantElement.remove();
        participants.delete(participantId);
        updateVideoGrid();
    }
}

// Update video grid layout based on participant count
function updateVideoGrid() {
    const participantCount = participants.size;
    
    // Reset all classes
    videoGrid.className = 'video-grid';
    
    // Apply appropriate layout class based on participant count
    switch (participantCount) {
        case 1:
            videoGrid.classList.add('single-video');
            break;
        case 2:
            videoGrid.classList.add('two-videos');
            break;
        case 3:
            videoGrid.classList.add('three-videos');
            break;
        case 4:
            videoGrid.classList.add('four-videos');
            break;
        case 5:
            videoGrid.classList.add('five-videos');
            break;
        case 6:
            videoGrid.classList.add('six-videos');
            break;
        case 7:
        case 8:
            videoGrid.classList.add('seven-videos');
            break;
        case 9:
            videoGrid.classList.add('nine-videos');
            break;
        default:
            videoGrid.classList.add('many-videos');
            break;
    }
    
    console.log(`Updated video grid for ${participantCount} participants`);
}

// Toggle fullscreen for video
function toggleFullscreen(element) {
    if (element.classList.contains('fullscreen-video')) {
        element.classList.remove('fullscreen-video');
        document.body.style.overflow = 'hidden';
    } else {
        // Remove fullscreen from other videos
        document.querySelectorAll('.fullscreen-video').forEach(el => {
            el.classList.remove('fullscreen-video');
        });
        element.classList.add('fullscreen-video');
        
        // Click anywhere to exit fullscreen after a delay
        setTimeout(() => {
            const exitFullscreen = (e) => {
                if (e.target === element || element.contains(e.target)) return;
                element.classList.remove('fullscreen-video');
                document.removeEventListener('click', exitFullscreen);
            };
            document.addEventListener('click', exitFullscreen);
        }, 100);
    }
}

// Toggle microphone
async function toggleMicrophone() {
    try {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                isMuted = !audioTrack.enabled;
                
                if (isMuted) {
                    muteButton.classList.add('muted');
                    muteButton.querySelector('.material-icons').textContent = 'mic_off';
                } else {
                    muteButton.classList.remove('muted');
                    muteButton.querySelector('.material-icons').textContent = 'mic';
                }
                
                // Update status indicator on local video
                updateLocalVideoStatus();
                
                // Notify other participants
                socket.emit('toggle-audio', isMuted);
            }
        }
    } catch (error) {
        console.error('Failed to toggle microphone:', error);
    }
}

// Toggle camera
async function toggleCamera() {
    try {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                isCameraOff = !videoTrack.enabled;
                
                if (isCameraOff) {
                    videoButton.classList.add('muted');
                    videoButton.querySelector('.material-icons').textContent = 'videocam_off';
                } else {
                    videoButton.classList.remove('muted');
                    videoButton.querySelector('.material-icons').textContent = 'videocam';
                }
                
                // Update local video display
                const localVideo = document.querySelector('#participant-' + currentUser.id + ' video');
                if (localVideo) {
                    localVideo.style.opacity = isCameraOff ? '0' : '1';
                }
                
                // Notify other participants
                socket.emit('toggle-video', isCameraOff);
            }
        }
    } catch (error) {
        console.error('Failed to toggle camera:', error);
    }
}

// Update local video status indicators
function updateLocalVideoStatus() {
    const localParticipant = participants.get(currentUser.id);
    if (localParticipant) {
        const statusContainer = localParticipant.querySelector('.video-status');
        statusContainer.innerHTML = '';
        
        if (isMuted) {
            const muteIcon = document.createElement('div');
            muteIcon.className = 'status-icon muted';
            muteIcon.innerHTML = '<span class="material-icons">mic_off</span>';
            statusContainer.appendChild(muteIcon);
        }
    }
}

// Add screen sharing indicator
function addScreenShareIndicator(userId) {
    const participantElement = participants.get(userId);
    if (participantElement) {
        const nameLabel = participantElement.querySelector('.participant-name');
        const statusContainer = participantElement.querySelector('.video-status');
        
        // Update name label to show screen sharing
        const originalName = nameLabel.textContent.replace(' (Sharing screen)', '');
        nameLabel.textContent = originalName + ' (Sharing screen)';
        
        // Add screen share icon
        let screenIcon = statusContainer.querySelector('.screen-sharing');
        if (!screenIcon) {
            screenIcon = document.createElement('div');
            screenIcon.className = 'status-icon screen-sharing';
            screenIcon.innerHTML = '<span class="material-icons">screen_share</span>';
            screenIcon.style.background = '#1a73e8';
            statusContainer.appendChild(screenIcon);
        }
        
        console.log(`Added screen sharing indicator for ${userId}`);
    }
}

// Remove screen sharing indicator
function removeScreenShareIndicator(userId) {
    const participantElement = participants.get(userId);
    if (participantElement) {
        const nameLabel = participantElement.querySelector('.participant-name');
        const statusContainer = participantElement.querySelector('.video-status');
        
        // Remove screen sharing text from name
        nameLabel.textContent = nameLabel.textContent.replace(' (Sharing screen)', '');
        
        // Remove screen share icon
        const screenIcon = statusContainer.querySelector('.screen-sharing');
        if (screenIcon) {
            screenIcon.remove();
        }
        
        console.log(`Removed screen sharing indicator for ${userId}`);
    }
}

// Toggle screen sharing
async function toggleScreenShare() {
    try {
        if (isScreenSharing) {
            // Stop screen sharing and return to camera
            await stopScreenShare();
        } else {
            // Start screen sharing
            await startScreenShare();
        }
    } catch (error) {
        console.error('Failed to toggle screen share:', error);
        if (error.name === 'NotAllowedError') {
            alert('Screen sharing permission denied. Please allow screen sharing and try again.');
        }
    }
}

// Start screen sharing
async function startScreenShare() {
    try {
        // Get screen capture stream
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                mediaSource: 'screen',
                width: { ideal: 1920, max: 1920 },
                height: { ideal: 1080, max: 1080 },
                frameRate: { ideal: 30, max: 60 }
            },
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                sampleRate: 44100
            }
        });
        
        console.log('Screen capture stream obtained:', screenStream);
        
        // Update UI
        screenShareButton.classList.add('active');
        screenShareButton.querySelector('.material-icons').textContent = 'stop_screen_share';
        isScreenSharing = true;
        
        // Get tracks from screen stream
        const videoTrack = screenStream.getVideoTracks()[0];
        const audioTrack = screenStream.getAudioTracks()[0];
        
        console.log('Screen sharing tracks:', {
            video: !!videoTrack,
            audio: !!audioTrack,
            videoSettings: videoTrack?.getSettings(),
            audioSettings: audioTrack?.getSettings()
        });
        
        // Store original camera stream for later restoration
        window.originalStream = localStream;
        
        // Create new stream with screen tracks
        const combinedStream = new MediaStream();
        
        // Add video track from screen
        if (videoTrack) {
            combinedStream.addTrack(videoTrack);
        }
        
        // Add audio - prefer screen audio, fallback to microphone
        if (audioTrack) {
            combinedStream.addTrack(audioTrack);
            console.log('Using screen audio');
        } else if (localStream && localStream.getAudioTracks()[0]) {
            combinedStream.addTrack(localStream.getAudioTracks()[0]);
            console.log('Using microphone audio');
        }
        
        // Replace tracks in all peer connections with better error handling
        const trackReplacementPromises = [];
        
        for (const [userId, pc] of Object.entries(peerConnections)) {
            console.log(`Replacing tracks for user ${userId}`);
            
            const senders = pc.getSenders();
            console.log(`Found ${senders.length} senders for ${userId}`);
            
            // Replace video track
            const videoSender = senders.find(sender => 
                sender.track && sender.track.kind === 'video'
            );
            
            if (videoSender && videoTrack) {
                const replaceVideoPromise = videoSender.replaceTrack(videoTrack)
                    .then(() => {
                        console.log(`✅ Successfully replaced video track for ${userId}`);
                    })
                    .catch(error => {
                        console.error(`❌ Failed to replace video track for ${userId}:`, error);
                        // Try to re-add the track
                        return pc.addTrack(videoTrack, combinedStream)
                            .then(() => console.log(`✅ Re-added video track for ${userId}`))
                            .catch(e => console.error(`❌ Failed to re-add video track for ${userId}:`, e));
                    });
                trackReplacementPromises.push(replaceVideoPromise);
            } else {
                console.warn(`No video sender found for ${userId}`);
                // Add track if sender doesn't exist
                if (videoTrack) {
                    try {
                        pc.addTrack(videoTrack, combinedStream);
                        console.log(`✅ Added new video track for ${userId}`);
                    } catch (error) {
                        console.error(`❌ Failed to add video track for ${userId}:`, error);
                    }
                }
            }
            
            // Replace audio track if we have screen audio
            if (audioTrack) {
                const audioSender = senders.find(sender => 
                    sender.track && sender.track.kind === 'audio'
                );
                
                if (audioSender) {
                    const replaceAudioPromise = audioSender.replaceTrack(audioTrack)
                        .then(() => {
                            console.log(`✅ Successfully replaced audio track for ${userId}`);
                        })
                        .catch(error => {
                            console.error(`❌ Failed to replace audio track for ${userId}:`, error);
                        });
                    trackReplacementPromises.push(replaceAudioPromise);
                }
            }
        }
        
        // Wait for all track replacements to complete
        try {
            await Promise.allSettled(trackReplacementPromises);
            console.log('✅ All track replacements completed');
        } catch (error) {
            console.error('❌ Some track replacements failed:', error);
        }
        
        // Update local video display with screen share
        const localVideo = document.querySelector(`#participant-${currentUser.id} video`);
        if (localVideo) {
            localVideo.srcObject = combinedStream;
            console.log('✅ Updated local video display with screen share');
            
            // Ensure local video plays
            try {
                await localVideo.play();
            } catch (error) {
                console.warn('Local video autoplay failed:', error);
            }
        }
        
        // Update local stream reference
        localStream = combinedStream;
        
        // Notify other participants that screen sharing started
        socket.emit('screen-share-started', currentUser.id);
        
        console.log('✅ Screen sharing started and transmitted to all peers');
        
        // Listen for screen share end (when user clicks "Stop sharing" in browser)
        videoTrack.addEventListener('ended', () => {
            console.log('Screen share ended by user (browser stop sharing)');
            stopScreenShare();
        });
        
        // Also listen for track becoming inactive
        videoTrack.addEventListener('mute', () => {
            console.log('Screen share video track muted');
        });
        
        if (audioTrack) {
            audioTrack.addEventListener('ended', () => {
                console.log('Screen share audio ended');
            });
        }
        
    } catch (error) {
        console.error('❌ Failed to start screen share:', error);
        
        // Reset UI state on failure
        screenShareButton.classList.remove('active');
        screenShareButton.querySelector('.material-icons').textContent = 'screen_share';
        isScreenSharing = false;
        
        throw error;
    }
}

// Stop screen sharing and return to camera
async function stopScreenShare() {
    try {
        // Update UI
        screenShareButton.classList.remove('active');
        screenShareButton.querySelector('.material-icons').textContent = 'screen_share';
        isScreenSharing = false;
        
        // Get camera stream back
        const cameraStream = window.originalStream || await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        // Replace screen share tracks back to camera tracks in all peer connections
        for (const [userId, pc] of Object.entries(peerConnections)) {
            const senders = pc.getSenders();
            
            // Replace video track back to camera
            const videoSender = senders.find(sender => 
                sender.track && sender.track.kind === 'video'
            );
            if (videoSender) {
                const cameraVideoTrack = cameraStream.getVideoTracks()[0];
                await videoSender.replaceTrack(cameraVideoTrack);
                console.log(`Restored camera video track for ${userId}`);
            }
            
            // Replace audio track back to microphone
            const audioSender = senders.find(sender => 
                sender.track && sender.track.kind === 'audio'
            );
            if (audioSender) {
                const cameraAudioTrack = cameraStream.getAudioTracks()[0];
                await audioSender.replaceTrack(cameraAudioTrack);
                console.log(`Restored microphone audio track for ${userId}`);
            }
        }
        
        // Update local video display back to camera
        const localVideo = document.querySelector(`#participant-${currentUser.id} video`);
        if (localVideo) {
            localVideo.srcObject = cameraStream;
        }
        
        // Update local stream reference
        localStream = cameraStream;
        
        // Notify other participants that screen sharing stopped
        socket.emit('screen-share-stopped', currentUser.id);
        
        console.log('Screen sharing stopped, returned to camera');
        
    } catch (error) {
        console.error('Failed to stop screen share:', error);
        throw error;
    }
}

// Leave meeting
async function leaveMeeting() {
    try {
        // Clean up
        participants.clear();
        videoGrid.innerHTML = '';
        
        // Stop all media streams
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        
        // Reset UI
        meetingScreen.style.display = 'none';
        preJoinScreen.style.display = 'flex';
        sharedContent.style.display = 'none';
        
        // Reset button states
        muteButton.classList.remove('muted');
        videoButton.classList.remove('muted');
        screenShareButton.classList.remove('active');
        muteButton.querySelector('.material-icons').textContent = 'mic';
        videoButton.querySelector('.material-icons').textContent = 'videocam';
        screenShareButton.querySelector('.material-icons').textContent = 'screen_share';
        
        // Reset variables
        isMuted = false;
        isCameraOff = false;
        isScreenSharing = false;
        meetingStartTime = null;
        
        // Restart preview
        await startPreview();
        
        console.log('Left meeting successfully');
    } catch (error) {
        console.error('Failed to leave meeting:', error);
    }
}

// Update participant count display
function updateParticipantCount() {
    const count = participants.size;
    participantCount.textContent = `${count} participant${count !== 1 ? 's' : ''}`;
}

// Start meeting timer
function startMeetingTimer() {
    const timerInterval = setInterval(() => {
        if (meetingStartTime) {
            const elapsed = new Date() - meetingStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            meetingTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            clearInterval(timerInterval);
        }
    }, 1000);
}

// Event listeners
joinButton.addEventListener('click', joinMeeting);
leaveButton.addEventListener('click', leaveMeeting);
muteButton.addEventListener('click', toggleMicrophone);
videoButton.addEventListener('click', toggleCamera);
screenShareButton.addEventListener('click', toggleScreenShare);

// Allow joining with Enter key
nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinMeeting();
    }
});

// Helper functions for better video connection handling

// Show connection status for a participant
function showConnectionStatus(userId, status) {
    const participantElement = document.querySelector(`#participant-${userId}`);
    if (participantElement) {
        // Remove existing status indicators
        const existingStatus = participantElement.querySelector('.connection-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        let statusText = '';
        let backgroundColor = '';
        let icon = '';
        
        switch (status) {
            case 'connected':
                statusText = 'Connected';
                backgroundColor = 'rgba(34, 139, 34, 0.9)';
                icon = '✅';
                break;
            case 'failed':
                statusText = 'Connection Failed';
                backgroundColor = 'rgba(220, 53, 69, 0.9)';
                icon = '❌';
                break;
            case 'disconnected':
                statusText = 'Disconnected';
                backgroundColor = 'rgba(255, 193, 7, 0.9)';
                icon = '⚠️';
                break;
            case 'ice-failed':
                statusText = 'ICE Failed';
                backgroundColor = 'rgba(220, 53, 69, 0.9)';
                icon = '🌐';
                break;
            case 'connecting':
                statusText = 'Connecting...';
                backgroundColor = 'rgba(0, 123, 255, 0.9)';
                icon = '⏳';
                break;
        }
        
        if (statusText) {
            const statusIndicator = document.createElement('div');
            statusIndicator.className = `connection-status ${status}`;
            statusIndicator.innerHTML = `${icon} ${statusText}`;
            statusIndicator.style.cssText = `
                position: absolute;
                top: 8px;
                left: 8px;
                background: ${backgroundColor};
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                z-index: 3;
                font-weight: 500;
                white-space: nowrap;
            `;
            participantElement.appendChild(statusIndicator);
            
            // Auto-remove success status after 3 seconds
            if (status === 'connected') {
                setTimeout(() => {
                    if (statusIndicator.parentNode) {
                        statusIndicator.remove();
                    }
                }, 3000);
            }
        }
    }
}

// Restart connection with a participant
async function restartConnection(userId) {
    try {
        console.log(`🔄 Restarting connection with ${userId}`);
        
        // Close existing connection
        if (peerConnections[userId]) {
            peerConnections[userId].close();
            delete peerConnections[userId];
        }
        
        // Clear any queued ICE candidates
        delete iceCandidatesQueue[userId];
        
        // Show connecting status
        showConnectionStatus(userId, 'connecting');
        
        // Create new connection
        const pc = createPeerConnection(userId, true);
        
        // Wait a bit and create new offer
        setTimeout(async () => {
            try {
                await createOffer(userId);
                console.log(`✅ Restart offer sent to ${userId}`);
            } catch (error) {
                console.error(`❌ Failed to create restart offer for ${userId}:`, error);
            }
        }, 1000);
        
    } catch (error) {
        console.error(`❌ Failed to restart connection with ${userId}:`, error);
    }
}

// Hide participant avatar when video is working
function hideParticipantAvatar(userId) {
    const participantElement = document.querySelector(`#participant-${userId}`);
    if (participantElement) {
        const avatar = participantElement.querySelector('.participant-avatar');
        if (avatar) {
            avatar.style.display = 'none';
        }
    }
}

// Show participant avatar when video is not working
function showParticipantAvatar(userId) {
    const participantElement = document.querySelector(`#participant-${userId}`);
    if (participantElement) {
        const avatar = participantElement.querySelector('.participant-avatar');
        if (avatar) {
            avatar.style.display = 'flex';
        }
    }
}

// Add click to play functionality for videos that can't autoplay
function addClickToPlay(videoElement, userId) {
    const playButton = document.createElement('div');
    playButton.className = 'play-button';
    playButton.innerHTML = '▶️ Click to play video';
    playButton.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        z-index: 4;
        font-size: 14px;
        font-weight: 500;
        text-align: center;
    `;
    
    const participantElement = document.querySelector(`#participant-${userId}`);
    if (participantElement) {
        participantElement.appendChild(playButton);
        
        playButton.addEventListener('click', async () => {
            try {
                await videoElement.play();
                playButton.remove();
                hideParticipantAvatar(userId);
                console.log(`Video manually started for ${userId}`);
            } catch (error) {
                console.error('Failed to play video manually:', error);
            }
        });
    }
}

// Add loading indicator for connecting participants
function addLoadingIndicator(userId) {
    const participantElement = document.querySelector(`#participant-${userId}`);
    if (participantElement) {
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '⏳ Connecting...';
        loadingIndicator.style.cssText = `
            position: absolute;
            top: 12px;
            left: 12px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 3;
        `;
        participantElement.appendChild(loadingIndicator);
    }
}

// Update connection quality indicator
function updateConnectionQuality(userId, quality) {
    const participantElement = document.querySelector(`#participant-${userId}`);
    if (participantElement) {
        const qualityIndicator = participantElement.querySelector('.connection-quality');
        if (qualityIndicator) {
            let color = '#666';
            switch (quality) {
                case 'excellent':
                    color = '#28a745';
                    break;
                case 'good':
                    color = '#ffc107';
                    break;
                case 'poor':
                    color = '#dc3545';
                    break;
            }
            qualityIndicator.style.background = color;
        }
    }
}

// Monitor connection quality
function startConnectionQualityMonitoring() {
    setInterval(() => {
        Object.keys(peerConnections).forEach(userId => {
            const pc = peerConnections[userId];
            if (pc && pc.connectionState === 'connected') {
                // Get connection stats
                pc.getStats().then(stats => {
                    let totalBitrate = 0;
                    let totalPacketsLost = 0;
                    
                    stats.forEach(report => {
                        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                            if (report.bytesReceived) {
                                totalBitrate += report.bytesReceived * 8 / 1000; // kbps
                            }
                            if (report.packetsLost) {
                                totalPacketsLost += report.packetsLost;
                            }
                        }
                    });
                    
                    // Determine quality based on bitrate and packet loss
                    let quality = 'poor';
                    if (totalBitrate > 500 && totalPacketsLost < 10) {
                        quality = 'excellent';
                    } else if (totalBitrate > 200 && totalPacketsLost < 50) {
                        quality = 'good';
                    }
                    
                    updateConnectionQuality(userId, quality);
                }).catch(error => {
                    console.warn('Failed to get connection stats:', error);
                });
            }
        });
    }, 5000); // Check every 5 seconds
}

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', initializeApp);
