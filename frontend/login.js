document.getElementById('form-login').addEventListener('submit', function(event){
    event.preventDefault()
    const usernameLogin = document.getElementById('username-login').value
    const passwordLogin = document.getElementById('password-login').value

    async function userLogin(){
        try{
            const res = await fetch('http://localhost:3000/api/login', {
                method: "POST",
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    username: usernameLogin,
                    password: passwordLogin
                })
            })
            const data = await res.json()
            if(res.ok){
                alert(`Berhasil Login`)
                localStorage.setItem('accessToken', data.accessToken)
                localStorage.setItem('refreshToken', data.refreshToken)
                window.location.href = 'dashboard.html'
            }
        }catch(error){
            console.error(error);
        }
    }
    userLogin()
})