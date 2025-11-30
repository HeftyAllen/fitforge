// theme.js - Enhanced with better color scheme management
(function(){
  const root = document.documentElement;
  const key = 'fitforge-theme';
  
  // Get initial theme preference
  const getInitialTheme = () => {
    const stored = localStorage.getItem(key);
    if (stored) return stored;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const initial = getInitialTheme();
  document.documentElement.setAttribute('data-theme', initial);

  // Update CSS variables based on theme
  const updateThemeVariables = (theme) => {
    const colors = theme === 'dark' ? darkColors : lightColors;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  };

  // Color schemes based on color theory
  const lightColors = {
    // Primary brand color (Vibrant blue)
    'primary-50': '#f0f9ff',
    'primary-100': '#e0f2fe',
    'primary-200': '#bae6fd',
    'primary-300': '#7dd3fc',
    'primary-400': '#38bdf8',
    'primary-500': '#0ea5e9',
    'primary-600': '#0284c7',
    'primary-700': '#0369a1',
    'primary-800': '#075985',
    'primary-900': '#0c4a6e',
    
    // Secondary color (Complementary orange)
    'secondary-50': '#fff7ed',
    'secondary-100': '#ffedd5',
    'secondary-200': '#fed7aa',
    'secondary-300': '#fdba74',
    'secondary-400': '#fb923c',
    'secondary-500': '#f97316',
    'secondary-600': '#ea580c',
    'secondary-700': '#c2410c',
    'secondary-800': '#9a3412',
    'secondary-900': '#7c2d12',
    
    // Neutral colors
    'neutral-50': '#f8fafc',
    'neutral-100': '#f1f5f9',
    'neutral-200': '#e2e8f0',
    'neutral-300': '#cbd5e1',
    'neutral-400': '#94a3b8',
    'neutral-500': '#64748b',
    'neutral-600': '#475569',
    'neutral-700': '#334155',
    'neutral-800': '#1e293b',
    'neutral-900': '#0f172a',
    
    // Success (Green)
    'success-50': '#f0fdf4',
    'success-100': '#dcfce7',
    'success-200': '#bbf7d0',
    'success-300': '#86efac',
    'success-400': '#4ade80',
    'success-500': '#22c55e',
    'success-600': '#16a34a',
    'success-700': '#15803d',
    'success-800': '#166534',
    'success-900': '#14532d',
    
    // Error (Red)
    'error-50': '#fef2f2',
    'error-100': '#fee2e2',
    'error-200': '#fecaca',
    'error-300': '#fca5a5',
    'error-400': '#f87171',
    'error-500': '#ef4444',
    'error-600': '#dc2626',
    'error-700': '#b91c1c',
    'error-800': '#991b1b',
    'error-900': '#7f1d1d',
    
    // Background and surface colors
    'bg-primary': '#ffffff',
    'bg-secondary': '#f8fafc',
    'bg-tertiary': '#f1f5f9',
    'surface-primary': '#ffffff',
    'surface-secondary': '#f8fafc',
    'surface-tertiary': '#f1f5f9',
    
    // Text colors
    'text-primary': '#0f172a',
    'text-secondary': '#475569',
    'text-tertiary': '#64748b',
    'text-inverse': '#ffffff',
    
    // Border colors
    'border-primary': '#e2e8f0',
    'border-secondary': '#cbd5e1',
    'border-tertiary': '#94a3b8',
    
    // Shadow colors
    'shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    'shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    'shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    'shadow-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  };

  const darkColors = {
    // Primary brand color (Vibrant blue)
    'primary-50': '#0c4a6e',
    'primary-100': '#075985',
    'primary-200': '#0369a1',
    'primary-300': '#0284c7',
    'primary-400': '#0ea5e9',
    'primary-500': '#38bdf8',
    'primary-600': '#7dd3fc',
    'primary-700': '#bae6fd',
    'primary-800': '#e0f2fe',
    'primary-900': '#f0f9ff',
    
    // Secondary color (Complementary orange)
    'secondary-50': '#7c2d12',
    'secondary-100': '#9a3412',
    'secondary-200': '#c2410c',
    'secondary-300': '#ea580c',
    'secondary-400': '#f97316',
    'secondary-500': '#fb923c',
    'secondary-600': '#fdba74',
    'secondary-700': '#fed7aa',
    'secondary-800': '#ffedd5',
    'secondary-900': '#fff7ed',
    
    // Neutral colors
    'neutral-50': '#0f172a',
    'neutral-100': '#1e293b',
    'neutral-200': '#334155',
    'neutral-300': '#475569',
    'neutral-400': '#64748b',
    'neutral-500': '#94a3b8',
    'neutral-600': '#cbd5e1',
    'neutral-700': '#e2e8f0',
    'neutral-800': '#f1f5f9',
    'neutral-900': '#f8fafc',
    
    // Success (Green)
    'success-50': '#14532d',
    'success-100': '#166534',
    'success-200': '#15803d',
    'success-300': '#16a34a',
    'success-400': '#22c55e',
    'success-500': '#4ade80',
    'success-600': '#86efac',
    'success-700': '#bbf7d0',
    'success-800': '#dcfce7',
    'success-900': '#f0fdf4',
    
    // Error (Red)
    'error-50': '#7f1d1d',
    'error-100': '#991b1b',
    'error-200': '#b91c1c',
    'error-300': '#dc2626',
    'error-400': '#ef4444',
    'error-500': '#f87171',
    'error-600': '#fca5a5',
    'error-700': '#fecaca',
    'error-800': '#fee2e2',
    'error-900': '#fef2f2',
    
    // Background and surface colors
    'bg-primary': '#0f172a',
    'bg-secondary': '#1e293b',
    'bg-tertiary': '#334155',
    'surface-primary': '#1e293b',
    'surface-secondary': '#334155',
    'surface-tertiary': '#475569',
    
    // Text colors
    'text-primary': '#f1f5f9',
    'text-secondary': '#cbd5e1',
    'text-tertiary': '#94a3b8',
    'text-inverse': '#0f172a',
    
    // Border colors
    'border-primary': '#334155',
    'border-secondary': '#475569',
    'border-tertiary': '#64748b',
    
    // Shadow colors
    'shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.4)',
    'shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
    'shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
    'shadow-xl': '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)'
  };

  // Initialize theme variables
  updateThemeVariables(initial);

  window.toggleTheme = function(){
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(key, newTheme);
    updateThemeVariables(newTheme);
    updateToggleButtons();
  };

  function updateToggleButtons(){
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      btn.innerHTML = isDark ? 
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>' : 
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z"/></svg>';
      btn.setAttribute('aria-pressed', isDark);
      btn.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
    });
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem(key)) {
      const newTheme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      updateThemeVariables(newTheme);
      updateToggleButtons();
    }
  });

  // Wire up theme toggle buttons
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-theme-toggle]');
    if (t) toggleTheme();
  });

  // Initialize toggle buttons
  updateToggleButtons();
})();