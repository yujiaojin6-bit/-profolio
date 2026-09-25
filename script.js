document.addEventListener('DOMContentLoaded', function () {
  const yearTarget = document.getElementById('current-year');
  if (yearTarget) {
    yearTarget.textContent = new Date().getFullYear();
  }

  const tabs = Array.from(document.querySelectorAll('.tool-tab'));
  const panels = Array.from(document.querySelectorAll('.toolkit-panel'));

  if (!tabs.length || !panels.length) {
    return;
  }

  function activateTab(nextTab) {
    const targetId = nextTab.getAttribute('aria-controls');
    tabs.forEach((tab) => {
      const isSelected = tab === nextTab;
      tab.classList.toggle('is-active', isSelected);
      tab.setAttribute('aria-selected', String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
    });

    panels.forEach((panel) => {
      const isActive = panel.id === targetId;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
    });
  }

  tabs.forEach((tab, index) => {
    tab.tabIndex = index === 0 ? 0 : -1;
    tab.addEventListener('click', () => activateTab(tab));

    tab.addEventListener('keydown', (event) => {
      const currentIndex = tabs.indexOf(tab);
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        const nextTab = tabs[(currentIndex + 1) % tabs.length];
        nextTab.focus();
        activateTab(nextTab);
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        const nextTab = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
        nextTab.focus();
        activateTab(nextTab);
      }

      if (event.key === 'Home') {
        event.preventDefault();
        tabs[0].focus();
        activateTab(tabs[0]);
      }

      if (event.key === 'End') {
        event.preventDefault();
        tabs[tabs.length - 1].focus();
        activateTab(tabs[tabs.length - 1]);
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activateTab(tab);
      }
    });
  });

  panels.forEach((panel) => {
    panel.hidden = !panel.classList.contains('is-active');
  });
});
