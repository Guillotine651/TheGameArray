const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const { setTimeout } = require('timers/promises');
const axios = require('axios');
const session = require('express-session');
const bcrypt = require('bcrypt');


const RAWG_API_KEY = '0d58929b4d22498181f00eda4eb343c0'; 
const RAWG_API_URL = 'https://api.rawg.io/api';

const app = express();
const port = 3000;


const pool = new Pool({
    host: 'localhost',
    user: "postgres",
    database: 'postgres',
    password: 'admin123',
    port: 5432,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'My_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(express.static(path.join(__dirname, 'public')));


async function fetchGameDetails(games) {
    const promises = games.map(async (game) => {
        const response = await axios.get(`${RAWG_API_URL}/games/${game.gameid}?key=${RAWG_API_KEY}`);
        return { ...game, ...response.data };
    });

    return await Promise.all(promises);
}

app.post('/signup', async (req, res) => {
    const { user_name, email, password, confirm_password } = req.body;

    if (password !== confirm_password) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (user_name, email, password) VALUES ($1, $2, $3)',
            [user_name, email, hashedPassword]
        );
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        if (error.code === '23505') {
            res.status(400).json({ error: 'Username or email already in use' });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

app.post('/login', async (req, res) => {
    const { userId, user_name, email, password } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE user_name = $1 OR email = $2',
            [user_name, email]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                req.session.user = { userId: user.user_no, user_name: user.user_name, email: user.email };
                res.json({ message: 'Login successful' });
            } else {
                res.status(400).json({ error: 'Invalid credentials' });
            }
        } else {
            res.status(400).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logout successful' });
});


app.get('/topics', async (req, res) => {
    try {
        const result = await pool.query('SELECT topic_no, topic_name, description, date_created FROM forum');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/api/topic/:id', async (req, res) => {
    const topicNo = req.params.id;
    try {
        const topicResult = await pool.query('SELECT topic_name, description, date_created, details FROM forum WHERE topic_no = $1', [topicNo]);
        const commentsResult = await pool.query('SELECT user_name, comment, date_created FROM forumComments WHERE topic_no = $1', [topicNo]);

        res.json({
            topic: topicResult.rows[0],
            comments: commentsResult.rows
        });

    } catch (error) {
        console.error('Error fetching topic:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/topic/:id/comment', async (req, res) => {
    const topicNo = req.params.id;
    const { comment } = req.body;
    if (req.session.user){
        var user_name = req.session.user.user_name;
    }
    else{
        return res.status(401).json({ error: 'You have to be logged in to make a comment' });
    }
    try {
        await pool.query(
            `INSERT INTO forumComments (topic_no, user_name, comment, date_created) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
            [topicNo, user_name, comment]
        );
        res.status(201).json({ message: 'Comment added successfully' });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.get('/api/games', async (req, res) => {
    const { genre, year, searchTerm, sort , page = 1} = req.query;
    let params = {
        key: RAWG_API_KEY,
        page_size: 20,
        page: page
    };

    if (genre) params.genres = genre;
    if (year) params.dates = `${year}-01-01,${year}-12-31`;
    if (searchTerm) params.search = searchTerm;

    switch (sort) {
        case 'name-asc':
            params.ordering = 'name';
            break;
        case 'name-desc':
            params.ordering = '-name';
            break;
        case 'rating-asc':
            params.ordering = 'metacritic';
            params.metacritic = '1,100';
            break;
        case 'rating-desc':
            params.ordering = '-metacritic';
            break;
        case 'released-asc':
            params.ordering = 'released';
            break;
        case 'released-desc':
            params.ordering = '-released';
            break;
        default:
            params.ordering = '-metacritic -released';
    }

    try {
        const response = await axios.get(`${RAWG_API_URL}/games`, { params });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching games from RAWG API:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/api/top-games', async (req, res) => {
    try {
        const response = await axios.get(`${RAWG_API_URL}/games`, {
            params: {
                key: RAWG_API_KEY,
                ordering: '-released',
                page_size: 4,
                metacritic: '90, 100'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching top games from RAWG API:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/short-library', async (req, res) =>{
    if (req.session.user){
        var userId = req.session.user.userId;
    }
    else{
        return res.status(401).json({ error: 'You have to be logged in to view your library' });
    }
    try{
        const likedGamesResult = await pool.query('SELECT gameid FROM LikedGames WHERE userid = $1', [userId]);
        const likedGames = await axios.get(`${RAWG_API_URL}/games/${likedGamesResult.rows[0].gameid}?key=${RAWG_API_KEY}`);
        const playedGamesResult = await pool.query('SELECT gameid FROM PlayedGames WHERE userid = $1', [userId]);
        const playedGames = await axios.get(`${RAWG_API_URL}/games/${playedGamesResult.rows[0].gameid}?key=${RAWG_API_KEY}`);
        const toPlayGamesResult = await pool.query('SELECT gameid FROM ToPlayGames WHERE userid = $1', [userId]);
        const toPlayGames = await axios.get(`${RAWG_API_URL}/games/${toPlayGamesResult.rows[0].gameid}?key=${RAWG_API_KEY}`);


        res.json({
            likedGame: likedGames.data, 
            playedGame: playedGames.data, 
            toPlayGame: toPlayGames.data
    })

    } catch (error) {
        console.error('Error fetching games from RAWG API:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})


app.get('/api/game/:id', async (req, res) => {
    const gameId = req.params.id;
    try {
        const response = await axios.get(`${RAWG_API_URL}/games/${gameId}`, {
            params: { key: RAWG_API_KEY }
        });
        const commentsResult = await pool.query('SELECT user_name, comment, date_created FROM gameComment WHERE gameid = $1', [gameId]);
        const ratingResult = await pool.query('SELECT ROUND(AVG(rating)) AS average_rating FROM GameRating WHERE gameid = $1', [gameId]);
        const averageRating = ratingResult.rows[0].average_rating || 0;
        res.json({...response.data, commentsResult, averageRating: averageRating});
    } catch (error) {
        console.error('Error fetching game details from Servers:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/game/:id/comment', async (req, res) => {
    const gameId = req.params.id;
    const { comment } = req.body;
    if (req.session.user){
        var user_name = req.session.user.user_name;
    }
    else{
        return res.status(401).json({ error: 'You have to be logged in to make a comment' });
    }
    try {
        await pool.query(
            `INSERT INTO gameComment (gameid, user_name, comment, date_created) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
            [gameId, user_name, comment]
        );
        res.status(201).json({ message: 'Comment added successfully' });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.post('/api/like-game/:gameId', async (req, res) => {
    const { gameId } = req.params;

    if(req.session.user){
        var userId = req.session.user.userId;
    }
    else{
        return res.status(401).json({ message: 'You must be logged in to like the game' });
    }

          
    try {
        const checkResult = await pool.query(
            `SELECT * FROM likedgames WHERE userID = ${userId} AND gameID = ${gameId}`
        );

        if (checkResult.rows.length > 0) {

            await pool.query(
                `DELETE FROM likedgames WHERE userID = ${userId} AND gameID = ${gameId}`
            );
            return res.status(200).json({ message: 'Game unliked successfully' });
        } else {

            await pool.query(
                `INSERT INTO likedgames (userID, gameID, dateLiked) VALUES (${userId}, ${gameId}, CURRENT_TIMESTAMP)`
            );
            return res.status(201).json({ message: 'Game liked successfully' });
        }
    } catch (error) {
        console.error('Error toggling like status:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/check-liked-game/:gameId', async (req, res) => {
    const { gameId } = req.params;
    if (req.session.user){
        var userId = req.session.user.userId;
    }
    else{
        return res.status(401).json({ message: 'User not logged in' });
    }
    
    try {
        const result = await pool.query(
            `SELECT * FROM likedgames WHERE userID = ${userId} AND gameID = ${gameId}`
        );

        res.json({ liked: result.rows.length > 0 });
    } catch (error) {
        console.error('Error checking liked game:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/game/:id/rate', async (req, res) => {
    const { rating } = req.body;
    const gameId = req.params.id;
    if (req.session.user){
        var userId = req.session.user.userId;
    }
    else{
        return res.status(401).json({ error: 'User not logged in' });
    }

    try {
        await pool.query(
            'INSERT INTO GameRating (gameid, userid, rating) VALUES ($1, $2, $3) ON CONFLICT (gameid, userid) DO UPDATE SET rating = EXCLUDED.rating',
            [gameId, userId, rating]
        );

        res.status(200).json({ message: 'Rating submitted successfully' });
    } catch (error) {
        console.error('Error saving game rating:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.get('/api/check-session', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});


app.get('/user-games', async (req, res) => {
    if (req.session.user){
        var userId = req.session.user.userId;
    }
    else{
        return res.status(401).json({ error: 'User not logged in' });
    }

    try {
        const likedGamesResult = await pool.query('SELECT gameId, dateLiked FROM LikedGames WHERE userId = $1', [userId]);
        const playedGamesResult = await pool.query('SELECT gameId, dateCompleted, userplaytime FROM PlayedGames WHERE userId = $1', [userId]);
        const toPlayGamesResult = await pool.query('SELECT gameId, dateAdded FROM ToPlayGames WHERE userId = $1', [userId]);

        const likedGames = await fetchGameDetails(likedGamesResult.rows);
        const playedGames = await fetchGameDetails(playedGamesResult.rows);
        const toPlayGames = await fetchGameDetails(toPlayGamesResult.rows);

        res.json({
            likedGames,
            playedGames,
            toPlayGames,
        });
    } catch (error) {
        console.error('Error fetching user games:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/save-game-status', async (req, res) => {
    const { gameid, status, playtime, completedDate } = req.body;

    if (req.session.user){
        var userId = req.session.user.userId;
    }
    else{
        return res.status(401).json({ error: 'User not logged in' });
    }

    try {
        if (status === 'played') {
            await pool.query(
                'INSERT INTO PlayedGames (gameid, userid, userplaytime, datecompleted) VALUES ($1, $2, $3, $4) ON CONFLICT (gameid, userid) DO UPDATE SET userplaytime = $3, datecompleted = $4',
                [gameid, userid, playtime, completedDate]
            );
        } else if (status === 'to-play') {
            await pool.query(
                'INSERT INTO ToPlayGames (gameid, userid, dateadded) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (gameid, userid) DO NOTHING',
                [gameid, userid]
            );
        }

        res.status(200).json({ message: 'Game status saved successfully' });
    } catch (error) {
        console.error('Error saving game status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));

});

app.get('/forum', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'forum.html'));

});

app.get('/games', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'games.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});


app.get('/game/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'game.html'));
});


app.get('/topic/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'topic.html'));
});


app.get('/library', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'usergames.html'));
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

