document.addEventListener('DOMContentLoaded', () => {
    const userFormCard = document.getElementById('userFormCard');
    const userListCard = document.getElementById('userListCard');
    const formTitle = document.getElementById('formTitle');
    const userForm = document.getElementById('userForm');
    const usersTableBody = document.getElementById('usersTableBody');
    const addUserBtn = document.getElementById('addUserBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    // Campo de input escondido para o ID do usuário
    const userIdInput = document.getElementById('userId');

    // Pré-visualização da foto
    const photoInput = document.getElementById('profile-photo');
    const photoPreview = document.getElementById('profile-preview');

    photoInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                photoPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Função para mostrar o formulário e esconder a tabela
    function showForm(isEditing = false) {
        userFormCard.style.display = 'block';
        userListCard.style.display = 'none';
        formTitle.textContent = isEditing ? "Editar Usuário" : "Adicionar Novo Usuário";
        userForm.reset(); // Limpa o formulário
        photoPreview.src = "https://api.iconify.design/solar:user-circle-bold-duotone.svg"; // Reset da foto de preview
    }

    // Função para mostrar a tabela e esconder o formulário
    function showTable() {
        userFormCard.style.display = 'none';
        userListCard.style.display = 'block';
        loadUsers(); // Recarrega os usuários para mostrar a lista atualizada
    }

    // Botão Adicionar Usuário
    addUserBtn.addEventListener('click', () => {
        showForm();
    });

    // Botão Cancelar (do formulário)
    cancelBtn.addEventListener('click', () => {
        showTable();
    });

    // Função para carregar usuários da API
    async function loadUsers() {
        usersTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Carregando usuários...</td></tr>';
        
        try {
            const response = await fetch('/api/users');
            if (!response.ok) {
                throw new Error('Erro ao carregar usuários.');
            }
            const users = await response.json();
            renderUsers(users);
        } catch (error) {
            usersTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">${error.message}</td></tr>`;
        }
    }

    // Lida com o envio do formulário
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = userIdInput.value;
        const formData = new FormData(userForm);
        const data = Object.fromEntries(formData.entries());

        // Se estiver editando, adicione o ID aos dados
        if (id) {
            data.id = id;
        }

        try {
            const response = await fetch('/api/users', {
                method: id ? 'PUT' : 'POST', // Usa PUT para editar, POST para criar
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Erro ao ${id ? 'atualizar' : 'criar'} usuário.`);
            }

            alert(`Usuário ${id ? 'atualizado' : 'criado'} com sucesso!`);
            showTable(); // Volta para a tabela e recarrega a lista
        } catch (error) {
            alert(error.message);
        }
    });

    // Lida com o clique em Excluir
    async function handleDelete(id) {
        if (confirm(`Tem certeza que deseja excluir o usuário com ID: ${id}?`)) {
            try {
                const response = await fetch('/api/users', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id }),
                });
                if (!response.ok) {
                    throw new Error('Erro ao excluir usuário.');
                }
                alert('Usuário excluído com sucesso!');
                loadUsers();
            } catch (error) {
                alert(error.message);
            }
        }
    }

    // Função para renderizar a tabela
    function renderUsers(users) {
        usersTableBody.innerHTML = '';
        if (users.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum usuário encontrado.</td></tr>';
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="Foto">
                    <img src="${user.photo_perfil_url || 'https://api.iconify.design/solar:user-circle-bold-duotone.svg'}" alt="Foto de Perfil" class="user-photo-sm">
                </td>
                <td data-label="Nome">${user.name}</td>
                <td data-label="E-mail">${user.email}</td>
                <td data-label="Cargo">${user.role}</td>
                <td data-label="Ações">
                    <div class="btn-actions">
                        <button class="btn-icon btn-edit" data-id="${user.id}">
                            <img src="https://api.iconify.design/solar:pen-bold.svg" alt="Editar">
                        </button>
                        <button class="btn-icon btn-delete" data-id="${user.id}">
                            <img src="https://api.iconify.design/solar:trash-bin-trash-bold.svg" alt="Excluir">
                        </button>
                    </div>
                </td>
            `;
            usersTableBody.appendChild(row);
        });

        // Adiciona eventos aos botões de Editar e Excluir
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', (e) => handleEdit(e.currentTarget.dataset.id));
        });
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', (e) => handleDelete(e.currentTarget.dataset.id));
        });
    }

    // Lida com o clique em Editar
    function handleEdit(id) {
        showForm(true);
        // TODO: Simulação de fetch para dados de usuário
        // fetch(`/api/users/${id}`)
        //     .then(response => response.json())
        //     .then(user => {
        //         userIdInput.value = user.id;
        //         document.getElementById('name').value = user.name;
        //         document.getElementById('email').value = user.email;
        //         document.getElementById('birthdate').value = user.birthdate;
        //         document.getElementById('role').value = user.role;
        //         if (user.photo_perfil_url) {
        //             photoPreview.src = user.photo_perfil_url;
        //         }
        //     });
        alert(`Preparando para editar o usuário com ID: ${id}.`);
    }

    // Lida com o clique em Excluir
    function handleDelete(id) {
        if (confirm(`Tem certeza que deseja excluir o usuário com ID: ${id}?`)) {
            // TODO: Lógica de fetch para exclusão
            // fetch(`/api/users/${id}`, { method: 'DELETE' })
            //     .then(response => {
            //         if (response.ok) {
            //             loadUsers();
            //         }
            //     });
            alert(`Usuário com ID: ${id} excluído (simulado).`);
            loadUsers(); // Recarrega a lista
        }
    }

    // user_management.js (TRECHO ATUALIZADO)

// Lida com o envio do formulário
userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = userIdInput.value;
    const formData = new FormData(userForm);
    
    // Constrói o objeto de dados a ser enviado
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        birthdate: formData.get('birthdate'),
        role: formData.get('role')
    };

    if (id) {
        data.id = id;
    }

    console.log("Enviando dados:", data); // Ajuda na depuração

    try {
        const url = '/api/users';
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erro ao ${id ? 'atualizar' : 'criar'} usuário.`);
        }

        alert(`Usuário ${id ? 'atualizado' : 'criado'} com sucesso!`);
        showTable();
    } catch (error) {
        alert(error.message);
    }
});

    // Inicia carregando os usuários ao carregar a página
    showTable();
});
