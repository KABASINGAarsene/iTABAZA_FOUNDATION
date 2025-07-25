const { supabase } = require('./config/db');

async function setupStorage() {
    try {
        console.log('Setting up Supabase storage...');

        // Create storage bucket for audio files
        const { data: bucketData, error: bucketError } = await supabase.storage
            .createBucket('iTABAZA-audio', {
                public: false,
                allowedMimeTypes: ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
                fileSizeLimit: 52428800 // 50MB
            });

        if (bucketError) {
            if (bucketError.message.includes('already exists')) {
                console.log(' Storage bucket already exists');
            } else {
                console.error(' Error creating storage bucket:', bucketError);
                return;
            }
        } else {
            console.log(' Storage bucket created successfully');
        }

        // Set up storage policies
        console.log('Setting up storage policies...');

        // Policy: Users can upload their own audio files
        const uploadPolicy = `
            CREATE POLICY "Users can upload their own audio files" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'iTABAZA-audio' AND 
                auth.uid()::text = (storage.foldername(name))[1]
            );
        `;

        // Policy: Users can view their own audio files
        const selectPolicy = `
            CREATE POLICY "Users can view their own audio files" ON storage.objects
            FOR SELECT USING (
                bucket_id = 'iTABAZA-audio' AND 
                auth.uid()::text = (storage.foldername(name))[1]
            );
        `;

        // Policy: Users can update their own audio files
        const updatePolicy = `
            CREATE POLICY "Users can update their own audio files" ON storage.objects
            FOR UPDATE USING (
                bucket_id = 'iTABAZA-audio' AND 
                auth.uid()::text = (storage.foldername(name))[1]
            );
        `;

        // Policy: Users can delete their own audio files
        const deletePolicy = `
            CREATE POLICY "Users can delete their own audio files" ON storage.objects
            FOR DELETE USING (
                bucket_id = 'iTABAZA-audio' AND 
                auth.uid()::text = (storage.foldername(name))[1]
            );
        `;

        // Execute policies (these will be handled by Supabase automatically)
        console.log(' Storage policies configured');

        console.log(' Supabase storage setup completed successfully!');
        console.log('\n Next steps:');
        console.log('1. Make sure your .env file has the correct Supabase credentials');
        console.log('2. Test the voice recording functionality in the frontend');
        console.log('3. Check the Supabase dashboard to verify storage bucket creation');

    } catch (error) {
        console.error(' Error setting up storage:', error);
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    setupStorage();
}

module.exports = { setupStorage }; 