// FICHIER GÉNÉRÉ PAR LE SCAFFOLD - NE PAS MODIFIER MANUELLEMENT
// Toute modification sera écrasée lors de la prochaine génération
// NOTE: BrowserRouter est dans main.tsx (responsabilité du template)

import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminPostNewPage } from './pages/admin/AdminPostNewPage'
import { AdminPostsPage } from './pages/admin/AdminPostsPage'
import { PostPage } from './pages/PostPage'
import { LoginPage } from './pages/LoginPage'
import { AdminPostEditPage } from './pages/admin/AdminPostEditPage'
import { AdminPostShowPage } from './pages/admin/AdminPostShowPage'
import { PostPostPage } from './pages/PostPostPage'

export function App() {
  return (
    <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/admin/posts/new" element={<AdminPostNewPage />} />
        <Route path="/admin/posts" element={<AdminPostsPage />} />
        <Route path="/posts" element={<PostPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/posts/:id/edit" element={<AdminPostEditPage />} />
        <Route path="/admin/posts/:id" element={<AdminPostShowPage />} />
        <Route path="/posts/:slug" element={<PostPostPage />} />
      <Route path="*" element={<div>Page not found</div>} />
    </Routes>
  )
}
