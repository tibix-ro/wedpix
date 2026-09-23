import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { LogOut, Menu, X } from "lucide-react";
import logoImage from "../assets/images/LOGO-WEDPIX-TRANS.png";
import logoWebp from "../assets/images/LOGO-WEDPIX-TRANS.webp";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isLanding = location.pathname === "/";
  const heroMode = isLanding && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { to: "/", label: "Acasă" },
    { to: "/#features", label: "Funcții" },
    { to: "/#pricing", label: "Pachete" },
    { to: "/contact", label: "Contact" },
  ];

  const handleHomeClick = (event) => {
    event.preventDefault();
    setOpen(false);
    navigate("/");
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const NavLink = ({ to, children, onClick }) => {
    const active = to.startsWith("/#")
      ? location.pathname === "/" && location.hash === to.slice(1)
      : location.pathname === to;
    return (
      <Link
        to={to}
        onClick={to === "/" ? handleHomeClick : onClick}
        className={`
          text-sm font-sans font-medium transition-colors duration-200
          ${active ? "text-rose-gold" : "text-charcoal/70 hover:text-rose-gold"}
        `}
      >
        {children}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 glass border-b border-rose-gold/15 shadow-card">
      {/* ── Hero band (desktop · landing · not scrolled) ── */}
      <div
        className="hidden md:block overflow-hidden"
        style={{
          maxHeight: heroMode ? "180px" : "0px",
          opacity: heroMode ? 1 : 0,
          transition:
            "max-height 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease-in-out",
          pointerEvents: heroMode ? "auto" : "none",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col items-center gap-3">
          <Link
            to="/"
            onClick={handleHomeClick}
            className="flex items-center group"
          >
            <picture>
              <source srcSet={logoWebp} type="image/webp" />
              <img
                src={logoImage}
                alt="WedPix"
                style={{
                  width: "297px",
                  height: "100px",
                  objectFit: "contain",
                }}
                className="group-hover:opacity-85 transition-opacity"
                loading="eager"
                decoding="async"
              />
            </picture>
          </Link>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}
            {user && <NavLink to="/dashboard">Dashboard</NavLink>}
            {user && <NavLink to="/profile">Profil</NavLink>}
            {user ? (
              <>
                <div className="flex items-center gap-2 bg-cream rounded-full px-3 py-1.5 border border-rose-gold/20">
                  <div className="w-2 h-2 rounded-full bg-rose-gold animate-pulse-soft" />
                  <span className="text-xs font-sans text-charcoal/80 max-w-[120px] truncate">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm text-taupe hover:text-red-400 transition-colors font-sans"
                >
                  <LogOut size={14} /> Ieșire
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-sans text-charcoal/70 hover:text-rose-gold transition-colors"
                >
                  Autentificare
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-sans font-medium bg-gradient-to-r from-rose-gold to-[#6F5827]
                    text-white px-4 py-1.5 rounded-full shadow-gold hover:shadow-gold-lg
                    hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  Înregistrare
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Compact band desktop (scrolled / non-landing) ── */}
      <div
        className="hidden md:block overflow-hidden"
        style={{
          maxHeight: heroMode ? "0px" : "56px",
          opacity: heroMode ? 0 : 1,
          transition:
            "max-height 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease-in-out",
          pointerEvents: heroMode ? "none" : "auto",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to="/"
            onClick={handleHomeClick}
            className="flex items-center group"
          >
            <picture>
              <source srcSet={logoWebp} type="image/webp" />
              <img
                src={logoImage}
                alt="WedPix"
                className="h-10 w-auto group-hover:opacity-85 transition-opacity"
                width="118"
                height="40"
                loading="eager"
                decoding="async"
              />
            </picture>
          </Link>
          <nav className="flex items-center gap-6">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}
            {user && <NavLink to="/dashboard">Dashboard</NavLink>}
            {user && <NavLink to="/profile">Profil</NavLink>}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 bg-cream rounded-full px-3 py-1.5 border border-rose-gold/20">
                  <div className="w-2 h-2 rounded-full bg-rose-gold animate-pulse-soft" />
                  <span className="text-xs font-sans text-charcoal/80 max-w-[120px] truncate">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm text-taupe hover:text-red-400 transition-colors font-sans"
                >
                  <LogOut size={14} /> Ieșire
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-sans text-charcoal/70 hover:text-rose-gold transition-colors"
                >
                  Autentificare
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-sans font-medium bg-gradient-to-r from-rose-gold to-[#6F5827]
                    text-white px-4 py-1.5 rounded-full shadow-gold hover:shadow-gold-lg
                    hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  Înregistrare
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile compact band (always visible) ── */}
      <div className="md:hidden px-4 h-14 flex items-center justify-between">
        <Link
          to="/"
          onClick={handleHomeClick}
          className="flex items-center group"
        >
          <picture>
            <source srcSet={logoWebp} type="image/webp" />
            <img
              src={logoImage}
              alt="WedPix"
              className="h-10 w-auto group-hover:opacity-85 transition-opacity"
              loading="eager"
              decoding="async"
            />
          </picture>
        </Link>
        <button
          onClick={() => setOpen((o) => !o)}
          className="p-2 text-charcoal/70 hover:text-rose-gold transition-colors"
          aria-label="Meniu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass border-t border-rose-gold/10 px-4 py-4 flex flex-col gap-3">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>
              {item.label}
            </NavLink>
          ))}
          {user && (
            <NavLink to="/dashboard" onClick={() => setOpen(false)}>
              Dashboard
            </NavLink>
          )}
          {user && (
            <NavLink to="/profile" onClick={() => setOpen(false)}>
              Profil
            </NavLink>
          )}
          <div className="h-px bg-rose-gold/10 my-1" />
          {user ? (
            <button
              onClick={handleLogout}
              className="text-sm text-left font-sans text-red-400"
            >
              Ieșire din cont
            </button>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setOpen(false)}>
                Autentificare
              </NavLink>
              <NavLink to="/register" onClick={() => setOpen(false)}>
                Înregistrare
              </NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
}
