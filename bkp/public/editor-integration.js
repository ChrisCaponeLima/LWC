document.addEventListener('DOMContentLoaded', () => {

  const formContainer = document.getElementById('formContainer');
  const formaInput = document.getElementById('formaInput');
  const formaPreview = document.getElementById('formaPreview');
  const formaPreviewContainer = document.getElementById('formaPreviewContainer');
  const openEditorBtn = document.getElementById('openEditorBtn');
  const formaFileUpload = document.getElementById('formaFileUpload');
  const cancelFormBtn = document.getElementById('cancelFormBtn');

  // Funções auxiliares para mostrar/esconder elementos
  function show(el) { el.style.display = 'block'; }
  function hide(el) { el.style.display = 'none'; }
  function toggle(el) {
    if (el.style.display === 'none' || el.style.display === '') {
      show(el);
    } else {
      hide(el);
    }
  }

  // Lógica para o botão 'Cancelar' - se o formulário for sempre visível, este botão pode não ser necessário
  // mas é mantido por segurança. Ele pode ser removido no futuro.
  if (cancelFormBtn) {
    cancelFormBtn.addEventListener('click', () => {
      formContainer.style.display = 'block'; // Garante que o formulário continue visível
      // Limpa o estado do formulário e a prévia
      formaInput.value = '';
      hide(formaPreviewContainer);
      formaPreview.src = '';
    });
  }

  // Lógica para o botão 'Abrir Editor'
  if (openEditorBtn) {
    openEditorBtn.addEventListener('click', () => {
      formaFileUpload.click();
    });
  }

  // Lógica para processar o arquivo selecionado
  if (formaFileUpload) {
    formaFileUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageDataURL = event.target.result;
          sessionStorage.setItem('originalImageData', imageDataURL);
          window.location.href = 'editor.html';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Lógica para carregar a imagem editada, se existir
  const editedImageData = sessionStorage.getItem('editedImageData');
  if (editedImageData) {
    show(formContainer);
    show(formaPreviewContainer);
    formaPreview.src = editedImageData;
    formaInput.value = editedImageData;
    sessionStorage.removeItem('editedImageData');
  }
});