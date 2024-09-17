const usernameRegis = document.getElementById('username-regis')
const passwordRegis = document.getElementById('password-regis')

const usernameRequired = document.getElementById('username-required')
const passwordRequired = document.getElementById('password-required')

usernameRegis.addEventListener('input', function(){
    if(usernameRegis.value.length > 8 || usernameRegis.value.startsWith(' ')){
        usernameRequired.style.color = '#FF6F61'
    }else if(usernameRegis.value.length == 0){
        usernameRequired.style.color = '#6D6E8C'
    } else {
        usernameRequired.style.color = '#6EAEA1'
    }
})

passwordRegis.addEventListener('input', function(){
    const containsNumber = /\d/
    if(passwordRegis.value.length < 6 || !containsNumber.test(passwordRegis.value) || passwordRegis.value.startsWith(' ')){
        passwordRequired.style.color = '#FF6F61'
    }else if(passwordRegis.value.length == 0){
        passwordRequired.style.color = '#6D6E8C'
    } else {
        passwordRequired.style.color = '#6EAEA1'
    }
})

document.getElementById('form-register').addEventListener('submit', function(event){
    event.preventDefault()
    const usernameRegisValue = document.getElementById('username-regis').value
    const passwordRegisValue = document.getElementById('password-regis').value
    
    async function userRegis(){
        try{
            const res = await fetch('http://localhost:3000/api/register', {
                method: "POST",
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    username: usernameRegisValue,
                    password: passwordRegisValue
                })
            })
            const data = await res.json()
            if(res.ok){
                alert(`${data.message}`)
                window.location.href = 'login.html'
            } else if(res.status === 400) {
                alert(`${data.message}`)
            }
        }catch(error){
            console.error(error);
        }
    }
    userRegis()
})