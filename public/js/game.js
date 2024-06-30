async function submitRating() {
    const rating = document.getElementById('rating-input').value;
    const gameId = window.location.pathname.split('/').pop();

    try {
        const response = await fetch(`/api/game/${gameId}/rate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rating: parseInt(rating, 10) })
        });

        const result = await response.json();
        if (response.ok) {
            alert('Rating submitted successfully!');
            window.location.reload();
        } else { 
            console.log(result) 
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
        alert('An error occurred while submitting the rating.');
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('/api/check-session');
    const result = await response.json();
    if (result.loggedIn) {
        document.getElementById('login').style.display = 'none';
        document.getElementById('signup').style.display = 'none';
        document.getElementById('logout').style.display = 'inline-block';
        document.getElementById('user-info').textContent = `${result.user.user_name} (${result.user.email})`;

    }
});

document.getElementById('logout').addEventListener('click', async () => {
    const response = await fetch('/logout', { method: 'POST' });
    const result = await response.json();
    if (response.ok) {
        window.location.href = '/';
    } else {
        alert(result.error);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    const liked_game = document.getElementById('liked-game');
    const played_game = document.getElementById('played-game');
    const to_play_game = document.getElementById('to-play-game');

    try{
        const shortLibraryData = await fetch('/api/short-library');
        const shortLibrary = await shortLibraryData.json();

        liked_game.parentElement.style.backgroundImage = `url('${shortLibrary.likedGame.background_image}')`;
        liked_game.parentElement.style.backgroundPosition = "center -50px";
        liked_game.parentElement.style.backgroundBlendMode = "multiply";
        liked_game.parentElement.style.backgroundSize = "1280px 720px";
        liked_game.innerHTML = `<h5>${shortLibrary.likedGame.name}</h5>
        <p>${shortLibrary.likedGame.developers[0].name}</p>`

        played_game.parentElement.style.backgroundImage = `url('${shortLibrary.playedGame.background_image}')`;
        played_game.parentElement.style.backgroundPosition = "center -50px";
        played_game.parentElement.style.backgroundBlendMode = "multiply";
        played_game.parentElement.style.backgroundSize = "1280px 720px";
        played_game.innerHTML = `<h5>${shortLibrary.playedGame.name}</h5>
        <p>${shortLibrary.playedGame.developers[0].name}</p>`

        to_play_game.parentElement.style.backgroundImage = `url('${shortLibrary.toPlayGame.background_image}')`;
        to_play_game.parentElement.style.backgroundPosition = "center -50px";
        to_play_game.parentElement.style.backgroundBlendMode = "multiply";
        to_play_game.parentElement.style.backgroundSize = "1280px 720px";
        to_play_game.innerHTML = `<h5>${shortLibrary.toPlayGame.name}</h5>
        <p>${shortLibrary.toPlayGame.developers[0].name}</p>`
        
    } catch(error){
        console.error('Error fetching library:', error);   
    }
})

document.addEventListener('DOMContentLoaded', async () => {
    const gameId = window.location.pathname.split('/').pop();
    const response = await fetch(`/api/game/${gameId}`);
    const game = await response.json();

    document.getElementById('game-title').textContent = game.name;
    document.title = `${game.name} - TheGameArray`
    document.getElementById('game-background').src = game.background_image;
    document.getElementById('game-description').textContent = game.description_raw || 'No description available';
    document.getElementById('game-playtime').textContent = game.playtime;
    document.getElementById('game-released').textContent = `Released: ${game.released}`;
    document.getElementById('game-rating').textContent = game.rating;
    document.getElementById('game-metacritic').textContent = game.metacritic;
    document.getElementById('game-platforms').textContent = game.platforms.map(p => p.platform.name).join(', ');
    document.getElementById('reddit-url').href = game.reddit_url;
    document.getElementById('game-esrb').textContent = game.esrb_rating.name;
    const commentsContainer = document.getElementById('comments');
    document.getElementById('average-rating').textContent = game.averageRating;


    const pcPlatform = game.platforms.find(p => p.platform.name === 'PC');
    
    if (pcPlatform && pcPlatform.requirements) {
        let x = pcPlatform.requirements.minimum + "\n\n" + pcPlatform.requirements.recommended;
        if (x == `${undefined}\n\n${undefined}`){document.getElementById('comparison-table').innerHTML = "No requirements defined by the developer";return}
        function parseSystemRequirements(input) {
            let minReq = {};
            let recReq = {};

            let hasRecommended = input.includes('Recommended:');
            let parts = input.split('Recommended:');
            let minPart = parts[0].replace('Minimum:', '').trim();
            let recPart = hasRecommended ? parts[1].trim() : '';

            function extractKeyValuePairs(section, obj) {
                let regex = /(OS|Processor|Memory|Graphics|Storage|Sound Card|Additional Notes|Hard Drive|DirectX|Video Card|Video Card Memory|Sound|Hard Disk Space|CPU|GPU|Direct X|VRAM|Available Storage Space|Setting Game Can Be Played On|DirectX Version|Other Requirements):/g;
                let keys = section.match(regex);
                if (keys) {
                    keys.forEach((key, index) => {
                        let nextIndex = section.indexOf(keys[index + 1], section.indexOf(key) + key.length);
                        let value = section.substring(section.indexOf(key) + key.length, nextIndex === -1 ? undefined : nextIndex).trim();
                        obj[key.slice(0, -1)] = value;
                    });
                }
            }

            extractKeyValuePairs(minPart, minReq);
            if (hasRecommended) {
                extractKeyValuePairs(recPart, recReq);
            }

            return { minReq, recReq };
        }

        const { minReq, recReq } = parseSystemRequirements(x);

        function generateTable(minReq, recReq) {
            let table = `<div class="grid-container">
                <div class="grid-item header">Factors</div>
                <div class="grid-item header">Minimum</div>
                <div class="grid-item header">Recommended</div>`;

            Object.keys(minReq).forEach(key => {
                table += `<div class="grid-item">${key}</div>
                          <div class="grid-item">${minReq[key]}</div>
                          <div class="grid-item">${recReq[key] || 'N/A'}</div>`;
            });

            Object.keys(recReq).forEach(key => {
                if (!minReq[key]) {
                    table += `<div class="grid-item">${key}</div>
                              <div class="grid-item">N/A</div>
                              <div class="grid-item">${recReq[key]}</div>`;
                }
            });

            table += `</div>`;
            return table;
        }

        document.getElementById('comparison-table').innerHTML = generateTable(minReq, recReq);
    } else {
        document.getElementById('specifications-section').style.display = 'none';
    }

    if (game.clip && game.clip.clip) {
        const trailerUrl = game.clip.clip.replace('watch?v=', 'embed/');
        document.getElementById('trailer').src = trailerUrl;
    }
    if (game.website) {
        document.getElementById('game-website').href = game.website;
    } else {
        document.getElementById('website-section').style.display = 'none';
    }
    comments = game.commentsResult.rows

    comments.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.classList.add('comment');
        commentDiv.innerHTML = `
            <div><strong>${comment.user_name}</strong></div>
            <hr>
            <div><p>${comment.comment}</p></div>
            <hr>
            <div><small>${comment.date_created.substring(0, 10)} ${comment.date_created.substring(11, 16)}</small></div>           
        `;
        commentsContainer.appendChild(commentDiv);
    });

    const commentForm = document.getElementById('commentForm');
    commentForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const commentText = document.getElementById('comment').value;

        try {
            const response = await fetch(`/api/game/${gameId}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ comment: commentText })
            });

            if (response.ok) {
                window.location.reload();
            } else {
                const err = await response.json()
                alert(`error: ${err.error}`);
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    });


});


