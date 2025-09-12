// Centraliza a verificação de permissão no topo do script
document.addEventListener('DOMContentLoaded', () => {
    // Tenta obter o role diretamente do localStorage
    const userRole = localStorage.getItem('role');

    // Se o role não for 'admin', redireciona para a página inicial
    if (userRole !== 'admin') {
        window.location.href = 'index.html';
    }
});

const userListCard = document.getElementById('userListCard');
const userFormCard = document.getElementById('userFormCard');
const addUserBtn = document.getElementById('addUserBtn');
const cancelBtn = document.getElementById('cancelBtn');
const userForm = document.getElementById('userForm');
const usersTableBody = document.getElementById('usersTableBody');
const formTitle = document.getElementById('formTitle');
const userIdInput = document.getElementById('userId');
const userProfileName = document.getElementById('userProfileName');
const userProfilePhoto = document.getElementById('userProfilePhoto');
const adminMenuItem = document.getElementById('adminMenuItem');
const logoutBtn = document.getElementById('logoutBtn');

// Referências aos novos elementos do HTML
const photoGrid = document.getElementById('photo-grid');
const formaGrid = document.getElementById('forma-grid');
const registrosButton = document.getElementById('registrosButtonCollapse');
const formaButton = document.getElementById('formaButtonCollapse');

// Função para mostrar a lista de usuários e esconder o formulário
const showList = () => {
    userListCard.style.display = 'block';
    userFormCard.style.display = 'none';
    loadUsers(); // Recarrega a lista de usuários ao voltar
    // Limpa os grids de fotos ao voltar para a lista
    if (photoGrid) photoGrid.innerHTML = '';
    if (formaGrid) formaGrid.innerHTML = '';
};

// Função para mostrar o formulário e esconder a lista
const showForm = () => {
    userListCard.style.display = 'none';
    userFormCard.style.display = 'block';
};

// Função para limpar o formulário
const resetForm = () => {
    userForm.reset();
    userIdInput.value = '';
    userForm.setAttribute('data-method', 'POST');
    formTitle.textContent = 'Adicionar Novo Usuário';
};

// Manipuladores de eventos
addUserBtn.addEventListener('click', () => {
    resetForm();
    showForm();
});

cancelBtn.addEventListener('click', () => {
    resetForm();
    showList();
});

// Manipulador de envio do formulário
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
            resetForm();
            showList();
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (error) {
        console.error('Erro ao enviar o formulário:', error);
        alert('Erro ao enviar formulário. Verifique a conexão.');
    }
});

