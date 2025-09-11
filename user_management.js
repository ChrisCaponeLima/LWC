// Centraliza a verificação de permissão no topo do script
document.addEventListener('DOMContentLoaded', () => {
    // Tenta obter o role diretamente do localStorage
    const userRole = localStorage.getItem('role');

    // Se o role não for 'admin', redireciona para a página inicial
    if (userRole !== 'admin') {
        window.location.href = 'index.html'; 
    }
});

// === O RESTO DO SEU CÓDIGO DA PÁGINA user_management.js ===

const userFormCard = document.getElementById('userFormCard');
const userListCard = document.getElementById('userListCard');
const addUserBtn = document.getElementById('addUserBtn');
const cancelBtn = document.getElementById('cancelBtn');
const userForm = document.getElementById('userForm');
const usersTableBody = document.getElementById('usersTableBody');
const formTitle = document.getElementById('formTitle');
const userIdInput = document.getElementById('userId');
const profilePhotoInput = document.getElementById('profile-photo');
const profilePreview = document.getElementById('profile-preview');

let users = [];

profilePhotoInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            profilePreview.src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
});

addUserBtn.addEventListener('click', () => {
    showForm('Adicionar Novo Usuário', 'POST');
});

cancelBtn.addEventListener('click', () => {
    showList();
});

userForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(userForm);
    const formMethod = userForm.getAttribute('data-method');

    let apiEndpoint = '/api/usermanagement';
    let requestMethod = formMethod;
    if (formMethod === 'PUT') {
        formData.append('id', userIdInput.value);
    }
    
    try {
        const response = await fetch(apiEndpoint, {
            method: requestMethod,
            body: formData,
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            showList();
            loadUsers();
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (error) {
        console.error('Erro ao enviar o formulário:', error);
        alert('Erro ao enviar formulário. Verifique a conexão.');
    }
});

async function loadUsers() {
    try {
        const response = await fetch('/api/usermanagement');
        if (!response.ok) {
            throw new Error('Erro ao carregar a lista de usuários.');
        }
        users = await response.json();
        renderUsers(users);
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        usersTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Erro ao carregar usuários.</td></tr>`;
    }
}

function renderUsers(users) {
    usersTableBody.innerHTML = '';
    if (users.length === 0) {
        usersTableBody.innerHTML = `<tr><td colspan="5" class="text-center">Nenhum usuário encontrado.</td></tr>`;
        return;
    }

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Foto">
                <img src="${user.photo_perfil_url || 'https://api.iconify.design/solar:user-circle-bold-duotone.svg'}" alt="Foto de Perfil" class="user-photo-sm">
            </td>
            <td data-label="Nome">${user.username}</td>
            <td data-label="E-mail">${user.email}</td>
            <td data-label="Cargo">${user.role}</td>
            <td data-label="Ações">
                <button class="btn-action edit-btn" data-id="${user.id}">
                    <img src="https://api.iconify.design/solar:pen-bold-duotone.svg" alt="Editar">
                </button>
                <button class="btn-action delete-btn" data-id="${user.id}">
                    <img src="https://api.iconify.design/solar:trash-bin-trash-bold-duotone.svg" alt="Excluir">
                </button>
            </td>
        `;
        usersTableBody.appendChild(row);
    });

    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', handleEdit);
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', handleDelete);
    });
}

async function handleEdit(event) {
    const userId = event.currentTarget.dataset.id;
    const userToEdit = users.find(u => u.id == userId);
    
    if (userToEdit) {
        formTitle.textContent = 'Editar Usuário';
        userIdInput.value = userToEdit.id;
        document.getElementById('name').value = userToEdit.username;
        document.getElementById('email').value = userToEdit.email;
        document.getElementById('birthdate').value = userToEdit.birthdate ? userToEdit.birthdate.split('T')[0] : '';
        document.getElementById('role').value = userToEdit.role;
        profilePreview.src = userToEdit.photo_perfil_url || 'https://api.iconify.design/solar:user-circle-bold-duotone.svg';
        userForm.setAttribute('data-method', 'PUT');
        showForm();
    }
}

async function handleDelete(event) {
    const userId = event.currentTarget.dataset.id;
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        try {
            const response = await fetch('/api/usermanagement', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: userId })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                loadUsers();
            } else {
                alert('Erro: ' + data.message);
            }
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            alert('Erro ao excluir usuário. Verifique a conexão.');
        }
    }
}

function showForm(title = 'Adicionar Novo Usuário') {
    userListCard.style.display = 'none';
    userFormCard.style.display = 'block';
    formTitle.textContent = title;
    userForm.reset();
    profilePreview.src = 'https://api.iconify.design/solar:user-circle-bold-duotone.svg';
    userForm.setAttribute('data-method', 'POST');
    userIdInput.value = '';
}

function showList() {
    userFormCard.style.display = 'none';
    userListCard.style.display = 'block';
    loadUsers();
}

loadUsers(); // Inicializa o carregamento da lista de usuários