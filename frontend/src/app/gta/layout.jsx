// This layout wraps ONLY the /gta route and its children.
// You can put shared nav, sidebar, or styling here.

export default function GTALayout({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f4f6fa',
      fontFamily: 'Inter, Arial, sans-serif'
    }}>
      <header style={{
        padding: '1.2rem 2rem',
        background: '#172554',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '1.6rem'
      }}>
        Grab Triage Agent Dashboard
      </header>
      <main style={{
        maxWidth: 1200,
        margin: '2rem auto',
        padding: '2rem',
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
      }}>
        {children}
      </main>
    </div>
  );
}
