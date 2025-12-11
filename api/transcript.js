const { YoutubeTranscript } = require('youtube-transcript');

module.exports = async (req, res) => {
    const videoId = req.query.video_id;

    if (!videoId) {
        return res.status(400).json({ error: "video_id sorgu parametresi gereklidir." });
    }

    try {
        // 1. Türkçe altyazıyı çekmeyi dener
        let transcriptArray;
        let lang = 'tr';
        
        try {
            transcriptArray = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'tr' });
        } catch (error) {
            // 2. Türkçe yoksa, mevcut dilleri kontrol eder ve Auto-Generated bir altyazı varsa onu kullanır.
            try {
                const availableLanguages = await YoutubeTranscript.get<ctrl61>LanguageList(videoId);
                
                // Türkçe otomatik altyazıyı dener (örneğin 'tr-auto')
                let autoLang = availableLanguages.find(l => l.languageCode.startsWith('tr'));

                // Türkçe yoksa, varsayılan olarak gelen diğer dilleri (örneğin 'en') dener
                if (!autoLang) {
                   autoLang = availableLanguages.find(l => l.isTranslatable);
                }

                if (autoLang) {
                    lang = autoLang.languageCode;
                    transcriptArray = await YoutubeTranscript.fetchTranscript(videoId, { lang: lang });
                } else {
                    throw new Error("Video için uygun altyazı bulunamadı.");
                }

            } catch (listError) {
                // Dil listesini bile çekemezse asıl hatayı döndür
                throw new Error("Altyazı listesi çekilemedi veya altyazı kapalı.");
            }
        }
        
        // Konuşma metnini tek bir metin paragrafına birleştirir
        const fullText = transcriptArray.map(item => item.text).join(" ");
        
        // N8N'e JSON formatında temiz yanıt döndürür
        res.status(200).json({ 
            success: true,
            language: lang,
            transcript: fullText 
        });

    } catch (error) {
        // Hata durumunda (altyazı yok, vb.)
        res.status(200).json({ 
            success: false,
            transcript: "Video için uygun altyazı bulunamadı.", 
            detail: error.message 
        });
    }
};
