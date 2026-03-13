import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { Plus, ChevronLeft, Trash2, Edit3, Calendar, User } from 'lucide-react';
import { fetchPosts, fetchPost, createPost, updatePost, deletePost, login, register, me } from './api';
import type { Post, AuthUser } from './api';
import './App.css';

// Components
const Navbar = ({ user, onLogout }: { user: AuthUser | null; onLogout: () => void }) => (
  <nav className="navbar">
    <div className="nav-content">
      <Link to="/" className="nav-logo">DevBlog</Link>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        {user ? (
          <>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Hi, {user.name}</span>
            <Link to="/new" className="btn btn-primary"><Plus size={18} style={{marginRight: '8px'}} /> New Post</Link>
            <button onClick={onLogout} className="btn" style={{ backgroundColor: '#eee' }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn" style={{ backgroundColor: '#eee' }}>Login</Link>
            <Link to="/register" className="btn btn-primary">Register</Link>
          </>
        )}
      </div>
    </div>
  </nav>
);

function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    me()
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  return { user, setUser, loading };
}

// Pages
const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts()
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Could not connect to the server. Please make sure the backend is running.");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="container">Loading...</div>;
  if (error) return <div className="container"><div style={{padding: '2rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem'}}>{error}</div></div>;

  return (
    <div className="container">
      <h1>Latest Stories</h1>
      <div className="blog-grid">
        {posts.map(post => (
          <div key={post.id} className="blog-card">
            <h2>{post.title}</h2>
            <p>{post.content.substring(0, 100)}...</p>
            <div className="footer">
              <span style={{display: 'flex', alignItems: 'center'}}><User size={14} style={{marginRight: '4px'}}/> {post.author}</span>
              <Link to={`/post/${post.id}`} className="btn btn-primary" style={{padding: '0.3rem 0.6rem', fontSize: '0.8rem'}}>Read More</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) fetchPost(id).then(setPost);
  }, [id]);

  const handleDelete = async () => {
    if (id && window.confirm("Are you sure?")) {
      await deletePost(id);
      navigate('/');
    }
  };

  if (!post) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <Link to="/" style={{display: 'flex', alignItems: 'center', marginBottom: '1rem', textDecoration: 'none', color: 'var(--primary)'}}>
        <ChevronLeft size={18} /> Back to Home
      </Link>
      <article className="post-detail">
        <header className="post-header">
          <h1>{post.title}</h1>
          <div style={{display: 'flex', gap: '1.5rem', color: 'var(--text-muted)'}}>
            <span style={{display: 'flex', alignItems: 'center'}}><User size={16} style={{marginRight: '4px'}}/> {post.author}</span>
            <span style={{display: 'flex', alignItems: 'center'}}><Calendar size={16} style={{marginRight: '4px'}}/> {new Date(post.created_at).toLocaleDateString()}</span>
          </div>
        </header>
        <div style={{lineHeight: '1.8', fontSize: '1.1rem'}}>{post.content}</div>
        <div style={{marginTop: '3rem', display: 'flex', gap: '1rem', borderTop: '1px solid #eee', paddingTop: '2rem'}}>
          <Link to={`/edit/${post.id}`} className="btn btn-primary" style={{display: 'flex', alignItems: 'center'}}>
            <Edit3 size={18} style={{marginRight: '8px'}} /> Edit
          </Link>
          <button onClick={handleDelete} className="btn btn-danger" style={{display: 'flex', alignItems: 'center'}}>
            <Trash2 size={18} style={{marginRight: '8px'}} /> Delete
          </button>
        </div>
      </article>
    </div>
  );
};

const PostForm = ({ user }: { user: AuthUser | null }) => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', content: '' });

  useEffect(() => {
    if (isEdit) {
      fetchPost(id!).then(post => setFormData({ title: post.title, content: post.content }));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in');
      navigate('/login');
      return;
    }
    if (isEdit) {
      await updatePost(id!, formData);
    } else {
      await createPost(formData);
    }
    navigate('/');
  };

  return (
    <div className="container">
      <h1>{isEdit ? 'Edit Post' : 'Create New Post'}</h1>
      <form onSubmit={handleSubmit} className="post-detail" style={{maxWidth: '600px', margin: '0 auto'}}>
        <div className="form-group">
          <label>Title</label>
          <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="Enter post title" />
        </div>
        <div className="form-group">
          <label>Content</label>
          <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required rows={10} placeholder="Write your story..." />
        </div>
        <div style={{display: 'flex', gap: '1rem'}}>
          <button type="submit" className="btn btn-primary">{isEdit ? 'Update Post' : 'Publish Post'}</button>
          <button type="button" onClick={() => navigate('/')} className="btn" style={{backgroundColor: '#eee'}}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

const LoginPage = ({ onAuthed }: { onAuthed: (user: AuthUser) => void }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await login(formData);
      localStorage.setItem('token', res.token);
      onAuthed(res.user);
      navigate('/');
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="container">
      <h1>Login</h1>
      <form onSubmit={handleSubmit} className="post-detail" style={{maxWidth: '420px', margin: '0 auto'}}>
        {error && <div style={{padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem'}}>{error}</div>}
        <div className="form-group">
          <label>Email</label>
          <input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required placeholder="you@example.com" />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required placeholder="******" />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
      </form>
    </div>
  );
};

const RegisterPage = ({ onAuthed }: { onAuthed: (user: AuthUser) => void }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await register(formData);
      localStorage.setItem('token', res.token);
      onAuthed(res.user);
      navigate('/');
    } catch {
      setError('Could not register (email may already be used)');
    }
  };

  return (
    <div className="container">
      <h1>Create Account</h1>
      <form onSubmit={handleSubmit} className="post-detail" style={{maxWidth: '420px', margin: '0 auto'}}>
        {error && <div style={{padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem'}}>{error}</div>}
        <div className="form-group">
          <label>Name</label>
          <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Your name" />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required placeholder="you@example.com" />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required placeholder="min 6 chars" />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register</button>
      </form>
    </div>
  );
};

function App() {
  const { user, setUser, loading } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <Router>
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/new" element={<PostForm user={user} />} />
        <Route path="/edit/:id" element={<PostForm user={user} />} />
        <Route path="/login" element={<LoginPage onAuthed={setUser} />} />
        <Route path="/register" element={<RegisterPage onAuthed={setUser} />} />
      </Routes>
      {loading ? null : null}
    </Router>
  );
}

export default App;
