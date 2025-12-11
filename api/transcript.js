const { YoutubeTranscript } = require('youtube-transcript');

module.exports = async (req, res) => {
    // N8N'den gelen video ID'yi sorgu parametrelerinden al
    const videoId = req.query.video_id;

    if (!videoId) {
        return res.status(400).json({ error: "video_id sorgu parametresi gereklidir." });
    }

    try {
        // Türkçe altyazıyı çekmeyi dener
        const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'tr' });

        // Konuşma metnini tek bir metin paragrafına birleştirir
        const fullText = transcriptArray.map(item => item.text).join(" ");

        // N8N'e JSON formatında temiz yanıt döndürür
        res.status(200).json({ 
            success: true,
            transcript: fullText 
        });

    } catch (error) {
        // Hata durumunda (altyazı yok, vb.)
        res.status(200).json({ 
            success: false,
            transcript: "Video için Türkçe altyazı bulunamadı.", 
            detail: error.message 
        });
    }
};
