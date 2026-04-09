import { Routes, Route } from 'react-router-dom'
import { BlogPage, BlogPostPage } from './pages/BlogPage'
import {
  AdminBlogPage,
  AdminBlogNewPage,
  AdminBlogShowPage,
  AdminBlogEditPage,
} from './pages/AdminBlogPage'
import { SecurityPage, LoginPage, LogoutPage } from './pages/SecurityPage'

export function App() {
  return (
    <div className="app">
      <header>
        <h1>Migrated Frontend</h1>
        <nav></nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/page/:page" element={<BlogPage />} />
          <Route path="/blog/posts/:slug" element={<BlogPostPage />} />
          <Route path="/admin/post" element={<AdminBlogPage />} />
          <Route path="/admin/post/new" element={<AdminBlogNewPage />} />
          <Route path="/admin/post/:id/edit" element={<AdminBlogEditPage />} />
          <Route path="/admin/post/:id" element={<AdminBlogShowPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/logout" element={<LogoutPage />} />
        </Routes>
      </main>
    </div>
  )
}

function Home() {
  return (
    <div>
      <h2>Welcome</h2>
      <p>Frontend application for the migrated API.</p>
    </div>
  )
}
