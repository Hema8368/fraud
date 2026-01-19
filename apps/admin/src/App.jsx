import { useState } from 'react';
import './styles/base.css';
import Login from './pages/Login';
import Decisions from './pages/Decisions';
import Config from './pages/Config';

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'));
  if (!authed) return <Login onAuthed={()=>setAuthed(true)} />;
  return (
    <div>
      <div className="container">
        <div className="nav">
          <a className="button" href="#" onClick={e=>{e.preventDefault(); window._page='decisions'; window.dispatchEvent(new Event('hashchange'));}}>Decisions</a>
          <a className="button ghost" href="#" onClick={e=>{e.preventDefault(); window._page='config'; window.dispatchEvent(new Event('hashchange'));}}>Config</a>
          <a className="button ghost" href="#" onClick={e=>{e.preventDefault(); localStorage.removeItem('token'); window.location.reload();}}>Logout</a>
        </div>
      </div>
      {window._page === 'config' ? <Config/> : <Decisions/>}
    </div>
  );
}