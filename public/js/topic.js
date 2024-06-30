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
    const topicId = window.location.pathname.split('/').pop();
    const topicName = document.getElementById('topic_name');
    const description = document.getElementById('description');
    const dateCreated = document.getElementById('date_created');
    const details = document.getElementById('details');
    const commentsContainer = document.getElementById('comments');

    try {
        const response = await fetch(`/api/topic/${topicId}`);
        const data = await response.json();
        const topic = data.topic;
        const comments = data.comments;

        topicName.textContent = topic.topic_name;
        document.title = `${topicName.textContent} - TheGameArray`;
        description.textContent = topic.description;
        dateCreated.textContent = `${topic.date_created.substring(0, 10)} ${topic.date_created.substring(11, 16)}`;
        details.textContent = topic.details;


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
    } catch (error) {
        console.error('Error fetching topic details:', error);
        commentsContainer.innerHTML = '<p>Error fetching comments.</p>';
    }

    const commentForm = document.getElementById('commentForm');
    commentForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const commentText = document.getElementById('comment').value;

        try {
            const response = await fetch(`/api/topic/${topicId}/comment`, {
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
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    });
});



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