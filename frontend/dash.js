let accessToken = localStorage.getItem('accessToken')
let refreshToken = localStorage.getItem('refreshToken')
const welcome = document.getElementById('welcome')

const btnProfile = document.getElementById('btn-profile')
btnProfile.addEventListener('click', function(){
    window.location.href = 'profile.html'
})

getUsername()
getToDoLists()

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

            let time = null
            const getHour = new Date()
            const hour = getHour.getHours()

            if(hour <= 11){
                time = 'Pagi'
            } else if(hour <= 14){
                time = 'Siang'
            } else if(hour <= 18){
                time = 'Sore'
            } else if(hour <= 24 || hour <= 0){
                time = 'Malam'
            }

            welcome.textContent = `Selamat ${time}, ${data.username}!`
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

document.getElementById('form-todo').addEventListener('submit', function(event){
    event.preventDefault()
    const titleToDo = document.getElementById('title-todo')
    const titleToDoValue = document.getElementById('title-todo').value
    
    async function addToDo() {
        try {
            let res = await fetch('http://localhost:3000/api/todos', {
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    title: titleToDoValue
                })
            })
    
            if (res.status === 401 || res.status === 403) {
                const newAccessToken = await refreshAccessToken()
                if (newAccessToken) {
                    accessToken = newAccessToken
                    return addToDo()
                }
            } else if (res.ok) {
                const data = await res.json()
                new Noty({
                    text: `${data.message}`,
                    type: 'success',
                    layout: 'bottom',
                    timeout: 3000,
                    theme: 'metroui'
                }).show();
                titleToDo.value = ''
                getToDoLists()
            } else {
                console.error('Error fetching user data:', res.statusText)
            }
        } catch (error) {
            console.error('Fetch error:', error)
        }
    }
    addToDo()
})


async function getToDoLists(){
    try{
        let res = await fetch('http://localhost:3000/api/todos', {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });

        if (res.status === 401 || res.status === 403) {
            const newAccessToken = await refreshAccessToken()
            if (newAccessToken) {
                accessToken = newAccessToken
                return getToDoLists()
            }
        } else if (res.ok) {
            const data = await res.json();
            const todoLists = document.getElementById('todo-lists');
            todoLists.innerHTML = '';  

            data.forEach(item => {
                const toDoListCard = document.createElement('div')
                toDoListCard.classList.add('todo-list-card')

                const btnWrapper = document.createElement('div')
                btnWrapper.classList.add('btn-wrapper')

                const titleTodo = document.createElement('h1');
                titleTodo.classList.add('title-todo')
                titleTodo.textContent = item.title;

                const btnEdit = document.createElement('button')
                btnEdit.textContent = 'Edit'
                btnEdit.classList.add('btn-edit')
                
                const btnDelete = document.createElement('button')
                btnDelete.textContent = 'Delete'
                btnDelete.classList.add('btn-delete')
                
                const btnSaveEdit = document.createElement('button')
                btnSaveEdit.textContent = 'Save'
                btnSaveEdit.classList.add('btn-save-edit')
                
                const btnCancel = document.createElement('button')
                btnCancel.textContent = 'Cancel'
                btnCancel.classList.add('btn-cancel')
                
                const editTitleToDo = document.createElement('input')
                editTitleToDo.attributes = 'required'
                editTitleToDo.style.order = '-1'
                editTitleToDo.type = 'text'
                editTitleToDo.placeholder = 'Edit title here'
                editTitleToDo.classList.add('edit-title-todo')

                btnEdit.addEventListener('click', function(event){
                    event.preventDefault()
                    toDoListCard.removeChild(titleTodo)
                    btnWrapper.removeChild(btnEdit)
                    btnWrapper.removeChild(btnDelete)
                    btnWrapper.append(btnSaveEdit, btnCancel)
                    toDoListCard.append(editTitleToDo, btnWrapper)
                    console.log(item.id);
                })

                btnDelete.addEventListener('click', function(){
                    deleteToDo(item.id)
                })

                btnSaveEdit.addEventListener('click', function(){
                    const titleEdit = editTitleToDo.value
                    changeToDo(item.id, item.status, titleEdit)
                    toDoListCard.append(titleTodo)
                    btnWrapper.insertBefore(btnEdit, btnWrapper.firstChild)
                    toDoListCard.removeChild(editTitleToDo)
                    btnWrapper.removeChild(btnCancel)
                    btnWrapper.removeChild(btnSaveEdit)
                })
                
                btnCancel.addEventListener('click', function(){
                    btnWrapper.append(btnEdit, btnDelete)
                    toDoListCard.append(titleTodo, btnWrapper)
                    toDoListCard.removeChild(editTitleToDo)
                    btnWrapper.removeChild(btnCancel)
                    btnWrapper.removeChild(btnSaveEdit)
                })

                btnWrapper.append(btnEdit, btnDelete)
                toDoListCard.append(titleTodo, btnWrapper)
                todoLists.append(toDoListCard);
                todoLists.insertBefore(toDoListCard, todoLists.firstChild)

                titleTodo.addEventListener('click', function(){
                    if(item.status === 'not completed'){
                        const status = item.status = 'completed'
                        changeToDo(item.id, status, item.title)
                    } else if(item.status === 'completed'){
                        const status = item.status = 'not completed'
                        changeToDo(item.id, status, item.title)
                    }
                })

                if(item.status === 'completed'){
                    titleTodo.classList.toggle('active')
                }

            });
        } else {
            console.error('Error fetching user data:', res.statusText)
        }
    }catch(error){
        console.error(error);
    }
}

async function changeToDo(id, status, title){
    try{
        const res = await fetch(`http://localhost:3000/api/todos/${id}`, {
            method: "PUT",
            headers: {
                "Content-type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                title: title,
                status: status
            })
        })

        if (res.status === 401 || res.status === 403) {
            const newAccessToken = await refreshAccessToken()
            if (newAccessToken) {
                accessToken = newAccessToken
                return changeToDo(id, status, title) 
            }
        } else if(res.ok){
            const data = await res.json()
            alert(`${data.message}`)
        }

        getToDoLists()
    }catch(error){
        console.error(error);
    }
}

async function deleteToDo(id){
    try{
        const res = await fetch(`http://localhost:3000/api/todos/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        })
        if(res.status === 401 || res.status === 403){
            const newAccessToken = await refreshAccessToken()
            if(newAccessToken){
                accessToken = newAccessToken
                return deleteToDo(id)
            }
        }else{
            const data = await res.json()
            alert(`${data.message}`)
        }
        getToDoLists()
    }catch(error){
        console.error(error);
    }
}