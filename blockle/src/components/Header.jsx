import './Header.css';

export default function Header({ day, dateLabel, streak, onHelp }) {
  return (
    <header className="hd">
      <div className="hd__left">
        <h1 className="serif hd__brand">
          Cobble<span className="hd__dot">.</span>
        </h1>
        <p className="hd__tagline">A DAILY ARRANGEMENT</p>
      </div>
      <div className="hd__right">
        <button className="hd__help" onClick={onHelp} aria-label="How to play">
          ?
        </button>
        <div className="hd__meta">
          <div className="hd__num serif">#{day}</div>
          <div className="hd__date">{dateLabel}</div>
        </div>
      </div>
      <div className="hd__streak">
        <span className="hd__streak-emoji">🔥</span>
        <span>{streak} day streak</span>
      </div>
    </header>
  );
}
