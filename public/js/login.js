document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
        user_name: formData.get('user_name'),
        email: formData.get('email'),
        password: formData.get('password')
    };

    const response = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();
    if (response.ok) {
        alert(result.message);
        window.location.href = '/';
    } else {
        alert(result.error);
    }
});
