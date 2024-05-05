const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();
const openAiApiKey = process.env.openAiApi;
const url = 'https://api.openai.com/v1/completions';
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${openAiApiKey}`
};

const openAiRequest = async (prompt) => {
  try {
    const response = await axios.post(url, {
      model: 'gpt-3.5-turbo-instruct',
      prompt: prompt,
      max_tokens: 500
    }, { headers: headers });
    
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
};

// Replace with your OpenWeatherMap API key
const apiKey = process.env.openWeatherApi;
const getCityWeather = async (city) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&lang=tr`;
    const response = await axios.get(url);
    const data = response.data;
    const weatherDescription = data.weather[0].description;
    const temperature = data.main.temp - 273.15; //Celsius a dönüştürme
    return { city, description: weatherDescription, temp: temperature.toFixed(2) };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};

const getPetNews = async () => {
    const newsApiKey = process.env.NEWS_API_KEY;
    const newsApiUrl = `https://newsapi.org/v2/everything?q=pet&apiKey=${newsApiKey}`;

    try {
        const newsResponse = await axios.get(newsApiUrl);
        const articles = newsResponse.data.articles;
        const relevantArticles = articles.filter(article => {
            return article.title.toLowerCase().includes('pet');
        });
        const selectedArticles = relevantArticles.slice(0, 10);
        const articlePromises = selectedArticles.map(async (article) => {
            const prompt = `${article.title}\n\n${article.description}\n\nBu haber İngilizce'dir. Türkçeye çeviriniz.`;
            const translation = await openAiRequest(prompt);
            const translatedTitle = translation.split('\n\n')[0];
            const translatedDescription = translation.split('\n\n')[1];
            article.translatedTitle = translatedTitle.length > 50 ? translatedTitle.slice(0, 50) + "..." : translatedTitle;
            article.translatedDescription = translatedDescription;
            return article;
        });
        return Promise.all(articlePromises);
    } catch (error) {
        console.error('Haberler alınırken bir hata oluştu:', error);
        throw error;
    }
};






  module.exports = { getCityWeather, openAiRequest, getPetNews};

  
