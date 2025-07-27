#!/bin/bash

echo "🚀 Starting Video Meeting Room..."
echo "📍 Opening http://localhost:3001 in your browser..."
echo "🎥 Make sure to allow camera and microphone permissions!"
echo ""
echo "To stop the server, press Ctrl+C"
echo ""

# Open browser (if available)
if command -v xdg-open > /dev/null; then
    sleep 2 && xdg-open http://localhost:3001 &
elif command -v open > /dev/null; then
    sleep 2 && open http://localhost:3001 &
fi

# Start the server
npm start
