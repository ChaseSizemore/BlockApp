import './HelpModal.css';

export default function HelpModal({ onClose }) {
  return (
    <div className="help" onClick={onClose}>
      <div className="help__card" onClick={(e) => e.stopPropagation()}>
        <button className="help__close" onClick={onClose} aria-label="Close">×</button>
        <h2 className="serif help__title">How to play</h2>
        <ol className="help__list">
          <li>Fill the board exactly using the 5 pieces in your tray.</li>
          <li>The striped piece is a hint — it's already placed.</li>
          <li>Tap a piece to pick it up, then tap the board to position it.</li>
          <li>Use <b>Rotate</b> and <b>Flip</b> while a piece is active.</li>
          <li>Press <b>Drop</b> (or release on a green preview) to lock it in.</li>
          <li>Tap a placed piece to pick it back up and move it.</li>
        </ol>
        <p className="help__foot">A new puzzle every day at midnight.</p>
      </div>
    </div>
  );
}
