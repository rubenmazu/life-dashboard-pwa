/**
 * App.tsx — Legacy entry point. The app now uses RouterProvider in main.tsx.
 * This file is kept for backward compatibility with tests that import App.
 */
import { RouterProvider } from 'react-router-dom';
import { ProfileProvider } from '@/context/ProfileContext';
import { router } from '@/router';

function App() {
  return (
    <ProfileProvider>
      <RouterProvider router={router} />
    </ProfileProvider>
  );
}

export default App;
