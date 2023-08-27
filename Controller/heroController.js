const heroModel = require("../Models/heroModel"); 
const axios = require('axios');
const cron = require('node-cron');
const infoModel = require("../Models/infoModel");

const fetchAndUpdate = async () => {
    const baseUrl = process.env.ANIME_URL;
    try {
        // fetch
        const response = await axios.get(`${baseUrl}/popular?page=1&perPage=15`);
        const popularData = response.data.data;

        let heroArray = []
        // loop through the popular data
        for (const animeData of popularData) {
            const infoResponse = await axios.get(`${baseUrl}/anime/${animeData.slug}`);
            heroArray.push(infoResponse.data);
        }

        // loop the array
        for (const item of heroArray) {
            const existingAnime = await heroModel.findOne({
                $or: [
                    { 'slug': item.slug },
                    { 'anilistId': item.anilistId },
                    { 'id': item.id },
                ],
            });

            const existingAnimeInfo = await infoModel.findOne({
                $or: [
                    { 'slug': item.slug },
                    { 'anilistId': item.anilistId },
                    { 'id': item.id },
                ],
            })

            if (!existingAnime || !existingAnimeInfo) {
                await infoModel.create(item)
                await heroModel.create(item); // Create a new document if no match is found
            } else {
                // Update the existing document with changes
                await heroModel.findOneAndUpdate(
                    { _id: existingAnime._id },
                    item,
                    { new: true }
                );

                await infoModel.findByIdAndUpdate(
                    { _id: existingAnimeInfo._id },
                    item,
                    { new: true }
                )
            }
        }

        console.log('Hero Data updated successfully.');
    } catch (error) {
        console.log('Error updating data:', error);
    }
};

// fetch every 2hours
cron.schedule('0 */1 * * *', () => {
    fetchAndUpdate();
});

const getHero = async (req, res) => {
    const { restSecret } = req.body;
    if (restSecret !== process.env.REST_SECRET) return res.status(500).json({ 'message': 'Unauthorized' });
    try {
        const animes = await heroModel.find(); 
        if (animes.length === 0) return res.status(200).json({ data:[] })

        res.status(200).json({
            status: 200,
            data: animes
        });
    } catch(error) {
        console.log(error)
        res.status(500).json(error); 
    }
}

module.exports = { 
    fetchAndUpdate,
    getHero
};