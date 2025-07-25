const express = require('express');
const { supabase } = require('../config/db');
const { authenticate } = require('../middlewares/authenticator.mw');
const multer = require('multer');
const path = require('path');

const audioRouter = express.Router();

// Configure multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow only audio files
        const allowedTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed'), false);
        }
    }
});

// Upload voice recording to Supabase storage
audioRouter.post('/upload-voice-recording', authenticate, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No audio file provided'
            });
        }

        const userId = req.body.userID;
        const timestamp = new Date().getTime();
        const fileName = `voice-recordings/${userId}/${timestamp}-${req.file.originalname}`;

        // Upload to Supabase storage
        const { data, error } = await supabase.storage
            .from('iTABAZA-audio')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Supabase storage upload error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to upload audio file',
                error: error.message
            });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('iTABAZA-audio')
            .getPublicUrl(fileName);

        // Store recording metadata in database
        const recordingData = {
            user_id: userId,
            file_name: fileName,
            file_url: urlData.publicUrl,
            file_size: req.file.size,
            duration: req.body.duration || null,
            appointment_id: req.body.appointmentId || null,
            created_at: new Date().toISOString()
        };

        const { data: dbData, error: dbError } = await supabase
            .from('voice_recordings')
            .insert([recordingData])
            .select();

        if (dbError) {
            console.error('Database insert error:', dbError);
            return res.status(500).json({
                success: false,
                message: 'Failed to save recording metadata',
                error: dbError.message
            });
        }

        res.json({
            success: true,
            message: 'Voice recording uploaded successfully',
            data: {
                id: dbData[0].id,
                fileName: fileName,
                fileUrl: urlData.publicUrl,
                fileSize: req.file.size,
                duration: req.body.duration
            }
        });

    } catch (error) {
        console.error('Voice recording upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get user's voice recordings
audioRouter.get('/my-recordings', authenticate, async (req, res) => {
    try {
        const userId = req.body.userID;
        const { data, error } = await supabase
            .from('voice_recordings')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch recordings',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Recordings fetched successfully',
            data: data
        });

    } catch (error) {
        console.error('Get recordings error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Delete voice recording
audioRouter.delete('/delete-recording/:id', authenticate, async (req, res) => {
    try {
        const recordingId = req.params.id;
        const userId = req.body.userID;

        // Get recording details
        const { data: recording, error: fetchError } = await supabase
            .from('voice_recordings')
            .select('*')
            .eq('id', recordingId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !recording) {
            return res.status(404).json({
                success: false,
                message: 'Recording not found or access denied'
            });
        }

        // Delete from Supabase storage
        const { error: storageError } = await supabase.storage
            .from('iTABAZA-audio')
            .remove([recording.file_name]);

        if (storageError) {
            console.error('Storage delete error:', storageError);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete audio file from storage',
                error: storageError.message
            });
        }

        // Delete from database
        const { error: dbError } = await supabase
            .from('voice_recordings')
            .delete()
            .eq('id', recordingId)
            .eq('user_id', userId);

        if (dbError) {
            console.error('Database delete error:', dbError);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete recording metadata',
                error: dbError.message
            });
        }

        res.json({
            success: true,
            message: 'Voice recording deleted successfully'
        });

    } catch (error) {
        console.error('Delete recording error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get recording by ID (for appointment details)
audioRouter.get('/recording/:id', authenticate, async (req, res) => {
    try {
        const recordingId = req.params.id;
        const userId = req.body.userID;

        const { data, error } = await supabase
            .from('voice_recordings')
            .select('*')
            .eq('id', recordingId)
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return res.status(404).json({
                success: false,
                message: 'Recording not found or access denied'
            });
        }

        res.json({
            success: true,
            message: 'Recording fetched successfully',
            data: data
        });

    } catch (error) {
        console.error('Get recording error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

module.exports = { audioRouter }; 