// Função para carregar usuários da API
const loadUsers = async () => {
    try {
        const response = await fetch('/api/usermanagement');
        if (!response.ok) {
            throw new Error('Erro ao carregar os usuários.');
        }
        const users = await response.json();
        renderUsersTable(users);
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        usersTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Erro ao carregar usuários.</td></tr>`;
    }
};

// Função para renderizar a tabela de usuários
const renderUsersTable = (users) => {
    usersTableBody.innerHTML = '';
    if (users.length === 0) {
        usersTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Nenhum usuário cadastrado.</td></tr>`;
        return;
    }

    users.forEach(user => {
        const row = document.createElement('tr');
        // Adiciona o evento de clique na linha para carregar os dados do usuário
        row.setAttribute('onclick', `loadUserRecords('${user.id}')`);
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>${user.initial_weight_kg ? user.initial_weight_kg : 'N/A'}</td>
            <td>${user.height_cm ? user.height_cm : 'N/A'}</td>
            <td class="action-buttons-cell">
                <button class="btn btn-sm btn-edit" onclick="editUser('${user.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')"><i class="fas fa-trash-alt"></i></button>
                <button class="btn btn-sm btn-warning" onclick="resetPassword('${user.id}')"><i class="fas fa-key"></i></button>
            </td>
        `;
        usersTableBody.appendChild(row);
    });
};

// Função para editar um usuário
const editUser = async (userId) => {
    try {
        const response = await fetch(`/api/usermanagement?id=${userId}`);
        const user = await response.json();

        userForm.reset();
        userIdInput.value = user.id;
        document.getElementById('name').value = user.username;
        document.getElementById('email').value = user.email;
        document.getElementById('birthdate').value = user.birthdate ? user.birthdate.split('T')[0] : '';
        document.getElementById('role').value = user.role;
        document.getElementById('initial-weight').value = user.initial_weight_kg;
        document.getElementById('height-cm').value = user.height_cm;

        userForm.setAttribute('data-method', 'PUT');
        formTitle.textContent = 'Editar Usuário';
        showForm();
    } catch (error) {
        alert('Erro ao carregar dados do usuário para edição.');
    }
};

// Função para excluir um usuário
const deleteUser = async (userId) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        try {
            const response = await fetch('/api/usermanagement', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: userId })
            });
            if (response.ok) {
                alert('Usuário excluído com sucesso!');
                loadUsers();
            } else {
                const data = await response.json();
                alert('Erro ao excluir usuário: ' + data.message);
            }
        } catch (error) {
            alert('Erro de conexão ao excluir o usuário.');
        }
    }
};

// Nova função para redefinir a senha
const resetPassword = async (userId) => {
    if (confirm('Tem certeza que deseja redefinir a senha deste usuário?')) {
        try {
            const response = await fetch('/api/usermanagement', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: userId, resetPassword: true })
            });

            if (response.ok) {
                alert('Senha redefinida com sucesso.');
            } else {
                const data = await response.json();
                alert('Erro ao redefinir a senha: ' + data.message);
            }
        } catch (error) {
            console.error('Erro de conexão:', error);
            alert('Erro de conexão ao redefinir a senha.');
        }
    }
};

// ----------------------------------------------------
// NOVO CÓDIGO para carregar dados de registros e formas
// ----------------------------------------------------

/**
 * Renderiza as fotos nos grids de registros ou formas.
 * @param {Array} records - A lista de registros do usuário.
 * @param {HTMLElement} gridElement - O elemento do grid onde as fotos serão renderizadas.
 * @param {string} photoUrlKey - A chave do objeto de registro que contém a URL da foto (ex: 'photo_url', 'forma_url').
 * @returns {boolean} True se houver fotos renderizadas, caso contrário, false.
 */
function renderPhotos(records, gridElement, photoUrlKey) {
    gridElement.innerHTML = '';
    let hasPhotos = false;
    records.forEach(record => {
        if (record[photoUrlKey]) {
            hasPhotos = true;
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.innerHTML = `
                <img src="${record[photoUrlKey]}" alt="Foto de Evolução">
                <div class="photo-date">${new Date(record.record_date).toLocaleDateString('pt-BR')}</div>
                <button class="photo-edit-btn" data-record-id="${record.id}">
                    <img src="https://api.iconify.design/solar:pen-bold-duotone.svg" alt="Editar" class="icon-sm">
                </button>
            `;
            const editBtn = photoItem.querySelector('.photo-edit-btn');
            editBtn.addEventListener('click', () => {
                alert('Funcionalidade de edição em desenvolvimento.');
            });
            gridElement.appendChild(photoItem);
        }
    });
    return hasPhotos;
}

/**
 * Carrega e exibe os registros e formas para um usuário específico.
 * @param {string} userId - O ID do usuário.
 */
async function loadUserRecords(userId) {
    try {
        const response = await fetch(`/api/users?id=${userId}`);
        if (response.ok) {
            const userData = await response.json();
            
            // Preenche os grids com as fotos dos registros e formas
            const hasPhotoRecords = renderPhotos(userData.records, photoGrid, 'photo_url');
            const hasFormaRecords = renderPhotos(userData.records, formaGrid, 'forma_url');

            // Atualiza o estilo dos botões com base na existência de fotos
            if (registrosButton) {
                if (hasPhotoRecords) {
                    registrosButton.classList.add('btn-with-photos');
                    registrosButton.classList.remove('btn-no-photos');
                } else {
                    registrosButton.classList.add('btn-no-photos');
                    registrosButton.classList.remove('btn-with-photos');
                }
            }
            if (formaButton) {
                if (hasFormaRecords) {
                    formaButton.classList.add('btn-with-photos');
                    formaButton.classList.remove('btn-no-photos');
                } else {
                    formaButton.classList.add('btn-no-photos');
                    formaButton.classList.remove('btn-with-photos');
                }
            }
            
            // Exibe uma mensagem de sucesso opcional
            console.log(`Dados de registros e formas para o usuário ${userData.username} carregados com sucesso.`);

        } else {
            console.error('Erro ao carregar dados do usuário.');
            if (photoGrid) photoGrid.innerHTML = '<p class="text-center text-secondary">Não foi possível carregar os registros.</p>';
            if (formaGrid) formaGrid.innerHTML = '';
        }
    } catch (error) {
        console.error('Erro de conexão ao carregar dados:', error);
        if (photoGrid) photoGrid.innerHTML = '<p class="text-center text-secondary">Erro de conexão.</p>';
        if (formaGrid) formaGrid.innerHTML = '';
    }
}
// ----------------------------------------------------
// FIM do NOVO CÓDIGO
// ----------------------------------------------------

// Carrega os usuários quando a página é carregada
loadUsers();