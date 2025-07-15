import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [themes, setThemes] = useState([]);
  const [currentThemeId, setCurrentThemeId] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all themes from backend
    const fetchThemes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/themes`);
        const data = await res.json();
        setThemes(data);
        if (data.length > 0 && !currentThemeId) {
          setCurrentThemeId(data[0]._id);
          setCurrentTheme(data[0]);
        }
      } catch (err) {
        setThemes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchThemes();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (themes.length > 0 && currentThemeId) {
      const found = themes.find(t => t._id === currentThemeId);
      setCurrentTheme(found || themes[0]);
    }
  }, [themes, currentThemeId]);

  const value = {
    themes,
    currentTheme,
    setCurrentThemeId,
    loading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 