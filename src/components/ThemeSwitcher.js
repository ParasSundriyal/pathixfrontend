import React from 'react';
import { useTheme } from './ThemeContext';

const ThemeSwitcher = () => {
  const { themes, currentTheme, setCurrentThemeId, loading } = useTheme();

  if (loading) return <div>Loading themes...</div>;
  if (!themes.length) return <div>No themes available</div>;

  return (
    <select
      className="theme-switcher p-2 rounded border dark:bg-gray-800 dark:text-white"
      value={currentTheme?._id || ''}
      onChange={e => setCurrentThemeId(e.target.value)}
    >
      {themes.map(theme => (
        <option key={theme._id} value={theme._id}>
          {theme.name}
        </option>
      ))}
    </select>
  );
};

export default ThemeSwitcher; 