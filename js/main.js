document.addEventListener('DOMContentLoaded', () => {
  // Hacker Mode (Konami Code)
  const secretCode = ['h', 'a', 'c', 'k'];
  let secretPos = 0;
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === secretCode[secretPos]) {
      secretPos++;
      if (secretPos === secretCode.length) {
        document.body.classList.toggle('hacker-mode');
        secretPos = 0;
      }
    } else {
      secretPos = 0;
    }
  });

  // Close Modals (Red Cross)
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const overlay = e.target.closest('.cv-modal-overlay, .search-modal-overlay');
      if (overlay) overlay.classList.remove('active');
    });
  });

  // CV Download Animation
  const btnCv = document.getElementById('btn-download-cv');
  const cvModal = document.getElementById('cv-modal');
  const cvModalBody = document.getElementById('cv-modal-body');
  
  if (btnCv && cvModal && cvModalBody) {
    btnCv.addEventListener('click', (e) => {
      e.preventDefault();
      cvModal.classList.add('active');
      cvModalBody.innerHTML = '';
      
      const lines = [
        "> Analyse du fichier en cours...",
        "> 0 malware détecté.",
        "> Fichier déchiffré.",
        "> Début du téléchargement..."
      ];
      
      let delay = 0;
      lines.forEach((line) => {
        setTimeout(() => {
          cvModalBody.innerHTML += `<div>${line}</div>`;
        }, delay);
        delay += 600;
      });
      
      setTimeout(() => {
        cvModal.classList.remove('active');
        const a = document.createElement('a');
        a.href = "assets/CV_Mathis_Ducarois.pdf"; 
        a.download = "CV_Mathis_Ducarois.pdf";
        a.click();
      }, delay + 800);
    });
  }
});