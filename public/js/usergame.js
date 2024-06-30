document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('/api/check-session');
    const result = await response.json();
    if (result.loggedIn) {
        document.getElementById('login').style.display = 'none';
        document.getElementById('signup').style.display = 'none';
        document.getElementById('logout').style.display = 'inline-block';
        document.getElementById('user-info').textContent = `${result.user.user_name} (${result.user.email})`;
        document.title = `${result.user.user_name}'s Library`;

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

    try {
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

    } catch (error) {
        console.error('Error fetching library:', error);
    }
})

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/user-games');
        const data = await response.json();

        displayGames(data.likedGames, 'liked-games');
        displayGames(data.playedGames, 'played-games');
        displayGames(data.toPlayGames, 'to-play-games');

        google.charts.load('current', { 'packages': ['corechart'] });
        google.charts.setOnLoadCallback(drawChart);


        function drawChart() {
            var chartData = google.visualization.arrayToDataTable([
                ['Game Type', '%AGE'],
                ['Liked Games', data.likedGames.length],
                ['Played Games', data.playedGames.length],
                ['To-Play Games', data.toPlayGames.length]
            ]);

            var options = { 
                title: 'Your Library', 
                titleTextStyle: {
                    color: 'white',
                    fontSize: 20, 
                    bold: true    
                  },
                width: 550, 
                height: 400,
                is3D: true,
                backgroundColor: 'transparent',
                legend: {
                    textStyle: {color: 'white', fontSize: 10}
                }};

            var chart = new google.visualization.PieChart(document.getElementById('piechart'));
            chart.draw(chartData, options);
        }

    } catch (error) {
        console.error('Error fetching user games:', error);
    }
});

function displayGames(games, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    games.forEach(game => {
        if (!game) return;
        const gameDiv = document.createElement('div');
        gameDiv.classList.add('usergame-card');

        if (game.dateliked) {
            gameDiv.innerHTML = `
            <div><img src="${game.background_image}" alt="${game.name}" class="cimg"></div>
            <div>
            <h3>${game.name}</h3><br>
                <span>Developer: ${game.developers[0].name}</span>
                &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;
                <span>Metacritic: ${game.metacritic}</span>
                &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;
                <span>Date Liked: ${game.dateliked.substring(0, 10)}</span>
            </div>
        `;
        }
        else if (game.datecompleted) {
            gameDiv.innerHTML = `
            <div><img src="${game.background_image}" alt="${game.name}" class="cimg"></div>
            <div>
            <h3 class= "ctitle">${game.name}</h3><br>
                <span>Developer: ${game.developers[0].name}</span>
                &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;
                <span>Metacritic: ${game.metacritic}</span>
                &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;
                <span>Date Completed: ${game.datecompleted.substring(0, 10)}</span>
            </div>
        `;
        }

        else {
            gameDiv.innerHTML = `
            <div><img src="${game.background_image}" alt="${game.name}" class="cimg"></div>
            <div>
            <h3 class= "ctitle">${game.name}</h3><br>
                <span>Developer: ${game.developers[0].name}</span>
                &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;
                <span>Metacritic: ${game.metacritic}</span>
                &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;
                <span>Date Added: ${game.dateadded.substring(0, 10)}</span>
            </div>
        `;
        }

        gameDiv.addEventListener('click', () => {
            window.location.href = `/game/${game.id}`;
        });

        container.appendChild(gameDiv);
    });
    if (container.innerHTML == '') { container.innerHTML = 'No games found' }
}