document.addEventListener('DOMContentLoaded', async () => {
    const likeButton = document.getElementById('like-button');
    const like = document.getElementById('heart');
    const gameId = window.location.pathname.split('/').pop();



    const checkIfLiked = async () => {
        try {
            const response = await fetch(`/api/check-liked-game/${gameId}`);
            const data = await response.json();

            if (data.liked) {
                like.style.fill = 'red';
            } else {
                like.style.fill = 'none';
            }
        } catch (error) {
            console.error('Error checking liked game:', error);
        }
    };

    await checkIfLiked();

    if (likeButton) {
        likeButton.addEventListener('click', async () => {
            try {
                const response = await fetch(`/api/like-game/${gameId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ gameId })
                });

                const data = await response.json();

                if (response.ok) {
                    if (data.message === 'Game liked successfully') {
                        like.style.fill = 'red';
                    } else if (data.message === 'Game unliked successfully') {
                        like.style.fill = 'none';
                    }
                    alert(data.message);
                } else {
                    alert(`Error: ${data.message}`);
                }
            } catch (error) {
                console.error('Error toggling like status:', error);
                alert('An error occurred. Please try again later.');
            }
        });
    }
});

function handleStatusChange() {
    const status = document.getElementById('game-status').value;
    const playedFields = document.getElementById('played-fields');
    const saveButton = document.getElementById('save-status-btn');

    if (status === 'played') {
        playedFields.style.display = 'block';
        saveButton.style.display = 'block';
    } else if (status === 'to-play') {
        playedFields.style.display = 'none';
        saveButton.style.display = 'block';
    } else {
        playedFields.style.display = 'none';
        saveButton.style.display = 'none';
    }
}

async function saveGameStatus() {
    const status = document.getElementById('game-status').value;
    const gameId = window.location.pathname.split('/').pop();

    
    let data = {
        gameid: gameId,
        status: status,
    };

    if (status === 'played') {
        const playtime = document.getElementById('playtime').value;
        const completedDate = document.getElementById('completed-date').value;
        data.playtime = playtime;
        data.completedDate = completedDate;
    }

    try {
        const response = await fetch('/save-game-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
            alert('Game status saved successfully!');
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error saving game status:', error);
        alert('An error occurred while saving game status.');
    }
}





let a = document.querySelector(".menu");
let b = document.querySelector(".left");
let is_r = 0;
a.addEventListener('click', e=>{
    if(is_r == 0){
    a.style.transform = "rotate(90deg)";
    a.style.transition = "transform 0.5s ease-out 1ms"
    b.style.width = "30vw";
    b.style.opacity = "1";
    b.style.transition = "all 0.5s ease-out 1ms"
    is_r = 1;
    }
    else{
        a.style.transform = "rotate(0deg)";
        a.style.transition = "transform 0.5s ease-out 1ms"
        b.style.opacity = "0";
        b.style.width = "0vw";
        b.style.transition = "all 0.5s ease-out 1ms"
        is_r = 0;
    }

})

function hidemenu(){
    a.style.transform = "rotate(0deg)";
    a.style.transition = "transform 1s ease-out 1ms"
    b.style.opacity = "0";
    b.style.width = "0vw";
    is_r = 0;
}