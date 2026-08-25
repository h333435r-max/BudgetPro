import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen text-center p-8">
      <div className="text-6xl mb-4">💸</div>
      <h1 className="font-display font-bold text-white text-3xl mb-2">Page Not Found</h1>
      <p className="text-slate-500 mb-8">The page you're looking for doesn't exist.</p>
      <button onClick={() => navigate('/')} className="btn-primary px-8 py-3">
        Go to Dashboard
      </button>
    </div>
  );
}
