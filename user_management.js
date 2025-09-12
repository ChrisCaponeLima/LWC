// Adicione esta função para limpar o formulário
function resetForm() {
    userForm.reset();
    userIdInput.value = '';
    userForm.setAttribute('data-method', 'POST');
    document.querySelector('#userFormContainer h2').textContent = 'Cadastrar Novo Usuário';
}

// Modifique a função showList para também esconder o form
function showList() {
    userListContainer.style.display = 'block';
    userFormContainer.style.display = 'none'; // Adicionado para esconder o formulário
    loadUsers(); // Recarrega os dados para a lista
}

// Modifique o evento 'submit' para chamar as novas funções
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
            resetForm(); // Limpa o formulário
            showList(); // Oculta o formulário e mostra a lista
        } else {
            alert('Erro: ' + data.message);
        }
    } catch (error) {
        console.error('Erro ao enviar o formulário:', error);
        alert('Erro ao enviar formulário. Verifique a conexão.');
    }
});