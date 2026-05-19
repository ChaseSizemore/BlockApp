import './StartScreen.css';

// Pre-game overlay. The puzzle is hidden behind this card until the player
// clicks Start, at which point the timer begins. This ensures every player
// gets the same amount of pre-thinking time (zero) — fair time comparisons.
export default function StartScreen({ day, dateLabel, streak, onStart, onHelp }) {
  return (
    <div className="start-screen">
      <div className="start-screen__card">
        <h1 className="serif start-screen__brand">
          Cobble<span className="start-screen__dot">.</span>
        </h1>
        <p className="start-screen__tagline">A DAILY ARRANGEMENT</p>

        <div className="start-screen__meta">
          <div className="start-screen__num serif">#{day}</div>
          <div className="start-screen__date">{dateLabel}</div>
        </div>

        {streak > 0 && (
          <div className="start-screen__streak">
            <span aria-hidden="true">🔥</span> {streak} day streak
          </div>
        )}

        <p className="start-screen__rules">
          Fill the board with all 10 pieces. Tap to select, rotate or flip, then drag to place.
        </p>

        <button className="start-screen__button" onClick={onStart} type="button">
          Start Puzzle
        </button>

        <button className="start-screen__help" onClick={onHelp} type="button">
          How to play
        </button>
      </div>
    </div>
  );
}
