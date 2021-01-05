const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');


// Ports
const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

// Create redis Client
const client = redis.createClient(REDIS_PORT);

const app = express();


// SET RESPONSE
const setResponse = (username, repos) => {
    return `<h2>${username} has ${repos} Github repos</h2>`;

}

// Make request to github for data 
const getRepos = async (req, res, next) => {
    try {
        console.log('Fetching Data...');

        const { username } = req.params;
        // console.time(`START time`);

        const response = await fetch(`https://api.github.com/users/${username}`);

        // we need the response  to be json
        const data = await response.json();

        const repos = data.public_repos;

        //SET data to Redis
        client.setex(username, 3600, repos);
        res.send(setResponse(username, repos));
        // console.timeEnd(`END time`);


    } catch (error) {
        res.status(500);
    }

}
// cache Middleware 
const cache = (req, res, next) => {
    const { username } = req.params;
    client.get(username, (err, data) => {
        if (err) throw err;
        if (data !== null) {
            res.send(setResponse(username, data));
        } else {
            next();
        }
    })
}
console.time(` GET time`);

app.get('/repos/:username', cache, getRepos);

console.timeEnd(` GET time`);


app.listen(5000, () => {
    console.log(`App Listening on port ${PORT}`)
})