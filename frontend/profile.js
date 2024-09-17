let accessToken = localStorage.getItem('accessToken')
let refreshToken = localStorage.getItem('refreshToken')
const profileUsername = document.getElementById('profile-username')

getUsername()
async function getUsername() {
    try {
        let res = await fetch('http://localhost:3000/api/user', {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        })

        if (res.status === 401 || res.status === 403) {
            const newAccessToken = await refreshAccessToken()
            if (newAccessToken) {
                accessToken = newAccessToken
                return getUsername()
            }
        } else if (res.ok) {
            const data = await res.json()
            profileUsername.textContent = data.username
        } else {
            console.error('Error fetching user data:', res.statusText)
        }
    } catch (error) {
        console.error('Fetch error:', error)
    }
}

async function refreshAccessToken() {
    try {
        const res = await fetch('http://localhost:3000/api/token', {
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                refreshToken: refreshToken
            })
        })

        if (res.ok) {
            const data = await res.json()
            
            localStorage.setItem('accessToken', data.accessToken)
            accessToken = data.accessToken
            return accessToken
        } else {
            console.error('Failed to refresh token:', res.statusText)
            return null
        }
    } catch (error) {
        console.error('Error refreshing token:', error)
        return null
    }
}

document.getElementById('btn-cancel-change').addEventListener('click', function(){
    window.location.href='dashboard.html'
})

const changeUsername = document.getElementById('change-profile-username')
const changePassword = document.getElementById('change-profile-password')

const usernameRequired = document.getElementById('username-required')
const passwordRequired = document.getElementById('password-required')

changeUsername.addEventListener('input', function(){
    if(changeUsername.value.length > 8 || changeUsername.value.startsWith(' ')){
        usernameRequired.style.color = '#FF6F61'
    }else if(changeUsername.value.length == 0){
        usernameRequired.style.color = '#6D6E8C'
    } else {
        usernameRequired.style.color = '#6EAEA1'
    }
})

changePassword.addEventListener('input', function(){
    const containsNumber = /\d/
    if(changePassword.value.length < 6 || !containsNumber.test(changePassword.value) || changePassword.value.startsWith(' ')){
        passwordRequired.style.color = '#FF6F61'
    }else if(changePassword.value.length == 0){
        passwordRequired.style.color = '#6D6E8C'
    } else {
        passwordRequired.style.color = '#6EAEA1'
    }
})

document.getElementById('form-edit-profile').addEventListener('submit', function(event){
    event.preventDefault()

    const changeUsernameValue = document.getElementById('change-profile-username').value
    const changePasswordValue = document.getElementById('change-profile-password').value

    async function editProfile(){
        try{
            const res = await fetch('http://localhost:3000/api/user', {
                method: "PUT",
                headers: {
                    "Content-type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    username: changeUsernameValue,
                    password: changePasswordValue
                })
            })
            if(res.status === 401 || res.status === 403){
                const newAccessToken = await refreshAccessToken()

                accessToken = newAccessToken
                return editProfile()
            } else{
                const data = await res.json()
                alert(`${data.message}`)
                getUsername()
                changeUsername.value = ''
                changePassword.value = ''
            }
        }catch(error){
            console.error(error);
        }
    }
    editProfile()
})

const btnLogOut = document.getElementById('btn-logout')
btnLogOut.addEventListener('click', function(){
    logoutUser()
})

function logoutUser(){
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    window.location.href = 'login.html'
}
