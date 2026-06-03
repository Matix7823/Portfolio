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

  // Nav Bar Search Logic
  const navSearchInput = document.getElementById('nav-search-input');
  const navSearchContainer = document.querySelector('.nav-search-container');
  
  if (navSearchInput && navSearchContainer) {
    // Focus input when clicking the container
    navSearchContainer.addEventListener('click', () => {
      navSearchInput.focus();
    });

    const performSearch = () => {
      const val = navSearchInput.value.trim();
      if (val) {
        let found = window.find(val, false, false, true, false, true, false);
        
        // Fallback wrap-around for some browsers
        if (!found) {
          window.getSelection().removeAllRanges();
          window.scrollTo(0, 0);
          found = window.find(val, false, false, true, false, true, false);
        }
        
        // Visual feedback if not found
        if (!found) {
          navSearchInput.style.color = 'var(--red)';
          setTimeout(() => { navSearchInput.style.color = 'var(--text)'; }, 800);
        } else {
          navSearchInput.style.color = 'var(--text)';
        }
      }
    };

    navSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
      }
    });
  }

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

  // Terminal Search Modal (Ctrl+K)
  const searchModal = document.getElementById('search-modal');
  const terminalInput = document.getElementById('terminal-input');
  const terminalOutput = document.getElementById('terminal-output');

  if (searchModal && terminalInput && terminalOutput) {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchModal.classList.add('active');
        setTimeout(() => terminalInput.focus(), 100);
      }
      if (e.key === 'Escape' && searchModal.classList.contains('active')) {
        searchModal.classList.remove('active');
        terminalInput.value = '';
        terminalOutput.innerHTML = '';
      }
    });
    
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) {
        searchModal.classList.remove('active');
      }
    });

    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = terminalInput.value.trim();
        terminalOutput.innerHTML = '';
        
        if (val === 'cd /skills') {
          searchModal.classList.remove('active');
          const section = document.getElementById('skills');
          if (section) section.scrollIntoView({ behavior: 'smooth' });
        } else if (val === 'cat contact.txt') {
          searchModal.classList.remove('active');
          const section = document.getElementById('contact');
          if (section) section.scrollIntoView({ behavior: 'smooth' });
        } else if (val === 'help') {
          terminalOutput.innerHTML = `Commandes disponibles :\n  cd /skills      - Aller à la section Compétences\n  cat contact.txt - Aller à la section Contact\n  clear           - Effacer le terminal\n  exit            - Quitter le terminal\n  sudo            - [ACCÈS REFUSÉ]\n  [mot]           - Recherche textuelle`;
        } else if (val === 'clear') {
          terminalOutput.innerHTML = '';
        } else if (val === 'exit' || val === 'quit') {
          searchModal.classList.remove('active');
          terminalInput.value = '';
        } else if (val.startsWith('sudo')) {
          terminalOutput.innerHTML = 'ERREUR: Cet incident sera signalé.';
        } else if (val) {
          searchModal.classList.remove('active');
          setTimeout(() => {
            window.find(val);
          }, 300);
        }
        
        if (!val.startsWith('sudo') && val !== 'help' && val !== 'clear') {
          terminalInput.value = '';
        }
      }
    });
  }
});